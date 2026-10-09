"use client";

import { useEffect, useState } from "react";
import { notFound } from "next/navigation";
import FuncionarioPerfil from "@/components/Funcionarios/perfil/FuncionarioPerfil";
import { Loader2 } from "lucide-react";
import styles from "./page.module.css";

export default function FuncionarioPerfilPage({
  params,
}: {
  params: { id: string };
}) {
  const [funcionario, setFuncionario] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFoundError, setNotFoundError] = useState(false);

  useEffect(() => {
    async function fetchFuncionario() {
      try {
        const res = await fetch(`/api/funcionarios/${params.id}`);
        const data = await res.json();
        if (res.ok && data.funcionario) {
          setFuncionario(data.funcionario);
        } else {
          setNotFoundError(true);
        }
      } catch {
        setNotFoundError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchFuncionario();
  }, [params.id]);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 size={28} strokeWidth={2} className={styles.spinner} />
      </div>
    );
  }

  if (notFoundError || !funcionario) {
    notFound();
  }

  return <FuncionarioPerfil funcionario={funcionario} />;
}