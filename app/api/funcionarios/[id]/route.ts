import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    const [rows] = await pool.execute(
      `SELECT id_func, nome, matricula, cpf, telefone, setor, funcao, status, created_at
       FROM funcionario WHERE id_func = ?`,
      [id]
    );

    const funcionarios = rows as any[];

    if (funcionarios.length === 0) {
      return NextResponse.json(
        { error: 'Funcionário não encontrado' },
        { status: 404 }
      );
    }

    const f = funcionarios[0];

    // Fetch movimentações (entregas + devoluções)
    const [entregasRows] = await pool.execute(
      `SELECT e.id_entrega as id, epi.nome as epi, 'Entrega' as acao, e.quantidade as qtd, DATE_FORMAT(e.data_entrega, '%d/%m/%Y %H:%i') as dataHora
       FROM entrega_epi e
       JOIN epi ON e.id_epi = epi.id_epi
       WHERE e.id_func = ?
       ORDER BY e.data_entrega DESC`,
      [id]
    );

    const [devolucoesRows] = await pool.execute(
      `SELECT d.id_devolucao as id, epi.nome as epi, 'Devolução' as acao, e.quantidade as qtd, DATE_FORMAT(d.data_devolucao, '%d/%m/%Y %H:%i') as dataHora
       FROM devolucao_epi d
       JOIN entrega_epi e ON d.id_entrega = e.id_entrega
       JOIN epi ON e.id_epi = epi.id_epi
       WHERE e.id_func = ?
       ORDER BY d.data_devolucao DESC`,
      [id]
    );

    const entregas = (entregasRows as any[]).map(e => ({
      id: `E-${e.id}`,
      epi: e.epi,
      acao: e.acao,
      qtd: e.qtd,
      dataHora: e.dataHora,
    }));

    const devolucoes = (devolucoesRows as any[]).map(d => ({
      id: `D-${d.id}`,
      epi: d.epi,
      acao: d.acao,
      qtd: d.qtd,
      dataHora: d.dataHora,
    }));

    const movimentacoes = [...entregas, ...devolucoes]
      .sort((a, b) => new Date(b.dataHora.split('/').reverse().join('-')).getTime() - new Date(a.dataHora.split('/').reverse().join('-')).getTime())
      .slice(0, 20);

    // Stats
    const [epiEmPosseResult] = await pool.execute(
      `SELECT
        e.id_epi,
        COALESCE(SUM(e.quantidade), 0) - COALESCE((
          SELECT COALESCE(SUM(e2.quantidade), 0) FROM entrega_epi e2
          JOIN devolucao_epi d2 ON d2.id_entrega = e2.id_entrega
          WHERE e2.id_func = ? AND e2.id_epi = e.id_epi
        ), 0) as qtd
       FROM entrega_epi e
       WHERE e.id_func = ?
       GROUP BY e.id_epi`,
      [id, id]
    );

    const epiEmPosse = (epiEmPosseResult as any[]).reduce((sum, r) => sum + (r.qtd || 0), 0);

    const [retiradasResult] = await pool.execute(
      `SELECT COALESCE(SUM(quantidade), 0) as total FROM entrega_epi WHERE id_func = ?`,
      [id]
    );
    const retiradasNoAno = (retiradasResult as any[])[0]?.total || 0;

    const [devolucoesTotalResult] = await pool.execute(
      `SELECT COALESCE(SUM(e.quantidade), 0) as total
       FROM devolucao_epi d
       JOIN entrega_epi e ON d.id_entrega = e.id_entrega
       WHERE e.id_func = ?`,
      [id]
    );
    const devolucoesTotal = (devolucoesTotalResult as any[])[0]?.total || 0;

    const [pendenciasResult] = await pool.execute(
      `SELECT COALESCE(COUNT(*), 0) as total
       FROM entrega_epi e
       WHERE e.id_func = ?
       AND NOT EXISTS (
         SELECT 1 FROM devolucao_epi d WHERE d.id_entrega = e.id_entrega
       )`,
      [id]
    );
    const pendencias = (pendenciasResult as any[])[0]?.total || 0;

    return NextResponse.json({
      funcionario: {
        id: f.id_func,
        codigo: `F-${String(f.id_func).padStart(3, '0')}`,
        matricula: f.matricula,
        nome: f.nome,
        cpf: f.cpf,
        telefone: f.telefone,
        setor: f.setor,
        cargo: f.funcao,
        status: f.status,
        createdAt: f.created_at,
        epiEmPosse,
        retiradasNoAno,
        devolucoes: devolucoesTotal,
        pendencias,
        movimentacoes,
      },
    });
  } catch (error) {
    console.error('Get funcionario error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}