"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui";

export function ProductStatusControls({
  productId,
  status,
}: {
  productId: string;
  status: string;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function propose(approvalStatus: string) {
    setBusy(true);
    setMessage(null);
    const res = await fetch("/api/admin/change-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entityType: "Product",
        entityId: productId,
        action: "SET_APPROVAL_STATUS",
        payload: { approvalStatus },
        makerNote: `Propose ${approvalStatus} (current: ${status})`,
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (res.ok) {
      setMessage("Change request submitted — awaiting checker approval.");
      router.refresh();
    } else {
      setMessage(data.error ?? "Could not create change request.");
    }
  }

  return (
    <div className="mt-3 space-y-2">
      <div className="flex flex-wrap gap-2">
        {status !== "approved" ? (
          <Button
            type="button"
            variant="soft"
            disabled={busy}
            onClick={() => void propose("approved")}
          >
            Propose approve
          </Button>
        ) : null}
        {status !== "suspended" ? (
          <Button
            type="button"
            variant="ghost"
            disabled={busy}
            onClick={() => void propose("suspended")}
          >
            Propose suspend
          </Button>
        ) : null}
      </div>
      {message ? <p className="text-sm text-muted">{message}</p> : null}
    </div>
  );
}
