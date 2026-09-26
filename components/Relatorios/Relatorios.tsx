"use client";

import { FormEvent, useMemo, useState } from "react";
import { Download } from "lucide-react";
import Sidebar from "@/components/Sidebar/Sidebar";
import { FUNCIONARIOS } from "@/lib/funcionarios";
import styles from "./relatorios.module.css";

type Acao = "Entrega" | "Devolução" | "Entrada";

type Movimentacao = {
  id: string;
  funcionario: string;
  quantidade: number;
  acao: Acao;
  data: string; // dd/mm/aaaa hh:mm
};

const MOVIMENTACOES: Movimentacao[] = [
  { id: "MV-9001", funcionario: "Carlos Mendes", quantidade: 42, acao: "Entrega", data: "09/09/2026 08:12" },
  { id: "MV-9002", funcionario: "Joana Silva", quantidade: 23, acao: "Devolução", data: "09/09/2026 08:40" },
  { id: "MV-9003", funcionario: "Amanda Medeiros", quantidade: 67, acao: "Entrada", data: "08/09/2026 17:05" },
  { id: "MV-9004", funcionario: "Indianara Lima", quantidade: 8, acao: "Entrega", data: "08/09/2026 14:33" },
];

const CONSUMO_POR_SETOR: { setor: string; valor: number }[] = [
  { setor: "Produção", valor: 128 },
  { setor: "Logística", valor: 61 },
  { setor: "Almoxarifado", valor: 33 },
  { setor: "Segurança", valor: 18 },
];

const SETORES = ["Produção", "Logística", "Almoxarifado", "Segurança"];

const RESUMO_PADRAO = {
  entregas: 150,
  devolucoes: 91,
  estoqueAtual: 288,
  custoEstimado: "R$8.420",
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

export default function Relatorios() {
  const [inicio, setInicio] = useState("01/09/2026");
  const [fim, setFim] = useState("09/09/2026");
  const [setor, setSetor] = useState("TODOS");
  const [funcionario, setFuncionario] = useState("TODOS");
  const [filtros, setFiltros] = useState({ inicio, fim, setor, funcionario });

  const linhasFiltradas = useMemo(() => {
    const inicioChave = paraChaveOrdenavel(filtros.inicio);
    const fimChave = paraChaveOrdenavel(filtros.fim);

    return MOVIMENTACOES.filter((m) => {
      if (filtros.funcionario !== "TODOS" && m.funcionario !== filtros.funcionario) {
        return false;
      }
      const dataMovimentacao = paraChaveOrdenavel(m.data.slice(0, 10));
      if (inicioChave && dataMovimentacao < inicioChave) return false;
      if (fimChave && dataMovimentacao > fimChave) return false;
      return true;
    });
  }, [filtros]);

  // TODO: quando houver backend, os cartões de resumo e o consumo por setor
  // devem ser recalculados a partir do período/setor selecionado.
  const resumo = RESUMO_PADRAO;

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
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="rel-setor">Setor</label>
            <select
              id="rel-setor"
              value={setor}
              onChange={(e) => setSetor(e.target.value)}
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
            >
              <option value="TODOS">TODOS</option>
              {FUNCIONARIOS.map((f) => (
                <option key={f.id} value={f.nome}>{f.nome}</option>
              ))}
            </select>
          </div>

          <button type="submit" className={styles.gerarBtn}>
            Gerar relatório
          </button>
        </form>

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
          <div className={styles.summaryCard}>
            <p className={styles.summaryLabel}>Custo estimado</p>
            <p className={`${styles.summaryValue} ${styles.summaryCusto}`}>{resumo.custoEstimado}</p>
          </div>
        </div>

        <div className={styles.tableCard}>
          <div className={`${styles.row} ${styles.tableHead}`}>
            <span>ID</span>
            <span>Funcionário</span>
            <span>Quantidade</span>
            <span>Ação</span>
            <span>Data</span>
          </div>

          {linhasFiltradas.map((m) => (
            <div className={`${styles.row} ${styles.tableRow}`} key={m.id}>
              <span className={styles.idCell}>{m.id}</span>
              <span className={styles.funcionarioCell}>{m.funcionario}</span>
              <span>{m.quantidade}</span>
              <span className={styles.acaoCell}>{m.acao}</span>
              <span className={styles.dataCell}>{m.data}</span>
            </div>
          ))}

          {linhasFiltradas.length === 0 && (
            <div className={styles.tableEmpty}>
              Nenhuma movimentação encontrada para os filtros selecionados.
            </div>
          )}
        </div>

        <section className={styles.consumoCard}>
          <h2 className={styles.consumoTitle}>Consumo por setor</h2>
          <div className={styles.consumoGrid}>
            {CONSUMO_POR_SETOR.map((c) => (
              <div className={styles.consumoItem} key={c.setor}>
                <span className={styles.consumoSetor}>{c.setor}</span>
                <span className={styles.consumoValor}>{c.valor}</span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
