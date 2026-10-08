import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { hashPassword, createToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { matricula, nome, senha, permissao = 1, id_cargo, acesso_site = true } = await request.json();

    if (!matricula || !nome || !senha) {
      return NextResponse.json(
        { error: 'Matrícula, nome e senha são obrigatórios' },
        { status: 400 }
      );
    }

    if (senha.length < 6) {
      return NextResponse.json(
        { error: 'A senha deve ter pelo menos 6 caracteres' },
        { status: 400 }
      );
    }

    const [existingUsers] = await pool.execute(
      'SELECT id_usuario FROM usuario WHERE id_usuario = ?',
      [matricula]
    );

    if ((existingUsers as any[]).length > 0) {
      return NextResponse.json(
        { error: 'Matrícula já cadastrada' },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(senha);

    await pool.execute(
      `INSERT INTO usuario (id_usuario, nome, senha, permissao, id_cargo, acesso_site)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [matricula, nome, hashedPassword, permissao, id_cargo || null, acesso_site]
    );

    const [rows] = await pool.execute(
      `SELECT u.id_usuario, u.nome, u.permissao, u.acesso_site, c.nome as cargo
       FROM usuario u
       LEFT JOIN cargo c ON u.id_cargo = c.id_cargo
       WHERE u.id_usuario = ?`,
      [matricula]
    );

    const users = rows as any[];
    const user = users[0];

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
        acesso_site: user.acesso_site,
      },
    });

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}