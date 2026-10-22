import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const inicio = searchParams.get('inicio');
    const fim = searchParams.get('fim');
    const setor = searchParams.get('setor');
    const funcionario = searchParams.get('funcionario');

    const conn = await pool.getConnection();
    try {
      // Build separate WHERE clauses for each table
      const buildWhere = (dateCol: string, setorCol?: string, nomeCol?: string) => {
        const conditions: string[] = [];
        const params: any[] = [];

        if (inicio) {
          conditions.push(`${dateCol} >= ?`);
          params.push(inicio);
        }
        if (fim) {
          conditions.push(`${dateCol} <= ?`);
          params.push(fim + ' 23:59:59');
        }
        if (setor && setor !== 'TODOS' && setorCol) {
          conditions.push(`${setorCol} = ?`);
          params.push(setor);
        }
        if (funcionario && funcionario !== 'TODOS' && nomeCol) {
          conditions.push(`${nomeCol} = ?`);
          params.push(funcionario);
        }

        return { clause: conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '', params };
      };

      // Entregas WHERE (has date, setor, funcionario)
      const { clause: whereEntregas, params: paramsEntregas } = buildWhere('e.data_entrega', 'f.setor', 'f.nome');
      // Devoluções WHERE (has date, setor, funcionario)
      const { clause: whereDevolucoes, params: paramsDevolucoes } = buildWhere('d.data_devolucao', 'f.setor', 'f.nome');
      // Movimentação estoque WHERE (only has date - no setor/funcionario)
      const { clause: whereEstoque, params: paramsEstoque } = buildWhere('m.data_movimentacao');

      // Movimentações (entregas + devoluções + entradas de estoque)
      const [movRows] = await conn.execute(
        `SELECT
          CONCAT('MV-', LPAD(e.id_entrega, 4, '0')) as id,
          f.nome as funcionario,
          e.quantidade,
          'Entrega' as acao,
          DATE_FORMAT(e.data_entrega, '%d/%m/%Y %H:%i') as data,
          'entrega' as tipo
        FROM entrega_epi e
        JOIN funcionario f ON e.id_func = f.id_func
        ${whereEntregas}

        UNION ALL

        SELECT
          CONCAT('MV-', LPAD(d.id_devolucao, 4, '0')) as id,
          f.nome as funcionario,
          e.quantidade as quantidade,
          'Devolução' as acao,
          DATE_FORMAT(d.data_devolucao, '%d/%m/%Y %H:%i') as data,
          'devolucao' as tipo
        FROM devolucao_epi d
        JOIN entrega_epi e ON d.id_entrega = e.id_entrega
        JOIN funcionario f ON e.id_func = f.id_func
        ${whereDevolucoes}

        UNION ALL

        SELECT
          CONCAT('MV-', LPAD(m.id_movimentacao, 4, '0')) as id,
          'Estoque' as funcionario,
          m.quantidade,
          CASE m.tipo WHEN 'entrada' THEN 'Entrada' ELSE 'Saída' END as acao,
          DATE_FORMAT(m.data_movimentacao, '%d/%m/%Y %H:%i') as data,
          'estoque' as tipo
        FROM movimentacao_estoque m
        ${whereEstoque}

        ORDER BY data DESC`,
        [...paramsEntregas, ...paramsDevolucoes, ...paramsEstoque]
      );

      // Resumo do período
      const [resumoEntregas] = await conn.execute(
        `SELECT COUNT(*) as total FROM entrega_epi e
         JOIN funcionario f ON e.id_func = f.id_func
         ${whereEntregas}`,
        paramsEntregas
      );

      const [resumoDevolucoes] = await conn.execute(
        `SELECT COUNT(*) as total FROM devolucao_epi d
         JOIN entrega_epi e ON d.id_entrega = e.id_entrega
         JOIN funcionario f ON e.id_func = f.id_func
         ${whereDevolucoes}`,
        paramsDevolucoes
      );

      const [resumoEstoque] = await conn.execute(
        `SELECT SUM(quantidade_estoque) as total FROM epi`
      );

      // Consumo por setor (entregas no período)
      const [consumoSetor] = await conn.execute(
        `SELECT f.setor as label, SUM(e.quantidade) as valor
         FROM entrega_epi e
         JOIN funcionario f ON e.id_func = f.id_func
         ${whereEntregas} AND f.setor IS NOT NULL AND f.setor != ''
         GROUP BY f.setor
         ORDER BY valor DESC`,
        paramsEntregas
      );

      return NextResponse.json({
        movimentacoes: (movRows as any[]).map(r => ({
          id: r.id,
          funcionario: r.funcionario,
          quantidade: Number(r.quantidade),
          acao: r.acao,
          data: r.data,
        })),
        resumo: {
          entregas: (resumoEntregas as any[])[0]?.total || 0,
          devolucoes: (resumoDevolucoes as any[])[0]?.total || 0,
          estoqueAtual: (resumoEstoque as any[])[0]?.total || 0,
          custoEstimado: 'R$ 0,00',
        },
        consumoPorSetor: (consumoSetor as any[]).map(s => ({
          setor: s.label,
          valor: Number(s.valor),
        })),
      });
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('[RELATORIOS API] Error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar relatórios' },
      { status: 500 }
    );
  }
}