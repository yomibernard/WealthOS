"use client";

import { useRef, useState } from "react";
import { clsx } from "clsx";

async function compressToDataUrl(file: File, maxPx = 512): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxPx / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.drawImage(bitmap, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", 0.82);
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function ProfileAvatarEditor({
  name,
  initialSrc,
  size = "lg",
}: {
  name: string;
  initialSrc?: string | null;
  size?: "sm" | "lg";
}) {
  const [src, setSrc] = useState<string | null>(initialSrc ?? null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);
  const dim = size === "lg" ? "h-24 w-24 text-2xl" : "h-12 w-12 text-sm";

  async function upload(file: File | null) {
    if (!file) return;
    setBusy(true);
    setMsg(null);
    try {
      const dataUrl = await compressToDataUrl(file);
      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setSrc(`${data.src}&t=${Date.now()}`);
      setMsg("Photo updated");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/profile/avatar", { method: "DELETE" });
    setBusy(false);
    if (res.ok) {
      setSrc(null);
      setMsg("Photo removed");
    } else {
      setMsg("Could not remove photo");
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div
        className={clsx(
          "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-line bg-accent-soft font-display font-semibold text-accent",
          dim,
        )}
        aria-label={src ? "Profile photo" : `Avatar initials ${initials(name)}`}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="" className="h-full w-full object-cover" />
        ) : (
          initials(name) || "?"
        )}
      </div>
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-soft text-sm"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
          >
            Upload photo
          </button>
          <button
            type="button"
            className="btn btn-ghost text-sm"
            disabled={busy}
            onClick={() => camRef.current?.click()}
          >
            Take photo
          </button>
          {src ? (
            <button type="button" className="btn btn-ghost text-sm" disabled={busy} onClick={() => void remove()}>
              Remove
            </button>
          ) : null}
        </div>
        <p className="muted text-xs leading-relaxed">
          Optional. Creates warmth on Home and Profile — not a social network. Stored privately for
          your account.
        </p>
        {msg ? (
          <p className="text-sm" role="status">
            {msg}
          </p>
        ) : null}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => void upload(e.target.files?.[0] ?? null)}
      />
      <input
        ref={camRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={(e) => void upload(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}

export function UserAvatar({
  name,
  src,
  className,
}: {
  name: string;
  src?: string | null;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-line bg-accent-soft text-sm font-display font-semibold text-accent",
        className,
      )}
      aria-hidden={!src}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        name
          .split(/\s+/)
          .filter(Boolean)
          .slice(0, 2)
          .map((p) => p[0]?.toUpperCase() ?? "")
          .join("") || "?"
      )}
    </div>
  );
}
