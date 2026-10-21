"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { ArrowDownToLine, ArrowUpFromLine, Loader2 } from "lucide-react";
import Sidebar from "@/components/Sidebar/Sidebar";
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

type EpiOption = {
  id: string;
  nome: string;
  compartimento: string;
};

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
  id_epi: "",
  lote: "",
  quantidade: "",
  dataEntrada: "",
  validade: "",
};

const EMPTY_SAIDA = {
  id_epi: "",
  armario: ARMARIOS[0],
  compartimento: COMPARTIMENTOS[0],
  quantidade: "",
  dataHora: "",
  motivo: MOTIVOS[0],
};

export default function Estoque() {
  const [stock, setStock] = useState<StockRow[]>([]);
  const [epis, setEpis] = useState<EpiOption[]>([]);
  const [entrada, setEntrada] = useState(EMPTY_ENTRADA);
  const [saida, setSaida] = useState(EMPTY_SAIDA);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const proceedRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    fetchStock();
    fetchEpis();
  }, []);

  useEffect(() => {
    if (showSuccess) proceedRef.current?.focus();
  }, [showSuccess]);

  async function fetchStock() {
    try {
      const res = await fetch('/api/estoque');
      if (res.ok) {
        const data = await res.json();
        setStock(data.stock || []);
      }
    } catch (error) {
      console.error('Erro ao buscar estoque:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchEpis() {
    try {
      const res = await fetch('/api/epis');
      if (res.ok) {
        const data = await res.json();
        const epiOptions: EpiOption[] = (data.epis || []).map((epi: any) => ({
          id: String(epi.id_epi),
          nome: epi.nome,
          compartimento: epi.compartimento || 'N/A',
        }));
        setEpis(epiOptions);
        if (epiOptions.length > 0) {
          setEntrada(prev => ({ ...prev, id_epi: epiOptions[0].id }));
          setSaida(prev => ({ ...prev, id_epi: epiOptions[0].id }));
        }
      }
    } catch (error) {
      console.error('Erro ao buscar EPIs:', error);
    }
  }

  function updateEntrada<K extends keyof typeof entrada>(key: K, value: string) {
    setEntrada((f) => ({ ...f, [key]: value }));
  }
  function updateSaida<K extends keyof typeof saida>(key: K, value: string) {
    setSaida((f) => ({ ...f, [key]: value }));
  }

  function formatDateForAPI(dateStr: string, withTime = false): string {
    if (!dateStr) return new Date().toISOString().slice(0, 19).replace('T', ' ');
    if (withTime) {
      // datetime-local format: yyyy-mm-ddThh:mm
      return dateStr.replace('T', ' ') + ':00';
    }
    // date format: yyyy-mm-dd
    return dateStr;
  }

  async function handleEntrada(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    const qtd = Math.max(0, Number(entrada.quantidade) || 0);
    if (!entrada.id_epi || qtd === 0 || !entrada.dataEntrada) {
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/estoque/entrada', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_epi: entrada.id_epi,
          lote: entrada.lote,
          quantidade: qtd,
          data_entrada: formatDateForAPI(entrada.dataEntrada, true),
          data_validade: entrada.validade || null,
        }),
      });

      if (res.ok) {
        setEntrada(EMPTY_ENTRADA);
        if (epis.length > 0) {
          setEntrada(prev => ({ ...prev, id_epi: epis[0].id }));
        }
        setShowSuccess(true);
        fetchStock();
      } else {
        const error = await res.json();
        alert(error.error || 'Erro ao registrar entrada');
      }
    } catch (error) {
      console.error('Erro ao registrar entrada:', error);
      alert('Erro ao registrar entrada');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSaida(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    const qtd = Math.max(0, Number(saida.quantidade) || 0);
    if (!saida.id_epi || qtd === 0 || !saida.dataHora) {
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/estoque/saida', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_epi: saida.id_epi,
          armario: saida.armario,
          compartimento: saida.compartimento,
          quantidade: qtd,
          data_saida: formatDateForAPI(saida.dataHora, true),
          motivo: saida.motivo,
        }),
      });

      if (res.ok) {
        setSaida(EMPTY_SAIDA);
        if (epis.length > 0) {
          setSaida(prev => ({ ...prev, id_epi: epis[0].id, armario: ARMARIOS[0], compartimento: COMPARTIMENTOS[0], motivo: MOTIVOS[0] }));
        }
        setShowSuccess(true);
        fetchStock();
      } else {
        const error = await res.json();
        alert(error.error || 'Erro ao registrar saída');
      }
    } catch (error) {
      console.error('Erro ao registrar saída:', error);
      alert('Erro ao registrar saída');
    } finally {
      setSubmitting(false);
    }
  }

  const epiOptions = epis.map((e) => (
    <option key={e.id} value={e.id}>{e.nome} (Comp: {e.compartimento})</option>
  ));

  return (
    <div className={styles.page}>
      <Sidebar active="Estoque" />

      <main className={styles.main}>
        <div className={styles.watermark} />

        <header className={styles.header}>
          <p className={styles.eyebrow}>Almoxarifado</p>
          <h1 className={styles.title}>Estoque</h1>
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
                  value={entrada.id_epi}
                  onChange={(e) => updateEntrada("id_epi", e.target.value)}
                  disabled={submitting}
                >
                  {epiOptions}
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
                  disabled={submitting}
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
                  disabled={submitting}
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="ent-data">Data de entrada</label>
                <input
                  id="ent-data"
                  type="datetime-local"
                  value={entrada.dataEntrada}
                  onChange={(e) => updateEntrada("dataEntrada", e.target.value)}
                  disabled={submitting}
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="ent-validade">Validade</label>
                <input
                  id="ent-validade"
                  type="date"
                  value={entrada.validade}
                  onChange={(e) => updateEntrada("validade", e.target.value)}
                  disabled={submitting}
                />
              </div>
            </div>

            <div className={styles.actions}>
              <button type="submit" className={`${styles.btn} ${styles.btnEntrada}`} disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 size={16} className={styles.spinner} />
                    Salvando...
                  </>
                ) : (
                  'Confirmar entrada'
                )}
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
                  value={saida.id_epi}
                  onChange={(e) => updateSaida("id_epi", e.target.value)}
                  disabled={submitting}
                >
                  {epiOptions}
                </select>
              </div>
              <div className={styles.field}>
                <label htmlFor="sai-armario">Armário</label>
                <select
                  id="sai-armario"
                  value={saida.armario}
                  onChange={(e) => updateSaida("armario", e.target.value)}
                  disabled={submitting}
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
                  disabled={submitting}
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
                  disabled={submitting}
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="sai-data">Data/Hora</label>
                <input
                  id="sai-data"
                  type="datetime-local"
                  value={saida.dataHora}
                  onChange={(e) => updateSaida("dataHora", e.target.value)}
                  disabled={submitting}
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="sai-motivo">Motivo</label>
                <select
                  id="sai-motivo"
                  value={saida.motivo}
                  onChange={(e) => updateSaida("motivo", e.target.value)}
                  disabled={submitting}
                >
                  {MOTIVOS.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.actions}>
              <button type="submit" className={`${styles.btn} ${styles.btnSaida}`} disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 size={16} className={styles.spinner} />
                    Salvando...
                  </>
                ) : (
                  'Confirmar saída'
                )}
              </button>
            </div>
          </form>
        </div>

        <div className={styles.sectionWrapper}>
          <h2 className={styles.sectionTitle}>Saldo por item</h2>
        </div>

        {loading ? (
          <div className={styles.tableCard}>
            <div className={`${styles.row} ${styles.tableHead}`}>
              <span>EPI</span>
              <span>Compart.</span>
              <span>Disponível</span>
              <span>Mínimo</span>
              <span>Status</span>
            </div>
            {[1, 2, 3, 4, 5].map((i) => (
              <div className={`${styles.row} ${styles.skeletonRow}`} key={i}>
                <span><div className={styles.skeleton} /></span>
                <span><div className={styles.skeleton} /></span>
                <span><div className={styles.skeleton} /></span>
                <span><div className={styles.skeleton} /></span>
                <span><div className={styles.skeletonBadge} /></span>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.tableCard}>
            <div className={`${styles.row} ${styles.tableHead}`}>
              <span>EPI</span>
              <span>Compart.</span>
              <span>Disponível</span>
              <span>Mínimo</span>
              <span>Status</span>
            </div>

            {stock.length === 0 ? (
              <div className={`${styles.row} ${styles.emptyRow}`}>
                <span>Nenhum item em estoque</span>
              </div>
            ) : (
              stock.map((r) => (
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
              ))
            )}
          </div>
        )}
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