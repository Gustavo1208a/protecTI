import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const {
      nome,
      categoria,
      tamanho,
      quantidadeInicial,
      quantidadeMinima,
      armario,
      compartimento,
    } = await request.json();

    if (!nome || !compartimento) {
      return NextResponse.json(
        { error: 'Nome e compartimento são obrigatórios' },
        { status: 400 }
      );
    }

    const [result] = await pool.execute(
      `UPDATE epi SET
        nome = ?,
        quantidade_estoque = ?,
        quantidade_minima = ?,
        categoria = ?,
        tamanho = ?,
        armario = ?,
        compartimento = ?
       WHERE id_epi = ?`,
      [
        nome,
        parseInt(quantidadeInicial) || 0,
        parseInt(quantidadeMinima) || 0,
        categoria || null,
        tamanho || null,
        armario || null,
        compartimento,
        id,
      ]
    );

    const updateResult = result as any;

    if (updateResult.affectedRows === 0) {
      return NextResponse.json(
        { error: 'EPI não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'EPI atualizado com sucesso' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao atualizar EPI:', error);
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
  try {
    const { id } = await params;

    // Remove registros dependentes antes de excluir o EPI (FK sem ON DELETE CASCADE)
    await pool.execute(
      'DELETE devolucao_epi FROM devolucao_epi INNER JOIN entrega_epi ON devolucao_epi.id_entrega = entrega_epi.id_entrega WHERE entrega_epi.id_epi = ?',
      [id]
    );
    await pool.execute('DELETE FROM entrega_epi WHERE id_epi = ?', [id]);
    await pool.execute('DELETE FROM movimentacao_estoque WHERE id_epi = ?', [id]);
    // epi_lote possui ON DELETE CASCADE e é removido automaticamente

    const [result] = await pool.execute(
      'DELETE FROM epi WHERE id_epi = ?',
      [id]
    );

    const deleteResult = result as any;

    if (deleteResult.affectedRows === 0) {
      return NextResponse.json(
        { error: 'EPI não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'EPI excluído com sucesso' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao excluir EPI:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}