import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AlbumGrid, Cover, GridSkeleton, ScoreBar } from "@/components/review-bits";
import { formatScore, RELEASE_TYPE_LABEL } from "@/lib/format";
import { getArtist } from "@/lib/queries";

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

  return (
    <div className="panel space-y-6 p-4 sm:p-6">
      <header className="flex flex-col gap-5 border-b border-line pb-5 sm:flex-row sm:items-center">
        <div className="w-28 shrink-0 border border-line">
          <Cover src={artist.coverUrl} alt={artist.name} />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-[11px] font-bold tracking-wider text-muted uppercase">Artist</p>
          <h1 className="text-3xl font-extrabold sm:text-4xl">{artist.name}</h1>
          <p className="text-[13px] text-muted">
            {counts.map(([t, n]) => `${n} ${RELEASE_TYPE_LABEL[t]}${n === 1 ? "" : "s"}`).join(" · ")} reviewed
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-5xl font-black tabular-nums">{formatScore(artist.averageScore)}</span>
          <div className="w-32">
            <p className="text-[11px] font-bold tracking-wider text-muted uppercase">Average score</p>
            <ScoreBar score={artist.averageScore} className="mt-1 !h-2" />
            <p className="mt-1 text-[11px] text-muted">
              from {artist.reviewCount} review{artist.reviewCount === 1 ? "" : "s"}
            </p>
          </div>
        </div>
      </header>
      <section>
        <h2 className="section-title mb-4">Discography reviewed</h2>
        <AlbumGrid reviews={reviews} showDate />
      </section>
    </div>
  );
}
