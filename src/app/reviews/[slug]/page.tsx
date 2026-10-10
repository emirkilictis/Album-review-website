import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Cover, ScoreBadge, ScoreBar } from "@/components/review-bits";
import type { ReviewWithTracks } from "@/lib/db/schema";
import { excerpt, formatDate, formatScore, RELEASE_TYPE_LABEL } from "@/lib/format";
import { averageTrackRating, getReviewBySlug } from "@/lib/queries";
import { SITE } from "@/lib/site";

export async function generateMetadata(props: PageProps<"/reviews/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const review = await getReviewBySlug(slug);
  if (!review) return { title: "Review not found" };
  const title = `${review.artist} – ${review.title} review`;
  const description = excerpt(review.summary || review.body, 200);
  return {
    title,
    description,
    alternates: { canonical: `/reviews/${review.slug}` },
    openGraph: {
      type: "article",
      title,
      description,
      publishedTime: review.publishedAt,
      images: review.coverUrl ? [{ url: review.coverUrl }] : undefined,
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default function ReviewPage(props: PageProps<"/reviews/[slug]">) {
  return (
    <Suspense fallback={<ReviewSkeleton />}>
      <ReviewContent params={props.params} />
    </Suspense>
  );
}

async function ReviewContent({ params }: { params: PageProps<"/reviews/[slug]">["params"] }) {
  const { slug } = await params;
  const review = await getReviewBySlug(slug);
  if (!review) notFound();

  const trackAvg = averageTrackRating(review.tracks);
  const paragraphs = review.body.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const details: [string, React.ReactNode][] = [
    ["Release Date", review.releaseDate ? formatDate(review.releaseDate) : "—"],
    ["Format", RELEASE_TYPE_LABEL[review.type]],
    ["Tracks", review.tracks.length || "—"],
    ["Reviewed", formatDate(review.publishedAt)],
    ["Reviewer", review.author],
  ];

  return (
    <article className="panel grid gap-6 p-4 sm:p-6 md:grid-cols-[260px_minmax(0,1fr)] md:grid-rows-[auto_1fr]">
      <JsonLd review={review} />

      <div className="space-y-4 md:col-start-1 md:row-start-1">
        <div className="border border-line">
          <Cover src={review.coverUrl} alt={`${review.title} cover`} />
        </div>
        <dl className="divide-y divide-line border-y border-line text-[13px]">
          {details.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-3 py-1.5">
              <dt className="text-muted">{label}</dt>
              <dd className="text-right font-semibold">{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="min-w-0 space-y-5 md:col-start-2 md:row-span-2 md:row-start-1">
        <header className="space-y-1">
          <Link href={`/artists/${review.artistSlug}`} className="text-lg font-bold hover:text-accent hover:underline">
            {review.artist}
          </Link>
          <h1 className="text-3xl leading-tight font-extrabold sm:text-4xl">{review.title}</h1>
          {review.featured && (
            <span className="inline-block rounded-[2px] bg-accent px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-white uppercase">
              Essential
            </span>
          )}
        </header>

        <div className="flex flex-wrap items-stretch gap-4 border-y border-line py-4">
          <div className="flex items-center gap-4">
            <span className="text-5xl font-black tabular-nums">{formatScore(review.score)}</span>
            <div className="w-40">
              <p className="text-[11px] font-bold tracking-wider text-muted uppercase">AItunes score</p>
              <ScoreBar score={review.score} className="mt-1 !h-2" />
              <p className="mt-1 text-[11px] text-muted">out of 10</p>
            </div>
          </div>
          {trackAvg != null && (
            <div className="flex items-center gap-3 border-line sm:border-l sm:pl-4">
              <ScoreBadge score={trackAvg} size="md" />
              <div>
                <p className="text-[11px] font-bold tracking-wider text-muted uppercase">Track average</p>
                <p className="text-[11px] text-muted">{review.tracks.filter((t) => t.rating != null).length} rated tracks</p>
              </div>
            </div>
          )}
        </div>

        {review.summary && <p className="text-lg leading-snug font-semibold">{review.summary}</p>}
        <div className="space-y-4 text-[15px] leading-relaxed text-ink/90">
          {paragraphs.map((p, i) => (
            <p key={i} className="whitespace-pre-line">
              {p}
            </p>
          ))}
        </div>
        <p className="text-xs text-muted">
          By <span className="font-semibold text-ink">{review.author}</span> · {formatDate(review.publishedAt)}
        </p>
      </div>

      {review.tracks.length > 0 && (
        <section className="self-start md:col-start-1 md:row-start-2">
          <h2 className="section-title mb-1">Tracklist</h2>
          <ol className="divide-y divide-line text-[13px]">
            {review.tracks.map((t) => (
              <li key={t.id} className="flex items-center gap-2 py-1.5">
                <span className="w-5 shrink-0 text-right text-muted tabular-nums">{t.position}</span>
                <span className="min-w-0 flex-1 truncate" title={t.title}>
                  {t.title}
                  {t.standout && (
                    <span className="ml-1 text-accent" title="Standout track" aria-label="Standout track">
                      ★
                    </span>
                  )}
                </span>
                <ScoreBadge score={t.rating} size="xs" />
              </li>
            ))}
          </ol>
          <p className="mt-2 text-[11px] text-muted">
            <span className="text-accent">★</span> Standout track
          </p>
        </section>
      )}
    </article>
  );
}

function JsonLd({ review }: { review: ReviewWithTracks }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Review",
    url: `${SITE.url}/reviews/${review.slug}`,
    datePublished: review.publishedAt,
    author: { "@type": "Organization", name: review.author },
    publisher: { "@type": "Organization", name: SITE.name, url: SITE.url },
    reviewRating: { "@type": "Rating", ratingValue: review.score, bestRating: 10, worstRating: 0 },
    reviewBody: review.body,
    itemReviewed: {
      "@type": "MusicAlbum",
      name: review.title,
      image: review.coverUrl ?? undefined,
      byArtist: { "@type": "MusicGroup", name: review.artist },
      datePublished: review.releaseDate ?? undefined,
      numTracks: review.tracks.length || undefined,
    },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

function ReviewSkeleton() {
  return (
    <div className="panel grid animate-pulse gap-6 p-6 md:grid-cols-[260px_minmax(0,1fr)]">
      <div className="aspect-square bg-line/60" />
      <div className="space-y-3">
        <div className="h-5 w-40 bg-line/60" />
        <div className="h-9 w-2/3 bg-line/60" />
        <div className="h-16 w-64 bg-line/60" />
      </div>
    </div>
  );
}
