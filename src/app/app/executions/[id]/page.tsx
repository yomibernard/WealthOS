import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, PageHeader, Panel } from "@/components/ui";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { formatCurrency } from "@/lib/format";
import { partnerLabel } from "@/integrations/execution-partner";

export default async function ExecutionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/auth/sign-in");

  const instruction = await prisma.executionInstruction.findFirst({
    where: { id, userId: user.id },
    include: { receipt: true },
  });
  if (!instruction) redirect("/app/executions");

  return (
    <main>
      <PageHeader title="Execution receipt" subtitle={instruction.title} />
      <Panel className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Badge>{instruction.status.replaceAll("_", " ")}</Badge>
          <Badge tone={instruction.stepUpVerified ? "default" : "warn"}>
            Step-up {instruction.stepUpVerified ? "verified" : "missing"}
          </Badge>
        </div>
        <p>
          <strong>Partner:</strong> {partnerLabel(instruction.partnerCode)}
        </p>
        <p>
          <strong>Amount:</strong>{" "}
          {instruction.amount != null
            ? formatCurrency(instruction.amount, instruction.currency, true)
            : "Not specified"}
        </p>
        <p>
          <strong>Suitability / consent:</strong> {instruction.suitabilityStatus}
        </p>
        {instruction.receipt ? (
          <>
            <p>
              <strong>Partner reference:</strong> {instruction.receipt.partnerRef}
            </p>
            <p>
              <strong>Partner status:</strong> {instruction.receipt.status}
            </p>
            <p className="leading-relaxed">{instruction.receipt.message}</p>
            <p className="muted text-sm">
              Confirmed {instruction.receipt.confirmedAt.toLocaleString("en-GB")}
            </p>
          </>
        ) : (
          <p className="muted">Awaiting partner confirmation.</p>
        )}
        <p className="rounded-xl bg-warning-soft px-3 py-2 text-sm text-warning">
          Funds moved: no. This is a demo execution rail for consent, audit and partner handshake
          testing.
        </p>
      </Panel>
      <Link href="/app/executions" className="btn btn-ghost mt-4 w-full">
        All executions
      </Link>
    </main>
  );
}
