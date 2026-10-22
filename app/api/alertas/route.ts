import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

async function buildAlertas(conn: any) {
  // 1. EPIs com CA vencido
  const [caVencidos] = await conn.execute(
    `SELECT e.id_epi, e.nome, e.ca, e.validade_ca
     FROM epi e
     WHERE e.validade_ca IS NOT NULL AND e.validade_ca < CURDATE()
     ORDER BY e.validade_ca`
  );

  // 2. EPIs com validade próxima (30 dias)
  const [caProximos] = await conn.execute(
    `SELECT e.id_epi, e.nome, e.ca, e.validade_ca
     FROM epi e
     WHERE e.validade_ca IS NOT NULL
       AND e.validade_ca >= CURDATE()
       AND e.validade_ca <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)
     ORDER BY e.validade_ca`
  );

  // 3. EPIs com estoque abaixo do mínimo
  const [estoqueBaixo] = await conn.execute(
    `SELECT e.id_epi, e.nome, e.ca, e.quantidade_estoque, e.quantidade_minima
     FROM epi e
     WHERE e.quantidade_estoque <= e.quantidade_minima AND e.quantidade_minima > 0
     ORDER BY e.quantidade_estoque / e.quantidade_minima`
  );

  // 4. Entregas pendentes de devolução
  const [pendentesDevolucao] = await conn.execute(
    `SELECT e.id_entrega, e.id_func, e.id_epi, e.quantidade, e.data_entrega,
            f.nome as funcionario_nome,
            ep.nome as epi_nome
     FROM entrega_epi e
     JOIN funcionario f ON e.id_func = f.id_func
     JOIN epi ep ON e.id_epi = ep.id_epi
     LEFT JOIN devolucao_epi d ON d.id_entrega = e.id_entrega
     WHERE d.id_devolucao IS NULL
     ORDER BY e.data_entrega`
  );

  const alertas = [];

  // CA vencido - ALTA prioridade
  for (const epi of caVencidos as any[]) {
    alertas.push({
      id: `AL-CA-${epi.id_epi}`,
      tipo: 'EPI com CA vencido',
      item: `${epi.nome} (${epi.ca}) - Venceu em ${new Date(epi.validade_ca).toLocaleDateString('pt-BR')}`,
      prioridade: 'Alta' as const,
      categoria: 'vencimento_ca',
    });
  }

  // CA próximo do vencimento - MÉDIA prioridade
  for (const epi of caProximos as any[]) {
    const dias = Math.ceil((new Date(epi.validade_ca).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    alertas.push({
      id: `AL-CA-${epi.id_epi}-prox`,
      tipo: 'Validade do CA próxima',
      item: `${epi.nome} (${epi.ca}) - Vence em ${dias} dia(s)`,
      prioridade: 'Média' as const,
      categoria: 'vencimento_ca',
    });
  }

  // Estoque baixo - ALTA prioridade
  for (const epi of estoqueBaixo as any[]) {
    alertas.push({
      id: `AL-EST-${epi.id_epi}`,
      tipo: 'Estoque abaixo do mínimo',
      item: `${epi.nome} (${epi.ca}) - Estoque: ${epi.quantidade_estoque} / Mín: ${epi.quantidade_minima}`,
      prioridade: 'Alta' as const,
      categoria: 'estoque_baixo',
    });
  }

  // Devoluções pendentes - MÉDIA prioridade
  for (const ent of pendentesDevolucao as any[]) {
    alertas.push({
      id: `AL-DEV-${ent.id_entrega}`,
      tipo: 'Devolução pendente',
      item: `${ent.epi_nome} com ${ent.funcionario_nome} - Retirado em ${new Date(ent.data_entrega).toLocaleDateString('pt-BR')}`,
      prioridade: 'Média' as const,
      categoria: 'devolucao_pendente',
    });
  }

  // Ordenar: Alta > Média > Baixa
  const prioridadeOrder = { Alta: 0, Média: 1, Baixa: 2 };
  alertas.sort((a, b) => prioridadeOrder[a.prioridade] - prioridadeOrder[b.prioridade]);

  return alertas;
}

export async function GET(request: NextRequest) {
  try {
    const conn = await pool.getConnection();
    try {
      const alertas = await buildAlertas(conn);

      // Buscar quais alertas estão marcados como lidos na tabela alertas
      const alertaKeys = alertas.map(a => a.id);
      let lidosSet = new Set<string>();
      if (alertaKeys.length > 0) {
        const placeholders = alertaKeys.map(() => '?').join(',');
        const [rows] = await conn.execute(
          `SELECT alerta_key FROM alertas WHERE alerta_key IN (${placeholders}) AND lido = 1`,
          alertaKeys
        );
        lidosSet = new Set((rows as any[]).map(r => r.alerta_key));
      }

      const alertasComLido = alertas.map(a => ({
        ...a,
        lido: lidosSet.has(a.id),
      }));

      return NextResponse.json({ alertas: alertasComLido });
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('[ALERTAS API] Error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar alertas' },
      { status: 500 }
    );
  }
}

// PATCH - marcar alertas como lidos
export async function PATCH(request: NextRequest) {
  try {
    const { ids, lido = true } = await request.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Lista de IDs obrigatória' },
        { status: 400 }
      );
    }

    const conn = await pool.getConnection();
    try {
      // Garantir que os alertas existam na tabela (upsert por alerta_key)
      for (const alertaKey of ids) {
        await conn.execute(
          `INSERT INTO alertas (alerta_key, tipo, mensagem, lido)
           VALUES (?, 'sistema', 'Alerta do sistema', ?)
           ON DUPLICATE KEY UPDATE lido = VALUES(lido)`,
          [alertaKey, lido ? 1 : 0]
        );
      }
      return NextResponse.json({ success: true });
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('[ALERTAS API] PATCH Error:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar alertas' },
      { status: 500 }
    );
  }
}

// POST - criar alerta manual
export async function POST(request: NextRequest) {
  try {
    const { tipo, item, prioridade } = await request.json();

    const conn = await pool.getConnection();
    try {
      await conn.execute(
        `INSERT INTO alertas (tipo, mensagem, lido) VALUES (?, ?, 0)`,
        [tipo, item]
      );
      return NextResponse.json({ success: true });
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('[ALERTAS API] POST Error:', error);
    return NextResponse.json(
      { error: 'Erro ao criar alerta' },
      { status: 500 }
    );
  }
}