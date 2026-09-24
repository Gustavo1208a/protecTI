import Sidebar from "@/components/Sidebar/Sidebar";
import styles from "@/components/Entrega/entrega.module.css";

// Página provisória: existe apenas para que o fluxo de Entrega
// tenha um destino. Substitua pelo layout real de Devolução.
export default function Devolucao() {
  return (
    <div className={styles.page}>
      <Sidebar active="Devolução" />

      <main className={styles.main}>
        <div className={styles.watermark} />
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Cadastros</p>
            <h1 className={styles.title}>Devolução</h1>
          </div>
        </header>
      </main>
    </div>
  );
}
