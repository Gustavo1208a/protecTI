import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { hashPassword } from '@/lib/auth';

const PERFIL_TO_PERMISSAO: Record<string, number> = {
  'Funcionário': 1,
  'Almoxarife': 2,
  'Técnico de Segurança': 2,
  'Administrador': 3,
};

export async function POST(request: NextRequest) {
  try {
    const { matricula, nome, cpf, telefone, setor, cargo, perfil, status, senha, temAcesso } = await request.json();

    if (!matricula || !nome || !cpf) {
      return NextResponse.json(
        { error: 'Matrícula, nome e CPF são obrigatórios' },
        { status: 400 }
      );
    }

    // If has access, password is required
    if (temAcesso && (!senha || senha.length < 6)) {
      return NextResponse.json(
        { error: 'A senha deve ter pelo menos 6 caracteres' },
        { status: 400 }
      );
    }

    // Check if funcionario already exists
    const [existingFuncionarios] = await pool.execute(
      'SELECT id_func FROM funcionario WHERE matricula = ? OR cpf = ?',
      [matricula, cpf]
    );

    if ((existingFuncionarios as any[]).length > 0) {
      return NextResponse.json(
        { error: 'Matrícula ou CPF já cadastrado' },
        { status: 409 }
      );
    }

    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Insert into funcionario
      const [funcResult] = await connection.execute(
        `INSERT INTO funcionario (matricula, nome, cpf, telefone, setor, funcao, status)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [matricula, nome, cpf, telefone || null, setor || null, cargo || null, status?.toLowerCase() || 'ativo']
      );

      const funcInsertResult = funcResult as any;

      // If has access, create usuario record
      if (temAcesso && senha) {
        // Check if usuario already exists
        const [existingUsuarios] = await connection.execute(
          'SELECT id_usuario FROM usuario WHERE id_usuario = ?',
          [matricula]
        );

        if ((existingUsuarios as any[]).length > 0) {
          await connection.rollback();
          connection.release();
          return NextResponse.json(
            { error: 'Matrícula já cadastrada como usuário' },
            { status: 409 }
          );
        }

        const permissao = PERFIL_TO_PERMISSAO[perfil] || 1;
        const hashedPassword = await hashPassword(senha);

        await connection.execute(
          `INSERT INTO usuario (id_usuario, nome, senha, permissao, id_cargo, acesso_site)
           VALUES (?, ?, ?, ?, NULL, ?)`,
          [matricula, nome, hashedPassword, permissao, temAcesso]
        );
      }

      await connection.commit();

      const [rows] = await connection.execute(
        `SELECT id_func, nome, matricula, cpf, telefone, setor, funcao, status, created_at
         FROM funcionario WHERE id_func = ?`,
        [funcInsertResult.insertId]
      );

      const funcionarios = rows as any[];
      const funcionario = funcionarios[0];

      connection.release();

      return NextResponse.json({
        funcionario: {
          id: funcionario.id_func,
          nome: funcionario.nome,
          matricula: funcionario.matricula,
          cpf: funcionario.cpf,
          telefone: funcionario.telefone,
          setor: funcionario.setor,
          cargo: funcionario.funcao,
          status: funcionario.status,
          createdAt: funcionario.created_at,
          temAcesso: !!temAcesso,
        },
      }, { status: 201 });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Register funcionario error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const [rows] = await pool.execute(
      `SELECT id_func, nome, matricula, cpf, telefone, setor, funcao, status, created_at
       FROM funcionario
       ORDER BY nome`
    );

    const funcionarios = (rows as any[]).map(f => ({
      id: f.id_func,
      nome: f.nome,
      matricula: f.matricula,
      cpf: f.cpf,
      telefone: f.telefone,
      setor: f.setor,
      cargo: f.funcao,
      status: f.status,
      createdAt: f.created_at,
    }));

    return NextResponse.json({ funcionarios });
  } catch (error) {
    console.error('Get funcionarios error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}