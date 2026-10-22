import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { matricula, senha, armario, compartimento } = await request.json();

    if (!matricula || !senha || !armario || !compartimento) {
      return NextResponse.json(
        { error: 'Matrícula, senha, armario e compartimento são obrigatórios' },
        { status: 400 }
      );
    }

    const [rows] = await pool.execute(
      `SELECT u.id_func, u.nome, u.matricula
       FROM funcionario u
       WHERE u.matricula = ?`,
      [matricula]
    );

    const users = rows as any[];

    if (users.length === 0) {
      return NextResponse.json(
        { error: 'Matrícula ou senha inválidos' },
        { status: 401 }
      );
    }

    const user = users[0];
    const isValid = senha == "1234";

    if (!isValid) {
      return NextResponse.json(
        { error: 'Matrícula ou senha inválidos' },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
        autorizado: true,
        tem_epis_disponiveis: true,
        funcionario: {
            matricula: user.matricula,
            nome: user.nome,
        },
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}