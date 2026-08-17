import Link from "next/link";

const story = [
  {
    id: "see",
    title: "See everything",
    body: "One calm view of cash, property, investments, pension, business interests, and liabilities — estimated, labelled, and honest about confidence.",
  },
  {
    id: "understand",
    title: "Understand what it means",
    body: "Wealth Health diagnoses liquidity, debt, diversification, goals, protection, retirement, and estate readiness before any product pitch.",
  },
  {
    id: "decide",
    title: "Make better decisions",
    body: "WealthAI explains what the engines calculated — never invents balances, returns, or licence status. Consent comes first.",
  },
  {
    id: "plan",
    title: "Plan your future",
    body: "Goals, scenarios, and a Digital Twin let you pressure-test retirement age, contributions, and affordability before you commit.",
  },
  {
    id: "guard",
    title: "Check before investing",
    body: "WealthGuard reviews offers carefully. It never auto-labels something a scam or safe — it surfaces gaps that deserve human attention.",
  },
  {
    id: "human",
    title: "Human help when needed",
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
        <div className="landing-hero-inner">
          <p className="eyebrow landing-eyebrow">Nigeria-first wealth intelligence</p>
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
            <a href="#how-it-works" className="btn btn-ghost">
              See how WealthOS works
            </a>
          </div>
          <p className="muted landing-note">
            Diagnosis before products · Demo rails labelled simulated
          </p>
        </div>
        <div className="landing-hero-visual" aria-hidden="true">
          <svg viewBox="0 0 640 420" className="landing-curve" role="presentation">
            <defs>
              <linearGradient id="landFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0f6e56" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#0f6e56" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d="M0 280 C80 250 120 300 180 240 C240 180 280 200 340 160 C400 120 460 150 520 110 C560 85 600 90 640 70 L640 420 L0 420 Z"
              fill="url(#landFill)"
            />
            <path
              d="M0 280 C80 250 120 300 180 240 C240 180 280 200 340 160 C400 120 460 150 520 110 C560 85 600 90 640 70"
              fill="none"
              stroke="#0f6e56"
              strokeWidth="3"
              strokeLinecap="round"
              className="landing-curve-line"
            />
          </svg>
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
            <Link href="/auth/sign-in" className="btn btn-ghost">
              Sign in
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
