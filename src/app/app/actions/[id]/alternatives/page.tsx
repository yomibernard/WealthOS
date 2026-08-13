import { redirect } from "next/navigation";
import { PageHeader, Panel } from "@/components/ui";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/db";

export default async function AlternativesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/auth/sign-in");
  const rec = await prisma.recommendation.findFirst({ where: { id, userId: user.id } });
  if (!rec) redirect("/app/actions");
  const alternatives = JSON.parse(rec.alternativesJson || "[]") as string[];

  return (
    <main>
      <PageHeader title="Alternatives" subtitle={`Other reasonable options to “${rec.title}”.`} />
      <Panel>
        <ul className="list-disc space-y-2 pl-5">
          {alternatives.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
      </Panel>
    </main>
  );
}
