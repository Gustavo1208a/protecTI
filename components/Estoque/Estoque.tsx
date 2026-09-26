"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import Sidebar from "@/components/Sidebar/Sidebar";
import { EPIS } from "@/lib/epis";
import styles from "./estoque.module.css";

type StockStatus = "Disponível" | "Estoque baixo" | "Vencido" | "Vencer";

type StockRow = {
  id: string;
  epi: string;
  compartimento: string;
  disponivel: number;
  minimo: number;
  status: StockStatus;
};

const INITIAL_STOCK: StockRow[] = [
  { id: "1", epi: EPIS[0].nome, compartimento: "A1", disponivel: 42, minimo: 15, status: "Disponível" },
  { id: "2", epi: EPIS[1].nome, compartimento: "A2", disponivel: 63, minimo: 20, status: "Estoque baixo" },
  { id: "3", epi: EPIS[4].nome, compartimento: "B1", disponivel: 4, minimo: 6, status: "Vencido" },
  { id: "4", epi: EPIS[5].nome, compartimento: "B2", disponivel: 120, minimo: 40, status: "Vencer" },
];

const EPI_OPTIONS = EPIS.map((e) => e.nome);
const FORNECEDORES = ["SafetyMax Ltda", "ProtegeMais EPI", "Vida Segura Equipamentos"];
const ARMARIOS = ["Armário 01", "Armário 02", "Armário 03"];
const COMPARTIMENTOS = ["A1", "A2", "B1", "B2"];
const MOTIVOS = ["Abastecimento", "Entrega", "Descarte", "Perda"];

const STATUS_CLASS: Record<StockStatus, string> = {
  "Disponível": styles.badgeDisponivel,
  "Estoque baixo": styles.badgeBaixo,
  "Vencido": styles.badgeVencido,
  "Vencer": styles.badgeVencer,
};

const EMPTY_ENTRADA = {
  epi: EPI_OPTIONS[0],
  fornecedor: FORNECEDORES[0],
  lote: "",
  quantidade: "",
  dataEntrada: "",
  validade: "",
};

const EMPTY_SAIDA = {
  epi: EPI_OPTIONS[0],
  armario: ARMARIOS[0],
  compartimento: COMPARTIMENTOS[0],
  quantidade: "",
  dataHora: "",
  motivo: MOTIVOS[0],
};


function mascaraDataHora(valor: string) {
  const d = valor.replace(/\D/g, "").slice(0, 12);
  let out = d.slice(0, 2);
  if (d.length > 2) out += "/" + d.slice(2, 4);
  if (d.length > 4) out += "/" + d.slice(4, 8);
  if (d.length > 8) out += " " + d.slice(8, 10);
  if (d.length > 10) out += ":" + d.slice(10, 12);
  return out;
}

function lerDataHora(valor: string): Date | null {
  const m = valor.match(/^(\d{2})\/(\d{2})\/(\d{4})(?: (\d{2}):(\d{2}))?$/);
  if (!m) return null;
  const [dia, mes, ano, hora, min] = [m[1], m[2], m[3], m[4] ?? "0", m[5] ?? "0"].map(Number);
  const data = new Date(ano, mes - 1, dia, hora, min);
  return data.getFullYear() === ano && data.getMonth() === mes - 1 && data.getDate() === dia && hora < 24 && min < 60
    ? data
    : null;
}

export default function Estoque() {
  const [stock, setStock] = useState<StockRow[]>(INITIAL_STOCK);
  const [entrada, setEntrada] = useState(EMPTY_ENTRADA);
  const [saida, setSaida] = useState(EMPTY_SAIDA);
  const [showSuccess, setShowSuccess] = useState(false);
  const proceedRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (showSuccess) proceedRef.current?.focus();
  }, [showSuccess]);

  function updateEntrada<K extends keyof typeof entrada>(key: K, value: string) {
    setEntrada((f) => ({ ...f, [key]: value }));
  }
  function updateSaida<K extends keyof typeof saida>(key: K, value: string) {
    setSaida((f) => ({ ...f, [key]: value }));
  }

  function handleEntrada(e: FormEvent) {
    e.preventDefault();
    const qtd = Math.max(0, Number(entrada.quantidade) || 0);
    // TODO: integrar com o endpoint de entrada de lotes
    setStock((rows) => {
      const idx = rows.findIndex((r) => r.epi === entrada.epi);
      if (idx === -1 || qtd === 0) return rows;
      const expired =
        entrada.validade !== "" && new Date(entrada.validade).getTime() < Date.now();
      return rows.map((r, i) => {
        if (i !== idx) return r;
        const disponivel = r.disponivel + qtd;
        let status = r.status;
        if (expired) status = "Vencido";
        else if (status === "Estoque baixo" && disponivel > r.minimo) status = "Disponível";
        return { ...r, disponivel, status };
      });
    });
    setEntrada(EMPTY_ENTRADA);
    setShowSuccess(true);
  }

  function handleSaida(e: FormEvent) {
    e.preventDefault();
    const qtd = Math.max(0, Number(saida.quantidade) || 0);
    const target =
      stock.find((r) => r.epi === saida.epi && r.compartimento === saida.compartimento) ??
      stock.find((r) => r.epi === saida.epi);
    // TODO: integrar com o endpoint de saída / abastecimento
    if (target && qtd > 0) {
      setStock((rows) =>
        rows.map((r) => {
          if (r.id !== target.id) return r;
          const disponivel = Math.max(0, r.disponivel - qtd);
          const status: StockStatus =
            disponivel <= r.minimo && r.status === "Disponível" ? "Estoque baixo" : r.status;
          return { ...r, disponivel, status };
        })
      );
    }
    setSaida(EMPTY_SAIDA);
    setShowSuccess(true);
  }

  return (
    <div className={styles.page}>
      <Sidebar active="Estoque" />

      <main className={styles.main}>
        <div className={styles.watermark} />

        <header className={styles.header}>
          <p className={styles.eyebrow}>Almoxarifado</p>
          <h1 className={styles.title}>Estoque</h1>
          <p className={styles.subtitle}>
            RF09 a RF11 · Registre entradas de lotes, saídas e abasteça os
            compartimentos do armário.
          </p>
        </header>

        <div className={styles.cards}>
          {/* Registrar entrada */}
          <form className={styles.card} onSubmit={handleEntrada}>
            <h2 className={styles.cardTitle}>
              <ArrowDownToLine size={18} strokeWidth={2} className={styles.iconEntrada} />
              Registrar entrada
            </h2>

            <div className={styles.grid}>
              <div className={styles.field}>
                <label htmlFor="ent-epi">EPI</label>
                <select
                  id="ent-epi"
                  value={entrada.epi}
                  onChange={(e) => updateEntrada("epi", e.target.value)}
                >
                  {EPI_OPTIONS.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>
              <div className={styles.field}>
                <label htmlFor="ent-fornecedor">Fornecedor</label>
                <select
                  id="ent-fornecedor"
                  value={entrada.fornecedor}
                  onChange={(e) => updateEntrada("fornecedor", e.target.value)}
                >
                  {FORNECEDORES.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>

              <div className={styles.field}>
                <label htmlFor="ent-lote">Lote</label>
                <input
                  id="ent-lote"
                  type="text"
                  placeholder="LT-0000"
                  value={entrada.lote}
                  onChange={(e) => updateEntrada("lote", e.target.value)}
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="ent-qtd">Quantidade</label>
                <input
                  id="ent-qtd"
                  type="number"
                  min={0}
                  placeholder="0"
                  value={entrada.quantidade}
                  onChange={(e) => updateEntrada("quantidade", e.target.value)}
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="ent-data">Data de entrada</label>
                <input
                  id="ent-data"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={16}
                  placeholder="dd/mm/aaaa --:--"
                  value={entrada.dataEntrada}
                  onChange={(e) => updateEntrada("dataEntrada", mascaraDataHora(e.target.value))}
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="ent-validade">Validade</label>
                <input
                  id="ent-validade"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={16}
                  placeholder="dd/mm/aaaa --:--"
                  value={entrada.validade}
                  onChange={(e) => updateEntrada("validade", mascaraDataHora(e.target.value))}
                />
              </div>
            </div>

            <div className={styles.actions}>
              <button type="submit" className={`${styles.btn} ${styles.btnEntrada}`}>
                Confirmar entrada
              </button>
            </div>
          </form>

          {/* Registrar saída / abastecimento */}
          <form className={styles.card} onSubmit={handleSaida}>
            <h2 className={styles.cardTitle}>
              <ArrowUpFromLine size={18} strokeWidth={2} className={styles.iconSaida} />
              Registrar saída / abastecimento
            </h2>

            <div className={styles.grid}>
              <div className={styles.field}>
                <label htmlFor="sai-epi">EPI</label>
                <select
                  id="sai-epi"
                  value={saida.epi}
                  onChange={(e) => updateSaida("epi", e.target.value)}
                >
                  {EPI_OPTIONS.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>
              <div className={styles.field}>
                <label htmlFor="sai-armario">Armário</label>
                <select
                  id="sai-armario"
                  value={saida.armario}
                  onChange={(e) => updateSaida("armario", e.target.value)}
                >
                  {ARMARIOS.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>

              <div className={styles.field}>
                <label htmlFor="sai-comp">Compartimento</label>
                <select
                  id="sai-comp"
                  value={saida.compartimento}
                  onChange={(e) => updateSaida("compartimento", e.target.value)}
                >
                  {COMPARTIMENTOS.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>
              <div className={styles.field}>
                <label htmlFor="sai-qtd">Quantidade</label>
                <input
                  id="sai-qtd"
                  type="number"
                  min={0}
                  placeholder="0"
                  value={saida.quantidade}
                  onChange={(e) => updateSaida("quantidade", e.target.value)}
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="sai-data">Data/Hora</label>
                <input
                  id="sai-data"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={16}
                  placeholder="dd/mm/aaaa --:--"
                  value={saida.dataHora}
                  onChange={(e) => updateSaida("dataHora", mascaraDataHora(e.target.value))}
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="sai-motivo">Motivo</label>
                <select
                  id="sai-motivo"
                  value={saida.motivo}
                  onChange={(e) => updateSaida("motivo", e.target.value)}
                >
                  {MOTIVOS.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.actions}>
              <button type="submit" className={`${styles.btn} ${styles.btnSaida}`}>
                Confirmar saída
              </button>
            </div>
          </form>
        </div>

        <h2 className={styles.sectionTitle}>Saldo por item</h2>

        <div className={styles.tableCard}>
          <div className={`${styles.row} ${styles.tableHead}`}>
            <span>EPI</span>
            <span>Compart.</span>
            <span>Disponível</span>
            <span>Mínimo</span>
            <span>Status</span>
          </div>

          {stock.map((r) => (
            <div className={`${styles.row} ${styles.tableRow}`} key={r.id}>
              <span className={styles.nome}>{r.epi}</span>
              <span className={styles.compartimento}>{r.compartimento}</span>
              <span className={styles.disponivel}>{r.disponivel}</span>
              <span className={styles.minimo}>{r.minimo}</span>
              <span>
                <span className={`${styles.badge} ${STATUS_CLASS[r.status]}`}>
                  {r.status}
                </span>
              </span>
            </div>
          ))}
        </div>
      </main>

      {showSuccess && (
        <div className={styles.overlay} role="presentation">
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="sucesso-title"
          >
            <svg
              className={styles.checkIcon}
              viewBox="0 0 240 240"
              aria-hidden="true"
            >
              <defs>
                <clipPath id="circleClip">
                  <circle cx="120" cy="120" r="120" />
                </clipPath>
              </defs>
              <circle cx="120" cy="120" r="120" fill="#2ed353" />
              <path
                clipPath="url(#circleClip)"
                d="M0 0 H170 C120 30 95 110 105 240 H0 Z"
                fill="#78dc84"
              />
              <path
                d="M62 122 L102 160 L172 84"
                fill="none"
                stroke="#ffffff"
                strokeWidth="34"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <h2 id="sucesso-title" className={styles.modalTitle}>SUCESSO</h2>
            <button
              ref={proceedRef}
              type="button"
              className={styles.proceedBtn}
              onClick={() => setShowSuccess(false)}
            >
              Prosseguir
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
