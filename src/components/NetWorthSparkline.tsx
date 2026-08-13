import { sparklinePath } from "@/engines/report-insights";

export function NetWorthSparkline({
  values,
  label = "Net worth trend",
}: {
  values: number[];
  label?: string;
}) {
  if (values.length < 2) {
    return <p className="muted text-sm">Trend appears after two or more reports.</p>;
  }
  const d = sparklinePath(values);
  return (
    <figure className="report-sparkline" aria-label={label}>
      <svg viewBox="0 0 100 32" className="h-12 w-full" role="img">
        <title>{label}</title>
        <path d={d} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </figure>
  );
}
