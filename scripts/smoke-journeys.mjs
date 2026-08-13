/**
 * HTTP smoke journeys against a running WealthOS server.
 *
 *   npm run dev   # separate terminal
 *   npm run smoke
 *
 * Optional: SMOKE_BASE_URL=http://localhost:3000
 */
const base = (process.env.SMOKE_BASE_URL || "http://localhost:3000").replace(/\/$/, "");

const publicPaths = ["/", "/demo", "/wealth-check", "/auth/sign-in", "/api/health"];

async function get(path) {
  const res = await fetch(`${base}${path}`, { redirect: "manual" });
  return res;
}

async function signIn(email, password) {
  const res = await fetch(`${base}/api/auth/sign-in`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const setCookie = res.headers.getSetCookie?.() ?? [];
  const cookie = setCookie.map((c) => c.split(";")[0]).join("; ");
  const data = await res.json().catch(() => ({}));
  return { res, cookie, data };
}

async function authedGet(path, cookie) {
  return fetch(`${base}${path}`, {
    headers: cookie ? { cookie } : {},
    redirect: "manual",
  });
}

const failures = [];

console.log(`WealthOS smoke journeys → ${base}`);

try {
  for (const path of publicPaths) {
    const res = await get(path);
    const ok = res.status >= 200 && res.status < 400;
    console.log(`  [${ok ? "OK" : "FAIL"}] GET ${path} → ${res.status}`);
    if (!ok) failures.push(`${path} status ${res.status}`);
  }

  const health = await (await get("/api/health")).json();
  if (health.status !== "ok" && health.status !== "degraded") {
    failures.push(`health status unexpected: ${health.status}`);
  } else {
    console.log(`  [OK] health.status=${health.status} db=${health.database?.ok}`);
  }

  const login = await signIn("yomi@demo.wealthos.ng", "WealthOSdemo1!");
  if (!login.res.ok) {
    failures.push(`sign-in failed: ${login.res.status} ${login.data.error ?? ""}`);
    console.log(`  [FAIL] sign-in Yomi → ${login.res.status}`);
  } else {
    console.log("  [OK] sign-in Yomi");
    const appPaths = ["/app", "/app/inbox", "/app/wealth", "/app/actions", "/app/wealthguard"];
    for (const path of appPaths) {
      const res = await authedGet(path, login.cookie);
      // Next may 200 or 307 depending on middleware; accept 200/307/308
      const ok = res.status === 200 || res.status === 307 || res.status === 308;
      console.log(`  [${ok ? "OK" : "FAIL"}] GET ${path} → ${res.status}`);
      if (!ok) failures.push(`${path} status ${res.status}`);
    }
  }
} catch (err) {
  console.error("\nSmoke could not reach the server.");
  console.error("Start the app with `npm run dev`, then re-run `npm run smoke`.");
  console.error(err instanceof Error ? err.message : err);
  process.exit(2);
}

if (failures.length) {
  console.error("\nSmoke FAILED:");
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

console.log("\nSmoke OK");
