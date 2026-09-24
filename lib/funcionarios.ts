export type Status = "Ativo" | "Inativo";

export type Movimentacao = {
  id: string;
  epi: string;
  acao: "Entrega" | "Devolução";
  qtd: number;
  dataHora: string;
};

export type Funcionario = {
  id: string;
  codigo: string;
  matricula: string;
  nome: string;
  setor: string;
  cargo: string;
  status: Status;
  cpf: string;
  telefone: string;
  epiEmPosse: number;
  retiradasNoAno: number;
  devolucoes: number;
  pendencias: number;
  movimentacoes: Movimentacao[];
};

export const FUNCIONARIOS: Funcionario[] = [
  {
    id: "carlos-mendes",
    codigo: "F-001",
    matricula: "2024001",
    nome: "Carlos Mendes",
    setor: "Gerenciar",
    cargo: "Administrador do sistema",
    status: "Ativo",
    cpf: "123.456.789-00",
    telefone: "(11) 98812-4410",
    epiEmPosse: 3,
    retiradasNoAno: 21,
    devolucoes: 18,
    pendencias: 0,
    movimentacoes: [
      {
        id: "MV-9001",
        epi: "Óculos de Proteção Incolor",
        acao: "Entrega",
        qtd: 1,
        dataHora: "09/09/2026 08:12",
      },
    ],
  },
  {
    id: "joana-silva",
    codigo: "F-002",
    matricula: "2024002",
    nome: "Joana Silva",
    setor: "Infraestrutura",
    cargo: "Almoxarife",
    status: "Ativo",
    cpf: "234.567.890-11",
    telefone: "(11) 98123-5521",
    epiEmPosse: 4,
    retiradasNoAno: 15,
    devolucoes: 11,
    pendencias: 0,
    movimentacoes: [
      {
        id: "MV-8712",
        epi: "Luva de Vaqueta",
        acao: "Entrega",
        qtd: 2,
        dataHora: "02/09/2026 14:35",
      },
    ],
  },
  {
    id: "amanda-medeiros",
    codigo: "F-003",
    matricula: "2024003",
    nome: "Amanda Medeiros",
    setor: "Manutenção",
    cargo: "Funcionário/Operador",
    status: "Ativo",
    cpf: "345.678.901-22",
    telefone: "(11) 97654-3312",
    epiEmPosse: 5,
    retiradasNoAno: 19,
    devolucoes: 14,
    pendencias: 1,
    movimentacoes: [
      {
        id: "MV-8650",
        epi: "Capacete de Segurança",
        acao: "Entrega",
        qtd: 1,
        dataHora: "28/08/2026 09:50",
      },
    ],
  },
  {
    id: "indianara-lima",
    codigo: "F-004",
    matricula: "2024004",
    nome: "Indianara Lima",
    setor: "Prevenção",
    cargo: "Técnica de Segurança do Trabalho",
    status: "Inativo",
    cpf: "456.789.012-33",
    telefone: "(11) 96543-2210",
    epiEmPosse: 0,
    retiradasNoAno: 9,
    devolucoes: 9,
    pendencias: 0,
    movimentacoes: [
      {
        id: "MV-7920",
        epi: "Máscara PFF2",
        acao: "Devolução",
        qtd: 3,
        dataHora: "14/07/2026 16:02",
      },
    ],
  },
];

export function getFuncionarioById(id: string) {
  return FUNCIONARIOS.find((f) => f.id === id);
}