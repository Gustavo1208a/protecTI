export type EpiStatus = "Disponível" | "Estoque baixo";

export type Epi = {
  id: string;
  compartimento: string;
  nome: string;
  quantidade: number;
  status: EpiStatus;
};

export const EPIS: Epi[] = [
  {
    id: "capacete-classe-b",
    compartimento: "A1",
    nome: "Capacete de Segurança Classe B",
    quantidade: 42,
    status: "Disponível",
  },
  {
    id: "luva-vaqueta",
    compartimento: "A1",
    nome: "Luva de Vaqueta",
    quantidade: 23,
    status: "Estoque baixo",
  },
  {
    id: "oculos-incolor",
    compartimento: "A1",
    nome: "Óculos de Proteção Incolor",
    quantidade: 67,
    status: "Disponível",
  },
  {
    id: "protetor-auricular-plug",
    compartimento: "A1",
    nome: "Protetor Auricular Plug",
    quantidade: 8,
    status: "Estoque baixo",
  },
  {
    id: "mascara-pff2",
    compartimento: "A1",
    nome: "Máscara PFF2",
    quantidade: 12,
    status: "Estoque baixo",
  },
  {
    id: "bota-bico-composite",
    compartimento: "A1",
    nome: "Bota de Segurança Bico Composite",
    quantidade: 53,
    status: "Disponível",
  },
];