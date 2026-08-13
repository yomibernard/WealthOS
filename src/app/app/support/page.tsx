import { PageHeader, Panel } from "@/components/ui";
import Link from "next/link";

export default function SupportPage() {
  return (
    <main>
      <PageHeader
        title="Support & complaints"
        subtitle="Human escalation when AI confidence is low, complexity rises, or you simply want a person."
      />
      <Panel className="space-y-3">
        <p>Escalation levels:</p>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li>L0 Self-service</li>
          <li>L1 WealthAI</li>
          <li>L2 Support specialist</li>
          <li>L3 Regulated financial adviser</li>
          <li>L4 Specialist professional</li>
          <li>L5 Private wealth adviser</li>
        </ul>
        <Link href="/app/adviser-request" className="btn btn-accent mt-2 w-full">
          Escalate to an adviser
        </Link>
      </Panel>
    </main>
  );
}
