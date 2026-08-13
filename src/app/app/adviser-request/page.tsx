"use client";

import { FormEvent, useState } from "react";
import { Button, Field, PageHeader, Panel, TextInput } from "@/components/ui";

export default function AdviserRequestPage() {
  const [reason, setReason] = useState("");
  const [done, setDone] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    await fetch("/api/escalations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason, level: "L3_ADVISER" }),
    });
    setDone(true);
  }

  return (
    <main>
      <PageHeader
        title="Request an adviser"
        subtitle="Level 3 escalation to a regulated financial adviser with packaged context."
      />
      <Panel>
        {done ? (
          <p>
            Request received. An adviser will see your Wealth Graph summary, goals and recent AI
            conversations.
          </p>
        ) : (
          <form className="space-y-4" onSubmit={onSubmit}>
            <Field label="What would you like help with?" id="reason">
              <TextInput
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />
            </Field>
            <Button type="submit" variant="accent" className="w-full">
              Request human review
            </Button>
          </form>
        )}
      </Panel>
    </main>
  );
}
