import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="app-shell">
      <div className="page flex min-h-[100dvh] flex-col justify-between py-8">
        <div className="animate-rise">
          <p className="eyebrow">Nigeria-first wealth intelligence</p>
          <h1 className="hero-brand mt-4">WealthOS</h1>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-ink-soft">
            Know what you have. Know where you are going. Know what to do next.
          </p>
          <p className="muted mt-4 max-w-md leading-relaxed">
            A calm personal wealth operating system — not another product shelf. See your
            estimated net worth, diagnose financial health, and get explainable next actions.
          </p>
        </div>

        <div className="animate-rise-delay space-y-3 pb-4">
          <Link href="/wealth-check" className="btn btn-accent w-full">
            Start free Wealth Check
          </Link>
          <Link href="/auth/sign-in" className="btn btn-ghost w-full">
            Sign in
          </Link>
          <p className="muted text-center text-sm">
            Demo ready · No investment products pushed before diagnosis
          </p>
        </div>
      </div>
    </main>
  );
}
