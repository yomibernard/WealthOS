/**
 * Optional grounded LLM polish layer.
 * Never invents numbers — only rephrases facts produced by deterministic engines.
 * Activate with OPENAI_API_KEY; otherwise the orchestrator draft is returned as-is.
 */

export type GroundedDraft = {
  facts: string[];
  draft: string;
  intent: string;
  agent: string;
  missingInformation: string[];
  assumptions: string[];
};

export async function polishGroundedAnswer(input: GroundedDraft): Promise<string | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;

  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  const system = [
    "You are WealthAI's explanation layer for a Nigerian wealth operating system.",
    "You may ONLY rephrase the provided draft and facts.",
    "Do not invent balances, returns, fees, regulatory status, or products.",
    "If information is missing, say so plainly.",
    "Keep a calm, premium, plain-English tone. No yield hype.",
    "Preserve all numbers exactly as given.",
  ].join(" ");

  const user = JSON.stringify({
    intent: input.intent,
    agent: input.agent,
    facts: input.facts,
    draft: input.draft,
    missingInformation: input.missingInformation,
    assumptions: input.assumptions,
  });

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });

    if (!res.ok) return null;
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) return null;

    // Guard: reject responses that invent percentage claims not in the draft/facts
    const source = `${input.draft}\n${input.facts.join("\n")}`;
    const inventedPct = [...text.matchAll(/(\d+(?:\.\d+)?)%/g)].some((m) => !source.includes(m[0]));
    if (inventedPct) return null;

    return text;
  } catch {
    return null;
  }
}
