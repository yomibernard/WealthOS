"use client";

import { useState } from "react";
import Link from "next/link";
import { browserSupportsWebAuthn } from "@simplewebauthn/browser";

export function BiometricPromptBanner({ hasPasskey }: { hasPasskey: boolean }) {
  const [dismissed, setDismissed] = useState(false);
  if (hasPasskey || dismissed) return null;
  if (typeof window !== "undefined" && !browserSupportsWebAuthn()) return null;

  return (
    <aside className="dash-bio-banner mt-3" role="region" aria-label="Secure with biometrics">
      <div className="min-w-0">
        <p className="text-sm font-semibold">Optional · Secure with biometrics</p>
        <p className="muted mt-0.5 text-sm leading-relaxed">
          Face ID, fingerprint, or passkeys — biometric data stays on your device.
        </p>
      </div>
      <div className="flex flex-wrap gap-2 shrink-0">
        <Link href="/app/security" className="btn btn-ghost text-sm">
          Enable
        </Link>
        <button type="button" className="btn btn-ghost text-sm" onClick={() => setDismissed(true)}>
          Not now
        </button>
      </div>
    </aside>
  );
}
