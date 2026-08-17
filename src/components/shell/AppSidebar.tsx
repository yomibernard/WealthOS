"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clsx } from "clsx";
import { Home, Wallet, Target, Sparkles, Menu, LogOut } from "lucide-react";

const items = [
  { href: "/app", label: "Home", icon: Home, match: (p: string) => p === "/app" },
  {
    href: "/app/wealth",
    label: "Wealth",
    icon: Wallet,
    match: (p: string) => p.startsWith("/app/wealth") || p.startsWith("/app/property") || p.startsWith("/app/pension"),
  },
  {
    href: "/app/plan",
    label: "Plan",
    icon: Target,
    match: (p: string) => p.startsWith("/app/plan"),
  },
  {
    href: "/app/ai",
    label: "AI",
    icon: Sparkles,
    match: (p: string) => p.startsWith("/app/ai"),
  },
  {
    href: "/app/more",
    label: "More",
    icon: Menu,
    match: (p: string) =>
      p.startsWith("/app/more") ||
      p.startsWith("/app/settings") ||
      p.startsWith("/app/profile") ||
      p.startsWith("/app/trust") ||
      p.startsWith("/app/security"),
  },
];

export function AppSidebar() {
  const pathname = usePathname() || "/app";
  const router = useRouter();

  return (
    <aside className="app-sidebar" aria-label="Primary">
      <div className="app-sidebar-brand">
        <Link href="/app" className="app-sidebar-logo">
          WealthOS
        </Link>
        <p className="app-sidebar-tag">Personal wealth OS</p>
      </div>

      <nav className="app-sidebar-nav">
        {items.map((item) => {
          const active = item.match(pathname);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx("app-sidebar-link", active && "is-active")}
              aria-current={active ? "page" : undefined}
            >
              <Icon size={18} aria-hidden />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="app-sidebar-footer">
        <button
          type="button"
          className="app-sidebar-link app-sidebar-logout"
          onClick={async () => {
            await fetch("/api/auth/sign-out", { method: "POST" });
            router.push("/");
            router.refresh();
          }}
        >
          <LogOut size={18} aria-hidden />
          <span>Log out</span>
        </button>
      </div>
    </aside>
  );
}
