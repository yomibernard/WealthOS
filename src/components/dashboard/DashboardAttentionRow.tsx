import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  RefreshCw,
  Shield,
  Sparkles,
  AlertCircle,
} from "lucide-react";

const ICONS = [CalendarClock, Shield, RefreshCw, AlertCircle, Sparkles];

export type AttentionItem = {
  id: string;
  title: string;
  detail: string;
  href: string;
};

export function DashboardAttentionRow({ items }: { items: AttentionItem[] }) {
  const cards = items.slice(0, 3);
  if (!cards.length) return null;

  return (
    <section className="dash-section">
      <h2 className="dash-section-title">Needs your attention</h2>
      <div className="dash-attention-grid">
        {cards.map((item, i) => {
          const Icon = ICONS[i % ICONS.length];
          return (
            <article key={item.id} className="dash-card dash-attention-card">
              <div className="dash-attention-icon" aria-hidden>
                <Icon size={18} />
              </div>
              <h3 className="mt-3 font-semibold leading-snug">{item.title}</h3>
              <p className="muted mt-2 text-sm leading-relaxed line-clamp-3">{item.detail}</p>
              <Link href={item.href} className="btn btn-soft mt-4 inline-flex items-center gap-2">
                Review
                <ArrowRight size={16} aria-hidden />
              </Link>
            </article>
          );
        })}
      </div>
    </section>
  );
}
