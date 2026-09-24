import { notFound } from "next/navigation";
import FuncionarioPerfil from "@/components/Funcionarios/perfil/FuncionarioPerfil";
import { FUNCIONARIOS, getFuncionarioById } from "@/lib/funcionarios";

export function generateStaticParams() {
  return FUNCIONARIOS.map((f) => ({ id: f.id }));
}

export default function FuncionarioPerfilPage({
  params,
}: {
  params: { id: string };
}) {
  const funcionario = getFuncionarioById(params.id);

  if (!funcionario) {
    notFound();
  }

  return <FuncionarioPerfil funcionario={funcionario} />;
}