"use client";

import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import Sidebar from "@/components/Sidebar/Sidebar";
import { Funcionario } from "@/lib/funcionarios";
import styles from "./funcionario-perfil.module.css";

export default function FuncionarioPerfil({ funcionario }: { funcionario: Funcionario }) {
  const {
    codigo,
    matricula,
    nome,
    cargo,
    setor,
    cpf,
    telefone,
    status,
    epiEmPosse,
    retiradasNoAno,
    devolucoes,
    pendencias,
    movimentacoes,
  } = funcionario;

  return (
    <div className={styles.page}>
      <Sidebar active="Funcionários" />

      <main className={styles.main}>
        <div className={styles.watermark} />

        <Link href="/funcionarios" className={styles.backLink}>
          <ArrowLeft size={16} strokeWidth={2} />
          Funcionários
        </Link>

        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Matrícula {matricula}</p>
            <h1 className={styles.title}>{nome}</h1>
            <p className={styles.subtitle}>{cargo}</p>
          </div>
          <button className={styles.addBtn} type="button">
            <Plus size={18} strokeWidth={2.2} />
            Registrar entrega
          </button>
        </header>

        <section className={styles.statsGrid}>
          <div className={styles.statCard}>
            <p className={styles.statLabel}>EPI&apos;s em posse</p>
            <p className={styles.statValue} style={{ color: "var(--text-main)" }}>
              {epiEmPosse}
            </p>
          </div>
          <div className={styles.statCard}>
            <p className={styles.statLabel}>Retiradas no ano</p>
            <p className={styles.statValue} style={{ color: "var(--yellow-1)" }}>
              {retiradasNoAno}
            </p>
          </div>
          <div className={styles.statCard}>
            <p className={styles.statLabel}>Devoluções</p>
            <p className={styles.statValue} style={{ color: "#4ade80" }}>
              {devolucoes}
            </p>
          </div>
          <div className={styles.statCard}>
            <p className={styles.statLabel}>Pendências</p>
            <p className={styles.statValue} style={{ color: "var(--text-main)" }}>
              {pendencias}
            </p>
          </div>
        </section>

        <h2 className={styles.sectionTitle}>Movimentações recentes</h2>

        <div className={styles.tableCard}>
          <div className={`${styles.row} ${styles.tableHead}`}>
            <span>ID</span>
            <span>EPI</span>
            <span>Ação</span>
            <span>Qtd.</span>
            <span>Data/Hora</span>
          </div>

          {movimentacoes.map((m) => (
            <div className={`${styles.row} ${styles.tableRow}`} key={m.id}>
              <span className={styles.mvId}>{m.id}</span>
              <span className={styles.mvEpi}>{m.epi}</span>
              <span className={styles.muted}>{m.acao}</span>
              <span className={styles.muted}>{m.qtd}</span>
              <span className={styles.muted}>{m.dataHora}</span>
            </div>
          ))}
        </div>

        <div className={styles.cadastralWrap}>
          <div className={styles.cadastralCard}>
            <h3 className={styles.cadastralTitle}>Dados Cadastrais</h3>

            <div className={styles.cadastralRow}>
              <span className={styles.cadastralLabel}>ID</span>
              <span className={styles.cadastralValue}>{codigo}</span>
            </div>
            <div className={styles.cadastralRow}>
              <span className={styles.cadastralLabel}>CPF</span>
              <span className={styles.cadastralValue}>{cpf}</span>
            </div>
            <div className={styles.cadastralRow}>
              <span className={styles.cadastralLabel}>Telefone</span>
              <span className={styles.cadastralValue}>{telefone}</span>
            </div>
            <div className={styles.cadastralRow}>
              <span className={styles.cadastralLabel}>Setor</span>
              <span className={styles.cadastralValue}>{setor.toUpperCase()}</span>
            </div>
            <div className={styles.cadastralRow}>
              <span className={styles.cadastralLabel}>Cargo</span>
              <span className={styles.cadastralValue}>{cargo.toUpperCase()}</span>
            </div>
            <div className={styles.cadastralRow}>
              <span className={styles.cadastralLabel}>Status</span>
              <span
                className={`${styles.badge} ${
                  status === "Ativo" ? styles.badgeAtivo : styles.badgeInativo
                }`}
              >
                {status}
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}