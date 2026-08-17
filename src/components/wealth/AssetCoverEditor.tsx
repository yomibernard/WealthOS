"use client";

import { useRef, useState } from "react";

async function compressToDataUrl(file: File, maxPx = 960): Promise<string> {
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
  return canvas.toDataURL("image/jpeg", 0.8);
}

export function AssetCoverEditor({
  assetId,
  initialSrc,
  label = "Add property photo",
}: {
  assetId: string;
  initialSrc?: string | null;
  label?: string;
}) {
  const [src, setSrc] = useState<string | null>(initialSrc ?? null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const ref = useRef<HTMLInputElement>(null);

  async function upload(file: File | null) {
    if (!file) return;
    setBusy(true);
    setMsg(null);
    try {
      const dataUrl = await compressToDataUrl(file);
      const res = await fetch(`/api/assets/${assetId}/cover`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setSrc(`${data.src}&t=${Date.now()}`);
      setMsg("Cover photo saved");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3">
      {src ? (
        <div className="overflow-hidden rounded-[var(--radius-sm)] border border-line">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="" className="h-36 w-full object-cover" />
        </div>
      ) : null}
      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          className="btn btn-ghost text-sm"
          disabled={busy}
          onClick={() => ref.current?.click()}
        >
          {src ? "Replace photo" : label}
        </button>
        {src ? (
          <button
            type="button"
            className="btn btn-ghost text-sm"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              await fetch(`/api/assets/${assetId}/cover`, { method: "DELETE" });
              setSrc(null);
              setBusy(false);
            }}
          >
            Remove
          </button>
        ) : null}
      </div>
      {msg ? <p className="muted mt-1 text-xs">{msg}</p> : null}
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => void upload(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}
