"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import Sidebar from "@/components/Sidebar/Sidebar";
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

type Funcionario = {
  id: number;
  nome: string;
  matricula: string;
  cpf: string;
  telefone: string | null;
  setor: string | null;
  cargo: string | null;
  status: string;
  createdAt: string;
};

type EpiEntrega = {
  id_epi: number;
  nome: string;
  quantidade_estoque: number;
  quantidade_minima: number;
  validade_ca: string | null;
  categoria: string | null;
};

export default function Entrega() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("funcionarios");
  const [funcionario, setFuncionario] = useState<Funcionario | null>(null);
  const [epi, setEpi] = useState<EpiEntrega | null>(null);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [epis, setEpis] = useState<EpiEntrega[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchFunc, setSearchFunc] = useState("");
  const [searchEpi, setSearchEpi] = useState("");

  const stepIndex = STEPS.findIndex((s) => s.key === step);

  useEffect(() => {
    async function fetchFuncionarios() {
      try {
        const res = await fetch("/api/funcionarios");
        const data = await res.json();
        if (res.ok && data.funcionarios) {
          setFuncionarios(data.funcionarios.filter((f: Funcionario) => f.status === "ativo"));
        } else {
          throw new Error(data.error || "Erro ao buscar funcionários");
        }
      } catch (err) {
        setError("Erro ao carregar funcionários");
        console.error(err);
      }
    }
    fetchFuncionarios();
  }, []);

  useEffect(() => {
    async function fetchEpis() {
      setLoading(true);
      try {
        const res = await fetch("/api/epis");
        const data = await res.json();
        if (res.ok && data.epis) {
          setEpis(data.epis);
        } else {
          throw new Error(data.error || "Erro ao buscar EPIs");
        }
      } catch (err) {
        setError("Erro ao carregar EPIs");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (step === "epis") {
      fetchEpis();
    }
  }, [step]);

  function escolherFuncionario(f: Funcionario) {
    setFuncionario(f);
    setEpi(null);
    setStep("epis");
  }

  function escolherEpi(e: EpiEntrega) {
    // Não permitir entregar EPI com estoque zero
    if (e.quantidade_estoque <= 0) return;
    setEpi(e);
    setStep("confirmacao");
  }

  function voltar() {
    if (step === "confirmacao") setStep("epis");
    else if (step === "epis") setStep("funcionarios");
  }

  async function confirmar() {
    if (!funcionario || !epi) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/entrega", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_func: funcionario.id,
          id_epi: epi.id_epi,
          quantidade: 1,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao registrar entrega");
      // Recarregar EPIs para atualizar estoque
      const resEpis = await fetch("/api/epis");
      const dataEpis = await resEpis.json();
      if (resEpis.ok && dataEpis.epis) setEpis(dataEpis.epis);
      setStep("funcionarios");
      setFuncionario(null);
      setEpi(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setLoading(false);
    }
  }

  // "2028-03-15" ou "2028-03-15T00:00:00.000Z" -> "15/03/2028" (sem converter fuso horário)
  function formatarData(iso: string | null) {
    if (!iso) return "Não informada";
    const [ano, mes, dia] = iso.split("T")[0].split("-");
    return `${dia}/${mes}/${ano}`;
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
            <div className={styles.searchInput}>
              <input
                type="text"
                placeholder="Buscar funcionário por nome, matrícula ou setor..."
                value={searchFunc}
                onChange={(e) => setSearchFunc(e.target.value)}
              />
            </div>
            {funcionarios.length === 0 && !loading ? (
              <div className={styles.emptyState}>Nenhum funcionário ativo cadastrado</div>
            ) : (
              funcionarios
                .filter((f) => {
                  const q = searchFunc.trim().toLowerCase();
                  if (!q) return true;
                  return (
                    f.nome.toLowerCase().includes(q) ||
                    f.matricula.toLowerCase().includes(q) ||
                    (f.setor && f.setor.toLowerCase().includes(q)) ||
                    (f.cargo && f.cargo.toLowerCase().includes(q))
                  );
                })
                .map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    className={styles.card}
                    onClick={() => escolherFuncionario(f)}
                  >
                    <span className={styles.cardName}>{f.nome}</span>
                    <span className={styles.cardTag}>{SETOR_ENTREGA[f.id] ?? f.setor ?? "-"}</span>
                    <span className={styles.cardRole}>{f.cargo ?? "-"}</span>
                    <span className={styles.cardMeta}>Cadastro {f.matricula}</span>
                  </button>
                ))
            )}
          </div>
        )}

        {step === "epis" && (
          <div className={styles.cards}>
            <div className={styles.searchInput}>
              <input
                type="text"
                placeholder="Buscar EPI por nome, CA, categoria..."
                value={searchEpi}
                onChange={(e) => setSearchEpi(e.target.value)}
              />
            </div>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className={`${styles.card} ${styles.skeletonCard}`}>
                  <div className={`${styles.skeletonLine} ${styles.skeletonLineLong}`} />
                  <div className={styles.skeletonBadge} />
                  <div className={styles.skeletonLine} />
                </div>
              ))
            ) : (
              epis
                .filter((e) => e.quantidade_estoque > 0)
                .filter((e) => {
                  const q = searchEpi.trim().toLowerCase();
                  if (!q) return true;
                  return (
                    e.nome.toLowerCase().includes(q) ||
                    (e.categoria && e.categoria.toLowerCase().includes(q))
                  );
                })
                .map((e) => {
                  const vencido = Boolean(e.validade_ca && new Date(e.validade_ca) < new Date());
                  const estoqueBaixo = e.quantidade_estoque <= e.quantidade_minima && e.quantidade_minima > 0;
                  return (
                    <button
                      key={e.id_epi}
                      type="button"
                      className={`${styles.card} ${vencido || estoqueBaixo ? styles.cardWarning : ""} ${e.quantidade_estoque <= 0 ? styles.cardDisabled : ""}`}
                      onClick={() => escolherEpi(e)}
                      disabled={e.quantidade_estoque <= 0 || vencido}
                      title={
                        vencido
                          ? "EPI vencido: não pode ser entregue"
                          : estoqueBaixo
                          ? `Estoque baixo: ${e.quantidade_estoque} unidades`
                          : undefined
                      }
                    >
                      <span className={`${styles.cardName} ${(vencido || estoqueBaixo) && styles.cardNameMuted}`}>
                        {e.nome}
                      </span>
                      <span
                        className={`${styles.badge} ${
                          vencido
                            ? styles.badgeVencido
                            : estoqueBaixo
                            ? styles.badgeBaixo
                            : styles.badgeDisponivel
                        }`}
                      >
                        {vencido ? "Vencido" : estoqueBaixo ? "Estoque baixo" : "Disponível"}
                      </span>
                      <span className={styles.cardMeta}>
                        {e.quantidade_estoque} Disponíveis {e.quantidade_minima > 0 && `(Mín: ${e.quantidade_minima})`}
                      </span>
                      {e.categoria && <span className={styles.cardCategory}>{e.categoria}</span>}
                    </button>
                  );
                })
            )}
            {epis.length === 0 && !loading && (
              <div className={styles.emptyState}>Nenhum EPI cadastrado</div>
            )}
            {epis.length > 0 && epis.filter((e) => e.quantidade_estoque > 0).length === 0 && !loading && (
              <div className={styles.emptyState}>Nenhum EPI disponível em estoque</div>
            )}
            {epis.length > 0 && searchEpi.trim() && epis.filter((e) => e.quantidade_estoque > 0).filter((e) => {
                  const q = searchEpi.trim().toLowerCase();
                  if (!q) return true;
                  return (
                    e.nome.toLowerCase().includes(q) ||
                    (e.categoria && e.categoria.toLowerCase().includes(q))
                  );
                }).length === 0 && !loading && (
              <div className={styles.emptyState}>Nenhum EPI encontrado com esse termo</div>
            )}
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
                value={SETOR_ENTREGA[funcionario.id] ?? funcionario.setor ?? "-"}
              />

              <label htmlFor="c-epi">EPI</label>
              <input id="c-epi" readOnly value={epi.nome} />

              <label htmlFor="c-validade">Validade do CA</label>
              <input id="c-validade" readOnly value={formatarData(epi.validade_ca)} />
            </div>

            {error && (
              <div className={styles.errorMessage}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <button
              type="button"
              className={styles.confirmBtn}
              onClick={confirmar}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className={styles.spinner} />
                  Confirmando...
                </>
              ) : (
                <>
                  <CheckCircle size={16} />
                  Confirmar
                </>
              )}
            </button>
          </section>
        )}
      </main>
    </div>
  );
}