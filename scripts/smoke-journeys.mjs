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
    const appPaths = [
      "/app",
      "/app/inbox",
      "/app/wealth",
      "/app/actions",
      "/app/wealthguard",
      "/app/support",
      "/app/privacy",
      "/app/ai",
    ];
    for (const path of appPaths) {
      const res = await authedGet(path, login.cookie);
      // Next may 200 or 307 depending on middleware; accept 200/307/308
      const ok = res.status === 200 || res.status === 307 || res.status === 308;
      console.log(`  [${ok ? "OK" : "FAIL"}] GET ${path} → ${res.status}`);
      if (!ok) failures.push(`${path} status ${res.status}`);
    }
    const careRes = await authedGet("/api/care-updates", login.cookie);
    const careOk = careRes.status === 200;
    console.log(`  [${careOk ? "OK" : "FAIL"}] GET /api/care-updates → ${careRes.status}`);
    if (!careOk) failures.push(`/api/care-updates status ${careRes.status}`);

    const careListRes = await authedGet("/api/care-updates?list=1", login.cookie);
    const careListOk = careListRes.status === 200;
    console.log(`  [${careListOk ? "OK" : "FAIL"}] GET /api/care-updates?list=1 → ${careListRes.status}`);
    if (!careListOk) failures.push(`/api/care-updates?list=1 status ${careListRes.status}`);

    const careListData = await careListRes.json().catch(() => ({}));
    const firstUnseen = Array.isArray(careListData.items)
      ? careListData.items.find((i) => i && i.seen === false && i.id)
      : null;
    if (firstUnseen?.id) {
      const seenRes = await fetch(`${base}/api/care-updates/${firstUnseen.id}/seen`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(login.cookie ? { cookie: login.cookie } : {}),
        },
        body: JSON.stringify({ thanks: "Smoke receipt — thanks" }),
      });
      const seenOk = seenRes.status === 200;
      console.log(`  [${seenOk ? "OK" : "FAIL"}] POST /api/care-updates/:id/seen → ${seenRes.status}`);
      if (!seenOk) failures.push(`care receipt seen status ${seenRes.status}`);
    } else {
      console.log("  [SKIP] POST /api/care-updates/:id/seen (no unseen care update in seed)");
    }

    const aiRes = await fetch(`${base}/api/ai/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(login.cookie ? { cookie: login.cookie } : {}),
      },
      body: JSON.stringify({ message: "Where do I see my adviser care update?" }),
    });
    const aiData = await aiRes.json().catch(() => ({}));
    const aiOk =
      aiRes.status === 200 &&
      typeof aiData.content === "string" &&
      /care update|does not close|\/app\/support|\/app\/privacy/i.test(aiData.content);
    console.log(`  [${aiOk ? "OK" : "FAIL"}] POST /api/ai/chat care_update → ${aiRes.status}`);
    if (!aiOk) {
      failures.push(
        `ai care_update chat failed: ${aiRes.status} ${String(aiData.content ?? "").slice(0, 120)}`,
      );
    }
  }

  const adviserLogin = await signIn("adviser@demo.wealthos.ng", "WealthOSdemo1!");
  if (!adviserLogin.res.ok) {
    failures.push(`adviser sign-in failed: ${adviserLogin.res.status}`);
    console.log(`  [FAIL] sign-in adviser → ${adviserLogin.res.status}`);
  } else {
    console.log("  [OK] sign-in adviser");
    for (const path of ["/adviser", "/adviser?care=awaiting", "/adviser?care=unacked"]) {
      const res = await authedGet(path, adviserLogin.cookie);
      const ok = res.status === 200 || res.status === 307 || res.status === 308;
      console.log(`  [${ok ? "OK" : "FAIL"}] GET ${path} → ${res.status}`);
      if (!ok) failures.push(`${path} status ${res.status}`);
    }
  }

  const adminLogin = await signIn("admin@demo.wealthos.ng", "WealthOSdemo1!");
  if (!adminLogin.res.ok) {
    failures.push(`admin sign-in failed: ${adminLogin.res.status}`);
    console.log(`  [FAIL] sign-in admin → ${adminLogin.res.status}`);
  } else {
    console.log("  [OK] sign-in admin");
    const opsRes = await authedGet("/admin/ops", adminLogin.cookie);
    const opsOk = opsRes.status === 200 || opsRes.status === 307 || opsRes.status === 308;
    console.log(`  [${opsOk ? "OK" : "FAIL"}] GET /admin/ops → ${opsRes.status}`);
    if (!opsOk) failures.push(`/admin/ops status ${opsRes.status}`);
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
