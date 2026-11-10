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
      `INSERT INTO epi (nome, quantidade_estoque, quantidade_minima, categoria, tamanho, armario, compartimento)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        nome,
        parseInt(quantidadeInicial) || 0,
        parseInt(quantidadeMinima) || 0,
        categoria || null,
        tamanho || null,
        armario || null,
        compartimento,
      ]
    );

    const insertResult = result as any;
    const idEpi = insertResult.insertId;

    return NextResponse.json(
      { message: 'EPI cadastrado com sucesso', id: idEpi },
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