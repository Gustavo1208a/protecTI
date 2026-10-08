import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyPassword, createToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { matricula, senha } = await request.json();

    if (!matricula || !senha) {
      return NextResponse.json(
        { error: 'Matrícula e senha são obrigatórios' },
        { status: 400 }
      );
    }

    const [rows] = await pool.execute(
      `SELECT u.id_usuario, u.nome, u.senha, u.permissao, u.acesso_site, c.nome as cargo
       FROM usuario u
       LEFT JOIN cargo c ON u.id_cargo = c.id_cargo
       WHERE u.id_usuario = ?`,
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
    const isValid = await verifyPassword(senha, user.senha);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Matrícula ou senha inválidos' },
        { status: 401 }
      );
    }

    // Verificar se o usuário tem acesso ao site
    if (!user.acesso_site) {
      return NextResponse.json(
        { error: 'Acesso negado. Usuário sem permissão para acessar o site.' },
        { status: 403 }
      );
    }

    const token = await createToken({
      id: user.id_usuario,
      nome: user.nome,
      permissao: user.permissao,
      cargo: user.cargo,
    });

    const response = NextResponse.json({
      user: {
        id: user.id_usuario,
        nome: user.nome,
        permissao: user.permissao,
        cargo: user.cargo,
      },
    });

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
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