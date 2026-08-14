/**
 * Post-deploy smoke against a hosted WealthOS URL (Vercel pilot, etc.).
 *
 *   SMOKE_BASE_URL=https://your-app.vercel.app npm run smoke:hosted
 *
 * Optional:
 *   SMOKE_STRICT=1          treat launch/demo warns as failures
 *   SMOKE_SKIP_AUTH=1       skip demo sign-in (no seed on host)
 *   SMOKE_EMAIL / SMOKE_PASSWORD  override demo credentials
 */
// Rules mirrored from src/lib/hosted-smoke.ts (unit-tested there).
function evaluateHostedHealth(health, opts = {}) {
  const requirePostgres = opts.requirePostgres ?? true;
  const findings = [];
  findings.push({
    id: "health_status",
    ok: health.status === "ok",
    severity: "blocker",
    message:
      health.status === "ok"
        ? "Health status is ok."
        : `Health status is ${health.status ?? "missing"} (need ok with reachable DB).`,
  });
  findings.push({
    id: "database_ok",
    ok: Boolean(health.database?.ok),
    severity: "blocker",
    message: health.database?.ok
      ? "Database probe succeeded."
      : `Database probe failed${health.database?.error ? `: ${health.database.error}` : "."}`,
  });
  const kind = health.config?.databaseKind ?? "other";
  findings.push({
    id: "database_kind",
    ok: requirePostgres ? kind === "postgres" : kind !== "sqlite",
    severity: "blocker",
    message:
      kind === "postgres"
        ? "DATABASE_URL looks like Postgres."
        : `DATABASE_URL kind is ${kind} — hosted pilot expects Postgres.`,
  });
  const demoMode = Boolean(health.config?.demoMode);
  findings.push({
    id: "demo_mode_off",
    ok: !demoMode,
    severity: "warn",
    message: demoMode
      ? "DEMO_MODE is on — turn off for shared pilot URLs."
      : "DEMO_MODE is off.",
  });
  const blockers = health.launch?.blockers ?? [];
  findings.push({
    id: "launch_blockers",
    ok: blockers.length === 0,
    severity: "warn",
    message:
      blockers.length === 0
        ? "Launch gate reports no blockers."
        : `Launch blockers: ${blockers.join(", ")}.`,
  });
  return findings;
}

function smokePassed(findings, strict = false) {
  return findings.every((f) => f.ok || (!strict && f.severity === "warn"));
}

const base = (process.env.SMOKE_BASE_URL || process.env.BASE_URL || "").replace(/\/$/, "");
const strict = ["1", "true", "yes", "on"].includes((process.env.SMOKE_STRICT ?? "").toLowerCase());
const skipAuth = ["1", "true", "yes", "on"].includes((process.env.SMOKE_SKIP_AUTH ?? "").toLowerCase());
const email = process.env.SMOKE_EMAIL || "yomi@demo.wealthos.ng";
const password = process.env.SMOKE_PASSWORD || "WealthOSdemo1!";

const publicPaths = ["/", "/demo", "/auth/sign-in", "/api/health"];
const appPaths = [
  "/app",
  "/app/privacy",
  "/app/support",
  "/app/digest",
  "/app/ai",
  "/app/inbox",
  "/app/inbox?status=unread",
  "/app/notifications",
  "/app/notifications?read=unread",
  "/app/notifications?kind=care_update",
  "/app/notifications?kind=cadence",
  "/api/care-updates",
  "/api/care-updates?list=1",
  "/api/notifications",
  "/api/inbox",
];

if (!base) {
  console.error("Set SMOKE_BASE_URL to your hosted origin, e.g.");
  console.error("  SMOKE_BASE_URL=https://your-app.vercel.app npm run smoke:hosted");
  process.exit(2);
}

if (/localhost|127\.0\.0\.1/i.test(base) && !process.env.SMOKE_ALLOW_LOCAL) {
  console.error("Refusing localhost for hosted smoke. Use `npm run smoke` for local,");
  console.error("or set SMOKE_ALLOW_LOCAL=1 to override.");
  process.exit(2);
}

const failures = [];

console.log(`WealthOS hosted smoke → ${base}${strict ? " (strict)" : ""}`);

async function get(path) {
  return fetch(`${base}${path}`, { redirect: "manual" });
}

try {
  for (const path of publicPaths) {
    const res = await get(path);
    const ok = res.status >= 200 && res.status < 400;
    console.log(`  [${ok ? "OK" : "FAIL"}] GET ${path} → ${res.status}`);
    if (!ok) failures.push(`${path} status ${res.status}`);
  }

  const healthRes = await get("/api/health");
  const health = await healthRes.json().catch(() => ({}));
  const findings = evaluateHostedHealth(health, { requirePostgres: true });
  for (const f of findings) {
    const mark = f.ok ? "OK" : f.severity === "warn" && !strict ? "WARN" : "FAIL";
    console.log(`  [${mark}] ${f.id}: ${f.message}`);
    if (!f.ok && (f.severity === "blocker" || strict)) failures.push(f.message);
  }
  if (!smokePassed(findings, strict) && failures.length === 0) {
    failures.push("hosted health evaluation failed");
  }

  if (!skipAuth) {
    const loginRes = await fetch(`${base}/api/auth/sign-in`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const setCookie = loginRes.headers.getSetCookie?.() ?? [];
    const cookie = setCookie.map((c) => c.split(";")[0]).join("; ");
    if (!loginRes.ok) {
      console.log(`  [WARN] sign-in skipped paths — ${loginRes.status} (seed missing? use SMOKE_SKIP_AUTH=1)`);
      if (strict) failures.push(`sign-in failed: ${loginRes.status}`);
    } else {
      console.log("  [OK] sign-in");
      for (const path of appPaths) {
        const res = await fetch(`${base}${path}`, {
          headers: cookie ? { cookie } : {},
          redirect: "manual",
        });
        const ok = res.status === 200 || res.status === 307 || res.status === 308;
        console.log(`  [${ok ? "OK" : "FAIL"}] GET ${path} → ${res.status}`);
        if (!ok) failures.push(`${path} status ${res.status}`);
      }

      const adviserEmail = process.env.SMOKE_ADVISER_EMAIL || "adviser@demo.wealthos.ng";
      const adminEmail = process.env.SMOKE_ADMIN_EMAIL || "admin@demo.wealthos.ng";
      for (const [label, roleEmail, paths] of [
        ["adviser", adviserEmail, [
          "/adviser",
          "/adviser?care=awaiting",
          "/adviser/notifications",
          "/adviser/notifications?read=unread",
          "/adviser/notifications?kind=care_receipt",
          "/api/notifications",
        ]],
        ["admin", adminEmail, ["/admin/ops"]],
      ]) {
        const roleLogin = await fetch(`${base}/api/auth/sign-in`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: roleEmail, password }),
        });
        if (!roleLogin.ok) {
          console.log(`  [WARN] ${label} sign-in skipped — ${roleLogin.status}`);
          if (strict) failures.push(`${label} sign-in failed: ${roleLogin.status}`);
          continue;
        }
        const roleCookies = roleLogin.headers.getSetCookie?.() ?? [];
        const roleCookie = roleCookies.map((c) => c.split(";")[0]).join("; ");
        console.log(`  [OK] sign-in ${label}`);
        for (const path of paths) {
          const res = await fetch(`${base}${path}`, {
            headers: roleCookie ? { cookie: roleCookie } : {},
            redirect: "manual",
          });
          const ok = res.status === 200 || res.status === 307 || res.status === 308;
          console.log(`  [${ok ? "OK" : "FAIL"}] GET ${path} → ${res.status}`);
          if (!ok) failures.push(`${path} status ${res.status}`);
        }
      }
    }
  } else {
    console.log("  [OK] auth checks skipped (SMOKE_SKIP_AUTH)");
  }
} catch (err) {
  console.error("\nHosted smoke could not reach the deployment.");
  console.error(err instanceof Error ? err.message : err);
  process.exit(2);
}

if (failures.length) {
  console.error("\nHosted smoke FAILED:");
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

console.log("\nHosted smoke passed.");
