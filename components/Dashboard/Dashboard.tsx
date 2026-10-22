"use client";

import { useEffect, useState } from "react";
import { Package, Clock } from "lucide-react";
import Sidebar from "@/components/Sidebar/Sidebar";
import styles from "./dashboard.module.css";

type Stats = {
  totalFuncionarios: number;
  totalEpis: number;
  totalEmEstoque: number;
  estoqueBaixo: number;
  vencidos: number;
  aVencer: number;
};

type WeekData = {
  day: string;
  entregas: number;
  devolucoes: number;
};

type Setor = {
  label: string;
  value: number;
};

type LastMovimentacao = {
  id: number;
  funcionario: string;
  epi: string;
  quantidade?: number;
  estado?: string;
  data: string;
};

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalFuncionarios: 0,
    totalEpis: 0,
    totalEmEstoque: 0,
    estoqueBaixo: 0,
    vencidos: 0,
    aVencer: 0,
  });
  const [weekData, setWeekData] = useState<WeekData[]>([]);
  const [setores, setSetores] = useState<Setor[]>([]);
  const [ultimasEntregas, setUltimasEntregas] = useState<LastMovimentacao[]>([]);
  const [ultimasDevolucoes, setUltimasDevolucoes] = useState<LastMovimentacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"entregas" | "devolucoes">("entregas");

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch("/api/dashboard");
        const data = await res.json();
        if (res.ok) {
          setStats(data.stats);
          setWeekData(data.weekData);
          setSetores(data.setores);
          setUltimasEntregas(data.ultimasEntregas);
          setUltimasDevolucoes(data.ultimasDevolucoes);
        }
      } catch (error) {
        console.error("Erro ao buscar dashboard:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  // Formata data para exibição
  function formatarData(iso: string) {
    if (!iso) return "-";
    const date = new Date(iso);
    return date.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const maxBar = Math.max(...weekData.map((d) => d.entregas + d.devolucoes), 1);
  const maxSetor = Math.max(...setores.map((s) => s.value), 1);

  const statCards = [
    {
      label: "Funcionários Ativos",
      value: stats.totalFuncionarios,
      accentColor: "var(--yellow-1)",
      detail: `${stats.totalFuncionarios} ativos no sistema`,
      detailColor: "var(--text-muted)",
    },
    {
      label: "EPIs Cadastrados",
      value: stats.totalEpis,
      accentColor: "#2fd066",
      detail: `${stats.totalEmEstoque} unidades em estoque`,
      detailColor: "var(--text-muted)",
    },
    {
      label: "Estoque Baixo",
      value: stats.estoqueBaixo,
      accentColor: stats.estoqueBaixo > 0 ? "#f36a6a" : "#2fd066",
      detail: stats.estoqueBaixo > 0
        ? `${stats.estoqueBaixo} EPIs precisam de reposição`
        : "Todos os itens acima do mínimo",
      detailColor: stats.estoqueBaixo > 0 ? "#f36a6a" : "#2fd066",
    },
    {
      label: "Validade do CA",
      value: stats.vencidos + stats.aVencer,
      accentColor: stats.vencidos > 0 ? "#f36a6a" : (stats.aVencer > 0 ? "var(--yellow-1)" : "#2fd066"),
      detail: stats.vencidos > 0
        ? `${stats.vencidos} vencidos, ${stats.aVencer} a vencer (30 dias)`
        : stats.aVencer > 0
        ? `${stats.aVencer} a vencer nos próximos 30 dias`
        : "Todos os CAs válidos",
      detailColor: stats.vencidos > 0 ? "#f36a6a" : (stats.aVencer > 0 ? "var(--yellow-1)" : "#2fd066"),
    },
  ];

  return (
    <div className={styles.page}>
      <Sidebar active="Dashboard" />

      <main className={styles.main}>
        <div className={styles.watermark} />

        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>Dashboard</h1>
            <p className={styles.subtitle}>Visão geral do controle de EPIs</p>
          </div>
        </header>

        {/* Stats Grid */}
        <section className={styles.statsGrid} aria-label="Estatísticas principais">
          {statCards.map((card, i) => (
            <div key={card.label} className={`${styles.statCard} ${loading ? styles.loading : ""}`}>
              <div className={styles.statAccent} style={{ background: card.accentColor }} />
              <div className={styles.statContent}>
                <p className={styles.statLabel}>{card.label}</p>
                <span className={styles.statValue} style={{ color: card.accentColor }}>
                  {loading ? "—" : card.value}
                </span>
                <p className={styles.statDetail} style={{ color: card.detailColor }}>
                  {loading ? "—" : card.detail}
                </p>
              </div>
            </div>
          ))}
        </section>

        {/* Panels Grid */}
        <section className={styles.panelsGrid}>
          {/* Chart Card */}
          <div className={styles.chartCard}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Movimentação da Semana</h2>
              <p className={styles.cardSub}>Entregas e devoluções dos últimos 7 dias</p>
            </div>

            <div className={styles.chartWrapper}>
              <div className={styles.chart} role="img" aria-label="Gráfico de barras de entregas e devoluções da semana">
                {weekData.map(({ day, entregas, devolucoes }) => {
                  const total = entregas + devolucoes;
                  const totalPct = maxBar > 0 ? (total / maxBar) * 100 : 0;
                  const entregasPct = total > 0 ? (entregas / total) * 100 : 0;
                  const devolucoesPct = total > 0 ? (devolucoes / total) * 100 : 0;
                  return (
                    <div className={styles.barGroup} key={day}>
                      <div className={styles.barArea}>
                        <div
                          className={styles.barStack}
                          style={{ height: `${total > 0 ? Math.max(totalPct, 4) : 4}%` }}
                          title={`${day}: ${entregas} entregas, ${devolucoes} devoluções`}
                        >
                          <div className={styles.barStackInner}>
                            {entregas > 0 && (
                              <div
                                className={styles.barEntregas}
                                style={{ height: `${entregasPct}%` }}
                              />
                            )}
                            {devolucoes > 0 && (
                              <div
                                className={styles.barDevolucoes}
                                style={{ height: `${devolucoesPct}%` }}
                              />
                            )}
                            {total === 0 && (
                              <div className={styles.barEmpty} style={{ height: "100%" }} />
                            )}
                          </div>
                        </div>
                      </div>
                      <span className={styles.barValue}>{total > 0 ? total : ""}</span>
                      <span className={styles.barLabel}>{day}</span>
                    </div>
                  );
                })}
              </div>

              <div className={styles.legend}>
                <span className={styles.legendItem}>
                  <span className={styles.legendDot} style={{ background: "var(--yellow-1)" }} />
                  Entregas
                </span>
                <span className={styles.legendItem}>
                  <span className={styles.legendDot} style={{ background: "#f36a6a" }} />
                  Devoluções
                </span>
              </div>
            </div>
          </div>

          {/* Recent Activity Card */}
          <div className={styles.activityCard}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Atividade Recente</h2>
              <p className={styles.cardSub}>Últimas entregas e devoluções</p>
            </div>

            <div className={styles.activityTabs}>
              <button
                className={`${styles.activityTab} ${activeTab === "entregas" ? styles.active : ""}`}
                onClick={() => setActiveTab("entregas")}
              >
                <Package size={14} />
                Entregas
              </button>
              <button
                className={`${styles.activityTab} ${activeTab === "devolucoes" ? styles.active : ""}`}
                onClick={() => setActiveTab("devolucoes")}
              >
                <Clock size={14} />
                Devoluções
              </button>
            </div>

            <div className={styles.activityList}>
              {activeTab === "entregas" ? (
                ultimasEntregas.length === 0 ? (
                  <div className={styles.emptyState}>Nenhuma entrega registrada</div>
                ) : (
                  ultimasEntregas.map((item) => (
                    <div key={item.id} className={styles.activityItem}>
                      <div className={styles.activityInfo}>
                        <span className={styles.activityEpi}>{item.epi}</span>
                        <span className={styles.activityFunc}>{item.funcionario}</span>
                      </div>
                      <div className={styles.activityMeta}>
                        <span className={styles.activityQty}>Qtd: {item.quantidade}</span>
                        <span className={styles.activityTime}>{formatarData(item.data)}</span>
                      </div>
                    </div>
                  ))
                )
              ) : (
                ultimasDevolucoes.length === 0 ? (
                  <div className={styles.emptyState}>Nenhuma devolução registrada</div>
                ) : (
                  ultimasDevolucoes.map((item) => (
                    <div key={item.id} className={styles.activityItem}>
                      <div className={styles.activityInfo}>
                        <span className={styles.activityEpi}>{item.epi}</span>
                        <span className={styles.activityFunc}>{item.funcionario}</span>
                      </div>
                      <div className={styles.activityMeta}>
                        <span className={`${styles.activityEstado} ${styles[item.estado?.toLowerCase() || "bom"]}`}>
                          {item.estado}
                        </span>
                        <span className={styles.activityTime}>{formatarData(item.data)}</span>
                      </div>
                    </div>
                  ))
                )
              )}
            </div>
          </div>
        </section>

        {/* Sectors Card - Full Width */}
        <section className={styles.sectorsCard}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Consumo por Setor</h2>
            <p className={styles.cardSub}>EPIs retirados no período</p>
          </div>

          <div className={styles.sectorList}>
            {setores.length === 0 ? (
              <div className={styles.emptyState}>Nenhum dado de setor disponível</div>
            ) : (
              setores.map((sector) => (
                <div className={styles.sectorRow} key={sector.label}>
                  <div className={styles.sectorHeader}>
                    <span className={styles.sectorLabel}>{sector.label}</span>
                    <span className={styles.sectorValue}>{sector.value}</span>
                  </div>
                  <div className={styles.sectorTrack}>
                    <div
                      className={styles.sectorFill}
                      style={{ width: `${(sector.value / maxSetor) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}