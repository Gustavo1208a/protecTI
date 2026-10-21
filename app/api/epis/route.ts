import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM epi ORDER BY created_at DESC'
    );
    return NextResponse.json({ epis: rows });
  } catch (error) {
    console.error('Erro ao buscar EPIs:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar EPIs' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const {
      nome,
      numeroCa,
      categoria,
      tamanho,
      quantidadeInicial,
      quantidadeMinima,
      lote,
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

    // Check if CA already exists
    const [existing] = await pool.execute(
      'SELECT id_epi FROM epi WHERE ca = ?',
      [numeroCa]
    );

    if ((existing as any[]).length > 0) {
      return NextResponse.json(
        { error: 'Já existe um EPI com esse número de CA' },
        { status: 409 }
      );
    }

    const [result] = await pool.execute(
      `INSERT INTO epi (nome, ca, validade_ca, quantidade_estoque, quantidade_minima, categoria, tamanho, lote, data_fabricacao, armario, compartimento)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nome,
        numeroCa,
        dataValidade || null,
        parseInt(quantidadeInicial) || 0,
        parseInt(quantidadeMinima) || 0,
        categoria || null,
        tamanho || null,
        lote || null,
        dataFabricacao || null,
        armario || null,
        compartimento,
      ]
    );

    const insertResult = result as any;

    return NextResponse.json(
      { message: 'EPI cadastrado com sucesso', id: insertResult.insertId },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro ao cadastrar EPI:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}