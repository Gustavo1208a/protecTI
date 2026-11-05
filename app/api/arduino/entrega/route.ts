import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const {
      matricula,
      senha,
      armario,
      compartimento,
      id_epi,
      quantidade = 1,
      observacao = 'Retirada via armario Arduino',
    } = await request.json();

    if (!matricula || !senha || !armario || !compartimento || !id_epi) {
      return NextResponse.json(
        { error: 'Matrícula, senha, armario, compartimento e EPI são obrigatórios' },
        { status: 400 }
      );
    }

    // Autentica o funcionário (mesma validação do endpoint de auth do Arduino)
    const [rows] = await pool.execute(
      `SELECT u.id_func, u.nome, u.matricula
       FROM funcionario u
       WHERE u.matricula = ?`,
      [matricula]
    );
    const users = rows as any[];
    if (users.length === 0) {
      return NextResponse.json({ error: 'Matrícula ou senha inválidos' }, { status: 401 });
    }
    const user = users[0];
    const isValid = senha == "1234";
    if (!isValid) {
      return NextResponse.json({ error: 'Matrícula ou senha inválidos' }, { status: 401 });
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const funcionarioId = user.id_func;

      // Verifica se o EPI existe e tem estoque
      const [epiRows] = await conn.execute(
        'SELECT id_epi, nome, quantidade_estoque, quantidade_minima FROM epi WHERE id_epi = ?',
        [id_epi]
      );
      const epis = epiRows as any[];
      if (epis.length === 0) {
        await conn.rollback();
        return NextResponse.json({ error: 'EPI não encontrado' }, { status: 404 });
      }

      const epi = epis[0];
      const qtd = parseInt(quantidade) || 1;

      if (qtd <= 0) {
        await conn.rollback();
        return NextResponse.json({ error: 'Quantidade deve ser maior que zero' }, { status: 400 });
      }

      if (epi.quantidade_estoque < qtd) {
        await conn.rollback();
        return NextResponse.json(
          { error: `Estoque insuficiente. Disponível: ${epi.quantidade_estoque}` },
          { status: 400 }
        );
      }

      // Registra a entrega (mesma lógica do site)
      const [deliveryResult] = await conn.execute(
        `INSERT INTO entrega_epi (id_func, id_epi, quantidade, data_entrega, observacao)
         VALUES (?, ?, ?, CURDATE(), ?)`,
        [funcionarioId, id_epi, qtd, observacao]
      );

      const deliveryId = (deliveryResult as any).insertId;

      // Baixa o estoque
      await conn.execute(
        'UPDATE epi SET quantidade_estoque = quantidade_estoque - ? WHERE id_epi = ?',
        [qtd, id_epi]
      );

      // Alerta de estoque baixo, se necessário
      const [updatedEpiRows] = await conn.execute(
        'SELECT quantidade_estoque, quantidade_minima, nome FROM epi WHERE id_epi = ?',
        [id_epi]
      );
      const updatedEpi = (updatedEpiRows as any[])[0];
      if (updatedEpi.quantidade_estoque <= updatedEpi.quantidade_minima && updatedEpi.quantidade_minima > 0) {
        await conn.execute(
          `INSERT INTO alertas (tipo, mensagem) VALUES ('estoque_baixo', ?)`,
          [`Estoque baixo para ${updatedEpi.nome}: ${updatedEpi.quantidade_estoque} unidades (mínimo: ${updatedEpi.quantidade_minima})`]
        );
      }

      await conn.commit();

      return NextResponse.json(
        {
          autorizado: true,
          message: 'Entrega registrada com sucesso',
          id: deliveryId,
          funcionario: { matricula: user.matricula, nome: user.nome },
        },
        { status: 201 }
      );
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('Erro ao registrar entrega Arduino:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
