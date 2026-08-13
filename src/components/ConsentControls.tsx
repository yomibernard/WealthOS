"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";

export function ConsentControls({
  consentId,
  status,
}: {
  consentId: string;
  status: string;
}) {
  const router = useRouter();

  async function update(next: "ACTIVE" | "PAUSED" | "REVOKED") {
    await fetch(`/api/consent/${consentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    router.refresh();
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {status !== "ACTIVE" ? (
        <Button type="button" variant="soft" onClick={() => void update("ACTIVE")}>
          Reconnect
        </Button>
      ) : (
        <Button type="button" variant="ghost" onClick={() => void update("PAUSED")}>
          Pause
        </Button>
      )}
      {status !== "REVOKED" ? (
        <Button type="button" variant="ghost" onClick={() => void update("REVOKED")}>
          Revoke
        </Button>
      ) : null}
    </div>
  );
}
