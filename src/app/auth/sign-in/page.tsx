"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { startAuthentication } from "@simplewebauthn/browser";
import { Button, Field, Panel, TextInput } from "@/components/ui";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim(),
        }),
      });

      let data: { error?: string; role?: string } = {};
      try {
        data = (await res.json()) as { error?: string; role?: string };
      } catch {
        throw new Error("Sign-in response was invalid. Please refresh and try again.");
      }

      if (!res.ok) {
        setError(data.error ?? "We could not sign you in. Please try again.");
        return;
      }

      // Hard navigation avoids a stuck client router after a corrupted Next.js cache.
      if (data.role === "ADVISER") window.location.assign("/adviser");
      else if (data.role === "ADMIN") window.location.assign("/admin");
      else window.location.assign("/app");
    } catch (err) {
      setError(err instanceof Error ? err.message : "We could not sign you in. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function signInWithPasskey() {
    setLoading(true);
    setError(null);
    try {
      const optRes = await fetch("/api/auth/webauthn/authenticate/options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const options = await optRes.json();
      if (!optRes.ok) throw new Error(options.error || "No passkey for this account");
      const assertion = await startAuthentication({ optionsJSON: options });
      const verify = await fetch("/api/auth/webauthn/authenticate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), response: assertion }),
      });
      const data = await verify.json();
      if (!verify.ok) throw new Error(data.error || "Passkey sign-in failed");
      window.location.assign("/app");
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
        <form className="space-y-4" onSubmit={(e) => void onSubmit(e)}>
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
          <p className="text-sm">
            <Link href="/app/support" className="font-semibold text-accent">
              Forgot password?
            </Link>
            <span className="muted"> — self-serve reset is not live yet; Support can help recover access.</span>
          </p>
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

      <details
        className="mt-4 rounded-xl border border-line bg-white/70 px-3 py-2 text-sm"
        open={showDemo}
        onToggle={(e) => setShowDemo((e.target as HTMLDetailsElement).open)}
      >
        <summary className="cursor-pointer font-semibold text-ink">Use demo account</summary>
        <div className="mt-2 pb-1">
          <p className="muted">
            Email: <code className="text-ink">yomi@demo.wealthos.ng</code>
          </p>
          <p className="muted mt-1">
            Password: <code className="text-ink">WealthOSdemo1!</code>
          </p>
          <button
            type="button"
            className="mt-2 text-sm font-semibold text-accent underline-offset-2 hover:underline"
            onClick={() => {
              setEmail("yomi@demo.wealthos.ng");
              setPassword("WealthOSdemo1!");
              setError(null);
            }}
          >
            Fill demo credentials
          </button>
        </div>
      </details>

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
