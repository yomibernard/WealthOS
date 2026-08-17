"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { startAuthentication } from "@simplewebauthn/browser";
import { Button, Field, Panel, TextInput } from "@/components/ui";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("yomi@demo.wealthos.ng");
  const [password, setPassword] = useState("WealthOSdemo1!");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/auth/sign-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "We could not sign you in. Please try again.");
      return;
    }
    if (data.role === "ADVISER") router.push("/adviser");
    else if (data.role === "ADMIN") router.push("/admin");
    else router.push("/app");
  }

  async function signInWithPasskey() {
    setLoading(true);
    setError(null);
    try {
      const optRes = await fetch("/api/auth/webauthn/authenticate/options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const options = await optRes.json();
      if (!optRes.ok) throw new Error(options.error || "No passkey for this account");
      const assertion = await startAuthentication({ optionsJSON: options });
      const verify = await fetch("/api/auth/webauthn/authenticate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, response: assertion }),
      });
      const data = await verify.json();
      if (!verify.ok) throw new Error(data.error || "Passkey sign-in failed");
      router.push("/app");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Passkey sign-in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page py-10">
      <p className="eyebrow">Welcome back</p>
      <h1 className="font-display mt-2 text-3xl">Sign in to WealthOS</h1>
      <Panel className="mt-6">
        <form className="space-y-4" onSubmit={onSubmit}>
          <Field label="Email" id="email">
            <TextInput
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Field>
          <Field label="Password" id="password">
            <TextInput
              id="password"
              type="password"
              autoComplete="current-password"
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
            {loading ? "Signing in…" : "Sign in"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            disabled={loading}
            onClick={() => void signInWithPasskey()}
          >
            Use Face ID / passkey
          </Button>
        </form>
      </Panel>
      <p className="muted mt-4 text-sm">
        New here?{" "}
        <Link href="/auth/sign-up" className="font-semibold text-accent">
          Create an account
        </Link>{" "}
        or try the{" "}
        <Link href="/wealth-check" className="font-semibold text-accent">
          Wealth Check
        </Link>
        . Biometric data stays on your device.
      </p>
    </main>
  );
}
