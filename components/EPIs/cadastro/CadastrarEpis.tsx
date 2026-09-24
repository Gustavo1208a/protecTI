"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
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

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    // TODO: integrar com o endpoint de cadastro de EPIs
    console.log("cadastrar EPI", form);
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
          <form onSubmit={handleSubmit}>
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
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="categoria">Categoria</label>
                <select
                  id="categoria"
                  value={form.categoria}
                  onChange={(e) => update("categoria", e.target.value)}
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
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="fornecedor">Fornecedor</label>
                <select
                  id="fornecedor"
                  value={form.fornecedor}
                  onChange={(e) => update("fornecedor", e.target.value)}
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
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="dataValidade">Data de validade</label>
                <input
                  id="dataValidade"
                  type="date"
                  value={form.dataValidade}
                  onChange={(e) => update("dataValidade", e.target.value)}
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="armario">Armário</label>
                <select
                  id="armario"
                  value={form.armario}
                  onChange={(e) => update("armario", e.target.value)}
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
                />
              </div>
            </div>

            <div className={styles.actions}>
              <button type="submit" className={styles.submitBtn}>
                Salvar EPI
              </button>
              <Link href="/epis" className={styles.cancelBtn}>
                Cancelar
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}