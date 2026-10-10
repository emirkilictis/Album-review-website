import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AlbumGrid, GridSkeleton, ScoreBadge } from "@/components/review-bits";
import { formatScore, RELEASE_TYPE_LABEL } from "@/lib/format";
import { collectGenres, getArtist } from "@/lib/queries";

export async function generateMetadata(props: PageProps<"/artists/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const data = await getArtist(slug);
  if (!data) return { title: "Artist not found" };
  return {
    title: data.artist.name,
    description: `${data.artist.reviewCount} AItunes review(s) of ${data.artist.name}, average score ${formatScore(data.artist.averageScore)}.`,
  };
}

export default function ArtistPage(props: PageProps<"/artists/[slug]">) {
  return (
    <Suspense fallback={<GridSkeleton count={6} />}>
      <ArtistContent params={props.params} />
    </Suspense>
  );
}

async function ArtistContent({ params }: { params: PageProps<"/artists/[slug]">["params"] }) {
  const { slug } = await params;
  const data = await getArtist(slug);
  if (!data) notFound();
  const { artist, reviews } = data;
  const counts = (["album", "ep", "single"] as const)
    .map((t) => [t, reviews.filter((r) => r.type === t).length] as const)
    .filter(([, n]) => n > 0);

  const genres = collectGenres(reviews).slice(0, 5);

  return (
    <div className="space-y-10">
      <header className="flex flex-col items-center gap-4 border-b border-ink pb-8 text-center">
        <p className="text-[11px] font-bold tracking-[0.14em] text-muted uppercase">Artist</p>
        <h1 className="headline text-5xl sm:text-6xl">{artist.name}</h1>
        {genres.length > 0 && <p className="text-[13px]">{genres.join(" · ")}</p>}
        <div className="flex items-center gap-4 pt-2">
          <ScoreBadge score={artist.averageScore} size="lg" />
          <div className="text-left">
            <p className="text-[11px] font-bold tracking-[0.12em] uppercase">Average score</p>
            <p className="text-[13px] text-muted">
              {counts.map(([t, n]) => `${n} ${RELEASE_TYPE_LABEL[t]}${n === 1 ? "" : "s"}`).join(" · ")}
            </p>
          </div>
        </div>
      </header>
      <section>
        <h2 className="section-title mb-5">Reviewed releases</h2>
        <AlbumGrid reviews={reviews} showDate />
      </section>
    </div>
  );
}
