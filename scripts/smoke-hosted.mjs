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
  "/app/inbox?kind=recommendation",
  "/app/inbox?kind=adviser",
  "/app/notifications",
  "/app/notifications?read=unread",
  "/app/notifications?kind=care_update",
  "/app/notifications?kind=cadence",
  "/api/care-updates",
  "/api/care-updates?list=1",
  "/api/notifications",
  "/api/inbox",
  "/api/next-steps",
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
          "/adviser?care=ops_reminded",
          "/adviser/ai",
          "/adviser/notifications",
          "/adviser/notifications?read=unread",
          "/adviser/notifications?kind=care_receipt",
          "/adviser/notifications?kind=care_handoff",
          "/api/notifications",
          "/api/adviser/next-steps",
        ]],
        ["admin", adminEmail, ["/admin/ops", "/admin/ai", "/api/admin/next-steps"]],
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
        if (label === "adviser") {
          const adviserAiRes = await fetch(`${base}/api/adviser/ai`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(roleCookie ? { cookie: roleCookie } : {}),
            },
            body: JSON.stringify({ message: "What should I do next for my book?" }),
          });
          const adviserAiData = await adviserAiRes.json().catch(() => ({}));
          const adviserAiContent =
            typeof adviserAiData.content === "string" ? adviserAiData.content : "";
          const adviserAiOk =
            adviserAiRes.status === 200 &&
            /Path:\s*\/adviser/i.test(adviserAiContent) &&
            Array.isArray(adviserAiData.toolsUsed) &&
            adviserAiData.toolsUsed.includes("adviserNextStepsPulse");
          console.log(
            `  [${adviserAiOk ? "OK" : "FAIL"}] POST /api/adviser/ai book_next_steps → ${adviserAiRes.status}`,
          );
          if (!adviserAiOk) {
            failures.push(
              `hosted adviser ai book_next_steps failed: ${adviserAiRes.status} ${adviserAiContent.slice(0, 120)}`,
            );
          }
        }
        if (label === "admin") {
          const chiomaEmail = process.env.SMOKE_CHIOMA_EMAIL || "chioma@demo.wealthos.ng";
          const chiomaLogin = await fetch(`${base}/api/auth/sign-in`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: chiomaEmail, password }),
          });
          if (chiomaLogin.ok) {
            const setCookie = chiomaLogin.headers.getSetCookie?.() ?? [];
            const chiomaCookie = setCookie.map((c) => c.split(";")[0]).join("; ");
            const escRes = await fetch(`${base}/api/escalations`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...(chiomaCookie ? { cookie: chiomaCookie } : {}),
              },
              body: JSON.stringify({
                reason: "Hosted smoke: unacked support for remind-answer close-loop",
                level: "L2_SUPPORT",
                category: "support",
              }),
            });
            console.log(
              `  [${escRes.status === 200 || escRes.status === 201 ? "OK" : "WARN"}] hosted POST /api/escalations (chioma) → ${escRes.status}`,
            );
          }

          const careRemindRes = await fetch(`${base}/api/admin/care-remind`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(roleCookie ? { cookie: roleCookie } : {}),
            },
            body: JSON.stringify({}),
          });
          const careRemindData = await careRemindRes.json().catch(() => ({}));
          const careRemindOk =
            careRemindRes.status === 200 &&
            typeof careRemindData.reminded === "number" &&
            /do not close|queues/i.test(String(careRemindData.note ?? ""));
          console.log(
            `  [${careRemindOk ? "OK" : "FAIL"}] POST /api/admin/care-remind → ${careRemindRes.status}`,
          );
          if (!careRemindOk) {
            failures.push(
              `hosted admin care-remind failed: ${careRemindRes.status} ${String(careRemindData.error ?? "").slice(0, 120)}`,
            );
          }

          const scopedId =
            Array.isArray(careRemindData.results) &&
            careRemindData.results.find(
              (r) => r && typeof r.customerId === "string" && r.customerId.length > 0,
            )?.customerId;
          if (scopedId) {
            const scopedRes = await fetch(`${base}/api/admin/care-remind`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...(roleCookie ? { cookie: roleCookie } : {}),
              },
              body: JSON.stringify({ customerId: scopedId }),
            });
            const scopedData = await scopedRes.json().catch(() => ({}));
            const scopedOk =
              scopedRes.status === 200 &&
              typeof scopedData.reminded === "number" &&
              /do not close|queues/i.test(String(scopedData.note ?? ""));
            console.log(
              `  [${scopedOk ? "OK" : "FAIL"}] POST /api/admin/care-remind customerId → ${scopedRes.status}`,
            );
            if (!scopedOk) {
              failures.push(
                `hosted admin care-remind customerId failed: ${scopedRes.status} ${String(scopedData.error ?? "").slice(0, 120)}`,
              );
            }
          }

          if (careRemindOk && (careRemindData.reminded ?? 0) > 0) {
            const opsDailyRes = await fetch(`${base}/api/admin/ops-daily`, {
              headers: roleCookie ? { cookie: roleCookie } : {},
            });
            const opsDaily = opsDailyRes.status === 200 ? await opsDailyRes.json().catch(() => ({})) : {};
            const reminds = opsDaily?.careHandoff?.recentReminds;
            const trailOk =
              opsDailyRes.status === 200 &&
              Array.isArray(reminds) &&
              reminds.length > 0;
            const awaitingOk =
              trailOk && reminds.some((r) => r && r.awaitingAnswer === true);
            console.log(
              `  [${trailOk ? "OK" : "FAIL"}] hosted ops care remind trail → ${opsDailyRes.status}`,
            );
            console.log(
              `  [${awaitingOk ? "OK" : "FAIL"}] hosted ops remind awaitingAnswer before care-ack`,
            );
            if (!trailOk) {
              failures.push("hosted ops care remind trail missing recentReminds");
            }
            if (!awaitingOk) {
              failures.push("hosted ops care remind trail missing awaitingAnswer before care-ack");
            }

            const adviserEmail = process.env.SMOKE_ADVISER_EMAIL || "adviser@demo.wealthos.ng";
            const adviserAfter = await fetch(`${base}/api/auth/sign-in`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email: adviserEmail, password }),
            });
            if (adviserAfter.ok) {
              const setCookie = adviserAfter.headers.getSetCookie?.() ?? [];
              const adviserCookie = setCookie.map((c) => c.split(";")[0]).join("; ");
              const radarRes = await fetch(`${base}/adviser?care=ops_reminded`, {
                headers: adviserCookie ? { cookie: adviserCookie } : {},
                redirect: "manual",
              });
              const radarHtml =
                radarRes.status === 200 ? await radarRes.text().catch(() => "") : "";
              const radarOk =
                (radarRes.status === 200 ||
                  radarRes.status === 307 ||
                  radarRes.status === 308) &&
                (radarRes.status !== 200 ||
                  /\d+\s+ops reminded/i.test(radarHtml) ||
                  /ops-reminded and still unacked/i.test(radarHtml));
              console.log(
                `  [${radarOk ? "OK" : "FAIL"}] hosted adviser ops_reminded radar → ${radarRes.status}`,
              );
              if (!radarOk) {
                failures.push("hosted adviser ops_reminded radar missing Ops reminded cue");
              }

              const nextRes = await fetch(`${base}/api/adviser/next-steps`, {
                headers: adviserCookie ? { cookie: adviserCookie } : {},
              });
              const nextPulse = nextRes.status === 200 ? await nextRes.json().catch(() => ({})) : {};
              const nextItems = Array.isArray(nextPulse.items) ? nextPulse.items : [];
              const opsStepOk = nextItems.some((i) => i && i.kind === "ops_reminded");
              console.log(
                `  [${nextRes.status === 200 && opsStepOk ? "OK" : "FAIL"}] hosted adviser next-steps ops_reminded → ${nextRes.status}`,
              );
              if (nextRes.status !== 200 || !opsStepOk) {
                failures.push("hosted adviser next-steps missing ops_reminded kind after care-remind");
              } else {
                const opsAiRes = await fetch(`${base}/api/adviser/ai`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    ...(adviserCookie ? { cookie: adviserCookie } : {}),
                  },
                  body: JSON.stringify({ message: "ops reminded customers for my book" }),
                });
                const opsAiData = await opsAiRes.json().catch(() => ({}));
                const opsAiContent =
                  typeof opsAiData.content === "string" ? opsAiData.content : "";
                const opsAiOk =
                  opsAiRes.status === 200 &&
                  /Ops reminded/i.test(opsAiContent) &&
                  /care=ops_reminded/i.test(opsAiContent);
                console.log(
                  `  [${opsAiOk ? "OK" : "FAIL"}] hosted adviser ai ops_reminded cite → ${opsAiRes.status}`,
                );
                if (!opsAiOk) {
                  failures.push("hosted adviser ai ops_reminded cite failed after care-remind");
                }
              }

              const remindedCustomerId =
                Array.isArray(careRemindData.results) &&
                careRemindData.results.find(
                  (r) => r && typeof r.customerId === "string" && r.customerId.length > 0,
                )?.customerId;
              if (remindedCustomerId) {
                const ackRes = await fetch(`${base}/api/adviser/care-ack`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    ...(adviserCookie ? { cookie: adviserCookie } : {}),
                  },
                  body: JSON.stringify({
                    customerId: remindedCustomerId,
                    kind: "support",
                    message: "Hosted smoke care ack answering ops remind.",
                  }),
                });
                const ackData = await ackRes.json().catch(() => ({}));
                const ackOk = ackRes.status === 200 && ackData.answeredOpsRemind === true;
                console.log(
                  `  [${ackOk ? "OK" : "FAIL"}] hosted adviser care-ack answeredOpsRemind → ${ackRes.status}`,
                );
                if (!ackOk) {
                  failures.push(
                    `hosted adviser care-ack after ops remind failed: ${ackRes.status}`,
                  );
                } else {
                  const opsDailyAfter = await fetch(`${base}/api/admin/ops-daily`, {
                    headers: roleCookie ? { cookie: roleCookie } : {},
                  });
                  const boardAfter =
                    opsDailyAfter.status === 200
                      ? await opsDailyAfter.json().catch(() => ({}))
                      : {};
                  const answers = boardAfter?.careHandoff?.recentRemindAnswers;
                  const answersOk =
                    opsDailyAfter.status === 200 &&
                    Array.isArray(answers) &&
                    answers.length > 0;
                  console.log(
                    `  [${answersOk ? "OK" : "FAIL"}] hosted ops remind-answer trail → ${opsDailyAfter.status}`,
                  );
                  if (!answersOk) {
                    failures.push("hosted ops remind-answer trail missing recentRemindAnswers");
                  } else {
                    const auditRes = await fetch(`${base}/api/admin/audit?category=care&take=20`, {
                      headers: roleCookie ? { cookie: roleCookie } : {},
                    });
                    const audit = auditRes.status === 200 ? await auditRes.json().catch(() => ({})) : {};
                    const events = Array.isArray(audit.events) ? audit.events : [];
                    const types = events.map((e) => e?.eventType);
                    const auditOk =
                      auditRes.status === 200 &&
                      types.includes("OPS_CARE_REMIND") &&
                      (types.includes("OPS_REMIND_ANSWERED") || types.includes("ADVISER_CARE_ACK"));
                    console.log(
                      `  [${auditOk ? "OK" : "FAIL"}] hosted admin audit care category → ${auditRes.status}`,
                    );
                    if (!auditOk) {
                      failures.push("hosted admin audit care category missing remind/answer events");
                    }
                  }
                }
              }
            } else if (strict) {
              failures.push(`hosted adviser re-sign-in after care-remind failed: ${adviserAfter.status}`);
            }
          }

          const adminAiRes = await fetch(`${base}/api/admin/ai`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(roleCookie ? { cookie: roleCookie } : {}),
            },
            body: JSON.stringify({ message: "What should I do next for ops?" }),
          });
          const adminAiData = await adminAiRes.json().catch(() => ({}));
          const adminAiContent =
            typeof adminAiData.content === "string" ? adminAiData.content : "";
          const adminAiOk =
            adminAiRes.status === 200 &&
            /Path:\s*\/(admin|adviser)/i.test(adminAiContent) &&
            Array.isArray(adminAiData.toolsUsed) &&
            adminAiData.toolsUsed.includes("opsNextStepsPulse");
          console.log(
            `  [${adminAiOk ? "OK" : "FAIL"}] POST /api/admin/ai ops_next_steps → ${adminAiRes.status}`,
          );
          if (!adminAiOk) {
            failures.push(
              `hosted admin ai ops_next_steps failed: ${adminAiRes.status} ${adminAiContent.slice(0, 120)}`,
            );
          }
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
