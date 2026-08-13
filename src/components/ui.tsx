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
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <Panel className="text-center">
      <h2 className="font-display text-xl">{title}</h2>
      <p className="muted mt-2">{body}</p>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
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
