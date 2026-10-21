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
      `SELECT e.id_entrega as id, epi.nome as epi, 'Entrega' as acao, e.quantidade as qtd, DATE_FORMAT(e.data_entrega, '%d/%m/%Y %H:%i') as dataHora, e.data_entrega as ts
       FROM entrega_epi e
       JOIN epi ON e.id_epi = epi.id_epi
       WHERE e.id_func = ?
       ORDER BY e.data_entrega DESC`,
      [id]
    );

    const [devolucoesRows] = await pool.execute(
      `SELECT d.id_devolucao as id, epi.nome as epi, 'Devolução' as acao, d.quantidade as qtd, DATE_FORMAT(d.data_devolucao, '%d/%m/%Y %H:%i') as dataHora, d.data_devolucao as ts
       FROM devolucao_epi d
       JOIN entrega_epi e ON d.id_entrega = e.id_entrega
       JOIN epi ON e.id_epi = epi.id_epi
       WHERE e.id_func = ?
       ORDER BY d.data_devolucao DESC`,
      [id]
    );

    // "ts" guarda a data/hora real só para ordenar (o texto dd/mm/aaaa não ordena).
    const entregas = (entregasRows as any[]).map(e => ({
      id: `E-${e.id}`,
      epi: e.epi,
      acao: e.acao,
      qtd: e.qtd,
      dataHora: e.dataHora,
      ts: e.ts,
    }));

    const devolucoes = (devolucoesRows as any[]).map(d => ({
      id: `D-${d.id}`,
      epi: d.epi,
      acao: d.acao,
      qtd: d.qtd,
      dataHora: d.dataHora,
      ts: d.ts,
    }));

    const movimentacoes = [...entregas, ...devolucoes]
      .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())
      .slice(0, 20)
      .map(({ ts, ...m }) => m);

    // Os quatro números do topo do perfil vêm prontos da view vw_funcionario_resumo
    const [resumoRows] = await pool.execute(
      `SELECT epi_em_posse, retiradas_no_ano, devolucoes, pendencias
       FROM vw_funcionario_resumo WHERE id_func = ?`,
      [id]
    );
    const resumo = (resumoRows as any[])[0] || {};
    const epiEmPosse = resumo.epi_em_posse || 0;
    const retiradasNoAno = resumo.retiradas_no_ano || 0;
    const devolucoesTotal = resumo.devolucoes || 0;
    const pendencias = resumo.pendencias || 0;

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