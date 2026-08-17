"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { SignOutButton } from "@/components/SignOutButton";

const LINKS = [
  { href: "/admin", label: "Hub", exact: true },
  { href: "/admin/ops", label: "Ops" },
  { href: "/admin/escalations", label: "Escalations" },
  { href: "/admin/privacy", label: "Privacy" },
  { href: "/admin/change-requests", label: "Checker" },
  { href: "/admin/audit", label: "Audit" },
  { href: "/admin/flags", label: "Flags" },
  { href: "/admin/ai", label: "AI" },
];

export function AdminShellNav({ name }: { name: string }) {
  const pathname = usePathname() || "/admin";
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-[color-mix(in_srgb,white_92%,transparent)] backdrop-blur-md">
      <div className="page-wide flex flex-wrap items-center justify-between gap-3 py-3">
        <div>
          <p className="eyebrow">Admin ops</p>
          <p className="font-display text-lg font-semibold tracking-tight">{name}</p>
        </div>
        <nav className="flex flex-wrap items-center gap-1" aria-label="Admin">
          {LINKS.map((l) => {
            const active = l.exact
              ? pathname === l.href
              : pathname === l.href || pathname.startsWith(`${l.href}/`);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={clsx(
                  "rounded-full px-3 py-1.5 text-sm font-semibold",
                  active ? "bg-ink text-white" : "text-muted hover:bg-line/60",
                )}
                aria-current={active ? "page" : undefined}
              >
                {l.label}
              </Link>
            );
          })}
          <div className="ml-2">
            <SignOutButton />
          </div>
        </nav>
      </div>
    </header>
  );
}
