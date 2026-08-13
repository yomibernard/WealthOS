"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui";

export function GenerateWeeklyDigestButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onGenerate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/digest/weekly", { method: "POST" });
      const data = (await res.json()) as {
        error?: string;
        skipped?: boolean;
        reason?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "Could not generate digest.");
        return;
      }
      if (data.skipped) {
        setError(data.reason ?? "Digest skipped by notification preferences.");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error — try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button type="button" onClick={onGenerate} disabled={loading}>
        {loading ? "Generating…" : "Generate this week’s digest"}
      </Button>
      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
