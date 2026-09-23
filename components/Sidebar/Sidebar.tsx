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
  userName?: string;
  userRole?: string;
};

export default function Sidebar({
  active = "Dashboard",
  userName = "Rafael Lamb",
  userRole = "Técnico de Segurança",
}: SidebarProps) {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <Image
          src="/protecti-logo.png"
          alt="protecTI"
          width={150}
          height={110}
          priority
        />
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

      <div className={styles.userCard}>
        <p className={styles.userName}>{userName}</p>
        <p className={styles.userRole}>{userRole}</p>
        <a href="/login" className={styles.logout}>
          <LogOut size={16} strokeWidth={1.8} />
          <span>Sair</span>
        </a>
      </div>
    </aside>
  );
}
