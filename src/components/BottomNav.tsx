"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Wallet, Target, Sparkles, Menu } from "lucide-react";

const items = [
  { href: "/app", label: "Home", icon: Home },
  { href: "/app/wealth", label: "Wealth", icon: Wallet },
  { href: "/app/plan", label: "Plan", icon: Target },
  { href: "/app/ai", label: "AI", icon: Sparkles },
  { href: "/app/more", label: "More", icon: Menu },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="bottom-nav" aria-label="Primary">
      {items.map((item) => {
        const active =
          item.href === "/app"
            ? pathname === "/app"
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className="nav-item"
            data-active={active}
            aria-current={active ? "page" : undefined}
          >
            <Icon size={20} aria-hidden />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
