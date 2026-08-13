"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button, Field, Panel, TextInput } from "@/components/ui";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/auth/sign-up", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "We could not create your account right now.");
      return;
    }
    router.push("/onboarding/consent");
  }

  return (
    <main className="page py-10">
      <p className="eyebrow">Create account</p>
      <h1 className="font-display mt-2 text-3xl">Join WealthOS</h1>
      <Panel className="mt-6">
        <form className="space-y-4" onSubmit={onSubmit}>
          <Field label="Full name" id="name">
            <TextInput id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </Field>
          <Field label="Email" id="email">
            <TextInput
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Field>
          <Field label="Password" id="password" hint="At least 8 characters.">
            <TextInput
              id="password"
              type="password"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Field>
          {error ? (
            <p className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger" role="alert">
              {error}
            </p>
          ) : null}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating…" : "Create account"}
          </Button>
        </form>
      </Panel>
      <p className="muted mt-4 text-sm">
        Already have an account?{" "}
        <Link href="/auth/sign-in" className="font-semibold text-accent">
          Sign in
        </Link>
      </p>
    </main>
  );
}
