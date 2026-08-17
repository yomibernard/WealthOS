"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button, Field, Panel, ProgressBar, TextInput } from "@/components/ui";

const STEPS = [
  { key: "name", label: "Full name", type: "text", hint: "How we should greet you." },
  { key: "email", label: "Email", type: "email", hint: "Used for sign-in and important notices." },
  {
    key: "password",
    label: "Password",
    type: "password",
    hint: "At least 8 characters.",
    minLength: 8,
  },
] as const;

export default function SignUpPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const current = STEPS[step];
  const progress = Math.round(((step + 1) / STEPS.length) * 100);

  function valueForStep() {
    if (current.key === "name") return name;
    if (current.key === "email") return email;
    return password;
  }

  function setValueForStep(v: string) {
    if (current.key === "name") setName(v);
    else if (current.key === "email") setEmail(v);
    else setPassword(v);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const value = valueForStep().trim();
    if (!value) {
      setError("Please complete this step to continue.");
      return;
    }
    if (current.key === "password" && value.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
      return;
    }

    setLoading(true);
    const res = await fetch("/api/auth/sign-up", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
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
      <p className="muted mt-2 text-sm">Name → Email → Password → Continue to consent</p>
      <div className="mt-4">
        <ProgressBar value={progress} label={`Step ${step + 1} of ${STEPS.length}`} />
      </div>
      <Panel className="mt-6">
        <form className="space-y-4" onSubmit={(e) => void onSubmit(e)}>
          <Field label={current.label} id={current.key} hint={current.hint}>
            <TextInput
              id={current.key}
              type={current.type}
              autoComplete={
                current.key === "name" ? "name" : current.key === "email" ? "email" : "new-password"
              }
              minLength={"minLength" in current ? current.minLength : undefined}
              value={valueForStep()}
              onChange={(e) => setValueForStep(e.target.value)}
              required
            />
          </Field>
          {error ? (
            <p className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger" role="alert">
              {error}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            {step > 0 ? (
              <Button
                type="button"
                variant="ghost"
                disabled={loading}
                onClick={() => {
                  setError(null);
                  setStep((s) => s - 1);
                }}
              >
                Back
              </Button>
            ) : null}
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading
                ? "Creating…"
                : step < STEPS.length - 1
                  ? "Continue"
                  : "Continue to consent"}
            </Button>
          </div>
        </form>
      </Panel>
      <p className="muted mt-4 text-sm leading-relaxed">
        By continuing you create an account so WealthOS can store your profile securely. Consent and
        personalisation come next — diagnosis before products.
      </p>
      <p className="muted mt-3 text-sm">
        Already have an account?{" "}
        <Link href="/auth/sign-in" className="font-semibold text-accent">
          Sign in
        </Link>
      </p>
    </main>
  );
}
