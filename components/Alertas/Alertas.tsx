"use client";

import { useEffect, useState } from "react";
import { Bell, Loader2, AlertTriangle, Shield, Package, Clock, Check, CheckCircle2, Eye, EyeOff } from "lucide-react";
import Sidebar from "@/components/Sidebar/Sidebar";
import styles from "./alertas.module.css";

type Prioridade = "Alta" | "Média" | "Baixa";

type Alerta = {
  id: string;
  tipo: string;
  item: string;
  prioridade: Prioridade;
  categoria: string;
  lido: boolean;
};

const PRIORIDADE_CLASS: Record<Prioridade, string> = {
  Alta: styles.badgeAlta,
  Média: styles.badgeMedia,
  Baixa: styles.badgeBaixa,
};

const PRIORIDADE_ICON: Record<Prioridade, React.ReactNode> = {
  Alta: <AlertTriangle size={14} strokeWidth={2.5} className={styles.prioridadeIconAlta} />,
  Média: <Clock size={14} strokeWidth={2.5} className={styles.prioridadeIconMedia} />,
  Baixa: <Shield size={14} strokeWidth={2.5} className={styles.prioridadeIconBaixa} />,
};

const ICONE_CATEGORIA: Record<string, React.ReactNode> = {
  vencimento_ca: <AlertTriangle size={14} strokeWidth={2} className={styles.categoriaIcon} />,
  estoque_baixo: <Package size={14} strokeWidth={2} className={styles.categoriaIcon} />,
  devolucao_pendente: <Clock size={14} strokeWidth={2} className={styles.categoriaIcon} />,
};

// Skeleton components
function Skeleton({ className = "", width = "100%", height = "16px", borderRadius = "6px" }) {
  return (
    <div
      className={`${styles.skeleton} ${className}`}
      style={{ width, height, borderRadius, background: "linear-gradient(90deg, rgba(242,169,12,0.1) 25%, rgba(242,169,12,0.2) 50%, rgba(242,169,12,0.1) 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite" }}
    />
  );
}

function SummarySkeleton() {
  return (
    <div className={styles.summaryCard}>
      <Skeleton width="80%" height="12px" borderRadius="4px" />
      <Skeleton width="50%" height="34px" borderRadius="4px" />
    </div>
  );
}

function TableRowSkeleton() {
  return (
    <div className={`${styles.row} ${styles.tableRow}`}>
      <Skeleton width="40px" height="14px" />
      <Skeleton width="180px" height="14px" />
      <Skeleton width="140px" height="14px" />
      <Skeleton width="74px" height="20px" borderRadius="999px" />
      <Skeleton width="60px" height="14px" borderRadius="4px" />
    </div>
  );
}

export default function Alertas() {
  const [mostrarLidos, setMostrarLidos] = useState(false);
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [marcandoLido, setMarcandoLido] = useState<Set<string>>(new Set());

  const fetchAlertas = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/alertas");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao buscar alertas");
      setAlertas(data.alertas || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
      setAlertas([]);
    } finally {
      setLoading(false);
    }
  };

  const marcarComoLido = async (ids: string[], lido: boolean) => {
    // Optimistic update
    setMarcandoLido(prev => new Set([...prev, ...ids]));
    setAlertas(prev => prev.map(a => ids.includes(a.id) ? { ...a, lido } : a));

    try {
      const res = await fetch("/api/alertas", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, lido }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao atualizar");
    } catch (err) {
      // Rollback on error
      setAlertas(prev => prev.map(a => ids.includes(a.id) ? { ...a, lido: !lido } : a));
      console.error("Erro ao marcar alerta:", err);
    } finally {
      setMarcandoLido(prev => {
        const next = new Set(prev);
        ids.forEach(id => next.delete(id));
        return next;
      });
    }
  };

  const toggleTodosLidos = () => {
    const naoLidos = alertas.filter(a => !a.lido).map(a => a.id);
    if (naoLidos.length > 0) {
      marcarComoLido(naoLidos, true);
    } else {
      // Se todos já estão lidos, marca como não lidos
      const todosIds = alertas.map(a => a.id);
      marcarComoLido(todosIds, false);
    }
  };

  useEffect(() => {
    fetchAlertas();
  }, []);

  const alertasFiltrados = mostrarLidos ? alertas : alertas.filter(a => !a.lido);
  const ALTA_PRIORIDADE = alertasFiltrados.filter((a) => a.prioridade === "Alta").length;
  const MEDIA_PRIORIDADE = alertasFiltrados.filter((a) => a.prioridade === "Média").length;
  const BAIXA_PRIORIDADE = alertasFiltrados.filter((a) => a.prioridade === "Baixa").length;
  const totalLidos = alertas.filter(a => a.lido).length;
  const totalNaoLidos = alertas.filter(a => !a.lido).length;

  return (
    <div className={styles.page}>
      <Sidebar active="Alertas" />

      <main className={styles.main}>
        <div className={styles.watermark} />

        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>SEGURANÇA DO TRABALHO</p>
            <h1 className={styles.title}>Alertas</h1>
          </div>
          <button
            type="button"
            className={styles.marcarBtn}
            onClick={toggleTodosLidos}
            disabled={marcandoLido.size > 0}
          >
            {totalNaoLidos > 0
              ? `Marcar ${totalNaoLidos} como ${mostrarLidos ? "não lidos" : "lidos"}`
              : "Marcar todos como não lidos"}
          </button>
        </header>

        {loading ? (
          <>
            <div className={styles.summary}>
              <SummarySkeleton />
              <SummarySkeleton />
              <SummarySkeleton />
            </div>
            <h2 className={styles.sectionTitle}>
              <Bell size={18} strokeWidth={2} className={styles.sectionIcon} />
              Lista de alertas
            </h2>
            <div className={styles.tableCard}>
              <div className={`${styles.row} ${styles.tableHead}`}>
                <span>ID</span>
                <span>Tipo</span>
                <span>Item</span>
                <span>Prioridade</span>
                <span className={styles.statusHead}>Status</span>
              </div>
              {Array.from({ length: 4 }).map((_, i) => (
                <TableRowSkeleton key={i} />
              ))}
            </div>
          </>
        ) : error ? (
          <div className={styles.errorCard}>
            <AlertTriangle size={32} strokeWidth={2} className={styles.errorIcon} />
            <p>{error}</p>
            <button className={styles.retryBtn} onClick={fetchAlertas}>
              Tentar novamente
            </button>
          </div>
        ) : (
          <>
            <div className={styles.summary}>
              <div className={styles.summaryCard}>
                <p className={styles.summaryLabel}>Alta prioridade</p>
                <p className={`${styles.summaryValue} ${styles.summaryAlta}`}>{ALTA_PRIORIDADE}</p>
              </div>
              <div className={styles.summaryCard}>
                <p className={styles.summaryLabel}>Média prioridade</p>
                <p className={`${styles.summaryValue} ${styles.summaryMedia}`}>{MEDIA_PRIORIDADE}</p>
              </div>
              <div className={styles.summaryCard}>
                <p className={styles.summaryLabel}>Baixa prioridade</p>
                <p className={`${styles.summaryValue} ${styles.summaryBaixa}`}>{BAIXA_PRIORIDADE}</p>
              </div>
            </div>

            <div className={styles.toolbar}>
              <h2 className={styles.sectionTitle}>
                <Bell size={18} strokeWidth={2} className={styles.sectionIcon} />
                Lista de alertas {totalLidos > 0 && <span className={styles.badgeContagem}>{totalLidos} lidos</span>}
              </h2>
              <label className={styles.toggleLidos}>
                <input
                  type="checkbox"
                  checked={mostrarLidos}
                  onChange={(e) => setMostrarLidos(e.target.checked)}
                />
                <span className={styles.toggleSlider} />
                <span className={styles.toggleLabel}>{mostrarLidos ? "Ocultar lidos" : "Mostrar lidos"}</span>
              </label>
            </div>

            <div className={styles.tableWrapper}>
              <div className={styles.tableCard}>
                <div className={`${styles.row} ${styles.tableHead}`}>
                  <span>ID</span>
                  <span>Tipo</span>
                  <span>Item</span>
                  <span>Prioridade</span>
                  <span className={styles.statusHead}>Status</span>
                </div>

                {alertasFiltrados.length === 0 ? (
                  <div className={styles.emptyState}>
                    <Shield size={32} strokeWidth={2} className={styles.emptyIcon} />
                    <p>{mostrarLidos || totalLidos === 0 ? "Nenhum alerta no momento" : "Todos os alertas foram lidos"}</p>
                    <span>{mostrarLidos || totalLidos === 0 ? "Tudo funcionando normalmente ✓" : "Desmarque \"Mostrar lidos\" para ver os alertas lidos"}</span>
                  </div>
                ) : (
                  alertasFiltrados.map((a) => {
                    const isLoading = marcandoLido.has(a.id);
                    return (
                      <div
                        className={`${styles.row} ${styles.tableRow} ${a.lido ? styles.lido : ""} ${isLoading ? styles.loading : ""}`}
                        key={a.id}
                        onClick={() => marcarComoLido([a.id], !a.lido)}
                        style={{ cursor: "pointer" }}
                      >
                        <span className={styles.idCell}>{a.id}</span>
                        <span className={styles.tipoCell}>
                          {ICONE_CATEGORIA[a.categoria] || <Package size={14} strokeWidth={2} className={styles.categoriaIcon} />}
                          {a.tipo}
                        </span>
                        <span className={styles.itemCell}>{a.item}</span>
                        <span>
                          <span className={`${styles.badge} ${PRIORIDADE_CLASS[a.prioridade]}`}>
                            {PRIORIDADE_ICON[a.prioridade]}
                            {a.prioridade}
                          </span>
                        </span>
                        <span className={styles.statusCell}>
                          {a.lido ? (
                            <span className={styles.statusLido}>
                              <CheckCircle2 size={14} strokeWidth={2.5} className={styles.checkIcon} />
                              Lido
                            </span>
                          ) : (
                            <span className={styles.statusNaoLido}>
                              <span className={styles.pulseDot} />
                              Novo
                            </span>
                          )}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
