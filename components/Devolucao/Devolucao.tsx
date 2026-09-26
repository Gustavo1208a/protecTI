"use client";

import { FormEvent, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import Sidebar from "@/components/Sidebar/Sidebar";
import { FUNCIONARIOS } from "@/lib/funcionarios";
import { EPIS } from "@/lib/epis";
import styles from "./devolucao.module.css";

const COMPARTIMENTOS = ["A1", "A2", "B1", "B2"];
const ESTADOS = ["Bom estado", "Desgastado", "Danificado"];

type Pendente = {
  id: string;
  epi: string;
  funcionario: string;
  retiradoEm: string; // dd/mm/aaaa
};

const PENDENTES: Pendente[] = [
  { id: "p1", epi: "Óculos de Proteção Incolor", funcionario: "Ana Paula Ribeiro", retiradoEm: "09/09/2026" },
  { id: "p2", epi: "Luva de Vaqueta", funcionario: "Carlos Eduardo Lima", retiradoEm: "08/09/2026" },
  { id: "p3", epi: "Cinto Paraquedista", funcionario: "Marcos Antônio Silva", retiradoEm: "05/09/2026" },
];

type Devolucao = {
  id: string;
  funcionario: string;
  qtd: number;
  dataHora: string; // dd/mm/aaaa hh:mm
};

const DEVOLUCOES_INICIAIS: Devolucao[] = [
  { id: "MV-9002", funcionario: "Marcos Antônio Silva", qtd: 1, dataHora: "09/09/2026 08:40" },
  { id: "MV-9005", funcionario: "Paulo Henrique Dias", qtd: 1, dataHora: "08/09/2026 11:20" },
];

// Máscara de data/hora no padrão brasileiro (dd/mm/aaaa hh:mm, 24 horas).
// Um campo de texto próprio evita o formato AM/PM que o navegador usaria
// no <input type="datetime-local"> quando o sistema está em inglês.
function mascaraDataHora(valor: string) {
  const d = valor.replace(/\D/g, "").slice(0, 12);
  let out = d.slice(0, 2);
  if (d.length > 2) out += "/" + d.slice(2, 4);
  if (d.length > 4) out += "/" + d.slice(4, 8);
  if (d.length > 8) out += " " + d.slice(8, 10);
  if (d.length > 10) out += ":" + d.slice(10, 12);
  return out;
}

// Data/hora atual já formatada como dd/mm/aaaa hh:mm, no fuso de Brasília.
function agoraFormatado() {
  const partes = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const get = (t: string) => partes.find((p) => p.type === t)?.value ?? "";
  return `${get("day")}/${get("month")}/${get("year")} ${get("hour")}:${get("minute")}`;
}

const EMPTY_FORM = {
  funcionario: FUNCIONARIOS[0]?.nome ?? "",
  epi: EPIS[0]?.nome ?? "",
  quantidade: "1",
  compartimento: COMPARTIMENTOS[0],
  estado: ESTADOS[0],
  dataHora: "",
};

let proximoId = 9008;

export default function Devolucao() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [devolucoes, setDevolucoes] = useState(DEVOLUCOES_INICIAIS);
  const [confirmacao, setConfirmacao] = useState<string | null>(null);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleRegistrar(e: FormEvent) {
    e.preventDefault();
    const id = `MV-${proximoId++}`;
    const qtd = Math.max(1, Number(form.quantidade) || 1);
    const dataHora = form.dataHora.trim() !== "" ? form.dataHora : agoraFormatado();

    // TODO: integrar com o endpoint de devolução (também deve dar baixa
    // no item correspondente em "EPIs pendentes de devolução").
    setDevolucoes((rows) => [
      { id, funcionario: form.funcionario, qtd, dataHora },
      ...rows,
    ]);
    setConfirmacao(id);
    setForm((f) => ({ ...EMPTY_FORM, funcionario: f.funcionario, epi: f.epi }));
  }

  return (
    <div className={styles.page}>
      <Sidebar active="Devolução" />

      <main className={styles.main}>
        <div className={styles.watermark} />

        <header className={styles.header}>
          <p className={styles.eyebrow}>Armário inteligente</p>
          <h1 className={styles.title}>Devolução de EPI</h1>
        </header>

        <div className={styles.grid}>
          <form className={styles.card} onSubmit={handleRegistrar}>
            <h2 className={styles.cardTitle}>Registrar retorno</h2>

            <div className={styles.fields}>
              <div className={styles.field}>
                <label htmlFor="dev-funcionario">Funcionário</label>
                <select
                  id="dev-funcionario"
                  value={form.funcionario}
                  onChange={(e) => update("funcionario", e.target.value)}
                >
                  {FUNCIONARIOS.map((f) => (
                    <option key={f.id} value={f.nome}>{f.nome}</option>
                  ))}
                </select>
              </div>
              <div className={styles.field}>
                <label htmlFor="dev-epi">EPIs</label>
                <select
                  id="dev-epi"
                  value={form.epi}
                  onChange={(e) => update("epi", e.target.value)}
                >
                  {EPIS.map((e) => (
                    <option key={e.id} value={e.nome}>{e.nome}</option>
                  ))}
                </select>
              </div>

              <div className={styles.field}>
                <label htmlFor="dev-qtd">Quantidade</label>
                <input
                  id="dev-qtd"
                  type="number"
                  min={1}
                  value={form.quantidade}
                  onChange={(e) => update("quantidade", e.target.value)}
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="dev-compartimento">Compartimento</label>
                <select
                  id="dev-compartimento"
                  value={form.compartimento}
                  onChange={(e) => update("compartimento", e.target.value)}
                >
                  {COMPARTIMENTOS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className={styles.field}>
                <label htmlFor="dev-estado">Estado do equipamento</label>
                <select
                  id="dev-estado"
                  value={form.estado}
                  onChange={(e) => update("estado", e.target.value)}
                >
                  {ESTADOS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className={styles.field}>
                <label htmlFor="dev-data">Data/Hora</label>
                <input
                  id="dev-data"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={16}
                  placeholder="dd/mm/aaaa --:--"
                  value={form.dataHora}
                  onChange={(e) => update("dataHora", mascaraDataHora(e.target.value))}
                />
              </div>
            </div>

            <button type="submit" className={styles.registrarBtn}>
              Registrar
            </button>

            {confirmacao && (
              <div className={styles.confirmBanner} role="status">
                <CheckCircle2 size={20} strokeWidth={2} className={styles.confirmIcon} />
                <div>
                  <p className={styles.confirmTitle}>Devolução registrada</p>
                  <p className={styles.confirmSubtitle}>
                    Movimentação {confirmacao} · estoque atualizado automaticamente.
                  </p>
                </div>
              </div>
            )}
          </form>

          <section className={styles.card}>
            <h2 className={styles.cardTitle}>EPIs pendentes de devolução</h2>
            <p className={styles.cardSubtitle}>Itens em posse de funcionários</p>

            <ul className={styles.pendentesList}>
              {PENDENTES.map((p) => (
                <li key={p.id} className={styles.pendenteItem}>
                  <div>
                    <p className={styles.pendenteNome}>{p.epi}</p>
                    <p className={styles.pendenteMeta}>
                      {p.funcionario} · Retirado em {p.retiradoEm}
                    </p>
                  </div>
                  <span className={styles.badgeAtivo}>Ativo</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <h2 className={styles.sectionTitle}>Devoluções recentes</h2>

        <div className={styles.tableCard}>
          <div className={`${styles.row} ${styles.tableHead}`}>
            <span>ID</span>
            <span>Funcionário</span>
            <span>Qtd.</span>
            <span>Data/Hora</span>
          </div>

          {devolucoes.map((d) => (
            <div className={`${styles.row} ${styles.tableRow}`} key={d.id}>
              <span className={styles.idCell}>{d.id}</span>
              <span className={styles.funcionarioCell}>{d.funcionario}</span>
              <span>{d.qtd}</span>
              <span>{d.dataHora}</span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
