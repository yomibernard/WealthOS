"use client";

import { useCallback, useEffect, useState } from "react";
import {
  startAuthentication,
  startRegistration,
  browserSupportsWebAuthn,
} from "@simplewebauthn/browser";

type Cred = {
  id: string;
  label: string | null;
  deviceType: string | null;
  backedUp: boolean;
  createdAt: string;
  lastUsedAt: string | null;
};

type EventRow = {
  id: string;
  kind: string;
  detail: string | null;
  createdAt: string;
};

export function SecurityBiometricsPanel() {
  const supported = typeof window !== "undefined" && browserSupportsWebAuthn();
  const [credentials, setCredentials] = useState<Cred[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/auth/webauthn/credentials");
    if (!res.ok) return;
    const data = await res.json();
    setCredentials(data.credentials ?? []);
    setEvents(data.events ?? []);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function registerPasskey() {
    setBusy(true);
    setMsg(null);
    try {
      const optRes = await fetch("/api/auth/webauthn/register");
      const options = await optRes.json();
      if (!optRes.ok) throw new Error(options.error || "Could not start");
      const attestation = await startRegistration({ optionsJSON: options });
      const verify = await fetch("/api/auth/webauthn/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response: attestation, label: "This device" }),
      });
      const data = await verify.json();
      if (!verify.ok) throw new Error(data.error || "Verification failed");
      setMsg("Passkey enabled on this device.");
      await refresh();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Could not enable biometrics");
    } finally {
      setBusy(false);
    }
  }

  async function testUnlock() {
    setBusy(true);
    setMsg(null);
    try {
      const optRes = await fetch("/api/auth/webauthn/authenticate");
      const options = await optRes.json();
      if (!optRes.ok) throw new Error(options.error || "No passkey");
      const assertion = await startAuthentication({ optionsJSON: options });
      const verify = await fetch("/api/auth/webauthn/authenticate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response: assertion }),
      });
      const data = await verify.json();
      if (!verify.ok) throw new Error(data.error || "Failed");
      setMsg("Biometric confirmation succeeded. Your biometric data stayed on this device.");
      await refresh();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Confirmation failed");
    } finally {
      setBusy(false);
    }
  }

  async function removeCred(id: string) {
    setBusy(true);
    await fetch(`/api/auth/webauthn/credentials?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    await refresh();
    setBusy(false);
    setMsg("Passkey removed from WealthOS (device may still keep a local copy).");
  }

  return (
    <section className="action-card space-y-4">
      <div>
        <p className="eyebrow">Security & biometrics</p>
        <h2 className="font-display mt-1 text-xl font-semibold tracking-tight">
          Face ID, Touch ID & passkeys
        </h2>
        <p className="muted mt-2 text-sm leading-relaxed">
          Your biometric data remains on your device. WealthOS only receives confirmation that
          authentication succeeded — we never store fingerprints or face templates. Enable only when
          you want faster unlock.
        </p>
      </div>

      {!supported ? (
        <p className="text-sm text-warning" role="status">
          This browser or device does not expose WebAuthn. Try a modern mobile browser, Safari, or
          Windows Hello–capable Edge/Chrome.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-accent"
            disabled={busy}
            onClick={() => void registerPasskey()}
          >
            Enable biometrics / passkey
          </button>
          {credentials.length ? (
            <button
              type="button"
              className="btn btn-ghost"
              disabled={busy}
              onClick={() => void testUnlock()}
            >
              Confirm with biometrics
            </button>
          ) : null}
        </div>
      )}

      {msg ? (
        <p className="text-sm" role="status">
          {msg}
        </p>
      ) : null}

      <div>
        <p className="eyebrow">Trusted passkeys</p>
        {credentials.length ? (
          <ul className="mt-2 divide-y divide-line">
            {credentials.map((c) => (
              <li key={c.id} className="flex items-start justify-between gap-3 py-3 text-sm">
                <div>
                  <p className="font-semibold">{c.label || "Passkey"}</p>
                  <p className="muted text-xs">
                    {c.deviceType ?? "platform"} · added{" "}
                    {new Date(c.createdAt).toLocaleDateString("en-GB")}
                    {c.lastUsedAt
                      ? ` · last used ${new Date(c.lastUsedAt).toLocaleDateString("en-GB")}`
                      : ""}
                  </p>
                </div>
                <button
                  type="button"
                  className="text-sm font-semibold text-danger"
                  disabled={busy}
                  onClick={() => void removeCred(c.id)}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted mt-2 text-sm">No passkeys yet — enable when you are ready. Never forced.</p>
        )}
      </div>

      <div>
        <p className="eyebrow">Recent security events</p>
        {events.length ? (
          <ul className="mt-2 space-y-2 text-sm">
            {events.map((e) => (
              <li key={e.id} className="flex justify-between gap-3 border-b border-line/70 py-2">
                <span>
                  {e.kind.replaceAll("_", " ")}
                  {e.detail ? ` · ${e.detail}` : ""}
                </span>
                <span className="muted shrink-0 text-xs">
                  {new Date(e.createdAt).toLocaleString("en-GB")}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted mt-2 text-sm">Events appear when you register or use a passkey.</p>
        )}
      </div>
    </section>
  );
}
