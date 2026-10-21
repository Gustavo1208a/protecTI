import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const {
      id_epi,
      armario,
      compartimento,
      quantidade,
      data_saida,
      motivo,
      observacao = '',
    } = await request.json();

    if (!id_epi || !quantidade || !data_saida || !motivo) {
      return NextResponse.json(
        { error: 'EPI, quantidade, data de saída e motivo são obrigatórios' },
        { status: 400 }
      );
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Check if EPI exists and has stock
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
      const qtdSaida = parseInt(quantidade) || 0;

      if (qtdSaida <= 0) {
        await conn.rollback();
        return NextResponse.json(
          { error: 'Quantidade deve ser maior que zero' },
          { status: 400 }
        );
      }

      if (epi.quantidade_estoque < qtdSaida) {
        await conn.rollback();
        return NextResponse.json(
          { error: `Estoque insuficiente. Disponível: ${epi.quantidade_estoque}` },
          { status: 400 }
        );
      }

      // Create stock movement record
      const [movementResult] = await conn.execute(
        `INSERT INTO movimentacao_estoque (id_epi, tipo, quantidade, armario, compartimento, motivo, observacao, data_movimentacao)
         VALUES (?, 'saida', ?, ?, ?, ?, ?, ?)`,
        [id_epi, qtdSaida, armario || null, compartimento || null, motivo, observacao || null, data_saida]
      );

      const movementId = (movementResult as any).insertId;

      // Update stock quantity
      await conn.execute(
        'UPDATE epi SET quantidade_estoque = quantidade_estoque - ? WHERE id_epi = ?',
        [qtdSaida, id_epi]
      );

      // Check if stock is now at or below minimum and create alert if needed
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

      await conn.commit();

      return NextResponse.json(
        { message: 'Saída registrada com sucesso', id: movementId },
        { status: 201 }
      );
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('Erro ao registrar saída:', error);
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
       WHERE m.tipo = 'saida'
       ORDER BY m.data_movimentacao DESC`
    );
    return NextResponse.json({ saidas: rows });
  } catch (error) {
    console.error('Erro ao buscar saídas:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar saídas' },
      { status: 500 }
    );
  }
}