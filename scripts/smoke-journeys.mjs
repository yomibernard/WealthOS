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
      "/app/inbox?status=unread",
      "/app/inbox?kind=recommendation",
      "/app/inbox?kind=adviser",
      "/app/inbox?kind=connection",
      "/app/inbox?kind=data_quality",
      "/app/wealth",
      "/app/actions",
      "/app/wealthguard",
      "/app/support",
      "/app/privacy",
      "/app/ai",
      "/app/notifications",
      "/app/notifications?read=unread",
      "/app/notifications?kind=care_update",
      "/app/notifications?kind=cadence",
    ];
    for (const path of appPaths) {
      const res = await authedGet(path, login.cookie);
      // Next may 200 or 307 depending on middleware; accept 200/307/308
      const ok = res.status === 200 || res.status === 307 || res.status === 308;
      console.log(`  [${ok ? "OK" : "FAIL"}] GET ${path} → ${res.status}`);
      if (!ok) failures.push(`${path} status ${res.status}`);
    }

    const nextStepsRes = await authedGet("/api/next-steps", login.cookie);
    const nextStepsOk = nextStepsRes.status === 200;
    console.log(`  [${nextStepsOk ? "OK" : "FAIL"}] GET /api/next-steps → ${nextStepsRes.status}`);
    if (!nextStepsOk) {
      failures.push(`/api/next-steps status ${nextStepsRes.status}`);
    } else {
      const pulse = await nextStepsRes.json().catch(() => ({}));
      const hasItems = Array.isArray(pulse.items) && pulse.items.length > 0;
      const hasHref =
        typeof pulse.primaryHref === "string" && pulse.primaryHref.startsWith("/app/");
      const firstHref =
        hasItems && typeof pulse.items[0]?.href === "string" ? pulse.items[0].href : null;
      console.log(
        `  [${hasItems && hasHref ? "OK" : "FAIL"}] next-steps items=${pulse.items?.length ?? 0} primaryHref=${pulse.primaryHref ?? "n/a"}`,
      );
      if (!hasItems) failures.push("next-steps pulse missing items");
      if (!hasHref) failures.push("next-steps pulse missing primaryHref");
      if (firstHref && !String(firstHref).startsWith("/app/")) {
        failures.push(`next-steps first href not in-app: ${firstHref}`);
      }
    }

    const inboxRes = await authedGet("/api/inbox?refresh=1", login.cookie);
    const inboxOk = inboxRes.status === 200;
    console.log(`  [${inboxOk ? "OK" : "FAIL"}] GET /api/inbox?refresh=1 → ${inboxRes.status}`);
    if (!inboxOk) {
      failures.push(`/api/inbox status ${inboxRes.status}`);
    } else {
      const inboxData = await inboxRes.json().catch(() => ({}));
      const unreadItem = Array.isArray(inboxData.items)
        ? inboxData.items.find((i) => i && i.status === "unread" && i.id)
        : null;
      if (unreadItem?.id) {
        const patchRes = await fetch(`${base}/api/inbox/${unreadItem.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(login.cookie ? { cookie: login.cookie } : {}),
          },
          body: JSON.stringify({ status: "read" }),
        });
        const patchOk = patchRes.status === 200;
        console.log(`  [${patchOk ? "OK" : "FAIL"}] PATCH /api/inbox/:id read → ${patchRes.status}`);
        if (!patchOk) failures.push(`inbox mark-read status ${patchRes.status}`);
      } else {
        console.log("  [SKIP] PATCH /api/inbox/:id (no unread inbox item after refresh)");
      }

      const markAllRes = await fetch(`${base}/api/inbox/mark-all-read`, {
        method: "POST",
        headers: login.cookie ? { cookie: login.cookie } : {},
      });
      const markAllOk = markAllRes.status === 200;
      console.log(`  [${markAllOk ? "OK" : "FAIL"}] POST /api/inbox/mark-all-read (inbox) → ${markAllRes.status}`);
      if (!markAllOk) failures.push(`inbox mark-all-read status ${markAllRes.status}`);
    }

    const custNoteRes = await authedGet("/api/notifications", login.cookie);
    const custNoteOk = custNoteRes.status === 200;
    console.log(`  [${custNoteOk ? "OK" : "FAIL"}] GET /api/notifications (customer) → ${custNoteRes.status}`);
    if (!custNoteOk) {
      failures.push(`/api/notifications customer status ${custNoteRes.status}`);
    } else {
      const notes = await custNoteRes.json().catch(() => []);
      const unread = Array.isArray(notes) ? notes.find((n) => n && n.read === false && n.id) : null;
      if (unread?.id) {
        const patchRes = await fetch(`${base}/api/notifications/${unread.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(login.cookie ? { cookie: login.cookie } : {}),
          },
          body: JSON.stringify({ read: true }),
        });
        const patchOk = patchRes.status === 200;
        console.log(`  [${patchOk ? "OK" : "FAIL"}] PATCH /api/notifications/:id (customer) → ${patchRes.status}`);
        if (!patchOk) failures.push(`customer notification mark-read status ${patchRes.status}`);
      } else {
        console.log("  [SKIP] PATCH /api/notifications/:id (no unread customer notification in seed)");
      }

      const custMarkAllRes = await fetch(`${base}/api/notifications/mark-all-read`, {
        method: "POST",
        headers: login.cookie ? { cookie: login.cookie } : {},
      });
      const custMarkAllOk = custMarkAllRes.status === 200;
      console.log(
        `  [${custMarkAllOk ? "OK" : "FAIL"}] POST /api/notifications/mark-all-read (customer) → ${custMarkAllRes.status}`,
      );
      if (!custMarkAllOk) {
        failures.push(`customer notification mark-all-read status ${custMarkAllRes.status}`);
      }
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

    const nextAiRes = await fetch(`${base}/api/ai/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(login.cookie ? { cookie: login.cookie } : {}),
      },
      body: JSON.stringify({ message: "What should I do next?" }),
    });
    const nextAiData = await nextAiRes.json().catch(() => ({}));
    const nextAiOk =
      nextAiRes.status === 200 &&
      typeof nextAiData.content === "string" &&
      (/Path:\s*\/app\//i.test(nextAiData.content) ||
        /next step|do next|Home pulse|\/app\/(support|privacy|actions|wealth|profile)/i.test(
          nextAiData.content,
        ));
    console.log(`  [${nextAiOk ? "OK" : "FAIL"}] POST /api/ai/chat next_steps → ${nextAiRes.status}`);
    if (!nextAiOk) {
      failures.push(
        `ai next_steps chat failed: ${nextAiRes.status} ${String(nextAiData.content ?? "").slice(0, 120)}`,
      );
    }
  }

  const adviserLogin = await signIn("adviser@demo.wealthos.ng", "WealthOSdemo1!");
  if (!adviserLogin.res.ok) {
    failures.push(`adviser sign-in failed: ${adviserLogin.res.status}`);
    console.log(`  [FAIL] sign-in adviser → ${adviserLogin.res.status}`);
  } else {
    console.log("  [OK] sign-in adviser");
    for (const path of [
      "/adviser",
      "/adviser?care=awaiting",
      "/adviser?care=unacked",
      "/adviser/ai",
      "/adviser/notifications",
      "/adviser/notifications?read=unread",
      "/adviser/notifications?kind=care_receipt",
      "/adviser/notifications?kind=care_handoff",
      "/adviser/notifications?kind=share",
    ]) {
      const res = await authedGet(path, adviserLogin.cookie);
      const ok = res.status === 200 || res.status === 307 || res.status === 308;
      console.log(`  [${ok ? "OK" : "FAIL"}] GET ${path} → ${res.status}`);
      if (!ok) failures.push(`${path} status ${res.status}`);
    }

    const adviserNextRes = await authedGet("/api/adviser/next-steps", adviserLogin.cookie);
    const adviserNextOk = adviserNextRes.status === 200;
    console.log(`  [${adviserNextOk ? "OK" : "FAIL"}] GET /api/adviser/next-steps → ${adviserNextRes.status}`);
    if (!adviserNextOk) {
      failures.push(`/api/adviser/next-steps status ${adviserNextRes.status}`);
    } else {
      const pulse = await adviserNextRes.json().catch(() => ({}));
      const hasItems = Array.isArray(pulse.items) && pulse.items.length > 0;
      const hasHref =
        typeof pulse.primaryHref === "string" &&
        (/^\/adviser(\/|\?|$)/.test(pulse.primaryHref) || pulse.primaryHref.startsWith("/adviser/"));
      const first = hasItems ? pulse.items[0] : null;
      const firstHrefOk =
        first &&
        typeof first.href === "string" &&
        (/^\/adviser(\/|\?|$)/.test(first.href) || first.href.startsWith("/adviser/"));
      const firstKindOk = first && typeof first.kind === "string" && first.kind.length > 0;
      console.log(
        `  [${hasItems && hasHref && firstHrefOk && firstKindOk ? "OK" : "FAIL"}] adviser next-steps items=${pulse.items?.length ?? 0} kind=${first?.kind ?? "n/a"} primaryHref=${pulse.primaryHref ?? "n/a"}`,
      );
      if (!hasItems) failures.push("adviser next-steps pulse missing items");
      if (!hasHref) failures.push("adviser next-steps pulse missing primaryHref");
      if (!firstHrefOk) failures.push("adviser next-steps first href not adviser path");
      if (!firstKindOk) failures.push("adviser next-steps first item missing kind");
    }

    const adviserAiRes = await fetch(`${base}/api/adviser/ai`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(adviserLogin.cookie ? { cookie: adviserLogin.cookie } : {}),
      },
      body: JSON.stringify({ message: "What should I do next for my book?" }),
    });
    const adviserAiData = await adviserAiRes.json().catch(() => ({}));
    const adviserAiContent =
      typeof adviserAiData.content === "string" ? adviserAiData.content : "";
    const adviserAiHasPath = /Path:\s*\/adviser(\/|\?|$| )/i.test(adviserAiContent);
    const adviserAiTools = Array.isArray(adviserAiData.toolsUsed)
      ? adviserAiData.toolsUsed
      : [];
    const adviserAiToolOk = adviserAiTools.includes("adviserNextStepsPulse");
    const adviserAiAgentOk = adviserAiData.agent === "CoachAI";
    const adviserAiOk =
      adviserAiRes.status === 200 &&
      adviserAiHasPath &&
      adviserAiToolOk &&
      adviserAiAgentOk;
    console.log(
      `  [${adviserAiOk ? "OK" : "FAIL"}] POST /api/adviser/ai book_next_steps agent=${adviserAiData.agent ?? "n/a"} tools=${adviserAiTools.join(",") || "n/a"} path=${adviserAiHasPath ? "yes" : "no"} → ${adviserAiRes.status}`,
    );
    if (!adviserAiOk) {
      failures.push(
        `adviser ai book_next_steps failed: status=${adviserAiRes.status} agent=${adviserAiData.agent ?? "n/a"} tools=${adviserAiTools.join(",") || "n/a"} hasPath=${adviserAiHasPath} ${adviserAiContent.slice(0, 120)}`,
      );
    }
    if (adviserAiRes.status === 200 && !adviserAiHasPath) {
      failures.push("adviser ai book_next_steps missing Path: /adviser");
    }
    if (adviserAiRes.status === 200 && !adviserAiToolOk) {
      failures.push("adviser ai book_next_steps missing adviserNextStepsPulse tool");
    }
    if (adviserAiRes.status === 200 && !adviserAiAgentOk) {
      failures.push("adviser ai book_next_steps expected CoachAI agent");
    }

    const noteRes = await authedGet("/api/notifications", adviserLogin.cookie);
    const noteOk = noteRes.status === 200;
    console.log(`  [${noteOk ? "OK" : "FAIL"}] GET /api/notifications (adviser) → ${noteRes.status}`);
    if (!noteOk) {
      failures.push(`/api/notifications adviser status ${noteRes.status}`);
    } else {
      const notes = await noteRes.json().catch(() => []);
      const unread = Array.isArray(notes) ? notes.find((n) => n && n.read === false && n.id) : null;
      if (unread?.id) {
        const patchRes = await fetch(`${base}/api/notifications/${unread.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(adviserLogin.cookie ? { cookie: adviserLogin.cookie } : {}),
          },
          body: JSON.stringify({ read: true }),
        });
        const patchOk = patchRes.status === 200;
        console.log(`  [${patchOk ? "OK" : "FAIL"}] PATCH /api/notifications/:id read → ${patchRes.status}`);
        if (!patchOk) failures.push(`adviser notification mark-read status ${patchRes.status}`);
      } else {
        console.log("  [SKIP] PATCH /api/notifications/:id (no unread adviser notification in seed)");
      }

      const markAllRes = await fetch(`${base}/api/notifications/mark-all-read`, {
        method: "POST",
        headers: adviserLogin.cookie ? { cookie: adviserLogin.cookie } : {},
      });
      const markAllOk = markAllRes.status === 200;
      console.log(
        `  [${markAllOk ? "OK" : "FAIL"}] POST /api/notifications/mark-all-read → ${markAllRes.status}`,
      );
      if (!markAllOk) failures.push(`adviser notification mark-all-read status ${markAllRes.status}`);
    }
  }

  const adminLogin = await signIn("admin@demo.wealthos.ng", "WealthOSdemo1!");
  if (!adminLogin.res.ok) {
    failures.push(`admin sign-in failed: ${adminLogin.res.status}`);
    console.log(`  [FAIL] sign-in admin → ${adminLogin.res.status}`);
  } else {
    console.log("  [OK] sign-in admin");
    for (const path of ["/admin/ops", "/admin/ai"]) {
      const res = await authedGet(path, adminLogin.cookie);
      const ok = res.status === 200 || res.status === 307 || res.status === 308;
      console.log(`  [${ok ? "OK" : "FAIL"}] GET ${path} → ${res.status}`);
      if (!ok) failures.push(`${path} status ${res.status}`);
    }

    const opsNextRes = await authedGet("/api/admin/next-steps", adminLogin.cookie);
    const opsNextOk = opsNextRes.status === 200;
    console.log(`  [${opsNextOk ? "OK" : "FAIL"}] GET /api/admin/next-steps → ${opsNextRes.status}`);
    if (!opsNextOk) {
      failures.push(`/api/admin/next-steps status ${opsNextRes.status}`);
    } else {
      const pulse = await opsNextRes.json().catch(() => ({}));
      const hasItems = Array.isArray(pulse.items) && pulse.items.length > 0;
      const hasHref =
        typeof pulse.primaryHref === "string" &&
        (/^\/(admin|adviser)(\/|\?|$)/.test(pulse.primaryHref) ||
          pulse.primaryHref.startsWith("/admin/") ||
          pulse.primaryHref.startsWith("/adviser"));
      const first = hasItems ? pulse.items[0] : null;
      const firstHrefOk =
        first &&
        typeof first.href === "string" &&
        (/^\/(admin|adviser)(\/|\?|$)/.test(first.href) ||
          first.href.startsWith("/admin/") ||
          first.href.startsWith("/adviser"));
      const firstKindOk = first && typeof first.kind === "string" && first.kind.length > 0;
      console.log(
        `  [${hasItems && hasHref && firstHrefOk && firstKindOk ? "OK" : "FAIL"}] ops next-steps items=${pulse.items?.length ?? 0} kind=${first?.kind ?? "n/a"} primaryHref=${pulse.primaryHref ?? "n/a"}`,
      );
      if (!hasItems) failures.push("ops next-steps pulse missing items");
      if (!hasHref) failures.push("ops next-steps pulse missing primaryHref");
      if (!firstHrefOk) failures.push("ops next-steps first href not admin/adviser path");
      if (!firstKindOk) failures.push("ops next-steps first item missing kind");
    }

    const careRemindRes = await fetch(`${base}/api/admin/care-remind`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(adminLogin.cookie ? { cookie: adminLogin.cookie } : {}),
      },
      body: JSON.stringify({}),
    });
    const careRemindData = await careRemindRes.json().catch(() => ({}));
    const careRemindOk =
      careRemindRes.status === 200 &&
      typeof careRemindData.reminded === "number" &&
      /queues/i.test(String(careRemindData.note ?? ""));
    console.log(
      `  [${careRemindOk ? "OK" : "FAIL"}] POST /api/admin/care-remind reminded=${careRemindData.reminded ?? "n/a"} → ${careRemindRes.status}`,
    );
    if (!careRemindOk) {
      failures.push(
        `admin care-remind failed: ${careRemindRes.status} ${String(careRemindData.error ?? "").slice(0, 120)}`,
      );
    }

    const adminAiRes = await fetch(`${base}/api/admin/ai`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(adminLogin.cookie ? { cookie: adminLogin.cookie } : {}),
      },
      body: JSON.stringify({ message: "What should I do next for ops?" }),
    });
    const adminAiData = await adminAiRes.json().catch(() => ({}));
    const adminAiContent =
      typeof adminAiData.content === "string" ? adminAiData.content : "";
    const adminAiHasPath = /Path:\s*\/(admin|adviser)(\/|\?|$| )/i.test(adminAiContent);
    const adminAiTools = Array.isArray(adminAiData.toolsUsed) ? adminAiData.toolsUsed : [];
    const adminAiToolOk = adminAiTools.includes("opsNextStepsPulse");
    const adminAiAgentOk = adminAiData.agent === "CoachAI";
    const adminAiOk =
      adminAiRes.status === 200 && adminAiHasPath && adminAiToolOk && adminAiAgentOk;
    console.log(
      `  [${adminAiOk ? "OK" : "FAIL"}] POST /api/admin/ai ops_next_steps agent=${adminAiData.agent ?? "n/a"} tools=${adminAiTools.join(",") || "n/a"} path=${adminAiHasPath ? "yes" : "no"} → ${adminAiRes.status}`,
    );
    if (!adminAiOk) {
      failures.push(
        `admin ai ops_next_steps failed: status=${adminAiRes.status} agent=${adminAiData.agent ?? "n/a"} tools=${adminAiTools.join(",") || "n/a"} hasPath=${adminAiHasPath} ${adminAiContent.slice(0, 120)}`,
      );
    }
    if (adminAiRes.status === 200 && !adminAiHasPath) {
      failures.push("admin ai ops_next_steps missing Path: /admin or /adviser");
    }
    if (adminAiRes.status === 200 && !adminAiToolOk) {
      failures.push("admin ai ops_next_steps missing opsNextStepsPulse tool");
    }
    if (adminAiRes.status === 200 && !adminAiAgentOk) {
      failures.push("admin ai ops_next_steps expected CoachAI agent");
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
