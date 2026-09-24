"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Plus } from "lucide-react";
import Sidebar from "@/components/Sidebar/Sidebar";
import { EPIS } from "@/lib/epis";
import styles from "./epis.module.css";

export default function Epis() {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return EPIS;
    return EPIS.filter(
      (e) =>
        e.nome.toLowerCase().includes(q) ||
        e.compartimento.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <div className={styles.page}>
      <Sidebar active="EPIs" />

      <main className={styles.main}>
        <div className={styles.watermark} />

        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Cadastros</p>
            <h1 className={styles.title}>EPIs</h1>
          </div>
          <Link className={styles.addBtn} href={"/epis/cadastro"} type="button">
            <Plus size={18} strokeWidth={2.2} />
            Cadastrar EPIs
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
            <span>Compar.</span>
            <span>EPI</span>
            <span>Quantidade</span>
            <span>Status</span>
          </div>

          {filtered.map((e) => (
            <div className={`${styles.row} ${styles.tableRow}`} key={e.id}>
              <span className={styles.compartimento}>{e.compartimento}</span>
              <span className={styles.nome}>{e.nome}</span>
              <span className={styles.quantidade}>{e.quantidade}</span>
              <span className={styles.statusCol}>
                <span
                  className={`${styles.badge} ${
                    e.status === "Disponível"
                      ? styles.badgeDisponivel
                      : styles.badgeBaixo
                  }`}
                >
                  {e.status}
                </span>
              </span>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className={styles.emptyState}>
              Nenhum EPI encontrado para &ldquo;{query}&rdquo;.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}