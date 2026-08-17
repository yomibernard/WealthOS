import Link from "next/link";

const story = [
  {
    id: "see",
    title: "See your complete wealth",
    body: "One calm view of cash, property, investments, pension, business interests, and liabilities — estimated, labelled, and honest about confidence.",
  },
  {
    id: "health",
    title: "Understand your financial health",
    body: "Wealth Health diagnoses liquidity, debt, diversification, goals, protection, retirement, and estate readiness before any product pitch.",
  },
  {
    id: "ai",
    title: "Ask WealthAI",
    body: "WealthAI explains what the engines calculated — never invents balances, returns, or licence status. Consent comes first.",
  },
  {
    id: "plan",
    title: "Plan your future",
    body: "Goals, scenarios, and a Digital Twin let you pressure-test retirement age, contributions, and affordability before you commit.",
  },
  {
    id: "guard",
    title: "Check investments with WealthGuard",
    body: "WealthGuard reviews offers carefully. It never auto-labels something a scam or safe — it surfaces gaps that deserve human attention.",
  },
  {
    id: "human",
    title: "Human adviser support",
    body: "Adviser care acknowledgments and ops reminds keep people in the loop without closing formal support or privacy queues.",
  },
  {
    id: "trust",
    title: "Trust and security",
    body: "Consent, privacy, passkeys, and Trust Centre controls make clear what is personalised, what is simulated demo, and what stays on your device.",
  },
];

export default function LandingPage() {
  return (
    <main className="landing">
      <section className="landing-hero" aria-labelledby="landing-brand">
        <div className="landing-hero-bg" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/homepage-background.png"
            alt=""
            className="landing-hero-photo"
          />
          <div className="landing-hero-scrim" />
        </div>

        <header className="landing-topbar">
          <Link href="/" className="landing-topbar-brand">
            WealthOS
          </Link>
          <nav className="landing-topbar-auth" aria-label="Account">
            <Link href="/auth/sign-in" className="landing-auth-link">
              Sign in
            </Link>
            <Link href="/auth/sign-up" className="landing-auth-btn">
              Register
            </Link>
          </nav>
        </header>

        <div className="landing-hero-inner">
          <h1 id="landing-brand" className="hero-brand">
            WealthOS
          </h1>
          <p className="landing-promise">
            Your wealth deserves more than another investment app.
          </p>
          <p className="landing-support">
            Know what you have. Know where you&apos;re going. Know what to do next.
          </p>
          <div className="landing-cta">
            <Link href="/wealth-check" className="btn btn-accent">
              Check my wealth
            </Link>
          </div>
          <div className="landing-cta-secondary-row">
            <a href="#how-it-works" className="btn btn-ghost landing-cta-secondary">
              See how WealthOS works
            </a>
          </div>
          <p className="landing-note">
            Diagnosis before products · Demo rails labelled simulated
          </p>
        </div>
      </section>

      <section id="how-it-works" className="landing-story" aria-labelledby="story-heading">
        <div className="landing-story-inner">
          <h2 id="story-heading" className="landing-story-title">
            How WealthOS works
          </h2>
          <p className="landing-story-lead">
            A personal wealth operating system — not a product shelf.
          </p>
          <ol className="landing-chapters">
            {story.map((chapter, i) => (
              <li key={chapter.id} className="landing-chapter">
                <span className="landing-chapter-num" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3>{chapter.title}</h3>
                  <p>{chapter.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="landing-finale" aria-labelledby="finale-heading">
        <div className="landing-finale-inner">
          <h2 id="finale-heading" className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Start with a free Wealth Check
          </h2>
          <p className="muted mt-3 max-w-lg text-base leading-relaxed">
            In minutes you can see an estimated snapshot, health cues, and what deserves attention —
            without being pushed into products first.
          </p>
          <div className="landing-cta mt-6">
            <Link href="/wealth-check" className="btn btn-accent">
              Check my wealth
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
