
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const {
      id_func,
      id_epi,
      quantidade = 1,
      observacao = '',
    } = await request.json();

    if (!id_func || !id_epi) {
      return NextResponse.json(
        { error: 'Funcionário e EPI são obrigatórios' },
        { status: 400 }
      );
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // A tela envia a MATRÍCULA (ex.: "2024001"). Matrícula é numérica, então
      // ela precisa ser procurada primeiro; só se não existir tentamos como id_func.
      const [funcRows] = await conn.execute(
        'SELECT id_func FROM funcionario WHERE matricula = ? OR id_func = ? ORDER BY (matricula = ?) DESC LIMIT 1',
        [String(id_func), /^\d+$/.test(String(id_func)) ? Number(id_func) : 0, String(id_func)]
      );
      const funcs = funcRows as any[];
      if (funcs.length === 0) {
        await conn.rollback();
        return NextResponse.json(
          { error: 'Funcionário não encontrado' },
          { status: 404 }
        );
      }
      const funcionarioId: number = funcs[0].id_func;

      // Check if EPI exists and has stock
      const [epiRows] = await conn.execute(
        'SELECT id_epi, nome, quantidade_estoque, quantidade_minima FROM epi WHERE id_epi = ?',
        [id_epi]
      );

      const epis = epiRows as any[];
      if (epis.length === 0) {
        await conn.rollback();
        return NextResponse.json(
          { error: 'EPI não encontrado' },
          { status: 404 }
        );
      }

      const epi = epis[0];
      const qtdEntregar = parseInt(quantidade) || 1;

      if (epi.quantidade_estoque < qtdEntregar) {
        await conn.rollback();
        return NextResponse.json(
          { error: `Estoque insuficiente. Disponível: ${epi.quantidade_estoque}` },
          { status: 400 }
        );
      }

      // Create delivery record.
      // A baixa no estoque e o alerta de estoque baixo são feitos pelos gatilhos
      // do banco (trg_entrega_baixa_estoque e trg_epi_alertas_update). O banco
      // também recusa EPI vencido e funcionário inativo (erro SQLSTATE 45000).
      const [deliveryResult] = await conn.execute(
        `INSERT INTO entrega_epi (id_func, id_epi, quantidade, data_entrega, observacao)
         VALUES (?, ?, ?, NOW(), ?)`,
        [funcionarioId, id_epi, qtdEntregar, observacao]
      );

      const deliveryId = (deliveryResult as any).insertId;

      await conn.commit();

      return NextResponse.json(
        { message: 'Entrega registrada com sucesso', id: deliveryId },
        { status: 201 }
      );
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  } catch (error) {
    // Regras de negócio do banco (EPI vencido, funcionário inativo...) chegam
    // como SQLSTATE 45000 com a mensagem pronta para mostrar ao usuário.
    if ((error as any)?.sqlState === '45000') {
      return NextResponse.json(
        { error: (error as any).sqlMessage || 'Entrega não permitida' },
        { status: 400 }
      );
    }
    console.error('Erro ao registrar entrega:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const [rows] = await pool.execute(
      `SELECT e.*, ep.nome as epi_nome, f.nome as funcionario_nome, f.matricula
       FROM entrega_epi e
       JOIN epi ep ON e.id_epi = ep.id_epi
       JOIN funcionario f ON e.id_func = f.id_func
       ORDER BY e.data_entrega DESC, e.id_entrega DESC`
    );
    return NextResponse.json({ entregas: rows });
  } catch (error) {
    console.error('Erro ao buscar entregas:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar entregas' },
      { status: 500 }
    );
  }
}