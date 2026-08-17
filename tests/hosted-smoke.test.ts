import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  databaseKindFromUrl,
  evaluateHostedHealth,
  smokePassed,
} from "@/lib/hosted-smoke";

describe("hosted smoke rules", () => {
  it("detects database URL kinds", () => {
    expect(databaseKindFromUrl("file:./dev.db")).toBe("sqlite");
    expect(databaseKindFromUrl("postgresql://user:pass@host/db")).toBe("postgres");
    expect(databaseKindFromUrl("postgres://user:pass@host/db")).toBe("postgres");
    expect(databaseKindFromUrl(undefined)).toBe("missing");
  });

  it("passes a healthy Postgres pilot payload", () => {
    const findings = evaluateHostedHealth({
      status: "ok",
      database: { ok: true },
      config: { demoMode: false, databaseKind: "postgres" },
      launch: { ok: true, blockers: [] },
    });
    expect(smokePassed(findings)).toBe(true);
    expect(findings.every((f) => f.ok)).toBe(true);
  });

  it("blocks sqlite or down database on hosted smoke", () => {
    const sqlite = evaluateHostedHealth({
      status: "ok",
      database: { ok: true },
      config: { demoMode: false, databaseKind: "sqlite" },
      launch: { blockers: [] },
    });
    expect(smokePassed(sqlite)).toBe(false);

    const down = evaluateHostedHealth({
      status: "degraded",
      database: { ok: false, error: "timeout" },
      config: { demoMode: false, databaseKind: "postgres" },
      launch: { blockers: [] },
    });
    expect(smokePassed(down)).toBe(false);
  });

  it("warns on DEMO_MODE without failing default smoke", () => {
    const findings = evaluateHostedHealth({
      status: "ok",
      database: { ok: true },
      config: { demoMode: true, databaseKind: "postgres" },
      launch: { blockers: ["session_secret"] },
    });
    expect(smokePassed(findings)).toBe(true);
    expect(smokePassed(findings, true)).toBe(false);
  });

  it(
    "ships smoke:hosted script in the release package",
    () => {
    const root = process.cwd();
    expect(existsSync(join(root, "scripts", "smoke-hosted.mjs"))).toBe(true);
    expect(existsSync(join(root, "scripts", "smoke-hosted-ready.mjs"))).toBe(true);
    const pkg = readFileSync(join(root, "package.json"), "utf8");
    expect(pkg).toContain("smoke:hosted");
    expect(pkg).toContain("smoke:hosted-ready");
    const ready = spawnSync("node", [join("scripts", "smoke-hosted-ready.mjs")], {
      cwd: root,
      encoding: "utf8",
    });
    expect(ready.status).toBe(0);
    expect(ready.stdout).toMatch(/Hosted smoke readiness OK/);
    expect(readFileSync(join(root, "DEPLOY.md"), "utf8")).toContain("smoke:hosted");
    expect(readFileSync(join(root, "DEPLOY.md"), "utf8")).toContain("smoke:hosted-ready");
    const hosted = readFileSync(join(root, "scripts", "smoke-hosted.mjs"), "utf8");
    expect(hosted).toContain("/app/ai");
    expect(hosted).toContain("/api/care-updates");
    expect(hosted).toContain("list=1");
    expect(hosted).toContain("care=awaiting");
    expect(hosted).toContain("/admin/ops");
    const local = readFileSync(join(root, "scripts", "smoke-journeys.mjs"), "utf8");
    expect(local).toContain("/app/ai");
    expect(local).toContain("care update");
    expect(local).toContain("/seen");
    expect(local).toContain("care=awaiting");
    expect(local).toContain("/admin/ops");
    expect(local).toContain("/adviser/notifications");
    expect(local).toContain("read=unread");
    expect(local).toContain("kind=care_receipt");
    expect(local).toContain("kind=care_handoff");
    expect(local).toContain("/api/admin/care-remind");
    expect(local).toContain("admin care-remind");
    expect(local).toContain("admin care-remind missing queues-stay-open note");
    expect(local).toContain("adviser care_handoff notification missing after ops care-remind");
    expect(hosted).toContain("kind=care_handoff");
    expect(hosted).toContain("/api/admin/care-remind");
    expect(hosted).toContain("hosted admin care-remind");
    expect(hosted).toContain("customerId");
    expect(local).toContain("customerId");
    expect(local).toContain("admin care-remind customerId");
    expect(local).toContain("care=ops_reminded");
    expect(local).toContain("adviser ops_reminded radar");
    expect(local).toContain("adviser ops_reminded radar missing Ops reminded cue after care-remind");
    expect(local).toContain("adviser Care desk missing ops-remind banner after ops care-remind");
    expect(local).toContain("adviser next-steps missing ops_reminded kind after ops care-remind");
    expect(hosted).toContain("hosted adviser ops_reminded radar");
    expect(hosted).toContain("hosted adviser next-steps missing ops_reminded kind");
    expect(local).toContain("ops care remind trail");
    expect(local).toContain("recentReminds");
    expect(hosted).toContain("hosted ops care remind trail");
    expect(local).toContain("ops remind-answer trail");
    expect(local).toContain("recentRemindAnswers");
    expect(local).toContain("admin Remind answered notification missing after care-ack");
    expect(local).toContain("/api/adviser/care-ack");
    expect(local).toContain("answeredOpsRemind");
    expect(hosted).toContain("hosted ops remind-answer trail");
    expect(hosted).toContain("hosted adviser care-ack");
    expect(local).toContain("PATCH");
    expect(local).toContain("/api/notifications");
    expect(local).toContain("mark-all-read");
    expect(local).toContain("/app/notifications");
    expect(local).toContain("kind=care_update");
    expect(local).toContain("kind=cadence");
    expect(local).toContain("mark-all-read (customer)");
    expect(local).toContain("/app/inbox?status=unread");
    expect(local).toContain("kind=recommendation");
    expect(local).toContain("kind=adviser");
    expect(local).toContain("kind=connection");
    expect(local).toContain("kind=data_quality");
    expect(local).toContain("/api/inbox/mark-all-read");
    expect(local).toContain("mark-all-read (inbox)");
    expect(hosted).toContain("/adviser/notifications");
    expect(hosted).toContain("read=unread");
    expect(hosted).toContain("/api/notifications");
    expect(hosted).toContain("/app/notifications");
    expect(hosted).toContain("kind=care_update");
    expect(hosted).toContain("kind=cadence");
    expect(hosted).toContain("/app/inbox");
    expect(hosted).toContain("status=unread");
    expect(hosted).toContain("kind=recommendation");
    expect(hosted).toContain("kind=adviser");
    expect(hosted).toContain("/api/inbox");
    expect(local).toContain("/api/next-steps");
    expect(local).toContain("primaryHref");
    expect(local).toContain("What should I do next?");
    expect(local).toContain("next_steps");
    expect(local).toContain("/api/adviser/next-steps");
    expect(local).toContain("adviser next-steps first href");
    expect(local).toContain("adviser next-steps first item missing kind");
    expect(local).toContain("/api/adviser/ai");
    expect(local).toContain("What should I do next for my book?");
    expect(local).toContain("book_next_steps");
    expect(local).toContain("/adviser/ai");
    expect(local).toContain("adviserNextStepsPulse");
    expect(local).toContain("CoachAI");
    expect(local).toContain("adviser ai book_next_steps missing Path: /adviser");
    expect(hosted).toContain("/api/next-steps");
    expect(hosted).toContain("/api/adviser/next-steps");
    expect(hosted).toContain("/adviser/ai");
    expect(hosted).toContain("/api/adviser/ai");
    expect(hosted).toContain("What should I do next for my book?");
    expect(hosted).toContain("adviserNextStepsPulse");
    expect(local).toContain("/api/admin/next-steps");
    expect(local).toContain("ops next-steps");
    expect(local).toContain("ops next-steps first href not admin/adviser path");
    expect(local).toContain("ops next-steps first item missing kind");
    expect(local).toContain("/api/admin/ai");
    expect(local).toContain("What should I do next for ops?");
    expect(local).toContain("ops_next_steps");
    expect(local).toContain("/admin/ai");
    expect(local).toContain("opsNextStepsPulse");
    expect(local).toContain("admin ai ops_next_steps missing Path");
    expect(local).toContain("admin ai ops_next_steps expected CoachAI agent");
    expect(hosted).toContain("/api/admin/next-steps");
    expect(hosted).toContain("/admin/ai");
    expect(hosted).toContain("/api/admin/ai");
    expect(hosted).toContain("What should I do next for ops?");
    expect(hosted).toContain("opsNextStepsPulse");
  },
    60_000,
  );
});
