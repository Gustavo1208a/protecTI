"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Plus } from "lucide-react";
import Sidebar from "@/components/Sidebar/Sidebar";
import { FUNCIONARIOS } from "@/lib/funcionarios";
import styles from "./funcionarios.module.css";

export default function Funcionarios() {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return FUNCIONARIOS;
    return FUNCIONARIOS.filter(
      (f) =>
        f.nome.toLowerCase().includes(q) || f.setor.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <div className={styles.page}>
      <Sidebar active="Funcionários" />

      <main className={styles.main}>
        <div className={styles.watermark} />

        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Cadastros</p>
            <h1 className={styles.title}>Funcionários</h1>
          </div>
          <Link className={styles.addBtn} type="button" href={"/funcionarios/cadastro"}>
            <Plus size={18} strokeWidth={2.2} />
            Cadastrar funcionário
          </Link>
        </header>

        <div className={styles.searchBar}>
          <Search size={18} strokeWidth={1.8} />
          <input
            type="text"
            placeholder="Buscar por nome, ou setor"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className={styles.tableCard}>
          <div className={`${styles.row} ${styles.tableHead}`}>
            <span>Nome</span>
            <span>Setor</span>
            <span>Cargo</span>
            <span>Status</span>
            <span />
          </div>

          {filtered.map((f) => (
            <div className={`${styles.row} ${styles.tableRow}`} key={f.id}>
              <span className={styles.nome}>{f.nome}</span>
              <span className={styles.muted}>{f.setor}</span>
              <span className={styles.muted}>{f.cargo}</span>
              <span>
                <span
                  className={`${styles.badge} ${
                    f.status === "Ativo" ? styles.badgeAtivo : styles.badgeInativo
                  }`}
                >
                  {f.status}
                </span>
              </span>
              <Link className={styles.verPerfil} href={`/funcionarios/${f.id}`}>
                Ver Perfil
              </Link>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className={styles.emptyState}>
              Nenhum funcionário encontrado para &ldquo;{query}&rdquo;.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}