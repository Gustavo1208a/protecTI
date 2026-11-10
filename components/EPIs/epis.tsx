"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, Plus, Edit, Trash2, AlertCircle, CheckCircle, Calendar } from "lucide-react";
import Sidebar from "@/components/Sidebar/Sidebar";
import styles from "./epis.module.css";

const CATEGORIAS = [
  "Proteção da cabeça",
  "Proteção dos olhos e face",
  "Proteção auditiva",
  "Proteção respiratória",
  "Proteção das mãos",
  "Proteção dos pés",
];

const ARMARIOS = ["Armário 01", "Armário 02", "Armário 03"];

type EpiLote = {
  id_lote: number;
  lote: string;
  quantidade: number;
  quantidade_disponivel: number;
  data_fabricacao: string | null;
  data_validade: string | null;
  criado_em: string | null;
};

type Epi = {
  id_epi: number;
  nome: string;
  descricao: string | null;
  validade_ca: string | null;
  quantidade_estoque: number;
  quantidade_minima: number;
  categoria: string | null;
  tamanho: string | null;
  lote: string | null;
  data_fabricacao: string | null;
  armario: string | null;
  compartimento: string;
  lotes: EpiLote[];
};

type EditForm = {
  nome: string;
  categoria: string;
  tamanho: string;
  quantidadeInicial: number;
  quantidadeMinima: number;
  armario: string;
  compartimento: string;
};

export default function Epis() {
  const [query, setQuery] = useState("");
  const [epis, setEpis] = useState<Epi[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<EditForm>>({});
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function fetchLotes(id_epi: number) {
    try {
      const res = await fetch(`/api/epis/${id_epi}/lotes`);
      if (res.ok) {
        const data = await res.json();
        return data.lotes ?? [];
      }
      return [];
    } catch (error) {
      console.error("Erro ao buscar lotes:", error);
      return [];
    }
  }

  async function fetchEpis() {
    try {
      const res = await fetch("/api/epis");
      const data = await res.json();
      if (res.ok && data.epis) {
        const episComLotes = await Promise.all(
          (data.epis as any[]).map(async (e) => {
            const lotes = await fetchLotes(e.id_epi);
            return { ...e, lotes } as Epi;
          })
        );
        setEpis(episComLotes);
      }
    } catch (error) {
      console.error("Erro ao buscar EPIs:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchEpis();
  }, []);

  // Formata data ISO (ex: 2040-02-11T03:00:00.000Z) para DD/MM/YYYY
  function formatDateDisplay(dateStr: string | null | undefined): string {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "";
    const dia = String(date.getUTCDate()).padStart(2, "0");
    const mes = String(date.getUTCMonth() + 1).padStart(2, "0");
    const ano = date.getUTCFullYear();
    return `${dia}/${mes}/${ano}`;
  }

  function handleEditClick(epi: Epi) {
    setEditingId(epi.id_epi);
    setEditForm({
      nome: epi.nome,
      categoria: epi.categoria || "",
      tamanho: epi.tamanho || "",
      quantidadeInicial: epi.quantidade_estoque,
      quantidadeMinima: epi.quantidade_minima,
      armario: epi.armario || "",
      compartimento: epi.compartimento,
    });
    setError(null);
  }

  async function handleSaveEdit(id: number) {
    setError(null);
    try {
      const res = await fetch(`/api/epis/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao atualizar EPI");
      }
      setEditingId(null);
      setEditForm({});
      await fetchEpis();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado");
    }
  }

  function handleCancelEdit() {
    setEditingId(null);
    setEditForm({});
    setError(null);
  }

  async function handleDelete(id: number) {
    if (!confirm("Tem certeza que deseja excluir este EPI?")) return;
    setDeletingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/epis/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao excluir EPI");
      }
      await fetchEpis();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setDeletingId(null);
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return epis;
    return epis.filter(
      (e) =>
        e.nome.toLowerCase().includes(q) ||
        e.compartimento.toLowerCase().includes(q) ||
        (e.categoria && e.categoria.toLowerCase().includes(q))
    );
  }, [query, epis]);

    function getStatus(epi: Epi) {
    if (epi.validade_ca) {
      const validade = new Date(epi.validade_ca);
      const hoje = new Date();
      validade.setHours(0, 0, 0, 0);
      hoje.setHours(0, 0, 0, 0);

      if (validade < hoje) {
        return "Vencido";
      }
    }

    if (
      epi.quantidade_estoque <= epi.quantidade_minima &&
      epi.quantidade_minima > 0
    ) {
      return "Estoque baixo";
    }

    return "Disponível";
  }

  return (
    <div className={styles.page}>
      <Sidebar active="EPIs" />

      <main className={styles.main}>
        <div className={styles.watermark} />

        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Cadastros</p>
            <h1 className={styles.title}>EPIs</h1>
          </div>
          <Link className={styles.addBtn} href={"/epis/cadastro"} type="button">
            <Plus size={18} strokeWidth={2.2} />
            Cadastrar EPIs
          </Link>
        </header>

        <div className={styles.searchBar}>
          <Search size={18} strokeWidth={1.8} />
          <input
            type="text"
            placeholder="Buscar por nome, CA, compartimento ou categoria"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {error && (
          <div className={styles.errorToast}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <div className={styles.tableCard}>
          {loading ? (
            <>
              <div className={`${styles.row} ${styles.tableHead}`}>
                <span>Compart.</span>
                <span>EPI</span>
                <span>CA</span>
                <span>Categoria</span>
                <span>Estoque / Mín.</span>
                <span>Status</span>
                <span>Ações</span>
              </div>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className={styles.skeletonRow}>
                  <div className={`${styles.skeletonCell} ${styles.skeletonCellShort}`} />
                  <div className={`${styles.skeletonCell} ${styles.skeletonCellLong}`} />
                  <div className={`${styles.skeletonCell} ${styles.skeletonCellMedium}`} />
                  <div className={`${styles.skeletonCell} ${styles.skeletonCellShort}`} />
                  <div className={`${styles.skeletonCell} ${styles.skeletonCellShort}`} />
                  <div className={styles.skeletonBadge} />
                  <div className={styles.skeletonActions}>
                    <div className={styles.skeletonActionBtn} />
                    <div className={styles.skeletonActionBtn} />
                  </div>
                </div>
              ))}
            </>
          ) : (
            <>
              <div className={`${styles.row} ${styles.tableHead}`}>
                <span>Compart.</span>
                <span>EPI</span>
                <span>CA</span>
                <span>Categoria</span>
                <span>Estoque / Mín.</span>
                <span>Status</span>
                <span>Ações</span>
              </div>

              {filtered.map((e) => (
                editingId === e.id_epi ? (
                  <div key={e.id_epi} className={styles.editRow}>
                    <div className={styles.editHeader}>
                      <div className={styles.editTitle}>
                        <Edit size={18} strokeWidth={2.2} />
                        <span>Editando: {e.nome}</span>
                      </div>
                      <div className={styles.editHeaderActions}>
                        <button
                          className={styles.saveBtn}
                          onClick={() => handleSaveEdit(e.id_epi)}
                          disabled={deletingId === e.id_epi}
                        >
                          <CheckCircle size={16} />
                          Salvar alterações
                        </button>
                        <button
                          className={styles.cancelBtn}
                          onClick={handleCancelEdit}
                          disabled={deletingId === e.id_epi}
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>

                    {error && (
                      <div className={styles.errorMessage}>
                        <AlertCircle size={16} />
                        {error}
                      </div>
                    )}

                    <div className={styles.editBody}>
                      <div className={styles.editSection}>
                        <h4 className={styles.editSectionTitle}>Informações do EPI</h4>
                        <div className={styles.editGrid}>
                          <div className={styles.editField}>
                            <label>Nome do EPI</label>
                            <input
                              type="text"
                              value={editForm.nome || ""}
                              onChange={(ev) => setEditForm({ ...editForm, nome: ev.target.value })}
                              required
                            />
                          </div>
                          <div className={styles.editField}>
                            <label>Categoria</label>
                            <select
                              value={editForm.categoria || CATEGORIAS[0]}
                              onChange={(ev) => setEditForm({ ...editForm, categoria: ev.target.value })}
                            >
                              {CATEGORIAS.map((c) => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                            </select>
                          </div>
                          <div className={styles.editField}>
                            <label>Tamanho</label>
                            <input
                              type="text"
                              value={editForm.tamanho || ""}
                              onChange={(ev) => setEditForm({ ...editForm, tamanho: ev.target.value })}
                            />
                          </div>
                        </div>
                      </div>

                      <div className={styles.editSection}>
                        <h4 className={styles.editSectionTitle}>Estoque</h4>
                        <div className={styles.editGrid}>
                          <div className={styles.editField}>
                            <label>Quantidade em Estoque</label>
                            <input
                              type="number"
                              min="0"
                              value={editForm.quantidadeInicial ?? ""}
                              onChange={(ev) => setEditForm({ ...editForm, quantidadeInicial: parseInt(ev.target.value) || 0 })}
                            />
                          </div>
                          <div className={styles.editField}>
                            <label>Quantidade Mínima</label>
                            <input
                              type="number"
                              min="0"
                              value={editForm.quantidadeMinima ?? ""}
                              onChange={(ev) => setEditForm({ ...editForm, quantidadeMinima: parseInt(ev.target.value) || 0 })}
                            />
                          </div>
                        </div>
                      </div>

                      <div className={styles.editSection}>
                        <h4 className={styles.editSectionTitle}>Localização</h4>
                        <div className={styles.editGrid}>
                          <div className={styles.editField}>
                            <label>Armário</label>
                            <select
                              value={editForm.armario || ARMARIOS[0]}
                              onChange={(ev) => setEditForm({ ...editForm, armario: ev.target.value })}
                            >
                              {ARMARIOS.map((a) => (
                                <option key={a} value={a}>{a}</option>
                              ))}
                            </select>
                          </div>
                          <div className={styles.editField}>
                            <label>Compartimento</label>
                            <input
                              type="text"
                              value={editForm.compartimento || ""}
                              onChange={(ev) => setEditForm({ ...editForm, compartimento: ev.target.value })}
                              required
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div key={e.id_epi} className={`${styles.row} ${styles.tableRow} ${expandedId === e.id_epi ? styles.isExpanded : ""}`} onClick={() => setExpandedId(expandedId === e.id_epi ? null : e.id_epi)}>
                      <span className={styles.compartimento}>{e.compartimento}</span>
                      <span className={styles.nome}>{e.nome}</span>
                      <span className={styles.categoria}>{e.categoria || "-"}</span>
                      <span className={styles.quantidade}>
                        {e.quantidade_estoque} / {e.quantidade_minima}
                      </span>
                      <span className={styles.statusCol}>
                        <span
                          className={`${styles.badge} ${getStatus(e) === "Disponível"
                              ? styles.badgeDisponivel
                              : styles.badgeBaixo
                            }`}
                        >
                          {getStatus(e)}
                        </span>
                      </span>
                      <div className={styles.actions}>
                        <button
                          className={styles.actionBtn}
                          onClick={(ev) => {
                            ev.stopPropagation();
                            handleEditClick(e);
                          }}
                          disabled={deletingId !== null}
                          title="Editar"
                        >
                          <Edit size={16} strokeWidth={2} />
                        </button>
                        <button
                          className={`${styles.actionBtn} ${styles.deleteBtn}`}
                          onClick={(ev) => {
                            ev.stopPropagation();
                            handleDelete(e.id_epi);
                          }}
                          disabled={editingId !== null || deletingId !== null}
                          title="Excluir"
                        >
                          <Trash2 size={16} strokeWidth={2} />
                        </button>
                        <span className={styles.expandArrow}>
                          {expandedId === e.id_epi ? "▲" : "▼"}
                        </span>
                      </div>
                    </div>

                    {expandedId === e.id_epi && (
                      <div key={`lotes-${e.id_epi}`} className={styles.loteRow}>
                        <div className={styles.loteHeader}>
                          <span>Lotes cadastrados</span>
                          <span className={styles.loteBadge}>
                            {e.lotes.length} lote{e.lotes.length > 1 ? "s" : ""}
                          </span>
                        </div>
                        {e.lotes.length > 0 ? (
                          e.lotes.map((l) => (
                            <div key={l.id_lote} className={styles.loteBadge}>
                              <span className={styles.loteNumero}>Lote {l.lote}</span>
                              <span className={styles.loteQty}>
                                {l.quantidade_disponivel}/{l.quantidade} un.
                              </span>
                              {l.data_validade ? (
                                <span className={styles.loteVal}>
                                  <Calendar size={14} strokeWidth={1.5} />
                                  Val: {formatDateDisplay(l.data_validade)}
                                </span>
                              ) : null}
                            </div>
                          ))
                        ) : (
                          <div className={styles.loteEmpty}>
                            Nenhum lote cadastrado.
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )
              ))}

              {filtered.length === 0 && !loading && (
                <div className={styles.emptyState}>
                  Nenhum EPI encontrado.
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}