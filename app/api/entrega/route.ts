import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const {
      id_func,
      id_epi,
      lote: loteSelecionado = null,
      quantidade = 1,
      observacao = '',
    } = await request.json();

    if (!id_func || !id_epi) {
      return NextResponse.json(
        { error: 'Funcionário e EPI são obrigatórios' },
        { status: 400 }
      );
    }

    const qtdEntregar = parseInt(quantidade) || 1;

    if (qtdEntregar <= 0) {
      return NextResponse.json(
        { error: 'Quantidade deve ser maior que zero' },
        { status: 400 }
      );
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [funcRows] = await conn.execute(
        'SELECT id_func FROM funcionario WHERE id_func = ?',
        [id_func]
      );
      const funcs = funcRows as any[];
      if (funcs.length === 0) {
        await conn.rollback();
        return NextResponse.json(
          { error: 'Funcionário não encontrado' },
          { status: 404 }
        );
      }
      const funcionarioId = funcs[0].id_func;

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

      if (qtdEntregar <= 0) {
        await conn.rollback();
        return NextResponse.json(
          { error: 'Quantidade deve ser maior que zero' },
          { status: 400 }
        );
      }

      // Selecionar lote: priorizar o informado, senão buscar lote com estoque disponível (FIFO)
      let loteEntrega = null;
      if (loteSelecionado) {
        const [loteRows] = await conn.execute(
          'SELECT quantidade_disponivel FROM epi_lote WHERE id_epi = ? AND lote = ?',
          [id_epi, loteSelecionado]
        );
        const loteList = loteRows as any[];
        if (loteList.length === 0) {
          await conn.rollback();
          return NextResponse.json(
            { error: 'Lote selecionado não encontrado para este EPI' },
            { status: 400 }
          );
        }
        if (loteList[0].quantidade_disponivel < qtdEntregar) {
          await conn.rollback();
          return NextResponse.json(
            { error: `Quantidade insuficiente no lote selecionado. Disponível: ${loteList[0].quantidade_disponivel}` },
            { status: 400 }
          );
        }
        loteEntrega = loteSelecionado;

        await conn.execute(
          'UPDATE epi_lote SET quantidade_disponivel = quantidade_disponivel - ? WHERE id_epi = ? AND lote = ?',
          [qtdEntregar, id_epi, loteSelecionado]
        );
      } else {
        const [lotes] = await conn.execute(
          `SELECT id_lote, lote, quantidade_disponivel FROM epi_lote
           WHERE id_epi = ? AND quantidade_disponivel > 0
           ORDER BY criado_em ASC, id_lote ASC`,
          [id_epi]
        );
        const loteList = lotes as any[];
        const totalDisponivel = loteList.reduce((acc, l) => acc + l.quantidade_disponivel, 0);
        if (totalDisponivel < qtdEntregar) {
          await conn.rollback();
          return NextResponse.json(
            { error: 'Não há lotes com estoque suficiente para este EPI' },
            { status: 400 }
          );
        }
        loteEntrega = loteList.length > 0 ? loteList[0].lote : null;
        let restante = qtdEntregar;
        for (const loteRow of loteList) {
          if (restante <= 0) break;
          const baixar = Math.min(restante, loteRow.quantidade_disponivel);
          await conn.execute(
            'UPDATE epi_lote SET quantidade_disponivel = quantidade_disponivel - ? WHERE id_lote = ?',
            [baixar, loteRow.id_lote]
          );
          restante -= baixar;
        }
      }

      if (epi.quantidade_estoque < qtdEntregar) {
        await conn.rollback();
        return NextResponse.json(
          { error: `Estoque insuficiente. Disponível: ${epi.quantidade_estoque}` },
          { status: 400 }
        );
      }

      // Create delivery record
      const [deliveryResult] = await conn.execute(
        `INSERT INTO entrega_epi (id_func, id_epi, lote, quantidade, data_entrega, observacao)
         VALUES (?, ?, ?, ?, CURDATE(), ?)`,
        [funcionarioId, id_epi, loteEntrega, qtdEntregar, observacao]
      );

      const deliveryId = (deliveryResult as any).insertId;

      // Update stock
      await conn.execute(
        'UPDATE epi SET quantidade_estoque = quantidade_estoque - ? WHERE id_epi = ?',
        [qtdEntregar, id_epi]
      );

      // Check if stock is now at or below minimum and create alert if needed
      const [updatedEpiRows] = await conn.execute(
        'SELECT quantidade_estoque, quantidade_minima, nome FROM epi WHERE id_epi = ?',
        [id_epi]
      );

      const updatedEpi = (updatedEpiRows as any[])[0];
      if (updatedEpi.quantidade_estoque <= updatedEpi.quantidade_minima && updatedEpi.quantidade_minima > 0) {
        await conn.execute(
          `INSERT INTO alertas (tipo, mensagem)
           VALUES ('estoque_baixo', ?)`,
          [`Estoque baixo para ${updatedEpi.nome}: ${updatedEpi.quantidade_estoque} unidades (mínimo: ${updatedEpi.quantidade_minima})`]
        );
      }

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