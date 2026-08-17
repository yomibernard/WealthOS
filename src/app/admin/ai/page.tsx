"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button, InsightPanel, PageHeader } from "@/components/ui";

type Msg = {
  role: "user" | "assistant";
  content: string;
  agent?: string;
  confidence?: number;
};

const SUGGESTIONS = [
  "What should I do next for ops?",
  "What needs my attention on the daily board?",
  "Show ops next steps",
];

export default function AdminAiPage() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "I’m WealthAI for ops. I ground on the daily board next-steps pulse — I won’t invent case detail or customer balances. Ask what to do next for ops.",
      agent: "ConciergeAI",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    if (!text.trim() || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: text }]);
    setLoading(true);
    const res = await fetch("/api/admin/ai", {
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
          "I could not answer confidently. Open /admin/ops or try again.",
        agent: data.agent,
        confidence: data.confidence,
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
        title="WealthAI (ops)"
        subtitle="Queue-first next steps for ops — same ranking as Needs your attention."
        action={
          <Link href="/admin/ops" className="btn btn-soft">
            Ops board
          </Link>
        }
      />
      <InsightPanel eyebrow="Grounding">
        Answers stay on the daily board pulse. Ops queues remain authoritative — AI never closes
        cases.
      </InsightPanel>
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
            {m.role === "assistant" && m.agent ? (
              <p className="eyebrow mb-2">{m.agent}</p>
            ) : null}
            <p className="whitespace-pre-wrap">{m.content}</p>
            {m.confidence != null ? (
              <p className="mt-2 text-xs opacity-80">
                Confidence {Math.round(m.confidence * 100)}%
              </p>
            ) : null}
          </div>
        ))}
        {loading ? (
          <div className="chat-bubble-ai mr-6 p-3">
            <div className="skeleton h-4 w-40" />
            <div className="skeleton mt-2 h-4 w-64" />
          </div>
        ) : null}
        <div ref={endRef} />
      </div>

      <div className="fixed bottom-4 left-1/2 w-[min(720px,100%)] -translate-x-1/2 px-3">
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
        <form onSubmit={onSubmit} className="flex gap-2 rounded-2xl border border-line bg-white p-2 shadow-sm">
          <label htmlFor="admin-ai-input" className="sr-only">
            Ask WealthAI about ops
          </label>
          <input
            id="admin-ai-input"
            className="min-h-12 flex-1 rounded-xl px-3"
            placeholder="What should I do next for ops?"
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
