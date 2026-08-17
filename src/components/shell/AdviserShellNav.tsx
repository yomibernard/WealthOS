"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { SignOutButton } from "@/components/SignOutButton";

const LINKS = [
  { href: "/adviser", label: "Brief", match: (p: string) => p === "/adviser" },
  {
    href: "/adviser/notifications",
    label: "Inbox",
    match: (p: string) => p.startsWith("/adviser/notifications"),
  },
  { href: "/adviser/ai", label: "AI", match: (p: string) => p.startsWith("/adviser/ai") },
];

export function AdviserShellNav({ name }: { name: string }) {
  const pathname = usePathname() || "/adviser";
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-[color-mix(in_srgb,white_92%,transparent)] backdrop-blur-md">
      <div className="page-wide flex flex-wrap items-center justify-between gap-3 py-3">
        <div>
          <p className="eyebrow">Adviser</p>
          <p className="font-display text-lg font-semibold tracking-tight">{name}</p>
        </div>
        <nav className="flex flex-wrap items-center gap-1" aria-label="Adviser">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={clsx(
                "rounded-full px-3 py-2 text-sm font-semibold",
                l.match(pathname)
                  ? "bg-accent-soft text-accent"
                  : "text-muted hover:bg-accent-soft/40",
              )}
              aria-current={l.match(pathname) ? "page" : undefined}
            >
              {l.label}
            </Link>
          ))}
          {pathname.startsWith("/adviser/customers") ? (
            <span className="rounded-full bg-ink px-3 py-2 text-sm font-semibold text-white">
              360
            </span>
          ) : null}
          <div className="ml-2">
            <SignOutButton />
          </div>
        </nav>
      </div>
    </header>
  );
}
