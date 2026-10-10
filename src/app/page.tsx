import Link from "next/link";
import { AlbumGrid, Cover, EmptyState, EssentialTag, RankRow, ScoreBadge, SectionHeader } from "@/components/review-bits";
import { excerpt, formatScore, parseList, RELEASE_TYPE_LABEL } from "@/lib/format";
import { getAllReviews, getAllSongs, getArtists, sortArtists } from "@/lib/queries";

export default async function HomePage() {
  const [all, artists, songs] = await Promise.all([getAllReviews(), getArtists(), getAllSongs()]);

  if (all.length === 0) {
    return (
      <EmptyState title="No reviews yet">
        Log in to the{" "}
        <Link href="/admin" className="link">
          admin panel
        </Link>{" "}
        to publish the first one.
      </EmptyState>
    );
  }

  const lead = all.find((r) => r.featured) ?? all[0];
  const latest = all.filter((r) => r.id !== lead.id).slice(0, 8);
  const topRated = all
    .filter((r) => r.type !== "single")
    .toSorted((a, b) => b.score - a.score)
    .slice(0, 4);
  const topSongs = songs.toSorted((a, b) => b.rating - a.rating).slice(0, 5);
  const topArtists = sortArtists(artists, "average").slice(0, 5);

  return (
    <div className="space-y-14">
      {/* Lead review */}
      <section className="grid items-center gap-8 border-b border-ink pb-12 md:grid-cols-2 md:gap-12">
        <Link href={`/reviews/${lead.slug}`} className="block">
          <Cover src={lead.coverUrl} alt={`${lead.title} cover`} className="shadow-xl shadow-black/15" />
        </Link>
        <div className="space-y-4 text-center md:text-left">
          {lead.featured ? <EssentialTag /> : <p className="text-[11px] font-bold tracking-[0.14em] text-muted uppercase">Latest review</p>}
          <h1 className="headline text-5xl leading-[1.02] sm:text-6xl">
            <Link href={`/reviews/${lead.slug}`} className="hover:underline">
              {lead.title}
            </Link>
          </h1>
          <Link href={`/artists/${lead.artistSlug}`} className="inline-block text-2xl hover:underline">
            {lead.artist}
          </Link>
          <p className="text-[11px] font-bold tracking-[0.12em] text-muted uppercase">
            {[RELEASE_TYPE_LABEL[lead.type], ...parseList(lead.genres).slice(0, 2)].join(" · ")}
          </p>
          {lead.summary && <p className="font-serif text-lg leading-relaxed">{excerpt(lead.summary, 220)}</p>}
          <div className="flex items-center justify-center gap-5 pt-2 md:justify-start">
            <ScoreBadge score={lead.score} size="lg" />
            <Link href={`/reviews/${lead.slug}`} className="btn-ghost">
              Read the review
            </Link>
          </div>
        </div>
      </section>

      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-14">
          <section>
            <SectionHeader title="Latest Reviews" href="/reviews" />
            <AlbumGrid reviews={latest} cols="narrow" />
          </section>
          <section>
            <SectionHeader title="Highest Rated Albums & EPs" href="/rankings" />
            <AlbumGrid reviews={topRated} cols="narrow" />
          </section>
        </div>

        <aside className="space-y-12">
          {topSongs.length > 0 && (
            <section>
              <SectionHeader title="Top Songs" href="/rankings?tab=songs" />
              <ol className="divide-y divide-line">
                {topSongs.map((song, i) => (
                  <li key={song.id}>
                    <RankRow
                      rank={i + 1}
                      href={`/reviews/${song.releaseSlug}`}
                      cover={song.coverUrl}
                      title={song.title}
                      subtitle={song.artist}
                      score={song.rating}
                    />
                  </li>
                ))}
              </ol>
            </section>
          )}

          <section>
            <SectionHeader title="Top Artists" href="/rankings?tab=artists" />
            <ol className="divide-y divide-line">
              {topArtists.map((a, i) => (
                <li key={a.slug}>
                  <RankRow
                    rank={i + 1}
                    href={`/artists/${a.slug}`}
                    cover={a.coverUrl}
                    title={a.name}
                    subtitle={`${a.reviewCount} review${a.reviewCount === 1 ? "" : "s"} · avg ${formatScore(a.averageScore)}`}
                    score={a.averageScore}
                  />
                </li>
              ))}
            </ol>
          </section>
        </aside>
      </div>
    </div>
  );
}
