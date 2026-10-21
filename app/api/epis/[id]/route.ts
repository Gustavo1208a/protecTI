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
      numeroCa,
      categoria,
      tamanho,
      quantidadeInicial,
      quantidadeMinima,
      lote,
      fornecedor,
      dataFabricacao,
      dataValidade,
      armario,
      compartimento,
    } = await request.json();

    if (!nome || !numeroCa || !compartimento) {
      return NextResponse.json(
        { error: 'Nome, número do CA e compartimento são obrigatórios' },
        { status: 400 }
      );
    }

    // Check if CA already exists for another EPI
    const [existing] = await pool.execute(
      'SELECT id_epi FROM epi WHERE ca = ? AND id_epi != ?',
      [numeroCa, id]
    );

    if ((existing as any[]).length > 0) {
      return NextResponse.json(
        { error: 'Já existe um EPI com esse número de CA' },
        { status: 409 }
      );
    }

    const [result] = await pool.execute(
      `UPDATE epi SET
        nome = ?,
        ca = ?,
        validade_ca = ?,
        quantidade_estoque = ?,
        quantidade_minima = ?,
        categoria = ?,
        tamanho = ?,
        lote = ?,
        fornecedor = ?,
        data_fabricacao = ?,
        armario = ?,
        compartimento = ?
       WHERE id_epi = ?`,
      [
        nome,
        numeroCa,
        dataValidade || null,
        parseInt(quantidadeInicial) || 0,
        parseInt(quantidadeMinima) || 0,
        categoria || null,
        tamanho || null,
        lote || null,
        fornecedor || null,
        dataFabricacao || null,
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
    // EPI que já tem entrega/entrada/saída registrada não pode ser apagado
    // (o histórico precisa continuar existindo).
    if ((error as any)?.code === 'ER_ROW_IS_REFERENCED_2') {
      return NextResponse.json(
        { error: 'Este EPI possui movimentações registradas e não pode ser excluído' },
        { status: 409 }
      );
    }
    console.error('Erro ao excluir EPI:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}