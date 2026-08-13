export function formatNaira(amount: number, compact = false): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";
  if (compact) {
    if (abs >= 1_000_000_000) return `${sign}₦${(abs / 1_000_000_000).toFixed(1)}bn`;
    if (abs >= 1_000_000) return `${sign}₦${(abs / 1_000_000).toFixed(1)}m`;
    if (abs >= 1_000) return `${sign}₦${(abs / 1_000).toFixed(0)}k`;
  }
  return (
    sign +
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(abs)
  );
}

export function formatCurrency(amount: number, currency: string, compact = false): string {
  if (currency === "NGN") return formatNaira(amount, compact);
  const abs = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";
  if (compact && abs >= 1_000_000) {
    return `${sign}${currency} ${(abs / 1_000_000).toFixed(2)}m`;
  }
  return (
    sign +
    new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(abs)
  );
}

export function formatPercent(value: number, digits = 0): string {
  return `${value.toFixed(digits)}%`;
}

export function greetingForHour(hour: number, name: string): string {
  if (hour < 12) return `Good morning, ${name}`;
  if (hour < 17) return `Good afternoon, ${name}`;
  return `Good evening, ${name}`;
}

export function daysSince(date: Date, now = new Date()): number {
  return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
}

export function provenanceLabel(
  source: string,
  verification: string,
  lastValuation: Date,
  now = new Date(),
): string {
  const ageDays = daysSince(lastValuation, now);
  if (source === "CONNECTED" && verification === "VERIFIED") {
    if (ageDays === 0) return "Verified today";
    if (ageDays === 1) return "Verified yesterday";
    return `Verified ${ageDays} days ago`;
  }
  if (verification === "ESTIMATED") {
    if (ageDays > 180) return `Customer estimate, ${Math.round(ageDays / 30)} months old`;
    return "Estimated";
  }
  if (ageDays > 90) return `Stale · ${Math.round(ageDays / 30)} months old`;
  return source === "MANUAL" ? "Customer entered" : source.toLowerCase();
}
