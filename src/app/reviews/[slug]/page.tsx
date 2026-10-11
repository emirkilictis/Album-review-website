import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Cover, EssentialTag, ScoreBadge } from "@/components/review-bits";
import type { ReviewWithTracks } from "@/lib/db/schema";
import { excerpt, formatDate, formatScore, parseList, platformFor, RELEASE_TYPE_LABEL } from "@/lib/format";
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
      images: [{ url: `/reviews/${review.slug}/image`, width: 1600, height: 900 }],
    },
    twitter: { card: "summary_large_image", title, description, images: [`/reviews/${review.slug}/image`] },
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
  const genres = parseList(review.genres);
  const links = parseList(review.links);
  const paragraphs = review.body.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const year = review.releaseDate?.slice(0, 4);

  return (
    <article className="space-y-12">
      <JsonLd review={review} />

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
        {/* Release + score, like the left half of the share card */}
        <header className="min-w-0 space-y-6 text-center">
          <div className="space-y-2">
            {review.featured && <EssentialTag />}
            <h1 className="headline text-4xl leading-[1.05] sm:text-5xl">{review.title}</h1>
            <Link href={`/artists/${review.artistSlug}`} className="inline-block text-xl hover:underline sm:text-2xl">
              {review.artist}
            </Link>
            <p className="text-[15px]">{[year, RELEASE_TYPE_LABEL[review.type]].filter(Boolean).join(" · ")}</p>
            {genres.length > 0 && (
              <p className="flex flex-wrap justify-center gap-1.5 pt-1">
                {genres.map((g) => (
                  <Link
                    key={g}
                    href={`/reviews?genre=${encodeURIComponent(g)}`}
                    className="border border-line px-2 py-0.5 text-[11px] font-bold tracking-[0.1em] uppercase hover:border-ink"
                  >
                    {g}
                  </Link>
                ))}
              </p>
            )}
          </div>

          <div className="flex items-center justify-center gap-6 sm:gap-10">
            <div className="w-40 shrink-0 sm:w-56">
              <Cover src={review.coverUrl} alt={`${review.title} cover`} className="shadow-lg shadow-black/15" />
            </div>
            <ScoreBadge score={review.score} size="xl" />
          </div>

          {links.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2">
              {links.map((url) => {
                const platform = platformFor(url);
                return (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 border border-ink px-3 py-1.5 text-[12px] font-bold tracking-wide hover:bg-ink hover:text-white"
                  >
                    <span className="h-2 w-2 rounded-full" style={{ background: platform.color }} aria-hidden />
                    {platform.label}
                  </a>
                );
              })}
            </div>
          )}
        </header>

        {/* Track scores, like the right half of the share card */}
        {review.tracks.length > 0 && (
          <section className="min-w-0">
            <h2 className="border-b border-line pb-2 text-xl">Track Scores</h2>
            <ol>
              {review.tracks.map((t) => (
                <li key={t.id} className="flex items-center gap-4 border-b border-line py-3">
                  <span className="w-6 text-[13px] tabular-nums">{String(t.position).padStart(2, "0")}</span>
                  <div className="min-w-0 flex-1 leading-tight">
                    <p className="truncate text-[14px] font-medium uppercase" title={t.title}>
                      {t.title}
                      {t.standout && (
                        <span className="ml-1.5 text-accent" title="Standout track" aria-label="Standout track">
                          ★
                        </span>
                      )}
                    </p>
                    <p className="truncate text-[11px] text-muted">{review.artist}</p>
                  </div>
                  <ScoreBadge score={t.rating} size="sm" />
                </li>
              ))}
            </ol>
            <p className="mt-3 flex justify-between text-[11px] text-muted">
              <span>{review.tracks.some((t) => t.standout) && <><span className="text-accent">★</span> Standout track</>}</span>
              {trackAvg != null && ratedCount > 1 && <span>Track average {formatScore(trackAvg)}</span>}
            </p>
          </section>
        )}
      </div>

      {(review.summary || paragraphs.length > 0) && (
        <div className="mx-auto max-w-2xl space-y-5 border-t border-ink pt-10">
          {review.summary && <p className="font-serif text-2xl leading-snug font-bold">{review.summary}</p>}
          {paragraphs.map((p, i) => (
            <p key={i} className="font-serif text-[18px] leading-[1.7] whitespace-pre-line">
              {p}
            </p>
          ))}
          <p className="pt-2 text-[12px] font-bold tracking-[0.12em] text-muted uppercase">
            By {review.author} · {formatDate(review.publishedAt)}
          </p>
        </div>
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
      genre: parseList(review.genres),
      sameAs: parseList(review.links),
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
    <div className="grid animate-pulse gap-10 lg:grid-cols-2">
      <div className="space-y-4">
        <div className="mx-auto h-12 w-2/3 bg-surface-2" />
        <div className="mx-auto h-6 w-40 bg-surface-2" />
        <div className="mx-auto aspect-square w-56 bg-surface-2" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-10 bg-surface-2" />
        ))}
      </div>
    </div>
  );
}
