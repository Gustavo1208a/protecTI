import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id_epi = searchParams.get('id_epi');

    if (!id_epi) {
      return NextResponse.json(
        { error: 'id_epi é obrigatório' },
        { status: 400 }
      );
    }

    const [rows] = await pool.execute(
      `SELECT id_lote, lote, quantidade, quantidade_disponivel, data_fabricacao, data_validade
       FROM epi_lote
       WHERE id_epi = ?
       ORDER BY criado_em ASC, id_lote ASC`,
      [id_epi]
    );

    return NextResponse.json({ lotes: rows });
  } catch (error) {
    console.error('Erro ao buscar lotes:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
