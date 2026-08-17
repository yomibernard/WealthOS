export type CommandItem = {
  id: string;
  label: string;
  href: string;
  keywords: string[];
  group: string;
};

/** Static customer destinations for the global command palette. */
export const CUSTOMER_COMMANDS: CommandItem[] = [
  {
    id: "home",
    label: "Home",
    href: "/app",
    keywords: ["home", "dashboard", "overview", "today"],
    group: "Primary",
  },
  {
    id: "wealth",
    label: "Wealth map",
    href: "/app/wealth",
    keywords: ["wealth", "assets", "net worth", "allocation", "map"],
    group: "Primary",
  },
  {
    id: "plan",
    label: "Plan & goals",
    href: "/app/plan",
    keywords: ["plan", "goals", "retirement", "twin", "scenario"],
    group: "Primary",
  },
  {
    id: "ai",
    label: "Ask WealthAI",
    href: "/app/ai",
    keywords: ["ai", "ask", "chat", "advisor", "wealthai", "review today"],
    group: "Primary",
  },
  {
    id: "more",
    label: "More",
    href: "/app/more",
    keywords: ["more", "menu", "all"],
    group: "Primary",
  },
  {
    id: "actions",
    label: "Recommendations",
    href: "/app/actions",
    keywords: ["actions", "nbfa", "recommendations", "next", "do nothing"],
    group: "Priorities",
  },
  {
    id: "health",
    label: "Wealth Health",
    href: "/app/health",
    keywords: ["health", "score", "liquidity", "debt", "ring"],
    group: "Priorities",
  },
  {
    id: "guard",
    label: "WealthGuard",
    href: "/app/wealthguard",
    keywords: ["guard", "scam", "offer", "investment check"],
    group: "Priorities",
  },
  {
    id: "funding",
    label: "Goal funding",
    href: "/app/plan/funding",
    keywords: ["funding", "contribution", "gap"],
    group: "Priorities",
  },
  {
    id: "networth",
    label: "Net worth detail",
    href: "/app/wealth/net-worth",
    keywords: ["net worth", "ngn", "usd", "gbp", "fx"],
    group: "My Wealth",
  },
  {
    id: "confidence",
    label: "Data confidence",
    href: "/app/wealth/confidence",
    keywords: ["confidence", "quality", "gaps"],
    group: "My Wealth",
  },
  {
    id: "property",
    label: "Property",
    href: "/app/property",
    keywords: ["property", "real estate", "house", "land"],
    group: "My Wealth",
  },
  {
    id: "pension",
    label: "Pension",
    href: "/app/pension",
    keywords: ["pension", "retirement", "rsa"],
    group: "My Wealth",
  },
  {
    id: "business",
    label: "Business",
    href: "/app/business",
    keywords: ["business", "company", "equity"],
    group: "My Wealth",
  },
  {
    id: "insurance",
    label: "Insurance",
    href: "/app/insurance",
    keywords: ["insurance", "protection", "cover"],
    group: "My Wealth",
  },
  {
    id: "cashflow",
    label: "Cash flow",
    href: "/app/cashflow",
    keywords: ["cashflow", "income", "spend"],
    group: "My Wealth",
  },
  {
    id: "household",
    label: "Household",
    href: "/app/household",
    keywords: ["household", "family", "spouse"],
    group: "My Wealth",
  },
  {
    id: "estate",
    label: "Estate readiness",
    href: "/app/estate",
    keywords: ["estate", "will", "legacy"],
    group: "My Wealth",
  },
  {
    id: "reports",
    label: "Monthly wealth report",
    href: "/app/reports",
    keywords: ["report", "monthly", "review", "snapshot"],
    group: "Cadence",
  },
  {
    id: "digest",
    label: "Weekly wealth digest",
    href: "/app/digest",
    keywords: ["digest", "weekly"],
    group: "Cadence",
  },
  {
    id: "products",
    label: "Product intelligence",
    href: "/app/products",
    keywords: ["products", "catalogue", "suitability"],
    group: "Cadence",
  },
  {
    id: "trust",
    label: "Trust Centre",
    href: "/app/trust",
    keywords: ["trust", "security overview"],
    group: "Trust & Security",
  },
  {
    id: "security",
    label: "Security & biometrics",
    href: "/app/security",
    keywords: ["security", "biometrics", "passkey", "face id", "touch id", "webauthn"],
    group: "Trust & Security",
  },
  {
    id: "consent",
    label: "Consent Centre",
    href: "/app/consent",
    keywords: ["consent", "permission", "ai"],
    group: "Trust & Security",
  },
  {
    id: "privacy",
    label: "Privacy Centre",
    href: "/app/privacy",
    keywords: ["privacy", "export", "erasure", "gdpr"],
    group: "Trust & Security",
  },
  {
    id: "connections",
    label: "Connections",
    href: "/app/connections",
    keywords: ["connections", "open banking", "link"],
    group: "Trust & Security",
  },
  {
    id: "documents",
    label: "Documents",
    href: "/app/documents",
    keywords: ["documents", "files", "pdf"],
    group: "Trust & Security",
  },
  {
    id: "memory",
    label: "AI Memory",
    href: "/app/memory",
    keywords: ["memory", "remember"],
    group: "Trust & Security",
  },
  {
    id: "settings",
    label: "Settings",
    href: "/app/settings",
    keywords: ["settings", "preferences"],
    group: "Trust & Security",
  },
  {
    id: "inbox",
    label: "Wealth Inbox",
    href: "/app/inbox",
    keywords: ["inbox", "messages"],
    group: "Communication",
  },
  {
    id: "notifications",
    label: "Notifications",
    href: "/app/notifications",
    keywords: ["notifications", "alerts"],
    group: "Communication",
  },
  {
    id: "adviser-collab",
    label: "Adviser collaboration",
    href: "/app/adviser-collab",
    keywords: ["adviser", "share", "collab"],
    group: "Communication",
  },
  {
    id: "adviser-request",
    label: "Request an adviser",
    href: "/app/adviser-request",
    keywords: ["request adviser", "human"],
    group: "Communication",
  },
  {
    id: "support",
    label: "Support & complaints",
    href: "/app/support",
    keywords: ["support", "complaint", "help"],
    group: "Communication",
  },
  {
    id: "profile",
    label: "Profile",
    href: "/app/profile",
    keywords: ["profile", "avatar", "identity"],
    group: "Settings",
  },
  {
    id: "scenarios",
    label: "Affordability scenarios",
    href: "/app/plan/scenarios",
    keywords: ["afford", "scenario", "car", "property buy"],
    group: "Plan",
  },
];

export function filterCommands(query: string, items: CommandItem[] = CUSTOMER_COMMANDS): CommandItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  const tokens = q.split(/\s+/).filter(Boolean);
  return items
    .map((item) => {
      const hay = `${item.label} ${item.group} ${item.keywords.join(" ")}`.toLowerCase();
      const score = tokens.reduce((acc, t) => (hay.includes(t) ? acc + 1 : acc), 0);
      return { item, score };
    })
    .filter((r) => r.score === tokens.length)
    .sort((a, b) => b.score - a.score || a.item.label.localeCompare(b.item.label))
    .map((r) => r.item);
}

/** Prefer WealthAI when the query looks like a natural question. */
export function resolveCommandIntent(query: string): { href: string; label: string } | null {
  const q = query.trim();
  if (!q) return null;
  const looksLikeQuestion =
    /\?$/.test(q) ||
    /^(what|how|can|should|why|when|where|who|is|are|do|does|will)\b/i.test(q) ||
    /review today/i.test(q);
  if (!looksLikeQuestion) return null;
  return {
    href: `/app/ai?q=${encodeURIComponent(q)}`,
    label: `Ask WealthAI: “${q.slice(0, 60)}${q.length > 60 ? "…" : ""}”`,
  };
}
