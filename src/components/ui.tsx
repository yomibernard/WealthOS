import { clsx } from "clsx";
import {
  Children,
  cloneElement,
  isValidElement,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactElement,
  type ReactNode,
} from "react";

export function Panel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={clsx("panel p-4 sm:p-5", className)}>{children}</section>;
}

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "accent" | "ghost" | "soft";
}) {
  return (
    <button
      className={clsx(
        "btn",
        variant === "primary" && "btn-primary",
        variant === "accent" && "btn-accent",
        variant === "ghost" && "btn-ghost",
        variant === "soft" && "btn-soft",
        className,
      )}
      {...props}
    />
  );
}

export function Field({
  label,
  id,
  hint,
  error,
  children,
}: {
  label: string;
  id: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  const control = Children.map(children, (child) => {
    if (!isValidElement(child)) return child;
    return cloneElement(child as ReactElement<Record<string, unknown>>, {
      id,
      "aria-describedby": describedBy,
      "aria-invalid": error ? true : undefined,
    });
  });

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {control}
      {hint ? (
        <p id={hintId} className="muted text-sm">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="mt-1 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} />;
}

export function Badge({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: "default" | "warn" | "danger";
}) {
  return (
    <span
      className={clsx(
        "badge",
        tone === "warn" && "badge-warn",
        tone === "danger" && "badge-danger",
      )}
    >
      {children}
    </span>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <header className="mb-5 flex items-start justify-between gap-3 animate-rise">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">{title}</h1>
        {subtitle ? <p className="muted mt-1 text-[0.98rem] leading-relaxed">{subtitle}</p> : null}
      </div>
      {action}
    </header>
  );
}

export function EmptyState({
  title,
  body,
  action,
  secondary,
}: {
  title: string;
  body: string;
  action?: ReactNode;
  secondary?: ReactNode;
}) {
  return (
    <Panel className="text-center">
      <h2 className="font-display text-xl">{title}</h2>
      <p className="muted mt-2 leading-relaxed">{body}</p>
      {action ? <div className="mt-4 flex flex-wrap justify-center gap-2">{action}</div> : null}
      {secondary ? <div className="mt-3 flex justify-center">{secondary}</div> : null}
    </Panel>
  );
}

export function Metric({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div>
      <p className="eyebrow">{label}</p>
      <p className="font-display mt-1 text-3xl font-semibold tracking-tight">{value}</p>
      {hint ? <p className="muted mt-1 text-sm">{hint}</p> : null}
    </div>
  );
}

/** Primary financial figure — net worth, large balances */
export function HeroMetric({
  label,
  value,
  hint,
  children,
  className,
}: {
  label: string;
  value: string;
  hint?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section className={clsx("hero-metric", className)}>
      <p className="eyebrow">{label}</p>
      <p className="font-display mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">{value}</p>
      {hint ? <div className="mt-3 flex flex-wrap items-center gap-2">{hint}</div> : null}
      {children}
    </section>
  );
}

/** Deterministic / AI-grounded insight copy */
export function InsightPanel({
  eyebrow = "Insight",
  children,
  className,
}: {
  eyebrow?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <aside className={clsx("insight-panel", className)}>
      <p className="eyebrow">{eyebrow}</p>
      <div className="mt-2 text-[0.98rem] leading-relaxed text-ink-soft">{children}</div>
    </aside>
  );
}

/** Next-best action / attention block */
export function ActionCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={clsx("action-card", className)}>{children}</section>;
}

/** Tangible wealth item */
export function AssetTile({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <article className={clsx("asset-tile", className)}>{children}</article>;
}

/** Goal progress surface */
export function GoalCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={clsx("goal-card", className)}>{children}</section>;
}

/** Material concern — not shame */
export function RiskAlert({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <aside className={clsx("risk-alert", className)} role="status">
      {children}
    </aside>
  );
}

/** Secondary / deferred detail */
export function SupportingPanel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={clsx("supporting-panel", className)}>{children}</section>;
}

export function ProgressBar({ value, label }: { value: number; label?: string }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div>
      {label ? (
        <div className="mb-1 flex justify-between text-sm">
          <span>{label}</span>
          <span className="muted">{Math.round(v)}%</span>
        </div>
      ) : null}
      <div
        className="h-2 rounded-full bg-line"
        role="progressbar"
        aria-valuenow={v}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? "Progress"}
      >
        <div className="h-2 rounded-full bg-accent transition-all" style={{ width: `${v}%` }} />
      </div>
    </div>
  );
}
