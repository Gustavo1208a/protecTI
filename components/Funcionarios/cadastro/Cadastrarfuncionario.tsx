"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Sidebar from "@/components/Sidebar/Sidebar";
import styles from "./cadastrar-funcionario.module.css";

const SETORES = [
  "Produção",
  "Manutenção",
  "Logística",
  "Almoxarifado",
  "Segurança",
  "Infraestrutura",
  "Prevenção",
  "Gerenciar",
];

const PERFIS = ["Funcionário", "Almoxarife", "Técnico de Segurança", "Administrador"];

const STATUS_OPTS = ["Ativo", "Inativo"];

export default function CadastrarFuncionario() {
  const [form, setForm] = useState({
    matricula: "",
    nome: "",
    cpf: "",
    telefone: "",
    setor: SETORES[0],
    cargo: "",
    perfil: PERFIS[0],
    status: STATUS_OPTS[0],
  });

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    // TODO: integrar com o endpoint de cadastro de funcionários
    console.log("cadastrar funcionário", form);
  }

  return (
    <div className={styles.page}>
      <Sidebar active="Funcionários" />

      <main className={styles.main}>
        <div className={styles.watermark} />

        <Link href="/funcionarios" className={styles.backLink}>
          <ArrowLeft size={16} strokeWidth={2} />
          Funcionários
        </Link>

        <h1 className={styles.title}>Cadastrar Funcionários</h1>

        <div className={styles.formCard}>
          <form onSubmit={handleSubmit}>
            <div className={styles.grid}>
              <div className={styles.field}>
                <label htmlFor="matricula">Matrícula</label>
                <input
                  id="matricula"
                  type="text"
                  placeholder="2024007"
                  value={form.matricula}
                  onChange={(e) => update("matricula", e.target.value)}
                  required
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="nome">Nome completo</label>
                <input
                  id="nome"
                  type="text"
                  placeholder="Nome completo do funcionário"
                  value={form.nome}
                  onChange={(e) => update("nome", e.target.value)}
                  required
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="cpf">CPF</label>
                <input
                  id="cpf"
                  type="text"
                  placeholder="000.000.000-00"
                  value={form.cpf}
                  onChange={(e) => update("cpf", e.target.value)}
                  required
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="telefone">Telefone</label>
                <input
                  id="telefone"
                  type="text"
                  placeholder="(11) 90000-0000"
                  value={form.telefone}
                  onChange={(e) => update("telefone", e.target.value)}
                  required
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="setor">Setor</label>
                <select
                  id="setor"
                  value={form.setor}
                  onChange={(e) => update("setor", e.target.value)}
                >
                  {SETORES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.field}>
                <label htmlFor="cargo">Cargo</label>
                <input
                  id="cargo"
                  type="text"
                  placeholder="Ex. Soldador"
                  value={form.cargo}
                  onChange={(e) => update("cargo", e.target.value)}
                  required
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="perfil">Perfil de acesso</label>
                <select
                  id="perfil"
                  value={form.perfil}
                  onChange={(e) => update("perfil", e.target.value)}
                >
                  {PERFIS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.field}>
                <label htmlFor="status">Status</label>
                <select
                  id="status"
                  value={form.status}
                  onChange={(e) => update("status", e.target.value)}
                >
                  {STATUS_OPTS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.actions}>
              <button type="submit" className={styles.submitBtn}>
                Cadastrar
              </button>
              <Link href="/funcionarios" className={styles.cancelBtn}>
                Cancelar
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}