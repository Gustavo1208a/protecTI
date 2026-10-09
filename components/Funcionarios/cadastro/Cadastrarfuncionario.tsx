"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowLeft, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
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
    senha: "",
    temAcesso: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  function update<K extends keyof typeof form>(key: K, value: string | boolean) {
    setForm((f) => ({ ...f, [key]: value }));
    if (error) setError(null);
  }

  function resetForm() {
    setForm({
      matricula: "",
      nome: "",
      cpf: "",
      telefone: "",
      setor: SETORES[0],
      cargo: "",
      perfil: PERFIS[0],
      status: STATUS_OPTS[0],
      senha: "",
      temAcesso: false,
    });
    setSuccess(false);
    setError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/funcionarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao cadastrar funcionário");
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setLoading(false);
    }
  }

  function handleRegisterAnother() {
    resetForm();
  }

  function handleGoToList() {
    router.push("/funcionarios");
    router.refresh();
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
          {success && (
            <div className={styles.successMessage}>
              <CheckCircle size={20} strokeWidth={2} />
              <span>Funcionário cadastrado com sucesso!</span>
              <div className={styles.successActions}>
                <button
                  type="button"
                  className={styles.successBtn}
                  onClick={handleRegisterAnother}
                >
                  Cadastrar outro
                </button>
                <button
                  type="button"
                  className={styles.successBtnSecondary}
                  onClick={handleGoToList}
                >
                  Ver lista
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {error && (
              <div className={styles.errorMessage}>
                <AlertCircle size={18} strokeWidth={2} />
                {error}
              </div>
            )}

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
                  disabled={loading || success}
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
                  disabled={loading || success}
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
                  disabled={loading || success}
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
                  disabled={loading || success}
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="setor">Setor</label>
                <select
                  id="setor"
                  value={form.setor}
                  onChange={(e) => update("setor", e.target.value)}
                  disabled={loading || success}
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
                  disabled={loading || success}
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="perfil">Perfil de acesso</label>
                <select
                  id="perfil"
                  value={form.perfil}
                  onChange={(e) => update("perfil", e.target.value)}
                  disabled={loading || success}
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
                  disabled={loading || success}
                >
                  {STATUS_OPTS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tem Acesso - Last option with toggle switch */}
            <div className={styles.field} style={{ gridColumn: '1 / -1', marginTop: '8px' }}>
              <label className={styles.toggleLabel}>
                <input
                  id="temAcesso"
                  type="checkbox"
                  checked={form.temAcesso}
                  onChange={(e) => update("temAcesso", e.target.checked)}
                  disabled={loading || success}
                  className={styles.toggleInput}
                />
                <span className={styles.toggleTrack}>
                  <span className={styles.toggleThumb} />
                </span>
                <span className={styles.toggleText}>Tem acesso ao site (pode fazer login)</span>
              </label>
            </div>

            {form.temAcesso && (
              <div className={styles.field} style={{ gridColumn: '1 / -1', marginBottom: '16px' }}>
                <label htmlFor="senha">Senha</label>
                <input
                  id="senha"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={form.senha}
                  onChange={(e) => update("senha", e.target.value)}
                  required
                  disabled={loading || success}
                  minLength={6}
                />
              </div>
            )}

            <div className={styles.actions}>
              <button type="submit" className={styles.submitBtn} disabled={loading || success}>
                {loading && <Loader2 size={18} strokeWidth={2} className={styles.spinner} />}
                {loading ? "Cadastrando..." : "Cadastrar"}
              </button>
              {!success && (
                <Link
                  href="/funcionarios"
                  className={`${styles.cancelBtn} ${loading ? styles.disabled : ''}`}
                  onClick={(e) => loading && e.preventDefault()}
                >
                  Cancelar
                </Link>
              )}
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}