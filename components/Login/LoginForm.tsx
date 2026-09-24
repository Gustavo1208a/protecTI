"use client";

import { useState, FormEvent } from "react";
import { useRouter } from 'next/navigation'; 
import Image from "next/image";
import styles from "./login.module.css";

type View = "login" | "recover";

export default function LoginForm() {
  const router = useRouter();

  const [view, setView] = useState<View>("login");
  const [matricula, setMatricula] = useState("");
  const [senha, setSenha] = useState("");
  const [matricula2, setMatricula2] = useState("");
  const [email, setEmail] = useState("");

  function handleLogin(e: FormEvent) {
    e.preventDefault();
    // TODO: integrar com o endpoint de autenticação
    console.log("login attempt", { matricula });
    router.push("/dashboard");
  }

  function handleRecover(e: FormEvent) {
    e.preventDefault();
    // TODO: integrar com o endpoint de recuperação de senha
    console.log("recover attempt", { matricula: matricula2, email });
  }

  return (
    <div className={styles.card}>
      {/* LEFT: brand */}
      <div className={styles.panelLeft}>
        <div className={styles.logo}>
          <Image
            src="/protecti-logo.png"
            alt="protecTI"
            width={220}
            height={160}
            priority
          />
        </div>
        <div className={styles.pitch}>
          <h1>Nenhum EPI vencido sai do armário.</h1>
          <p>
            O protecTI conecta o armário inteligente ao controle de
            validade, ao estoque e aos indicadores de segurança em tempo
            real.
          </p>
        </div>
      </div>

      {/* RIGHT: forms */}
      <div className={styles.panelRight}>
        <div className={styles.watermark} />

        <div className={styles.formWrap}>
          {view === "login" ? (
            <>
              <h2>Entrar</h2>
              <p className={styles.sub}>
                Use sua matrícula e senha cadastradas pelo administrador.
              </p>

              <form onSubmit={handleLogin}>
                <div className={styles.field}>
                  <label htmlFor="matricula">Matrícula</label>
                  <input
                    type="text"
                    id="matricula"
                    name="matricula"
                    placeholder="Ex: 00123"
                    autoComplete="username"
                    value={matricula}
                    onChange={(e) => setMatricula(e.target.value)}
                    required
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="senha">Senha</label>
                  <input
                    type="password"
                    id="senha"
                    name="senha"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className={styles.btn}>
                  Entrar
                </button>
              </form>

              <div className={styles.belowLink}>
                <a href="#" onClick={(e) => { e.preventDefault(); setView("recover"); }}>
                  Esqueci minha senha
                </a>
              </div>
            </>
          ) : (
            <>
              <h2>Recuperar senha</h2>
              <p className={styles.sub}>
                Enviaremos um link de redefinição para o e-mail cadastrado.
              </p>

              <form onSubmit={handleRecover}>
                <div className={styles.field}>
                  <label htmlFor="matricula2">Matrícula</label>
                  <input
                    type="text"
                    id="matricula2"
                    name="matricula2"
                    placeholder="Ex: 00123"
                    value={matricula2}
                    onChange={(e) => setMatricula2(e.target.value)}
                    required
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="email">E-mail corporativo</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="nome@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className={styles.btn}>
                  Enviar link
                </button>
              </form>

              <div className={styles.belowLink}>
                <button
                  type="button"
                  className={styles.backLink}
                  onClick={() => setView("login")}
                >
                  ← Voltar ao login
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
