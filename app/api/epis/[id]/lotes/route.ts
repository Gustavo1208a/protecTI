import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const [rows] = await pool.execute(
      `SELECT id_lote, lote, quantidade, quantidade_disponivel, data_fabricacao, data_validade, criado_em
       FROM epi_lote
       WHERE id_epi = ?
       ORDER BY criado_em DESC, id_lote DESC`,
      [id]
    );
    return NextResponse.json({ lotes: rows });
  } catch (error) {
    console.error('Erro ao buscar lotes:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar lotes' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { lote, quantidade, data_fabricacao, data_validade } = await request.json();

    if (!lote || !quantidade) {
      return NextResponse.json(
        { error: 'Lote e quantidade são obrigatórios' },
        { status: 400 }
      );
    }

    const qtd = parseInt(quantidade) || 0;
    if (qtd <= 0) {
      return NextResponse.json(
        { error: 'Quantidade deve ser maior que zero' },
        { status: 400 }
      );
    }

    const [epiRows] = await pool.execute(
      'SELECT id_epi FROM epi WHERE id_epi = ?',
      [id]
    );
    const epis = epiRows as any[];
    if (epis.length === 0) {
      return NextResponse.json({ error: 'EPI não encontrado' }, { status: 404 });
    }

    const [existing] = await pool.execute(
      'SELECT id_lote FROM epi_lote WHERE id_epi = ? AND lote = ?',
      [id, lote]
    );
    if ((existing as any[]).length > 0) {
      return NextResponse.json(
        { error: 'Já existe um lote com este número para este EPI' },
        { status: 409 }
      );
    }

    const [result] = await pool.execute(
      `INSERT INTO epi_lote (id_epi, lote, quantidade, quantidade_disponivel, data_fabricacao, data_validade)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, lote, qtd, qtd, data_fabricacao || null, data_validade || null]
    );

    return NextResponse.json(
      { message: 'Lote registrado com sucesso', id_lote: (result as any).insertId },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro ao criar lote:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const id_lote = searchParams.get('id_lote');

  if (!id_lote) {
    return NextResponse.json(
      { error: 'id_lote é obrigatório' },
      { status: 400 }
    );
  }

  try {
    const [result] = await pool.execute(
      'DELETE FROM epi_lote WHERE id_lote = ? AND id_epi = ?',
      [id_lote, id]
    );
    if ((result as any).affectedRows === 0) {
      return NextResponse.json({ error: 'Lote não encontrado' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Lote removido com sucesso' });
  } catch (error) {
    console.error('Erro ao remover lote:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
