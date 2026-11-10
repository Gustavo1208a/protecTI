import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const {
      id_epi,
      lote,
      quantidade,
      data_fabricacao,
      data_validade,
      observacao = '',
    } = await request.json();

    if (!id_epi || !lote || !quantidade || !data_fabricacao || !data_validade) {
      return NextResponse.json(
        { error: 'EPI, lote, quantidade, data de fabricação e validade são obrigatórios' },
        { status: 400 }
      );
    }

    // Data de entrada é registrada automaticamente (timestamp atual)
    const dataEntrada = new Date().toISOString().slice(0, 19).replace('T', ' ');

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Check if EPI exists
      const [epiRows] = await conn.execute(
        'SELECT id_epi, nome, quantidade_estoque, quantidade_minima FROM epi WHERE id_epi = ?',
        [id_epi]
      );

      const epis = epiRows as any[];
      if (epis.length === 0) {
        await conn.rollback();
        return NextResponse.json(
          { error: 'EPI não encontrado' },
          { status: 404 }
        );
      }

      const epi = epis[0];
      const qtdEntrada = parseInt(quantidade) || 0;

      if (qtdEntrada <= 0) {
        await conn.rollback();
        return NextResponse.json(
          { error: 'Quantidade deve ser maior que zero' },
          { status: 400 }
        );
      }

      // Create stock movement record
      const [movementResult] = await conn.execute(
        `INSERT INTO movimentacao_estoque (id_epi, tipo, quantidade, lote, data_validade, observacao, data_movimentacao)
         VALUES (?, 'entrada', ?, ?, ?, ?, ?)`,
        [id_epi, qtdEntrada, lote || null, data_validade || null, observacao || null, dataEntrada]
      );

      const movementId = (movementResult as any).insertId;

      // Update stock quantity
      await conn.execute(
        'UPDATE epi SET quantidade_estoque = quantidade_estoque + ? WHERE id_epi = ?',
        [qtdEntrada, id_epi]
      );

      // Registrar/atualizar lote de estoque (segunda leva, etc.)
      const loteNumero = lote || `LOTE-${Date.now()}`;
      const [existingLote] = await conn.execute(
        'SELECT id_lote, quantidade_disponivel FROM epi_lote WHERE id_epi = ? AND lote = ?',
        [id_epi, loteNumero]
      );

      if ((existingLote as any[]).length > 0) {
        // Atualizar lote existente (reposição do mesmo lote)
        await conn.execute(
          `UPDATE epi_lote SET quantidade = quantidade + ?, quantidade_disponivel = quantidade_disponivel + ?
           WHERE id_lote = ?`,
          [qtdEntrada, qtdEntrada, (existingLote as any[])[0].id_lote]
        );
      } else {
        // Criar novo lote
        await conn.execute(
          `INSERT INTO epi_lote (id_epi, lote, quantidade, quantidade_disponivel, data_fabricacao, data_validade)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [id_epi, loteNumero, qtdEntrada, qtdEntrada, data_fabricacao || null, data_validade || null]
        );
      }

      // Check for expired items
      if (data_validade) {
        const validadeDate = new Date(data_validade);
        if (validadeDate.getTime() < Date.now()) {
          await conn.execute(
            `INSERT INTO alertas (tipo, mensagem)
             VALUES ('vencimento_ca', ?)`,
            [`EPI com validade vencida: ${epi.nome} (Lote: ${loteNumero}, Validade: ${data_validade})`]
          );
        }
      }

      await conn.commit();

      return NextResponse.json(
        { message: 'Entrada registrada com sucesso', id: movementId },
        { status: 201 }
      );
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('Erro ao registrar entrada:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const [rows] = await pool.execute(
      `SELECT m.*, e.nome as epi_nome
       FROM movimentacao_estoque m
       JOIN epi e ON m.id_epi = e.id_epi
       WHERE m.tipo = 'entrada'
       ORDER BY m.data_movimentacao DESC`
    );
    return NextResponse.json({ entradas: rows });
  } catch (error) {
    console.error('Erro ao buscar entradas:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar entradas' },
      { status: 500 }
    );
  }
}