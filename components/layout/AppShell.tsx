// components/layout/AppShell.tsx  — wraps every portal page
"use client";
import { type ReactNode } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";
import Header from "./Header";
import type { NavItem } from "./navigation";

export default function AppShell({ title, nav, children }:
  { title: string; nav: NavItem[]; children: ReactNode }) {
  const pathname = usePathname();
  const currentPage = nav.find((item) => pathname.startsWith(item.href));
  return (
    <div className="app-shell">
      <Sidebar nav={nav} />
      <div className="app-main">
        <Header title={currentPage?.label ?? title} />
        <main className="page">{children}</main>
      </div>
      <MobileNav nav={nav} />
    </div>
  );
}