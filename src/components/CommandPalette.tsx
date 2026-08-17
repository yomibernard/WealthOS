"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import {
  CUSTOMER_COMMANDS,
  filterCommands,
  resolveCommandIntent,
  type CommandItem,
} from "@/lib/command-catalog";

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  const results = useMemo(() => filterCommands(query), [query]);
  const askIntent = useMemo(() => resolveCommandIntent(query), [query]);

  const rows: { kind: "ask" | "nav"; key: string; label: string; href: string; group?: string }[] =
    useMemo(() => {
      const nav = results.map((item: CommandItem) => ({
        kind: "nav" as const,
        key: item.id,
        label: item.label,
        href: item.href,
        group: item.group,
      }));
      if (askIntent) {
        return [
          { kind: "ask" as const, key: "ask", label: askIntent.label, href: askIntent.href },
          ...nav,
        ];
      }
      return nav;
    }, [askIntent, results]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActive(0);
  }, []);

  const go = useCallback(
    (href: string) => {
      close();
      router.push(href);
    },
    [close, router],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  useEffect(() => {
    if (open) {
      setActive(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  return (
    <>
      <button
        type="button"
        className="command-trigger"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <Search size={16} aria-hidden />
        <span>Search</span>
        <kbd className="command-kbd">⌘K</kbd>
      </button>

      {open ? (
        <div
          className="command-overlay"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <div
            className="command-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="Search WealthOS"
          >
            <label className="sr-only" htmlFor={listId + "-input"}>
              Search pages or ask WealthAI
            </label>
            <input
              id={listId + "-input"}
              ref={inputRef}
              className="command-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search pages, or ask what to review…"
              aria-controls={listId}
              aria-autocomplete="list"
              aria-activedescendant={rows[active] ? `${listId}-${rows[active].key}` : undefined}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setActive((i) => Math.min(i + 1, Math.max(rows.length - 1, 0)));
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setActive((i) => Math.max(i - 1, 0));
                } else if (e.key === "Enter" && rows[active]) {
                  e.preventDefault();
                  go(rows[active].href);
                }
              }}
            />
            <ul id={listId} className="command-list" role="listbox">
              {rows.length === 0 ? (
                <li className="command-empty" role="option" aria-selected={false}>
                  No matching pages. Try “property”, “consent”, or ask a question.
                </li>
              ) : (
                rows.map((row, i) => (
                  <li key={row.key} role="presentation">
                    <button
                      type="button"
                      id={`${listId}-${row.key}`}
                      role="option"
                      aria-selected={i === active}
                      className="command-option"
                      data-active={i === active}
                      onMouseEnter={() => setActive(i)}
                      onClick={() => go(row.href)}
                    >
                      <span className="command-option-label">{row.label}</span>
                      {row.group ? <span className="command-option-group">{row.group}</span> : null}
                    </button>
                  </li>
                ))
              )}
            </ul>
            <p className="command-hint">
              ↑↓ to move · Enter to open · Esc to close · questions go to WealthAI
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}
