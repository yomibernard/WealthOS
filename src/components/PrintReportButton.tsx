"use client";

import { Button } from "@/components/ui";

export function PrintReportButton() {
  return (
    <Button type="button" variant="soft" className="print:hidden" onClick={() => window.print()}>
      Print / save PDF
    </Button>
  );
}
