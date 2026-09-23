"use client";

import Sidebar from "@/components/Sidebar/Sidebar";
import styles from "./dashboard.module.css";

type StatCard = {
  label: string;
  value: string;
  color: string;
};

const STATS: StatCard[] = [
  { label: "Total de funcionários", value: "316", color: "var(--yellow-1)" },
  { label: "EPIs em estoque", value: "288", color: "var(--text-main)" },
  { label: "Devoluções", value: "80", color: "#4ade80" },
  { label: "Vencidos / A vencer", value: "1/1", color: "#f36a6a" },
];

type DayData = {
  day: string;
  entregas: number;
  devolucoes: number;
};

const WEEK: DayData[] = [
  { day: "Seg", entregas: 62, devolucoes: 18 },
  { day: "Ter", entregas: 70, devolucoes: 24 },
  { day: "Qua", entregas: 44, devolucoes: 15 },
  { day: "Qui", entregas: 88, devolucoes: 28 },
  { day: "Sex", entregas: 75, devolucoes: 22 },
  { day: "Sáb", entregas: 34, devolucoes: 16 },
];

type Sector = {
  label: string;
  value: number;
};

const SECTORS: Sector[] = [
  { label: "Produção", value: 138 },
  { label: "Manutenção", value: 94 },
  { label: "Logística", value: 61 },
  { label: "Almoxarifado", value: 33 },
  { label: "Segurança", value: 18 },
];

const MAX_SECTOR = Math.max(...SECTORS.map((s) => s.value));
const MAX_BAR = Math.max(...WEEK.map((d) => d.entregas + d.devolucoes));

export default function Dashboard() {
  return (
    <div className={styles.page}>
      <Sidebar active="Dashboard" />

      <main className={styles.main}>
        <div className={styles.watermark} />

        <h1 className={styles.title}>Visão Geral</h1>

        <section className={styles.statsGrid}>
          {STATS.map((stat) => (
            <div className={styles.statCard} key={stat.label}>
              <p className={styles.statLabel}>{stat.label}</p>
              <p className={styles.statValue} style={{ color: stat.color }}>
                {stat.value}
              </p>
            </div>
          ))}
        </section>

        <section className={styles.panelsGrid}>
          <div className={styles.chartCard}>
            <h2 className={styles.cardTitle}>Movimentação da semana</h2>
            <p className={styles.cardSub}>Entregas e devoluções dos dias</p>

            <div className={styles.chart}>
              {WEEK.map(({ day, entregas, devolucoes }) => {
                const totalPct = ((entregas + devolucoes) / MAX_BAR) * 100;
                const entregasPct = (entregas / (entregas + devolucoes)) * 100;
                const devolucoesPct = 100 - entregasPct;
                return (
                  <div className={styles.barGroup} key={day}>
                    <div
                      className={styles.barStack}
                      style={{ height: `${totalPct}%` }}
                    >
                      <div
                        className={styles.barDevolucoes}
                        style={{ height: `${devolucoesPct}%` }}
                      />
                      <div
                        className={styles.barEntregas}
                        style={{ height: `${entregasPct}%` }}
                      />
                    </div>
                    <span className={styles.barLabel}>{day}</span>
                  </div>
                );
              })}
            </div>

            <div className={styles.legend}>
              <span className={styles.legendItem}>
                <span
                  className={styles.legendDot}
                  style={{ background: "var(--yellow-1)" }}
                />
                Entregas
              </span>
              <span className={styles.legendItem}>
                <span
                  className={styles.legendDot}
                  style={{ background: "#f36a6a" }}
                />
                Devoluções
              </span>
            </div>
          </div>

          <div className={styles.sectorCard}>
            <h2 className={styles.cardTitle}>Consumo por setor</h2>
            <p className={styles.cardSub}>EPIs retirados no período</p>

            <div className={styles.sectorList}>
              {SECTORS.map((sector) => (
                <div className={styles.sectorRow} key={sector.label}>
                  <div className={styles.sectorHeader}>
                    <span className={styles.sectorLabel}>{sector.label}</span>
                    <span className={styles.sectorValue}>{sector.value}</span>
                  </div>
                  <div className={styles.sectorTrack}>
                    <div
                      className={styles.sectorFill}
                      style={{
                        width: `${(sector.value / MAX_SECTOR) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
