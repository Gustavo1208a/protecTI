"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import Sidebar from "@/components/Sidebar/Sidebar";
import styles from "./alertas.module.css";

type Prioridade = "Alta" | "Média" | "Baixa";

type Alerta = {
  id: string;
  tipo: string;
  item: string;
  prioridade: Prioridade;
};

const ALERTAS: Alerta[] = [
  { id: "AL-01", tipo: "EPI vencido — entrega bloqueada", item: "Avental de Raspa para Solda", prioridade: "Alta" },
  { id: "AL-02", tipo: "Estoque abaixo do mínimo", item: "Luva de Vaqueta", prioridade: "Alta" },
  { id: "AL-03", tipo: "Validade próxima (30 dias)", item: "Protetor Auricular Plug", prioridade: "Média" },
  { id: "AL-04", tipo: "Compartimento aberto sem retirada", item: "Armário 01 — C1", prioridade: "Baixa" },
];

const PRIORIDADE_CLASS: Record<Prioridade, string> = {
  Alta: styles.badgeAlta,
  Média: styles.badgeMedia,
  Baixa: styles.badgeBaixa,
};

const ALTA_PRIORIDADE = ALERTAS.filter((a) => a.prioridade === "Alta").length;
const MEDIA_PRIORIDADE = ALERTAS.filter((a) => a.prioridade === "Média").length;
const RESOLVIDOS_NO_MES = 14;

export default function Alertas() {
  const [lidos, setLidos] = useState(false);

  return (
    <div className={styles.page}>
      <Sidebar active="Alertas" />

      <main className={styles.main}>
        <div className={styles.watermark} />

        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Segurança do Trabalho</p>
            <h1 className={styles.title}>Alertas</h1>
            <p className={styles.subtitle}>
              RF17 a RF19 · Validade, estoque mínimo e bloqueios automáticos de entrega.
            </p>
          </div>
          <button
            type="button"
            className={styles.marcarBtn}
            onClick={() => setLidos((v) => !v)}
          >
            {lidos ? "Ver todos" : "Marcar todos como lidos"}
          </button>
        </header>

        <div className={styles.summary}>
          <div className={styles.summaryCard}>
            <p className={styles.summaryLabel}>Alta prioridade</p>
            <p className={`${styles.summaryValue} ${styles.summaryAlta}`}>{ALTA_PRIORIDADE}</p>
          </div>
          <div className={styles.summaryCard}>
            <p className={styles.summaryLabel}>Média prioridade</p>
            <p className={`${styles.summaryValue} ${styles.summaryMedia}`}>{MEDIA_PRIORIDADE}</p>
          </div>
          <div className={styles.summaryCard}>
            <p className={styles.summaryLabel}>Resolvidos no mês</p>
            <p className={`${styles.summaryValue} ${styles.summaryResolvidos}`}>{RESOLVIDOS_NO_MES}</p>
          </div>
        </div>

        <h2 className={styles.sectionTitle}>
          <Bell size={18} strokeWidth={2} className={styles.sectionIcon} />
          Lista de alertas
        </h2>

        <div className={styles.tableCard}>
          <div className={`${styles.row} ${styles.tableHead}`}>
            <span>ID</span>
            <span>Tipo</span>
            <span>Item</span>
            <span>Prioridade</span>
          </div>

          {!lidos &&
            ALERTAS.map((a) => (
              <div className={`${styles.row} ${styles.tableRow}`} key={a.id}>
                <span className={styles.idCell}>{a.id}</span>
                <span className={styles.tipoCell}>{a.tipo}</span>
                <span className={styles.itemCell}>{a.item}</span>
                <span>
                  <span className={`${styles.badge} ${PRIORIDADE_CLASS[a.prioridade]}`}>
                    {a.prioridade}
                  </span>
                </span>
              </div>
            ))}
        </div>
      </main>
    </div>
  );
}
