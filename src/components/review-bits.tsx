import Link from "next/link";
import type { Review } from "@/lib/db/schema";
import { formatDate, formatScore, RELEASE_TYPE_LABEL, scoreTone } from "@/lib/format";

const BOX_TONE = {
  high: "bg-score-high text-white",
  mid: "bg-score-mid text-ink",
  low: "bg-score-low text-white",
  none: "bg-surface-2 text-muted",
} as const;

const BAR_TONE = { high: "bg-score-high", mid: "bg-score-mid", low: "bg-score-low", none: "bg-line" } as const;

const SIZE_CLASS = {
  xs: "h-6 min-w-8 px-1 text-xs",
  sm: "h-8 min-w-10 px-1.5 text-sm",
  md: "h-11 min-w-14 px-2 text-xl",
  lg: "h-20 min-w-24 px-3 text-5xl",
} as const;

/** Solid coloured score box (green / yellow / red). */
export function ScoreBadge({
  score,
  size = "sm",
  className = "",
}: {
  score: number | null | undefined;
  size?: keyof typeof SIZE_CLASS;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-[3px] font-extrabold tabular-nums ${BOX_TONE[scoreTone(score)]} ${SIZE_CLASS[size]} ${className}`}
      aria-label={score == null ? "Not rated" : `Score ${formatScore(score)} out of 10`}
    >
      {formatScore(score)}
    </span>
  );
}

/** Thin horizontal bar showing a 0–10 score. */
export function ScoreBar({ score, className = "" }: { score: number | null | undefined; className?: string }) {
  return (
    <div className={`h-1.5 overflow-hidden rounded-full bg-line ${className}`}>
      <div className={`h-full ${BAR_TONE[scoreTone(score)]}`} style={{ width: `${(score ?? 0) * 10}%` }} />
    </div>
  );
}

export function Cover({ src, alt, className = "" }: { src: string | null | undefined; alt: string; className?: string }) {
  if (!src) {
    return (
      <div
        className={`flex aspect-square w-full items-center justify-center bg-surface-2 text-3xl font-black text-muted/50 ${className}`}
        role="img"
        aria-label={alt}
      >
        {alt.slice(0, 1).toUpperCase()}
      </div>
    );
  }
  // Plain <img>: covers come from arbitrary hosts pasted in the admin panel.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} loading="lazy" className={`aspect-square w-full object-cover ${className}`} />;
}

export function TypePill({ type }: { type: Review["type"] }) {
  return <span className="text-[11px] font-semibold tracking-wider text-muted uppercase">{RELEASE_TYPE_LABEL[type]}</span>;
}

/** Album tile: cover, artist, title, then score + bar underneath. */
export function AlbumBlock({ review, showDate = false }: { review: Review; showDate?: boolean }) {
  return (
    <div className="group min-w-0">
      <Link href={`/reviews/${review.slug}`} className="relative block border border-line bg-surface-2">
        <Cover src={review.coverUrl} alt={`${review.title} cover`} />
        {review.featured && (
          <span className="absolute top-1.5 left-1.5 rounded-[2px] bg-accent px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-white uppercase">
            Essential
          </span>
        )}
      </Link>
      <div className="mt-1.5 space-y-0.5 leading-tight">
        <Link href={`/artists/${review.artistSlug}`} className="block truncate text-[13px] font-bold hover:text-accent hover:underline">
          {review.artist}
        </Link>
        <Link href={`/reviews/${review.slug}`} className="block truncate text-[13px] hover:text-accent hover:underline">
          {review.title}
        </Link>
        {showDate && (
          <p className="text-[11px] text-muted">
            {RELEASE_TYPE_LABEL[review.type]} · {formatDate(review.publishedAt)}
          </p>
        )}
      </div>
      <div className="mt-1.5 flex items-center gap-2">
        <span className="w-7 text-[15px] font-extrabold tabular-nums">{formatScore(review.score)}</span>
        <div className="flex-1">
          <p className="text-[9px] font-semibold tracking-wider text-muted uppercase">AItunes score</p>
          <ScoreBar score={review.score} className="mt-0.5" />
        </div>
      </div>
    </div>
  );
}

export function AlbumGrid({ reviews, showDate, cols = "wide" }: { reviews: Review[]; showDate?: boolean; cols?: "wide" | "narrow" }) {
  const grid =
    cols === "wide"
      ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
      : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4";
  return (
    <div className={`grid gap-x-4 gap-y-6 ${grid}`}>
      {reviews.map((r) => (
        <AlbumBlock key={r.id} review={r} showDate={showDate} />
      ))}
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="panel px-6 py-12 text-center">
      <p className="text-base font-bold">{title}</p>
      {children && <div className="mt-1 text-muted">{children}</div>}
    </div>
  );
}

export function GridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="animate-pulse space-y-2">
          <div className="aspect-square bg-line/60" />
          <div className="h-3 w-3/4 bg-line/60" />
          <div className="h-3 w-1/2 bg-line/60" />
        </div>
      ))}
    </div>
  );
}

export function SectionHeader({ title, href, linkLabel = "View all" }: { title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="section-title mb-4 flex items-end justify-between">
      <h2>{title}</h2>
      {href && (
        <Link href={href} className="text-[11px] font-semibold tracking-wider text-muted hover:text-accent">
          {linkLabel} ›
        </Link>
      )}
    </div>
  );
}

/** Compact ranked row used in sidebars and the artist leaderboard. */
export function RankRow({
  rank,
  href,
  cover,
  title,
  subtitle,
  score,
}: {
  rank: number;
  href: string;
  cover: string | null;
  title: string;
  subtitle: string;
  score: number;
}) {
  return (
    <Link href={href} className="flex items-center gap-3 py-2 hover:bg-surface-2">
      <span className="w-5 text-right text-[13px] font-bold text-muted tabular-nums">{rank}</span>
      <div className="w-11 shrink-0 border border-line">
        <Cover src={cover} alt={title} />
      </div>
      <div className="min-w-0 flex-1 leading-tight">
        <p className="truncate text-[13px] font-bold">{title}</p>
        <p className="truncate text-xs text-muted">{subtitle}</p>
      </div>
      <ScoreBadge score={score} size="xs" />
    </Link>
  );
}
