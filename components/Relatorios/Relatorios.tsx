"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Download, Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import Sidebar from "@/components/Sidebar/Sidebar";
import styles from "./relatorios.module.css";

type Acao = "Entrega" | "Devolução" | "Entrada" | "Saída";

type Movimentacao = {
  id: string;
  funcionario: string;
  quantidade: number;
  acao: Acao;
  data: string; // dd/mm/aaaa hh:mm
};

type Resumo = {
  entregas: number;
  devolucoes: number;
  estoqueAtual: number;
};

type ConsumoSetor = {
  setor: string;
  valor: number;
};

type RelatorioData = {
  movimentacoes: Movimentacao[];
  resumo: Resumo;
  consumoPorSetor: ConsumoSetor[];
};

type Funcionario = {
  id: number;
  nome: string;
  matricula: string;
  setor: string;
  cargo: string;
  status: string;
};

// Máscara de data no padrão brasileiro (dd/mm/aaaa), sem depender do
// formato que o navegador escolheria para <input type="date">.
function mascaraData(valor: string) {
  const d = valor.replace(/\D/g, "").slice(0, 8);
  let out = d.slice(0, 2);
  if (d.length > 2) out += "/" + d.slice(2, 4);
  if (d.length > 4) out += "/" + d.slice(4, 8);
  return out;
}

function paraChaveOrdenavel(dataBr: string) {
  // "dd/mm/aaaa" -> "aaaa-mm-dd" para permitir comparação simples de strings.
  const [dia, mes, ano] = dataBr.split("/");
  if (!dia || !mes || !ano || ano.length < 4) return "";
  return `${ano}-${mes}-${dia}`;
}

function csvEscape(valor: string | number) {
  const texto = String(valor);
  return /[;"\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}

async function exportarCsv(linhas: Movimentacao[]) {
  const cabecalho = ["ID", "Funcionário", "Quantidade", "Ação", "Data"];
  // Ponto e vírgula como separador: é o padrão que o Excel em português do
  // Brasil espera, já que a vírgula é usada como separador decimal.
  const corpo = linhas.map((m) =>
    [m.id, m.funcionario, m.quantidade, m.acao, m.data].map(csvEscape).join(";")
  );
  const conteudo = "\uFEFF" + [cabecalho.join(";"), ...corpo].join("\r\n");
  const nomeArquivo = `relatorio-protecti-${Date.now()}.csv`;

  const showSaveFilePicker = (
    window as unknown as {
      showSaveFilePicker?: (options: unknown) => Promise<FileSystemFileHandle>;
    }
  ).showSaveFilePicker;

  if (showSaveFilePicker) {
    // Abre o explorador de arquivos do sistema operacional para o usuário
    // escolher onde salvar (suportado em navegadores baseados em Chromium).
    try {
      const handle = await showSaveFilePicker({
        suggestedName: nomeArquivo,
        types: [{ description: "Arquivo CSV", accept: { "text/csv": [".csv"] } }],
      });
      const writable = await handle.createWritable();
      await writable.write(conteudo);
      await writable.close();
      return;
    } catch (err) {
      // Usuário cancelou a janela ou o navegador negou a permissão:
      // cai para o download comum abaixo.
      if ((err as DOMException)?.name === "AbortError") return;
    }
  }

  // Navegadores sem suporte a showSaveFilePicker (ex.: Firefox) recebem o
  // download padrão, que abre a caixa "Salvar como" do navegador.
  const blob = new Blob([conteudo], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

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
      <Skeleton width="100%" height="14px" />
      <Skeleton width="100%" height="14px" />
      <Skeleton width="100%" height="14px" />
      <Skeleton width="100%" height="14px" />
      <Skeleton width="100%" height="14px" />
    </div>
  );
}

const SETORES = ["Produção", "Manutenção", "Logística", "Almoxarifado", "Segurança", "Prevenção", "Gerência"];

export default function Relatorios() {
  // Initialize default dates for current month
  const pad2 = (n: number) => String(n).padStart(2, '0');
  const hoje = new Date();
  const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const defaultInicio = `${pad2(primeiroDia.getDate())}/${pad2(primeiroDia.getMonth() + 1)}/${primeiroDia.getFullYear()}`;
  const defaultFim = `${pad2(hoje.getDate())}/${pad2(hoje.getMonth() + 1)}/${hoje.getFullYear()}`;

  const [inicio, setInicio] = useState(defaultInicio);
  const [fim, setFim] = useState(defaultFim);
  const [setor, setSetor] = useState("TODOS");
  const [funcionario, setFuncionario] = useState("TODOS");
  const [filtros, setFiltros] = useState({
    inicio: defaultInicio,
    fim: defaultFim,
    setor: "TODOS",
    funcionario: "TODOS"
  });
  const [data, setData] = useState<RelatorioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);

  // Fetch funcionarios for dropdown
  useEffect(() => {
    fetch('/api/funcionarios')
      .then(res => res.json())
      .then(result => {
        if (result.funcionarios) {
          setFuncionarios(result.funcionarios.filter((f: Funcionario) => f.status === 'ativo'));
        }
      })
      .catch(err => console.error('Erro ao buscar funcionários:', err));
  }, []);

  const fetchRelatorio = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filtros.inicio) params.set('inicio', filtroParaApi(filtros.inicio));
      if (filtros.fim) params.set('fim', filtroParaApi(filtros.fim));
      if (filtros.setor && filtros.setor !== 'TODOS') params.set('setor', filtros.setor);
      if (filtros.funcionario && filtros.funcionario !== 'TODOS') params.set('funcionario', filtros.funcionario);

      const res = await fetch(`/api/relatorios?${params.toString()}`);
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Erro ao buscar relatório");
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  // Converte dd/mm/aaaa para aaaa-mm-dd para API
  function filtroParaApi(dataBr: string) {
    const [dia, mes, ano] = dataBr.split("/");
    if (!dia || !mes || !ano || ano.length < 4) return "";
    return `${ano}-${mes}-${dia}`;
  }

  useEffect(() => {
    fetchRelatorio();
  }, [filtros]);

  const [searchTerm, setSearchTerm] = useState("");
  const [searchField, setSearchField] = useState<"all" | "id" | "funcionario" | "acao" | "data">("all");

  const linhasFiltradas = data?.movimentacoes || [];
  const resumo = data?.resumo || { entregas: 0, devolucoes: 0, estoqueAtual: 0 };

  // Filtrar linhas pela busca
  const linhasComBusca = searchTerm
    ? linhasFiltradas.filter((m) => {
        const term = searchTerm.toLowerCase();
        switch (searchField) {
          case "id":
            return m.id.toLowerCase().includes(term);
          case "funcionario":
            return m.funcionario.toLowerCase().includes(term);
          case "acao":
            return m.acao.toLowerCase().includes(term);
          case "data":
            return m.data.toLowerCase().includes(term);
          default:
            return (
              m.id.toLowerCase().includes(term) ||
              m.funcionario.toLowerCase().includes(term) ||
              m.acao.toLowerCase().includes(term) ||
              m.data.toLowerCase().includes(term) ||
              String(m.quantidade).includes(term)
            );
        }
      })
    : linhasFiltradas;

  function handleGerar(e: FormEvent) {
    e.preventDefault();
    setFiltros({ inicio, fim, setor, funcionario });
  }

  return (
    <div className={styles.page}>
      <Sidebar active="Relatórios" />

      <main className={styles.main}>
        <div className={styles.watermark} />

        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Gestão</p>
            <h1 className={styles.title}>Relatórios</h1>
          </div>
          <button
            type="button"
            className={styles.exportBtn}
            onClick={() => exportarCsv(linhasFiltradas)}
            disabled={loading || linhasFiltradas.length === 0}
          >
            <Download size={16} strokeWidth={2} />
            Exportar CSV
          </button>
        </header>

        <form className={styles.filtros} onSubmit={handleGerar}>
          <div className={styles.field}>
            <label htmlFor="rel-inicio">Início</label>
            <input
              id="rel-inicio"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              maxLength={10}
              placeholder="dd/mm/aaaa"
              value={inicio}
              onChange={(e) => setInicio(mascaraData(e.target.value))}
              disabled={loading}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="rel-fim">Fim</label>
            <input
              id="rel-fim"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              maxLength={10}
              placeholder="dd/mm/aaaa"
              value={fim}
              onChange={(e) => setFim(mascaraData(e.target.value))}
              disabled={loading}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="rel-setor">Setor</label>
            <select
              id="rel-setor"
              value={setor}
              onChange={(e) => setSetor(e.target.value)}
              disabled={loading}
            >
              <option value="TODOS">TODOS</option>
              {SETORES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="rel-funcionario">Funcionário</label>
            <select
              id="rel-funcionario"
              value={funcionario}
              onChange={(e) => setFuncionario(e.target.value)}
              disabled={loading}
            >
              <option value="TODOS">TODOS</option>
              {funcionarios.map((f) => (
                <option key={f.id} value={f.nome}>{f.nome}</option>
              ))}
            </select>
          </div>

          <button type="submit" className={styles.gerarBtn} disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={16} strokeWidth={2.5} className={styles.spinner} />
                Carregando...
              </>
            ) : (
              "Gerar relatório"
            )}
          </button>
        </form>

        {loading ? (
          <>
            <div className={styles.summary}>
              <SummarySkeleton />
              <SummarySkeleton />
              <SummarySkeleton />
              <SummarySkeleton />
            </div>
            <div className={styles.tableCard}>
              <div className={`${styles.row} ${styles.tableHead}`}>
                <span>ID</span>
                <span>Funcionário</span>
                <span>Quantidade</span>
                <span>Ação</span>
                <span>Data</span>
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
            <button className={styles.retryBtn} onClick={fetchRelatorio}>
              <RefreshCw size={14} strokeWidth={2} />
              Tentar novamente
            </button>
          </div>
        ) : (
          <>
            <div className={styles.summary}>
              <div className={styles.summaryCard}>
                <p className={styles.summaryLabel}>Entregas</p>
                <p className={`${styles.summaryValue} ${styles.summaryEntregas}`}>{resumo.entregas}</p>
              </div>
              <div className={styles.summaryCard}>
                <p className={styles.summaryLabel}>Devoluções</p>
                <p className={`${styles.summaryValue} ${styles.summaryDevolucoes}`}>{resumo.devolucoes}</p>
              </div>
              <div className={styles.summaryCard}>
                <p className={styles.summaryLabel}>Estoque atual</p>
                <p className={`${styles.summaryValue} ${styles.summaryEstoque}`}>{resumo.estoqueAtual}</p>
              </div>
            </div>

            <div className={styles.tableSection}>
              <div className={styles.tableHeaderRow}>
                <h2 className={styles.sectionTitle}>Movimentações</h2>
                <div className={styles.searchBar}>
                  <select
                    value={searchField}
                    onChange={(e) => setSearchField(e.target.value as "all" | "id" | "funcionario" | "acao" | "data")}
                    disabled={loading}
                    className={styles.searchFieldSelect}
                  >
                    <option value="all">Todos</option>
                    <option value="id">ID</option>
                    <option value="funcionario">Funcionário</option>
                    <option value="acao">Ação</option>
                    <option value="data">Data</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Buscar na tabela..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    disabled={loading}
                    className={styles.searchInput}
                  />
                </div>
              </div>
              <div className={styles.tableWrapper}>
                <div className={styles.tableCard}>
                  <div className={`${styles.row} ${styles.tableHead}`}>
                    <span>ID</span>
                    <span>Funcionário</span>
                    <span>Quantidade</span>
                    <span>Ação</span>
                    <span>Data</span>
                  </div>

                  {linhasComBusca.map((m) => (
                    <div className={`${styles.row} ${styles.tableRow}`} key={m.id}>
                      <span className={styles.idCell}>{m.id}</span>
                      <span className={styles.funcionarioCell}>{m.funcionario}</span>
                      <span>{m.quantidade}</span>
                      <span className={styles.acaoCell}>{m.acao}</span>
                      <span className={styles.dataCell}>{m.data}</span>
                    </div>
                  ))}

                  {linhasComBusca.length === 0 && (
                    <div className={styles.tableEmpty}>
                      {searchTerm
                        ? "Nenhuma movimentação encontrada para a busca."
                        : "Nenhuma movimentação encontrada para os filtros selecionados."}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
