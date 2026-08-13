import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, PageHeader, Panel } from "@/components/ui";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { formatCurrency } from "@/lib/format";
import { partnerLabel } from "@/integrations/execution-partner";

export default async function ExecutionsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/sign-in");

  const instructions = await prisma.executionInstruction.findMany({
    where: { userId: user.id },
    include: { receipt: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main>
      <PageHeader
        title="Partner executions"
        subtitle="Instructions and receipts from regulated partner rails. Demo mode never moves funds."
      />
      <div className="space-y-3">
        {instructions.length ? (
          instructions.map((i) => (
            <Link key={i.id} href={`/app/executions/${i.id}`}>
              <Panel>
                <div className="flex flex-wrap gap-2">
                  <Badge
                    tone={
                      i.status.includes("rejected")
                        ? "danger"
                        : i.status.includes("queued")
                          ? "warn"
                          : "default"
                    }
                  >
                    {i.status.replaceAll("_", " ")}
                  </Badge>
                  <Badge>{partnerLabel(i.partnerCode)}</Badge>
                </div>
                <p className="font-display mt-2 text-xl">{i.title}</p>
                <p className="muted mt-1 text-sm">
                  {i.amount != null
                    ? formatCurrency(i.amount, i.currency, true)
                    : "Amount not specified"}{" "}
                  · {i.createdAt.toLocaleString("en-GB")}
                </p>
                {i.receipt ? (
                  <p className="mt-2 text-sm">Receipt {i.receipt.partnerRef}</p>
                ) : null}
              </Panel>
            </Link>
          ))
        ) : (
          <Panel>
            <p className="muted">
              No partner instructions yet. Accept a material recommendation with step-up and enable
              “Send to partner rail”.
            </p>
          </Panel>
        )}
      </div>
    </main>
  );
}
