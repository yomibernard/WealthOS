"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Button, PageHeader } from "@/components/ui";

type Msg = {
  role: "user" | "assistant";
  content: string;
  agent?: string;
  confidence?: number;
  escalate?: boolean;
};

const SUGGESTIONS = [
  "What am I worth?",
  "Am I financially healthy?",
  "Should I repay debt or invest?",
  "What are my top three priorities?",
  "Is this investment appropriate? 40% guaranteed monthly WhatsApp offer from Horizon Yield",
];

export default function AiPage() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "I’m WealthAI. I use your Wealth Graph and deterministic engines — I won’t invent balances, returns or regulatory status. What would you like to understand?",
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
      },
    ]);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void send(input);
  }

  return (
    <main className="flex min-h-[75dvh] flex-col">
      <PageHeader title="WealthAI" subtitle="One interface. Specialist agents behind the scenes." />
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
                {m.escalate ? " · Escalation available" : ""}
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
        <form onSubmit={onSubmit} className="flex gap-2 rounded-2xl border border-line bg-white p-2 shadow-sm">
          <label htmlFor="ai-input" className="sr-only">
            Ask WealthAI
          </label>
          <input
            id="ai-input"
            className="min-h-12 flex-1 rounded-xl px-3"
            placeholder="Ask about net worth, goals, risk, offers…"
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
