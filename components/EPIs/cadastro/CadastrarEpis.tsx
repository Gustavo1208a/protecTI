"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import Sidebar from "@/components/Sidebar/Sidebar";
import styles from "./cadastrar-epis.module.css";

const CATEGORIAS = [
  "Proteção da cabeça",
  "Proteção dos olhos e face",
  "Proteção auditiva",
  "Proteção respiratória",
  "Proteção das mãos",
  "Proteção dos pés",
];

const FORNECEDORES = ["SafetyMax Ltda", "ProtegeMais EPI", "Vida Segura Equipamentos"];

const ARMARIOS = ["Armário 01", "Armário 02", "Armário 03"];

export default function CadastrarEpi() {
  const [form, setForm] = useState({
    nome: "",
    numeroCa: "",
    categoria: CATEGORIAS[0],
    tamanho: "",
    quantidadeInicial: "",
    quantidadeMinima: "",
    lote: "",
    fornecedor: FORNECEDORES[0],
    dataFabricacao: "",
    dataValidade: "",
    armario: ARMARIOS[0],
    compartimento: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    if (error) setError(null);
  }

  function resetForm() {
    setForm({
      nome: "",
      numeroCa: "",
      categoria: CATEGORIAS[0],
      tamanho: "",
      quantidadeInicial: "",
      quantidadeMinima: "",
      lote: "",
      fornecedor: FORNECEDORES[0],
      dataFabricacao: "",
      dataValidade: "",
      armario: ARMARIOS[0],
      compartimento: "",
    });
    setSuccess(false);
    setError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/epis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao cadastrar EPI");
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
    router.push("/epis");
    router.refresh();
  }

  return (
    <div className={styles.page}>
      <Sidebar active="EPIs" />

      <main className={styles.main}>
        <div className={styles.watermark} />

        <Link href="/epis" className={styles.backLink}>
          <ArrowLeft size={16} strokeWidth={2} />
          EPIs
        </Link>

        <h1 className={styles.title}>Cadastrar EPI</h1>

        <div className={styles.formCard}>
          {success && (
            <div className={styles.successMessage}>
              <CheckCircle size={20} strokeWidth={2} />
              <span>EPI cadastrado com sucesso!</span>
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
                <label htmlFor="nome">Nome do EPI</label>
                <input
                  id="nome"
                  type="text"
                  placeholder="Ex.: Luva de Vaqueta"
                  value={form.nome}
                  onChange={(e) => update("nome", e.target.value)}
                  required
                  disabled={loading || success}
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="numeroCa">Número do CA</label>
                <input
                  id="numeroCa"
                  type="text"
                  placeholder="CA 00000"
                  value={form.numeroCa}
                  onChange={(e) => update("numeroCa", e.target.value)}
                  required
                  disabled={loading || success}
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="categoria">Categoria</label>
                <select
                  id="categoria"
                  value={form.categoria}
                  onChange={(e) => update("categoria", e.target.value)}
                  disabled={loading || success}
                >
                  {CATEGORIAS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.field}>
                <label htmlFor="tamanho">Tamanho</label>
                <input
                  id="tamanho"
                  type="text"
                  placeholder="Único, P, M, G, 42..."
                  value={form.tamanho}
                  onChange={(e) => update("tamanho", e.target.value)}
                  disabled={loading || success}
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="quantidadeInicial">Quantidade inicial</label>
                <input
                  id="quantidadeInicial"
                  type="number"
                  min={0}
                  placeholder="0"
                  value={form.quantidadeInicial}
                  onChange={(e) => update("quantidadeInicial", e.target.value)}
                  required
                  disabled={loading || success}
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="quantidadeMinima">Quantidade mínima</label>
                <input
                  id="quantidadeMinima"
                  type="number"
                  min={0}
                  placeholder="0"
                  value={form.quantidadeMinima}
                  onChange={(e) => update("quantidadeMinima", e.target.value)}
                  required
                  disabled={loading || success}
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="lote">Lote</label>
                <input
                  id="lote"
                  type="text"
                  placeholder="LT-0000"
                  value={form.lote}
                  onChange={(e) => update("lote", e.target.value)}
                  disabled={loading || success}
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="fornecedor">Fornecedor</label>
                <select
                  id="fornecedor"
                  value={form.fornecedor}
                  onChange={(e) => update("fornecedor", e.target.value)}
                  disabled={loading || success}
                >
                  {FORNECEDORES.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.field}>
                <label htmlFor="dataFabricacao">Data de fabricação</label>
                <input
                  id="dataFabricacao"
                  type="date"
                  value={form.dataFabricacao}
                  onChange={(e) => update("dataFabricacao", e.target.value)}
                  disabled={loading || success}
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="dataValidade">Data de validade</label>
                <input
                  id="dataValidade"
                  type="date"
                  value={form.dataValidade}
                  onChange={(e) => update("dataValidade", e.target.value)}
                  disabled={loading || success}
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="armario">Armário</label>
                <select
                  id="armario"
                  value={form.armario}
                  onChange={(e) => update("armario", e.target.value)}
                  disabled={loading || success}
                >
                  {ARMARIOS.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.field}>
                <label htmlFor="compartimento">Compartimento</label>
                <input
                  id="compartimento"
                  type="text"
                  placeholder="Ex.: A1"
                  value={form.compartimento}
                  onChange={(e) => update("compartimento", e.target.value)}
                  required
                  disabled={loading || success}
                />
              </div>
            </div>

            <div className={styles.actions}>
              <button type="submit" className={styles.submitBtn} disabled={loading || success}>
                {loading && <Loader2 size={18} strokeWidth={2} className={styles.spinner} />}
                {loading ? "Cadastrando..." : "Salvar EPI"}
              </button>
              {!success && (
                <Link
                  href="/epis"
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