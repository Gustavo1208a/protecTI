import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    // Total de funcionários ativos
    const [funcRows] = await pool.execute(
      `SELECT COUNT(*) as total FROM funcionario WHERE status = 'ativo'`
    );

    // Total de EPIs cadastrados
    const [epiRows] = await pool.execute(
      `SELECT COUNT(*) as total FROM epi`
    );

    // Total de EPIs em estoque (soma das quantidades)
    const [stockRows] = await pool.execute(
      `SELECT SUM(quantidade_estoque) as total FROM epi`
    );

    // EPIs com estoque baixo
    const [lowStockRows] = await pool.execute(
      `SELECT COUNT(*) as total FROM epi WHERE quantidade_estoque <= quantidade_minima AND quantidade_minima > 0`
    );

    // EPIs vencidos
    const [expiredRows] = await pool.execute(
      `SELECT COUNT(*) as total FROM epi WHERE validade_ca IS NOT NULL AND validade_ca < CURDATE()`
    );

    // EPIs a vencer (próximos 30 dias)
    const [expiringRows] = await pool.execute(
      `SELECT COUNT(*) as total FROM epi
       WHERE validade_ca IS NOT NULL
       AND validade_ca >= CURDATE()
       AND validade_ca <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)`
    );

    // Entregas da semana (últimos 7 dias)
    const [entregasWeek] = await pool.execute(
      `SELECT DATE_FORMAT(data_entrega, '%Y-%m-%d') as dia, COUNT(*) as total
       FROM entrega_epi
       WHERE data_entrega >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
       GROUP BY DATE_FORMAT(data_entrega, '%Y-%m-%d')
       ORDER BY dia`
    );

    // Devoluções da semana (últimos 7 dias)
    const [devolucoesWeek] = await pool.execute(
      `SELECT DATE_FORMAT(data_devolucao, '%Y-%m-%d') as dia, COUNT(*) as total
       FROM devolucao_epi
       WHERE data_devolucao >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
       GROUP BY DATE_FORMAT(data_devolucao, '%Y-%m-%d')
       ORDER BY dia`
    );

    // Entregas por setor
    const [setorRows] = await pool.execute(
      `SELECT f.setor as label, COUNT(*) as value
       FROM entrega_epi e
       JOIN funcionario f ON e.id_func = f.id_func
       WHERE f.setor IS NOT NULL AND f.setor != ''
       GROUP BY f.setor
       ORDER BY value DESC`
    );

    // Últimas movimentações
    const [lastEntregas] = await pool.execute(
      `SELECT e.id_entrega, e.id_func, e.id_epi, e.quantidade, e.data_entrega,
              f.nome as funcionario, ep.nome as epi
       FROM entrega_epi e
       JOIN funcionario f ON e.id_func = f.id_func
       JOIN epi ep ON e.id_epi = ep.id_epi
       ORDER BY e.data_entrega DESC
       LIMIT 5`
    );

    const [lastDevolucoes] = await pool.execute(
      `SELECT d.id_devolucao, d.id_entrega, d.estado, d.data_devolucao,
              f.nome as funcionario, ep.nome as epi, e.quantidade
       FROM devolucao_epi d
       JOIN entrega_epi e ON d.id_entrega = e.id_entrega
       JOIN funcionario f ON e.id_func = f.id_func
       JOIN epi ep ON e.id_epi = ep.id_epi
       ORDER BY d.data_devolucao DESC
       LIMIT 5`
    );

    // Dados da semana para o gráfico
    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const weekData = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

      const entregasDay = (entregasWeek as any[]).find(r => r.dia === dateStr)?.total || 0;
      const devolucoesDay = (devolucoesWeek as any[]).find(r => r.dia === dateStr)?.total || 0;

      weekData.push({
        day: weekDays[date.getDay()],
        entregas: Number(entregasDay),
        devolucoes: Number(devolucoesDay),
      });
    }

    return NextResponse.json({
      stats: {
        totalFuncionarios: (funcRows as any[])[0]?.total || 0,
        totalEpis: (epiRows as any[])[0]?.total || 0,
        totalEmEstoque: (stockRows as any[])[0]?.total || 0,
        estoqueBaixo: (lowStockRows as any[])[0]?.total || 0,
        vencidos: (expiredRows as any[])[0]?.total || 0,
        aVencer: (expiringRows as any[])[0]?.total || 0,
      },
      weekData,
      setores: (setorRows as any[]).map(s => ({ label: s.label, value: Number(s.value) })),
      ultimasEntregas: (lastEntregas as any[]).map(e => ({
        id: e.id_entrega,
        funcionario: e.funcionario,
        epi: e.epi,
        quantidade: e.quantidade,
        data: e.data_entrega,
      })),
      ultimasDevolucoes: (lastDevolucoes as any[]).map(d => ({
        id: d.id_devolucao,
        funcionario: d.funcionario,
        epi: d.epi,
        quantidade: d.quantidade,
        estado: d.estado,
        data: d.data_devolucao,
      })),
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar dados do dashboard' },
      { status: 500 }
    );
  }
}