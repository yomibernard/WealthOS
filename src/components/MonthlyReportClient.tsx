"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui";

export function GenerateMonthlyReportButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onGenerate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/reports/monthly", { method: "POST" });
      const data = (await res.json()) as {
        error?: string;
        skipped?: boolean;
        reason?: string;
        snapshotId?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "Could not generate report.");
        return;
      }
      if (data.skipped) {
        setError(data.reason ?? "Report skipped by your notification preferences.");
        return;
      }
      router.refresh();
      if (data.snapshotId) {
        router.push(`/app/reports/${data.snapshotId}`);
      }
    } catch {
      setError("Network error — try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button type="button" onClick={onGenerate} disabled={loading}>
        {loading ? "Generating…" : "Generate this month’s report"}
      </Button>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </div>
  );
}

export function ReportHistoryLink({ id, label }: { id: string; label: string }) {
  return (
    <Link
      href={`/app/reports/${id}`}
      className="font-medium text-accent underline-offset-2 hover:underline"
    >
      {label}
    </Link>
  );
}
