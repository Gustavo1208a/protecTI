import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const {
      id_epi,
      lote,
      quantidade,
      data_entrada,
      data_validade,
      observacao = '',
    } = await request.json();

    if (!id_epi || !quantidade || !data_entrada) {
      return NextResponse.json(
        { error: 'EPI, quantidade e data de entrada são obrigatórios' },
        { status: 400 }
      );
    }

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
        [id_epi, qtdEntrada, lote || null, data_validade || null, observacao || null, data_entrada]
      );

      const movementId = (movementResult as any).insertId;

      // Update stock quantity
      await conn.execute(
        'UPDATE epi SET quantidade_estoque = quantidade_estoque + ? WHERE id_epi = ?',
        [qtdEntrada, id_epi]
      );

      // Check if stock was below minimum and now is above - create alert if still below minimum
      const [updatedEpiRows] = await conn.execute(
        'SELECT quantidade_estoque, quantidade_minima, nome FROM epi WHERE id_epi = ?',
        [id_epi]
      );

      const updatedEpi = (updatedEpiRows as any[])[0];
      if (updatedEpi.quantidade_estoque <= updatedEpi.quantidade_minima && updatedEpi.quantidade_minima > 0) {
        await conn.execute(
          `INSERT INTO alertas (tipo, mensagem)
           VALUES ('estoque_baixo', ?)`,
          [`Estoque baixo para ${updatedEpi.nome}: ${updatedEpi.quantidade_estoque} unidades (mínimo: ${updatedEpi.quantidade_minima})`]
        );
      }

      // Check for expired items
      if (data_validade) {
        const validadeDate = new Date(data_validade);
        if (validadeDate.getTime() < Date.now()) {
          await conn.execute(
            `INSERT INTO alertas (tipo, mensagem)
             VALUES ('vencimento_ca', ?)`,
            [`EPI com validade vencida: ${updatedEpi.nome} (Lote: ${lote}, Validade: ${data_validade})`]
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