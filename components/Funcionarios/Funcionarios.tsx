"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, Plus, Loader2 } from "lucide-react";
import Sidebar from "@/components/Sidebar/Sidebar";
import styles from "./funcionarios.module.css";

type Funcionario = {
  id: number;
  nome: string;
  matricula: string;
  cpf: string;
  telefone: string;
  setor: string;
  cargo: string | null;
  status: string;
  createdAt: string;
  temAcesso?: boolean;
};

export default function Funcionarios() {
  const [query, setQuery] = useState("");
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFuncionarios() {
      try {
        const res = await fetch("/api/funcionarios");
        const data = await res.json();
        if (res.ok && data.funcionarios) {
          setFuncionarios(data.funcionarios);
        }
      } catch (error) {
        console.error("Erro ao buscar funcionários:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchFuncionarios();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return funcionarios;
    return funcionarios.filter(
      (f) =>
        f.nome.toLowerCase().includes(q) || f.setor.toLowerCase().includes(q)
    );
  }, [query, funcionarios]);

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
          {loading ? (
            <div className={styles.loadingState}>
              <Loader2 size={24} strokeWidth={2} className={styles.spinner} />
              Carregando funcionários...
            </div>
          ) : (
            <>
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
                  <span className={styles.muted}>{f.setor || "-"}</span>
                  <span className={styles.muted}>{f.cargo || "-"}</span>
                  <span>
                    <span
                      className={`${styles.badge} ${
                        f.status === "ativo" ? styles.badgeAtivo : styles.badgeInativo
                      }`}
                    >
                      {f.status === "ativo" ? "Ativo" : "Inativo"}
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
            </>
          )}
        </div>
      </main>
    </div>
  );
}