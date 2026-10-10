import type { Metadata } from "next";
import { ScoreBadge } from "@/components/review-bits";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "About", description: `About ${SITE.name} and how we score releases.` };

// Placeholder copy — the AItunes team should rewrite this in their own words.
const SCALE = [
  { score: 9.5, label: "9.0 – 10", text: "A landmark. Essential listening." },
  { score: 8, label: "7.0 – 8.9", text: "Great record, recommended without hesitation." },
  { score: 6, label: "5.0 – 6.9", text: "Decent, with clear highs and lows." },
  { score: 3.5, label: "0 – 4.9", text: "Misses more than it hits." },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-10">
      <header className="space-y-4">
        <h1 className="headline text-5xl">About {SITE.name}</h1>
        <p className="font-serif text-[18px] leading-[1.7]">
          {SITE.name} is a music publication dedicated to AI-generated music. We listen to every release in full and review
          albums, EPs and singles from AI music artists, with a score for the release and a rating for every track.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="section-title">How we score</h2>
        <p className="text-muted">
          Every review gets a score from 0 to 10 (one decimal). Track ratings use the same scale. The score reflects the
          release as a whole, so it is not simply the average of the track ratings.
        </p>
        <ul className="divide-y divide-line border-y border-line">
          {SCALE.map((s) => (
            <li key={s.label} className="flex items-center gap-4 py-3">
              <ScoreBadge score={s.score} size="sm" />
              <div>
                <p className="font-semibold">{s.label}</p>
                <p className="text-sm text-muted">{s.text}</p>
              </div>
            </li>
          ))}
        </ul>
        <p className="text-sm text-muted">
          Releases marked <span className="font-semibold text-accent">Essential</span> are our editors&apos; picks.
        </p>
      </section>
    </div>
  );
}
