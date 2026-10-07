// components/layout/MobileNav.tsx — mobile bottom nav
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { navIcons, type NavItem } from "./navigation";

export default function MobileNav({ nav }: { nav: NavItem[] }) {
  const path = usePathname();
  return (
    <nav className="mobile-nav" aria-label="Main navigation">
      {nav.map((item) => {
        const active = path.startsWith(item.href);
        const Icon = navIcons[item.icon] ?? navIcons.home;
        return (
          <Link key={item.href} href={item.href} className={`mobile-nav-link${active ? " mobile-nav-link-active" : ""}`} aria-current={active ? "page" : undefined}>
            <Icon size={19} strokeWidth={1.8} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}