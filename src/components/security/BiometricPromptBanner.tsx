"use client";

import { useState } from "react";
import Link from "next/link";
import { browserSupportsWebAuthn } from "@simplewebauthn/browser";

export function BiometricPromptBanner({ hasPasskey }: { hasPasskey: boolean }) {
  const [dismissed, setDismissed] = useState(false);
  if (hasPasskey || dismissed) return null;
  if (typeof window !== "undefined" && !browserSupportsWebAuthn()) return null;

  return (
    <aside className="insight-panel mt-3" role="region" aria-label="Secure with biometrics">
      <p className="eyebrow">Optional</p>
      <p className="font-semibold">Secure WealthOS with biometrics</p>
      <p className="muted mt-1 text-sm leading-relaxed">
        Use Face ID, fingerprint or device passkeys for faster, safer access. Biometric data stays
        on your device.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link href="/app/security" className="btn btn-accent text-sm">
          Enable biometrics
        </Link>
        <button type="button" className="btn btn-ghost text-sm" onClick={() => setDismissed(true)}>
          Not now
        </button>
      </div>
    </aside>
  );
}
