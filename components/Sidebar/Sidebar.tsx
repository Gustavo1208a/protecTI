"use client";

import Image from "next/image";
import {
  LayoutGrid,
  Users,
  HardHat,
  Boxes,
  Package,
  Undo2,
  Bell,
  FileBarChart2,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider/AuthProvider";
import { useRouter } from "next/navigation";
import styles from "./sidebar.module.css";

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutGrid, href: "/dashboard" },
  { label: "Funcionários", icon: Users, href: "/funcionarios" },
  { label: "EPIs", icon: HardHat, href: "/epis" },
  { label: "Estoque", icon: Boxes, href: "/estoque" },
  { label: "Entrega", icon: Package, href: "/entrega" },
  { label: "Devolução", icon: Undo2, href: "/devolucao" },
  { label: "Alertas", icon: Bell, href: "/alertas" },
  { label: "Relatórios", icon: FileBarChart2, href: "/relatorios" },
];

type SidebarProps = {
  active?: string;
};

export default function Sidebar({ active = "Dashboard" }: SidebarProps) {
  const { user, logout, loading } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
    router.refresh();
  };

  // Render skeleton loading state for user card while loading
  const renderUserCard = () => {
    if (loading) {
      return (
        <div className={styles.userCardSkeleton}>
          <div className={`${styles.skeletonLine} ${styles.skeletonLineMedium}`} />
          <div className={`${styles.skeletonLine} ${styles.skeletonLineShort}`} />
          <div className={styles.skeletonButton} />
        </div>
      );
    }

    return (
      <div className={styles.userCard}>
        <p className={styles.userName}>{user?.nome || "Usuário"}</p>
        <p className={styles.userRole}>{user?.cargo || "Funcionário"}</p>
        <button onClick={handleLogout} className={styles.logout}>
          <span className={styles.logoutIcon}>
            <LogOut size={16} strokeWidth={1.8} />
          </span>
          <span>Sair</span>
        </button>
      </div>
    );
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <a href="/dashboard">
        <Image
          src="/protecti-logo.png"
          alt="protecTI"
          width={150}
          height={110}
          priority
        />
        </a>
      </div>

      <nav className={styles.nav}>
        {NAV_ITEMS.map(({ label, icon: Icon, href }) => {
          const isActive = label === active;
          return (
            <a
              key={label}
              href={href}
              className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
            >
              <Icon size={20} strokeWidth={1.8} />
              <span>{label}</span>
            </a>
          );
        })}
      </nav>

      {renderUserCard()}
    </aside>
  );
}
