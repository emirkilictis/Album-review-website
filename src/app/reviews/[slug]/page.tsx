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
  const ratedCount = review.tracks.filter((t) => t.rating != null).length;
  const paragraphs = review.body.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const details = [
    RELEASE_TYPE_LABEL[review.type],
    review.releaseDate && `Released ${formatDate(review.releaseDate)}`,
    review.tracks.length > 1 && `${review.tracks.length} tracks`,
  ].filter(Boolean);

  return (
    <article className="panel space-y-8 p-4 sm:p-6">
      <JsonLd review={review} />

      <div className="grid gap-6 md:grid-cols-[300px_minmax(0,1fr)]">
        <div className="self-start border border-line">
          <Cover src={review.coverUrl} alt={`${review.title} cover`} />
        </div>

        <div className="min-w-0 space-y-5">
          <header className="space-y-1">
            <Link href={`/artists/${review.artistSlug}`} className="text-lg font-bold hover:text-accent hover:underline">
              {review.artist}
            </Link>
            <h1 className="text-3xl leading-tight font-extrabold sm:text-4xl">{review.title}</h1>
            <p className="flex flex-wrap items-center gap-x-2 text-[13px] text-muted">
              {details.join(" · ")}
              {review.featured && (
                <span className="rounded-[2px] bg-accent px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-white uppercase">
                  Essential
                </span>
              )}
            </p>
          </header>

          <div className="flex flex-wrap items-center gap-5 border-y border-line py-4">
            <ScoreBadge score={review.score} size="xl" />
            <div className="w-44">
              <p className="text-[11px] font-bold tracking-wider text-muted uppercase">AItunes score</p>
              <ScoreBar score={review.score} className="mt-1 !h-2" />
              <p className="mt-1 text-[11px] text-muted">out of 10</p>
            </div>
            {trackAvg != null && ratedCount > 1 && (
              <div className="border-line sm:border-l sm:pl-5">
                <p className="text-[11px] font-bold tracking-wider text-muted uppercase">Track average</p>
                <p className="text-2xl font-extrabold tabular-nums">{formatScore(trackAvg)}</p>
                <p className="text-[11px] text-muted">{ratedCount} rated tracks</p>
              </div>
            )}
          </div>

          {review.summary && <p className="text-lg leading-snug font-semibold">{review.summary}</p>}
          {paragraphs.length > 0 && (
            <div className="space-y-4 text-[15px] leading-relaxed text-ink/90">
              {paragraphs.map((p, i) => (
                <p key={i} className="whitespace-pre-line">
                  {p}
                </p>
              ))}
            </div>
          )}
          <p className="text-xs text-muted">
            By <span className="font-semibold text-ink">{review.author}</span> · {formatDate(review.publishedAt)}
          </p>
        </div>
      </div>

      {review.tracks.length > 0 && (
        <section>
          <h2 className="section-title mb-1 flex items-end justify-between">
            <span>Tracklist</span>
            <span className="text-[11px] font-semibold tracking-wider text-muted">Rating</span>
          </h2>
          <ol className="divide-y divide-line">
            {review.tracks.map((t) => (
              <li key={t.id} className="grid grid-cols-[1.75rem_minmax(0,1fr)_auto] items-center gap-3 py-2 sm:grid-cols-[2rem_minmax(0,1fr)_12rem_auto]">
                <span className="text-right text-[13px] text-muted tabular-nums">{t.position}</span>
                <span className="min-w-0 truncate text-[15px]" title={t.title}>
                  {t.title}
                  {t.standout && (
                    <span className="ml-1.5 text-accent" title="Standout track" aria-label="Standout track">
                      ★
                    </span>
                  )}
                </span>
                <ScoreBar score={t.rating} className="hidden sm:block" />
                <ScoreBadge score={t.rating} size="sm" />
              </li>
            ))}
          </ol>
          {review.tracks.some((t) => t.standout) && (
            <p className="mt-2 text-[11px] text-muted">
              <span className="text-accent">★</span> Standout track
            </p>
          )}
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
