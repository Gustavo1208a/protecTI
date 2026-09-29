"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Sidebar from "@/components/Sidebar/Sidebar";
import { FUNCIONARIOS, type Funcionario } from "@/lib/funcionarios";
import styles from "./entrega.module.css";

type Step = "funcionarios" | "epis" | "confirmacao";

const STEPS: { key: Step; label: string }[] = [
  { key: "funcionarios", label: "Funcionários" },
  { key: "epis", label: "EPIs" },
  { key: "confirmacao", label: "Confirmação" },
];

// Setores exibidos na tela de Entrega (conforme o layout).
const SETOR_ENTREGA: Record<string, string> = {
  "carlos-mendes": "Produção",
  "joana-silva": "Manutenção",
  "amanda-medeiros": "Atendimento",
  "indianara-lima": "Segurança",
};

type EpiEntrega = {
  id: string;
  nome: string;
  disponiveis: number;
  status: "Disponível" | "Vencido";
  validade: string; // AAAA-MM-DD
};

const EPIS_ENTREGA: EpiEntrega[] = [
  { id: "capacete", nome: "Capacete de Segurança Classe B", disponiveis: 42, status: "Disponível", validade: "2028-03-15" },
  { id: "luva", nome: "Luva de Vaqueta", disponiveis: 8, status: "Vencido", validade: "2026-05-10" },
  { id: "oculos", nome: "Óculos de Proteção Incolor", disponiveis: 63, status: "Disponível", validade: "2028-01-20" },
  { id: "protetor", nome: "Protetor Auricular Plug", disponiveis: 120, status: "Vencido", validade: "2026-04-02" },
  { id: "mascara", nome: "Máscara PFF2", disponiveis: 25, status: "Disponível", validade: "2027-11-30" },
  { id: "bota", nome: "Bota de Segurança Bico Composite", disponiveis: 120, status: "Disponível", validade: "2028-06-08" },
];

// "2028-03-15" -> "15/03/2028" (sem converter fuso horário, para não "voltar" um dia)
function formatarData(iso: string) {
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

export default function Entrega() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("funcionarios");
  const [funcionario, setFuncionario] = useState<Funcionario | null>(null);
  const [epi, setEpi] = useState<EpiEntrega | null>(null);

  const stepIndex = STEPS.findIndex((s) => s.key === step);

  function escolherFuncionario(f: Funcionario) {
    setFuncionario(f);
    setEpi(null);
    setStep("epis");
  }

  function escolherEpi(e: EpiEntrega) {
    if (e.status === "Vencido") return;
    setEpi(e);
    setStep("confirmacao");
  }

  function voltar() {
    if (step === "confirmacao") setStep("epis");
    else if (step === "epis") setStep("funcionarios");
  }

  function confirmar() {
    // TODO: integrar com o endpoint de registro de entrega
    router.push("/devolucao");
  }

  return (
    <div className={styles.page}>
      <Sidebar active="Entrega" />

      <main className={styles.main}>
        <div className={styles.watermark} />

        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Cadastros</p>
            <h1 className={styles.title}>
              {step === "funcionarios" ? "Entrega" : "Entrega de EPI"}
            </h1>
          </div>
          {step !== "funcionarios" && (
            <button type="button" className={styles.backBtn} onClick={voltar}>
              <ArrowLeft size={16} strokeWidth={1.8} />
              Voltar
            </button>
          )}
        </header>

        <div className={styles.tabs}>
          {STEPS.map((s, i) => {
            const done = i < stepIndex;
            return (
              <button
                key={s.key}
                type="button"
                className={`${styles.tab} ${done ? styles.tabDone : ""}`}
                onClick={() => done && setStep(s.key)}
                aria-current={i === stepIndex ? "step" : undefined}
              >
                {s.label}
              </button>
            );
          })}
        </div>

        {step === "funcionarios" && (
          <div className={styles.cards}>
            {FUNCIONARIOS.map((f) => (
              <button
                key={f.id}
                type="button"
                className={styles.card}
                onClick={() => escolherFuncionario(f)}
              >
                <span className={styles.cardName}>{f.nome}</span>
                <span className={styles.cardTag}>{SETOR_ENTREGA[f.id] ?? f.setor}</span>
                <span className={styles.cardRole}>{f.cargo}</span>
                <span className={styles.cardMeta}>Cadastro {f.matricula}</span>
              </button>
            ))}
          </div>
        )}

        {step === "epis" && (
          <div className={styles.cards}>
            {EPIS_ENTREGA.map((e) => {
              const vencido = e.status === "Vencido";
              return (
                <button
                  key={e.id}
                  type="button"
                  className={`${styles.card} ${vencido ? styles.cardDisabled : ""}`}
                  onClick={() => escolherEpi(e)}
                  disabled={vencido}
                  title={vencido ? "EPI vencido: não pode ser entregue" : undefined}
                >
                  <span className={`${styles.cardName} ${styles.cardNameMuted}`}>
                    {e.nome}
                  </span>
                  <span
                    className={`${styles.badge} ${
                      vencido ? styles.badgeVencido : styles.badgeDisponivel
                    }`}
                  >
                    {e.status}
                  </span>
                  <span className={styles.cardMeta}>
                    {e.disponiveis} Disponíveis
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {step === "confirmacao" && funcionario && epi && (
          <section className={styles.confirmCard} aria-labelledby="confirmar-title">
            <h2 id="confirmar-title" className={styles.confirmTitle}>
              Confirmar Entrega
            </h2>

            <div className={styles.confirmFields}>
              <label htmlFor="c-func">Funcionário</label>
              <input id="c-func" readOnly value={funcionario.nome} />

              <label htmlFor="c-setor">Setor</label>
              <input
                id="c-setor"
                readOnly
                value={SETOR_ENTREGA[funcionario.id] ?? funcionario.setor}
              />

              <label htmlFor="c-epi">EPI</label>
              <input id="c-epi" readOnly value={epi.nome} />

              <label htmlFor="c-validade">Validade</label>
              <input id="c-validade" readOnly value={formatarData(epi.validade)} />
            </div>

            <button type="button" className={styles.confirmBtn} onClick={confirmar}>
              Confirmar
            </button>
          </section>
        )}
      </main>
    </div>
  );
}
