"use client";

import { FormEvent, Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button, InsightPanel, PageHeader } from "@/components/ui";
import { WealthAiAnswer, type AiRichCard } from "@/components/ai/WealthAiAnswer";

type Msg = {
  role: "user" | "assistant";
  content: string;
  agent?: string;
  confidence?: number;
  escalate?: boolean;
  assumptions?: string[];
  missingInformation?: string[];
  toolsUsed?: string[];
  cards?: AiRichCard[];
};

const SUGGESTIONS = [
  "What should I do with ₦5m?",
  "Can I afford another property?",
  "Am I ready to retire at 55?",
  "What changed this month?",
  "What is my biggest financial risk?",
];

function AiInner() {
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "I’m WealthAI — a private-wealth briefing, not a chatbot. I use your Wealth Graph and deterministic engines. I won’t invent balances, returns, or regulatory status.",
      agent: "ConciergeAI",
      cards: [
        {
          type: "cta",
          title: "Try a wealth question",
          body: "Ask about net worth, goals, affordability, or paste an investment offer for WealthGuard-style caution.",
          href: "/app/plan/scenarios",
          ctaLabel: "Open scenario modeller",
        },
        {
          type: "cta",
          title: "Check an offer first",
          body: "WealthGuard reviews claims without calling anything a scam or safe.",
          href: "/app/wealthguard",
          ctaLabel: "Open WealthGuard",
        },
      ],
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const seededFromQuery = useRef(false);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    const q = searchParams.get("q")?.trim();
    if (!q || seededFromQuery.current) return;
    seededFromQuery.current = true;
    setInput(q);
  }, [searchParams]);

  async function send(text: string) {
    if (!text.trim() || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: text }]);
    setLoading(true);
    const res = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text }),
    });
    const data = await res.json();
    setLoading(false);
    setMessages((m) => [
      ...m,
      {
        role: "assistant",
        content:
          data.content ??
          "I do not have enough verified information to answer this confidently. You can add the missing information or ask for an adviser review.",
        agent: data.agent,
        confidence: data.confidence,
        escalate: data.escalate,
        assumptions: data.assumptions,
        missingInformation: data.missingInformation,
        toolsUsed: data.toolsUsed,
        cards: data.cards,
      },
    ]);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void send(input);
  }

  return (
    <main className="ai-workspace">
      <header className="ai-workspace-header">
        <div>
          <PageHeader
            title="WealthAI"
            subtitle="Premium financial conversation — engines calculate, WealthAI explains."
          />
          <p className="ai-status" role="status">
            <span className="ai-status-dot" aria-hidden />
            Using your Wealth Graph
          </p>
        </div>
        <div className="ai-workspace-links">
          <Link href="/app/consent" className="text-sm font-semibold text-accent">
            Consent
          </Link>
          <Link href="/app/wealthguard" className="text-sm font-semibold text-accent">
            WealthGuard
          </Link>
        </div>
      </header>

      <div className="ai-workspace-grid">
        <aside className="ai-prompt-rail" aria-label="Suggested prompts">
          <p className="eyebrow">Suggested</p>
          <ul className="mt-3 space-y-2">
            {SUGGESTIONS.map((s) => (
              <li key={s}>
                <button
                  type="button"
                  className="ai-prompt-chip"
                  onClick={() => void send(s)}
                  disabled={loading}
                >
                  {s}
                </button>
              </li>
            ))}
          </ul>
          <InsightPanel className="mt-4" eyebrow="Grounding">
            Answers may embed goals, scenarios, recommendations, and data gaps — never invented
            balances.
          </InsightPanel>
        </aside>

        <section className="ai-thread" aria-live="polite">
          <div className="ai-thread-scroll">
            {messages.map((m, i) => (
              <div
                key={`${i}-${m.role}`}
                className={
                  m.role === "user"
                    ? "chat-bubble-user ml-4 p-3 text-sm leading-relaxed sm:ml-10"
                    : "chat-bubble-ai mr-2 p-3 text-sm leading-relaxed sm:mr-6"
                }
              >
                {m.role === "assistant" ? (
                  <WealthAiAnswer
                    content={m.content}
                    agent={m.agent}
                    confidence={m.confidence}
                    escalate={m.escalate}
                    assumptions={m.assumptions}
                    missingInformation={m.missingInformation}
                    toolsUsed={m.toolsUsed}
                    cards={m.cards}
                  />
                ) : (
                  <p className="whitespace-pre-wrap">{m.content}</p>
                )}
              </div>
            ))}
            {loading ? (
              <div className="chat-bubble-ai mr-2 space-y-2 p-3 sm:mr-6" aria-live="polite">
                <p className="eyebrow">WealthAI</p>
                <p className="muted text-sm">Reviewing your wealth position…</p>
                <div className="skeleton h-4 w-40" />
                <div className="skeleton h-4 w-64" />
                <p className="muted text-xs">Checking goals and allocation signals…</p>
              </div>
            ) : null}
            <div ref={endRef} />
          </div>

          <form onSubmit={onSubmit} className="ai-composer">
            <label htmlFor="ai-input" className="sr-only">
              Ask WealthAI
            </label>
            <input
              id="ai-input"
              className="min-h-12 flex-1 rounded-xl px-3"
              placeholder="Ask about net worth, goals, affordability, offers…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <Button type="submit" variant="accent" disabled={loading}>
              Send
            </Button>
          </form>
        </section>
      </div>
    </main>
  );
}

export default function AiPage() {
  return (
    <Suspense
      fallback={
        <main>
          <PageHeader title="WealthAI" subtitle="Loading conversation…" />
        </main>
      }
    >
      <AiInner />
    </Suspense>
  );
}
