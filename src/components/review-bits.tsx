import Link from "next/link";
import type { Review } from "@/lib/db/schema";
import { formatDate, formatScore, parseList, RELEASE_TYPE_LABEL } from "@/lib/format";

const SIZE_CLASS = {
  xs: "h-8 w-8 text-[11px] border",
  sm: "h-10 w-10 text-[13px] border-[1.5px]",
  md: "h-14 w-14 text-lg border-2",
  lg: "h-24 w-24 text-3xl border-[3px]",
  xl: "h-32 w-32 text-5xl border-4 sm:h-40 sm:w-40 sm:text-6xl",
} as const;

/** Score in a black outlined circle, like the AItunes Reviews share cards. */
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
      className={`inline-flex shrink-0 items-center justify-center rounded-full border-ink bg-white font-bold tabular-nums ${score == null ? "text-muted" : "text-ink"} ${SIZE_CLASS[size]} ${className}`}
      aria-label={score == null ? "Not rated" : `Score ${formatScore(score)} out of 10`}
    >
      {formatScore(score)}
    </span>
  );
}

export function Cover({ src, alt, className = "" }: { src: string | null | undefined; alt: string; className?: string }) {
  if (!src) {
    return (
      <div
        className={`flex aspect-square w-full items-center justify-center bg-surface-2 font-serif text-4xl font-black text-muted/40 italic ${className}`}
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
  return <span className="text-[11px] font-bold tracking-[0.12em] text-muted uppercase">{RELEASE_TYPE_LABEL[type]}</span>;
}

export function EssentialTag({ className = "" }: { className?: string }) {
  return <span className={`text-[11px] font-bold tracking-[0.14em] text-accent uppercase ${className}`}>Essential</span>;
}

/** Album tile: cover, artist, italic title, genre/date line and score circle. */
export function AlbumBlock({ review, showDate = false }: { review: Review; showDate?: boolean }) {
  const genre = parseList(review.genres)[0];
  return (
    <div className="group min-w-0">
      <Link href={`/reviews/${review.slug}`} className="block">
        <Cover src={review.coverUrl} alt={`${review.title} cover`} className="transition group-hover:opacity-90" />
      </Link>
      <div className="mt-3 flex items-start gap-3">
        <div className="min-w-0 flex-1 leading-snug">
          {review.featured && <EssentialTag className="block" />}
          <Link href={`/artists/${review.artistSlug}`} className="block truncate text-[14px] font-bold hover:underline">
            {review.artist}
          </Link>
          <Link href={`/reviews/${review.slug}`} className="block truncate font-serif text-[16px] italic hover:underline">
            {review.title}
          </Link>
          <p className="mt-1 truncate text-[10px] font-bold tracking-[0.12em] text-muted uppercase">
            {[RELEASE_TYPE_LABEL[review.type], genre, showDate && formatDate(review.publishedAt)].filter(Boolean).join(" · ")}
          </p>
        </div>
        <ScoreBadge score={review.score} size="sm" />
      </div>
    </div>
  );
}

export function AlbumGrid({ reviews, showDate, cols = "wide" }: { reviews: Review[]; showDate?: boolean; cols?: "wide" | "narrow" }) {
  const grid =
    cols === "wide" ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5" : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4";
  return (
    <div className={`grid gap-x-5 gap-y-8 ${grid}`}>
      {reviews.map((r) => (
        <AlbumBlock key={r.id} review={r} showDate={showDate} />
      ))}
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="border-y border-line px-6 py-12 text-center">
      <p className="headline text-2xl">{title}</p>
      {children && <div className="mt-2 text-muted">{children}</div>}
    </div>
  );
}

export function GridSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="animate-pulse space-y-2">
          <div className="aspect-square bg-surface-2" />
          <div className="h-3 w-3/4 bg-surface-2" />
          <div className="h-3 w-1/2 bg-surface-2" />
        </div>
      ))}
    </div>
  );
}

export function SectionHeader({ title, href, linkLabel = "View all" }: { title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="section-title mb-5 flex items-end justify-between">
      <h2>{title}</h2>
      {href && (
        <Link href={href} className="text-[11px] text-muted hover:text-ink">
          {linkLabel} →
        </Link>
      )}
    </div>
  );
}

/** Compact ranked row used in sidebars. */
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
    <Link href={href} className="group flex items-center gap-3 py-2.5">
      <span className="w-5 text-right text-[15px] font-bold text-muted tabular-nums">{rank}</span>
      <div className="w-11 shrink-0">
        <Cover src={cover} alt={title} />
      </div>
      <div className="min-w-0 flex-1 leading-tight">
        <p className="truncate text-[13px] font-bold group-hover:underline">{title}</p>
        <p className="truncate text-xs text-muted">{subtitle}</p>
      </div>
      <ScoreBadge score={score} size="xs" />
    </Link>
  );
}
