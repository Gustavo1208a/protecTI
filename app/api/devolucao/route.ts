import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const {
      id_entrega,
      estado = 'bom',
      observacao = '',
      quantidade = 1,
    } = await request.json();

    if (!id_entrega) {
      return NextResponse.json(
        { error: 'ID da entrega é obrigatório' },
        { status: 400 }
      );
    }

    const validEstados = ['bom', 'danificado', 'perdido'];
    if (!validEstados.includes(estado)) {
      return NextResponse.json(
        { error: 'Estado inválido. Use: bom, danificado ou perdido' },
        { status: 400 }
      );
    }

    const qtdDevolver = parseInt(quantidade) || 1;
    if (qtdDevolver <= 0) {
      return NextResponse.json(
        { error: 'Quantidade deve ser maior que zero' },
        { status: 400 }
      );
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Get delivery info and check if it exists
      const [entregaRows] = await conn.execute(
        `SELECT e.id_entrega, e.id_func, e.id_epi, e.quantidade as qtd_entregue,
                ep.nome as epi_nome, ep.quantidade_estoque, ep.quantidade_minima, ep.compartimento,
                f.nome as funcionario_nome
         FROM entrega_epi e
         JOIN epi ep ON e.id_epi = ep.id_epi
         JOIN funcionario f ON e.id_func = f.id_func
         WHERE e.id_entrega = ?`,
        [id_entrega]
      );

      const entregas = entregaRows as any[];
      if (entregas.length === 0) {
        await conn.rollback();
        return NextResponse.json(
          { error: 'Entrega não encontrada' },
          { status: 404 }
        );
      }

      const entrega = entregas[0];

      // Check how many items have already been returned for this delivery
      // (each devolucao_epi row = 1 item since table doesn't have quantidade column)
      const [devolucoesRows] = await conn.execute(
        `SELECT COUNT(*) as total_devolvido
         FROM devolucao_epi
         WHERE id_entrega = ?`,
        [id_entrega]
      );

      const totalDevolvido = (devolucoesRows as any[])[0]?.total_devolvido || 0;
      const qtdPendente = entrega.qtd_entregue - totalDevolvido;

      if (qtdPendente <= 0) {
        await conn.rollback();
        return NextResponse.json(
          { error: 'Esta entrega já foi totalmente devolvida' },
          { status: 400 }
        );
      }

      if (qtdDevolver > qtdPendente) {
        await conn.rollback();
        return NextResponse.json(
          { error: `Quantidade a devolver (${qtdDevolver}) excede o pendente (${qtdPendente})` },
          { status: 400 }
        );
      }

      // Create devolucao record with current datetime
      const [devolucaoResult] = await conn.execute(
        `INSERT INTO devolucao_epi (id_entrega, data_devolucao, estado, observacao)
         VALUES (?, NOW(), ?, ?)`,
        [id_entrega, estado.toLowerCase(), observacao]
      );

      const devolucaoId = (devolucaoResult as any).insertId;

      // Update EPI stock (increase)
      await conn.execute(
        'UPDATE epi SET quantidade_estoque = quantidade_estoque + ? WHERE id_epi = ?',
        [qtdDevolver, entrega.id_epi]
      );

      // Create movimentacao_estoque record for the return
      await conn.execute(
        `INSERT INTO movimentacao_estoque (id_epi, tipo, quantidade, lote, armario, compartimento, motivo, observacao)
         VALUES (?, 'entrada', ?, '', '', ?, 'Devolução', ?)`,
        [entrega.id_epi, qtdDevolver, entrega.compartimento, `Devolução da entrega #${id_entrega} - ${observacao || 'Sem observação'}`]
      );

      // Check if stock is now above minimum and was previously at/below minimum
      const [updatedEpiRows] = await conn.execute(
        'SELECT quantidade_estoque, quantidade_minima, nome FROM epi WHERE id_epi = ?',
        [entrega.id_epi]
      );

      const updatedEpi = (updatedEpiRows as any[])[0];

      // If stock was below minimum and now is above, we could clear an alert (optional)
      // For now, just check if we need to create low stock alert for other cases

      await conn.commit();

      return NextResponse.json(
        {
          message: 'Devolução registrada com sucesso',
          id: devolucaoId,
          id_entrega: id_entrega,
          epi: entrega.epi_nome,
          funcionario: entrega.funcionario_nome,
          quantidade: qtdDevolver,
          estado: estado,
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
    console.error('Erro ao registrar devolução:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function GET() {
  const conn = await pool.getConnection();
  try {
    // Get pending items (entregas that don't have devolucao)
    const [pendentesRows] = await conn.execute(
      `SELECT e.id_entrega as id, e.id_func, e.id_epi, e.quantidade as qtd_entregue,
              e.data_entrega, e.observacao,
              ep.nome as epi_nome, ep.compartimento,
              f.nome as funcionario_nome, f.matricula
       FROM entrega_epi e
       JOIN epi ep ON e.id_epi = ep.id_epi
       JOIN funcionario f ON e.id_func = f.id_func
       LEFT JOIN devolucao_epi d ON d.id_entrega = e.id_entrega
       WHERE d.id_devolucao IS NULL
       ORDER BY e.data_entrega DESC`
    );

    // Get recent devoluções
    const [devolucoesRows] = await conn.execute(
      `SELECT d.id_devolucao as id, d.id_entrega, d.data_devolucao, d.estado, d.observacao,
              e.quantidade as qtd,
              ep.nome as epi_nome, ep.compartimento,
              f.nome as funcionario_nome, f.matricula
       FROM devolucao_epi d
       JOIN entrega_epi e ON d.id_entrega = e.id_entrega
       JOIN epi ep ON e.id_epi = ep.id_epi
       JOIN funcionario f ON e.id_func = f.id_func
       ORDER BY d.data_devolucao DESC, d.id_devolucao DESC
       LIMIT 50`
    );

    const pendentes = (pendentesRows as any[]).map(row => ({
      id: `P-${row.id}`,
      id_entrega: row.id,
      epi: row.epi_nome,
      funcionario: row.funcionario_nome,
      matricula: row.matricula,
      compartimento: row.compartimento,
      retiradoEm: row.data_entrega ? new Date(row.data_entrega).toLocaleDateString('pt-BR') : '',
      qtdPendente: row.qtd_entregue,
      qtdEntregue: row.qtd_entregue,
    }));

    const dbEstadoToDisplay = (estado: string): string => {
      switch (estado.toLowerCase()) {
        case 'bom': return 'Bom estado';
        case 'danificado': return 'Danificado';
        case 'perdido': return 'Perdido';
        default: return estado;
      }
    };

    const devolucoes = (devolucoesRows as any[]).map(row => ({
      id: `D-${row.id}`,
      epi: row.epi_nome,
      funcionario: row.funcionario_nome,
      matricula: row.matricula,
      compartimento: row.compartimento,
      qtd: row.qtd,
      estado: dbEstadoToDisplay(row.estado),
      observacao: row.observacao,
      dataHora: row.data_devolucao ? new Date(row.data_devolucao).toLocaleString('pt-BR') : '',
    }));

    return NextResponse.json({ pendentes, devolucoes });
  } catch (error) {
    console.error('Erro ao buscar devoluções:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar devoluções' },
      { status: 500 }
    );
  } finally {
    conn.release();
  }
}