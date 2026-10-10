import Link from "next/link";
import { AlbumGrid, Cover, EmptyState, RankRow, ScoreBadge, SectionHeader } from "@/components/review-bits";
import { excerpt, formatScore, RELEASE_TYPE_LABEL } from "@/lib/format";
import { getAllReviews, getAllSongs, getArtists, sortArtists } from "@/lib/queries";
import { SITE } from "@/lib/site";

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

  const latest = all.slice(0, 12);
  const topRated = all
    .filter((r) => r.type !== "single")
    .toSorted((a, b) => b.score - a.score)
    .slice(0, 8);
  const topSongs = songs.toSorted((a, b) => b.rating - a.rating).slice(0, 5);
  const essential = all.filter((r) => r.featured).slice(0, 3);
  const topArtists = sortArtists(artists, "average").slice(0, 5);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="space-y-10">
        <section className="panel p-4">
          <SectionHeader title="Latest Reviews" href="/reviews" />
          <AlbumGrid reviews={latest} cols="narrow" showDate />
        </section>
        <section className="panel p-4">
          <SectionHeader title="Highest Rated Albums & EPs" href="/rankings" />
          <AlbumGrid reviews={topRated} cols="narrow" />
        </section>
      </div>

      <aside className="space-y-6">
        {essential.length > 0 && (
          <section className="panel p-4">
            <SectionHeader title="Essential Listening" href="/reviews?sort=highest" />
            <ul className="space-y-4">
              {essential.map((r) => (
                <li key={r.id}>
                  <Link href={`/reviews/${r.slug}`} className="group flex gap-3">
                    <div className="w-20 shrink-0 self-start border border-line">
                      <Cover src={r.coverUrl} alt={r.title} />
                    </div>
                    <div className="min-w-0 space-y-1 leading-tight">
                      <p className="truncate text-[13px] font-bold">{r.artist}</p>
                      <p className="truncate text-[13px] group-hover:text-accent group-hover:underline">{r.title}</p>
                      <p className="line-clamp-2 text-xs text-muted">{excerpt(r.summary, 90)}</p>
                      <ScoreBadge score={r.score} size="xs" />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {topSongs.length > 0 && (
          <section className="panel p-4">
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

        <section className="panel p-4">
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

        <section className="panel p-4">
          <SectionHeader title={`About ${SITE.name}`} href="/about" linkLabel="More" />
          <p className="text-[13px] leading-relaxed text-muted">{SITE.description}</p>
          <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
            {(["album", "ep", "single"] as const).map((t) => (
              <div key={t} className="bg-surface-2 py-2">
                <dt className="text-[10px] font-semibold tracking-wider text-muted uppercase">{RELEASE_TYPE_LABEL[t]}s</dt>
                <dd className="text-lg font-extrabold">{all.filter((r) => r.type === t).length}</dd>
              </div>
            ))}
          </dl>
        </section>
      </aside>
    </div>
  );
}
