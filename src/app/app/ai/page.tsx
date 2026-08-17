"use client";

import { FormEvent, Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button, PageHeader } from "@/components/ui";
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
  "What should I do next?",
  "Can I afford another property around ₦70m?",
  "How does retiring at 55 look?",
  "Is this investment appropriate? 40% guaranteed monthly WhatsApp offer from Horizon Yield",
];

function AiInner() {
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "I’m WealthAI — more private-bank briefing than chatbot. I use your Wealth Graph and deterministic engines. I won’t invent balances, returns or regulatory status.",
      agent: "ConciergeAI",
      cards: [
        {
          type: "cta",
          title: "Try a wealth question",
          body: "Ask about net worth, goals, affordability, or paste an investment offer.",
          href: "/app/plan/scenarios",
          ctaLabel: "Open affordability simulator",
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
    <main className="flex min-h-[75dvh] flex-col">
      <PageHeader
        title="WealthAI"
        subtitle="Intelligent private wealth conversation — engines calculate, I explain."
      />
      <div className="flex flex-1 flex-col gap-3 pb-28">
        {messages.map((m, i) => (
          <div
            key={`${i}-${m.role}`}
            className={
              m.role === "user"
                ? "chat-bubble-user ml-8 p-3 text-sm leading-relaxed"
                : "chat-bubble-ai mr-6 p-3 text-sm leading-relaxed"
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
          <div className="chat-bubble-ai mr-6 space-y-2 p-3" aria-live="polite">
            <p className="eyebrow">WealthAI</p>
            <p className="muted text-sm">Reviewing your wealth position…</p>
            <div className="skeleton h-4 w-40" />
            <div className="skeleton h-4 w-64" />
            <p className="muted text-xs">Checking goals and allocation signals…</p>
          </div>
        ) : null}
        <div ref={endRef} />
      </div>

      <div className="fixed bottom-[4.5rem] left-1/2 w-[min(720px,100%)] -translate-x-1/2 px-3">
        <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              className="whitespace-nowrap rounded-full border border-line bg-white px-3 py-2 text-xs font-semibold"
              onClick={() => void send(s)}
            >
              {s}
            </button>
          ))}
        </div>
        <form
          onSubmit={onSubmit}
          className="flex gap-2 rounded-2xl border border-line bg-white p-2 shadow-sm"
        >
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
