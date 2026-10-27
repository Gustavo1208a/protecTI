"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, AlertCircle, ChevronDown, X, Package, User, Clock, AlertTriangle, Search, RotateCcw } from "lucide-react";
import Sidebar from "@/components/Sidebar/Sidebar";
import styles from "./devolucao.module.css";

const ESTADOS = ["Bom estado", "Danificado", "Perdido"];

type Pendente = {
  id: string;
  id_entrega: number;
  epi: string;
  funcionario: string;
  matricula: string;
  compartimento: string;
  retiradoEm: string;
  qtdPendente: number;
  qtdEntregue: number;
};

type Devolucao = {
  id: string;
  epi: string;
  funcionario: string;
  matricula: string;
  compartimento: string;
  qtd: number;
  estado: string;
  observacao: string;
  dataHora: string;
};

type FormState = {
  id_entrega: string;
  estado: string;
  observacao: string;
  quantidade: string;
};

const EMPTY_FORM: FormState = {
  id_entrega: "",
  estado: "Bom estado",
  observacao: "",
  quantidade: "1",
};

const estadoToDb = (estado: string): "bom" | "danificado" | "perdido" => {
  switch (estado) {
    case "Bom estado": return "bom";
    case "Danificado": return "danificado";
    case "Perdido": return "perdido";
    default: return "bom";
  }
};

function agoraFormatado() {
  const partes = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(new Date());
  const get = (t: string) => partes.find((p) => p.type === t)?.value ?? "";
  return `${get("day")}/${get("month")}/${get("year")} ${get("hour")}:${get("minute")}`;
}

// Skeleton components
function Skeleton({ className = "", width = "100%", height = "16px", borderRadius = "6px", bgColor = "rgba(242, 169, 12, 0.12)" }: React.HTMLAttributes<HTMLDivElement> & { width?: string; height?: string; borderRadius?: string; bgColor?: string }) {
  return (
    <div
      className={`${styles.skeleton} ${className}`}
      style={{ width, height, borderRadius, background: bgColor } as React.CSSProperties}
    >
      <div className={styles.skeletonShimmer} />
    </div>
  );
}

function CardSkeleton({ titleWidth = "40%", items = 3 }) {
  return (
    <section className={styles.cardFullWidth} aria-hidden="true">
      <Skeleton className={styles.cardTitleSkeleton} width={titleWidth} height="22px" borderRadius="4px" />
      <Skeleton width="60%" height="14px" borderRadius="4px" style={{ marginBottom: "16px" }} />
      <ul className={styles.pendentesList}>
        {Array.from({ length: items }).map((_, i) => (
          <li key={i} className={styles.pendenteItem}>
            <div>
              <Skeleton width="80%" height="18px" borderRadius="4px" />
              <Skeleton width="60%" height="14px" borderRadius="4px" style={{ marginTop: "6px" }} />
            </div>
            <Skeleton width="70px" height="24px" borderRadius="999px" />
          </li>
        ))}
      </ul>
    </section>
  );
}

function TableSkeleton() {
  return (
    <div className={styles.tableCard} aria-hidden="true">
      <div className={`${styles.row} ${styles.tableHead}`}>
        <Skeleton width="50px" height="14px" />
        <Skeleton width="80px" height="14px" />
        <Skeleton width="100px" height="14px" />
        <Skeleton width="40px" height="14px" />
        <Skeleton width="70px" height="14px" />
        <Skeleton width="100px" height="14px" />
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className={`${styles.row} ${styles.tableRow}`}>
          <Skeleton width="60px" height="16px" />
          <Skeleton width="120px" height="16px" />
          <Skeleton width="140px" height="16px" />
          <Skeleton width="30px" height="16px" />
          <Skeleton width="80px" height="16px" />
          <Skeleton width="120px" height="16px" />
        </div>
      ))}
    </div>
  );
}

// Toast notification component
function Toast({ message, type = "success", onClose }: { message: string; type?: "success" | "error"; onClose: () => void }) {
  return (
    <div className={`${styles.toast} ${styles[type]}`} role="alert" onAnimationEnd={onClose}>
      <div className={styles.toastIcon}>
        {type === "success" ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
      </div>
      <span>{message}</span>
      <button className={styles.toastClose} onClick={onClose} aria-label="Fechar">
        <X size={16} />
      </button>
    </div>
  );
}

// Modal for registering devolução
function DevolucaoModal({
  item,
  onClose,
  onSubmit,
  submitting
}: {
  item: Pendente | null;
  onClose: () => void;
  onSubmit: (form: FormState) => Promise<void>;
  submitting: boolean;
}) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  if (!item) return null;

  // Initialize form when item changes
  if (!form.id_entrega) {
    setForm({
      id_entrega: String(item.id_entrega),
      estado: "Bom estado",
      observacao: "",
      quantidade: String(item.qtdPendente),
    });
  }

  function update<K extends keyof FormState>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onSubmit(form);
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 id="modal-title" className={styles.modalTitle}>
            <Package size={20} className={styles.modalIcon} />
            Registrar devolução
          </h3>
          <button className={styles.modalClose} onClick={onClose} aria-label="Fechar">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <div className={styles.modalSummary}>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>EPI:</span>
              <span className={styles.summaryValue}>{item.epi}</span>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Funcionário:</span>
              <span className={styles.summaryValue}>{item.funcionario}</span>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Retirado em:</span>
              <span className={styles.summaryValue}>{item.retiradoEm}</span>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Pendente:</span>
              <span className={styles.summaryValue}><strong>{item.qtdPendente}</strong> unidade(s)</span>
            </div>
          </div>

          <div className={styles.modalFields}>
            <div className={styles.modalField}>
              <label htmlFor="modal-qtd" className={styles.modalLabel}>
                Quantidade a devolver
              </label>
              <input
                id="modal-qtd"
                type="number"
                min={1}
                max={item.qtdPendente}
                value={form.quantidade}
                onChange={(e) => update("quantidade", e.target.value)}
                className={styles.modalInput}
              />
              <p className={styles.modalHelp}>Máximo: {item.qtdPendente} unidade(s)</p>
            </div>

            <div className={styles.modalField}>
              <label htmlFor="modal-estado" className={styles.modalLabel}>
                Estado do equipamento
              </label>
              <div className={styles.modalSelectWrapper}>
                <select
                  id="modal-estado"
                  value={form.estado}
                  onChange={(e) => update("estado", e.target.value)}
                  className={styles.modalSelect}
                >
                  {ESTADOS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <ChevronDown className={styles.modalSelectChevron} />
              </div>
            </div>

            <div className={styles.modalField}>
              <label htmlFor="modal-obs" className={styles.modalLabel}>
                Observação
              </label>
              <textarea
                id="modal-obs"
                value={form.observacao}
                onChange={(e) => update("observacao", e.target.value)}
                placeholder="Observações sobre a devolução (opcional)"
                rows={3}
                className={styles.modalTextarea}
              />
            </div>
          </div>

          <div className={styles.modalActions}>
            <button
              type="button"
              className={styles.modalCancelBtn}
              onClick={onClose}
              disabled={submitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.modalSubmitBtn}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className={styles.spinnerBtn} />
                  Registrando...
                </>
              ) : (
                "Registrar devolução"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Devolucao() {
  const [pendentes, setPendentes] = useState<Pendente[]>([]);
  const [devolucoes, setDevolucoes] = useState<Devolucao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<Pendente | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const res = await fetch("/api/devolucao");
        if (!res.ok) throw new Error("Erro ao buscar dados");
        const data = await res.json();
        setPendentes(data.pendentes || []);
        setDevolucoes(data.devolucoes || []);
      } catch (err) {
        setError("Erro ao carregar dados. Tente recarregar a página.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  function closeModal() {
    setSelectedItem(null);
  }

  async function handleRegistrar(form: FormState) {
    if (!form.id_entrega) {
      showToast("Selecione um EPI pendente de devolução", "error");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/devolucao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_entrega: parseInt(form.id_entrega),
          estado: estadoToDb(form.estado),
          observacao: form.observacao,
          quantidade: parseInt(form.quantidade) || 1,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao registrar devolução");
      }

      setPendentes((prev) =>
        prev.map((p) =>
          p.id_entrega === data.id_entrega
            ? { ...p, qtdPendente: p.qtdPendente - data.quantidade }
            : p
        ).filter((p) => p.qtdPendente > 0)
      );

      setDevolucoes((prev) => [
        {
          id: `D-${data.id}`,
          epi: data.epi,
          funcionario: data.funcionario,
          matricula: "",
          compartimento: "",
          qtd: data.quantidade,
          estado: data.estado,
          observacao: form.observacao,
          dataHora: agoraFormatado(),
        },
        ...prev,
      ]);

      showToast(`Devolução registrada! ${data.epi} - ${data.funcionario}`);
      closeModal();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao registrar devolução";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setSubmitting(false);
    }
  }

  // Filter pendentes based on search query
  const filteredPendentes = pendentes.filter((p) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      p.epi.toLowerCase().includes(query) ||
      p.funcionario.toLowerCase().includes(query)
    );
  });

  // Loading state with skeleton
  if (loading) {
    return (
      <div className={styles.page}>
        <Sidebar active="Devolução" />
        <main className={styles.main}>
          <div className={styles.watermark} />
          <header className={styles.header}>
            <Skeleton width="140px" height="14px" />
            <Skeleton width="300px" height="44px" style={{ marginTop: "8px" }} />
          </header>
          <CardSkeleton titleWidth="45%" items={4} />
          <Skeleton className={styles.sectionTitleSkeleton} width="280px" height="26px" style={{ maxWidth: "1000px", margin: "0 auto 12px", paddingLeft: "4px" }} />
          <TableSkeleton />
        </main>
      </div>
    );
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

        {toast && (
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        )}

        {error && !toast && (
          <div className={styles.errorBanner} role="alert">
            <AlertCircle size={20} strokeWidth={2} />
            <span>{error}</span>
            <button className={styles.errorClose} onClick={() => setError(null)} aria-label="Fechar">
              <X size={16} />
            </button>
          </div>
        )}

        {/* EPIs pendentes de devolução */}
        <section className={styles.cardFullWidth}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>EPIs pendentes de devolução</h2>
            <p className={styles.cardSubtitle}>
              {filteredPendentes.length} ite{filteredPendentes.length !== 1 ? "ns" : "m"} em posse de funcionários
            </p>
          </div>

          {pendentes.length > 0 && (
            <div className={styles.searchWrapper}>
              <label htmlFor="dev-search" className={styles.searchLabel}>
                <Search size={14} className={styles.searchIcon} />
                Buscar EPI ou funcionário
              </label>
              <div className={styles.searchInputWrapper}>
                <input
                  id="dev-search"
                  type="text"
                  placeholder="Digite para filtrar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={styles.searchInput}
                />
                {searchQuery && (
                  <button
                    type="button"
                    className={styles.searchClear}
                    onClick={() => setSearchQuery("")}
                    aria-label="Limpar busca"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
          )}

          {filteredPendentes.length === 0 ? (
            <div className={styles.emptyStateCard}>
              <Package size={48} className={styles.emptyIconLarge} />
              <h3>{pendentes.length === 0 ? "Nenhum EPI pendente" : "Nenhum resultado encontrado"}</h3>
              <p>
                {pendentes.length === 0
                  ? "Todos os equipamentos foram devolvidos ou não há entregas registradas."
                  : 'Tente alterar os termos de busca.'}
              </p>
            </div>
          ) : (
            <div className={styles.pendentesScroll}>
              <ul className={styles.pendentesList}>
                {filteredPendentes.map((p) => (
<li
                    key={p.id}
                    className={styles.pendenteItem}
                    onClick={() => setSelectedItem(p)}
                  >
                    <div className={styles.pendenteContent}>
                      <div>
                        <p className={styles.pendenteNome}>{p.epi}</p>
                        <p className={styles.pendenteMeta}>
                          {p.funcionario} &middot; Retirado em {p.retiradoEm} &middot; Pendente: {p.qtdPendente}
                        </p>
                      </div>
                    </div>
                    <div className={styles.pendenteActions}>
                      <button
                        className={styles.itemActionBtn}
                        onClick={(e) => { e.stopPropagation(); setSelectedItem(p); }}
                        aria-label={`Registrar devolução de ${p.epi}`}
                      >
                        <RotateCcw size={16} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* Devoluções recentes */}
        <div className={styles.sectionWrapper}>
          <h2 className={styles.sectionTitle}>Devoluções recentes</h2>

          <div className={styles.tableCard}>
            {devolucoes.length === 0 ? (
              <div className={styles.emptyStateCard} style={{ padding: "48px 24px" }}>
                <h3>Nenhuma devolução registrada</h3>
                <p>As devoluções realizadas aparecerão aqui automaticamente.</p>
              </div>
            ) : (
              <div className={styles.tableScroll}>
                <div className={`${styles.row} ${styles.tableHead}`}>
                  <span>ID</span>
                  <span>EPI</span>
                  <span>Funcionário</span>
                  <span className={styles.centerCell}>Qtd.</span>
                  <span className={styles.estadoCell}>Estado</span>
                  <span>Data/Hora</span>
                </div>
                {devolucoes.map((d) => (
                  <div className={`${styles.row} ${styles.tableRow}`} key={d.id}>
                    <span className={styles.idCell}>{d.id}</span>
                    <span className={styles.epiCell}>
                      <Package size={14} className={styles.tableIcon} />
                      {d.epi}
                    </span>
                    <span className={styles.funcionarioCell}>
                      <User size={14} className={styles.tableIcon} />
                      {d.funcionario}
                    </span>
                    <span className={styles.centerCell}>{d.qtd}</span>
                    <span className={styles.estadoCell}>
                      <span className={`${styles.estadoBadge} ${styles[d.estado.toLowerCase().replace(" ", "")] || ""}`}>
                        {d.estado}
                      </span>
                    </span>
                    <span className={styles.dateCell}>
                      <Clock size={14} className={styles.tableIcon} />
                      {d.dataHora}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal */}
        <DevolucaoModal
          item={selectedItem}
          onClose={closeModal}
          onSubmit={handleRegistrar}
          submitting={submitting}
        />
      </main>

      <style jsx global>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeOut {
          from { opacity: 1; transform: translateY(0); }
          to { opacity: 0; transform: translateY(-10px); }
        }
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes overlayIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
