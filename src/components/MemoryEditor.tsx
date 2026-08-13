"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, TextInput } from "@/components/ui";

export function MemoryEditor({ memoryId, content }: { memoryId: string; content: string }) {
  const router = useRouter();
  const [value, setValue] = useState(content);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    await fetch(`/api/memory/${memoryId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: value }),
    });
    setBusy(false);
    setEditing(false);
    router.refresh();
  }

  async function remove() {
    setBusy(true);
    await fetch(`/api/memory/${memoryId}`, { method: "DELETE" });
    setBusy(false);
    router.refresh();
  }

  if (!editing) {
    return (
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" variant="ghost" onClick={() => setEditing(true)}>
          Correct
        </Button>
        <Button type="button" variant="ghost" onClick={() => void remove()} disabled={busy}>
          Remove
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-2">
      <label htmlFor={`mem-${memoryId}`} className="sr-only">
        Correct remembered fact
      </label>
      <TextInput
        id={`mem-${memoryId}`}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="accent" onClick={() => void save()} disabled={busy}>
          Save correction
        </Button>
        <Button type="button" variant="ghost" onClick={() => setEditing(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
