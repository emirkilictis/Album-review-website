import Link from "next/link";
import { Cover, ScoreBadge } from "@/components/review-bits";
import { formatScore, RELEASE_TYPE_LABEL } from "@/lib/format";
import type { ArtistSummary, SongEntry } from "@/lib/queries";
import type { Review } from "@/lib/db/schema";

/** Competition ranking: equal scores share a rank (1, 2, 2, 4…). */
export function competitionRanks(scores: number[]): number[] {
  return scores.map((s, i) => (i > 0 && s === scores[i - 1] ? -1 : i + 1)).map((r, i, arr) => {
    let j = i;
    while (arr[j] === -1) j--;
    return arr[j];
  });
}

function RankedRow({
  rank,
  href,
  cover,
  primary,
  secondary,
  meta,
  score,
}: {
  rank: number;
  href: string;
  cover: string | null;
  primary: React.ReactNode;
  secondary: React.ReactNode;
  meta?: React.ReactNode;
  score: number;
}) {
  return (
    <li className="grid grid-cols-[2rem_3.5rem_minmax(0,1fr)_auto] items-center gap-3 py-3 sm:grid-cols-[3rem_4.5rem_minmax(0,1fr)_auto] sm:gap-4">
      <span className="text-right text-xl font-bold tabular-nums">{rank}</span>
      <Link href={href}>
        <Cover src={cover} alt="" />
      </Link>
      <div className="min-w-0 leading-tight">
        <div className="truncate font-serif text-[17px] italic">{primary}</div>
        <div className="truncate text-[13px] font-bold">{secondary}</div>
        {meta && <div className="mt-1 truncate text-[10px] font-bold tracking-[0.12em] text-muted uppercase">{meta}</div>}
      </div>
      <ScoreBadge score={score} size="md" />
    </li>
  );
}

export function ReleaseRanking({ reviews }: { reviews: Review[] }) {
  const ranks = competitionRanks(reviews.map((r) => r.score));
  return (
    <ol className="divide-y divide-line border-b border-line">
      {reviews.map((r, i) => (
        <RankedRow
          key={r.id}
          rank={ranks[i]}
          href={`/reviews/${r.slug}`}
          cover={r.coverUrl}
          primary={
            <Link href={`/reviews/${r.slug}`} className="hover:underline">
              {r.title}
            </Link>
          }
          secondary={
            <Link href={`/artists/${r.artistSlug}`} className="hover:underline">
              {r.artist}
            </Link>
          }
          meta={`${RELEASE_TYPE_LABEL[r.type]}${r.releaseDate ? ` · ${r.releaseDate.slice(0, 4)}` : ""}`}
          score={r.score}
        />
      ))}
    </ol>
  );
}

/** `byArtist` is for an artist's own page: the artist column then shows the release instead. */
export function SongRanking({ songs, byArtist = false }: { songs: SongEntry[]; byArtist?: boolean }) {
  const ranks = competitionRanks(songs.map((s) => s.rating));
  return (
    <ol className="divide-y divide-line border-b border-line">
      {songs.map((s, i) => {
        const release = (
          <Link href={`/reviews/${s.releaseSlug}`} className="hover:underline">
            {s.releaseType === "single" ? "Single" : `From ${s.releaseTitle} (${RELEASE_TYPE_LABEL[s.releaseType]})`}
          </Link>
        );
        return (
          <RankedRow
            key={s.id}
            rank={ranks[i]}
            href={`/reviews/${s.releaseSlug}`}
            cover={s.coverUrl}
            primary={
              <>
                {s.title}
                {s.standout && <span className="ml-1 text-accent">★</span>}
              </>
            }
            secondary={
              byArtist ? (
                release
              ) : (
                <Link href={`/artists/${s.artistSlug}`} className="hover:underline">
                  {s.artist}
                </Link>
              )
            }
            meta={byArtist ? undefined : release}
            score={s.rating}
          />
        );
      })}
    </ol>
  );
}

export function ArtistTable({ artists, ranked = true }: { artists: ArtistSummary[]; ranked?: boolean }) {
  const ranks = ranked ? competitionRanks(artists.map((a) => a.averageScore)) : artists.map((_, i) => i + 1);
  return (
    <table className="w-full text-[13px]">
      <thead>
        <tr className="border-b border-ink text-left text-[11px] tracking-[0.12em] text-muted uppercase">
          <th className="w-10 py-2 text-right font-semibold">#</th>
          <th className="py-2 pl-3 font-semibold">Artist</th>
          <th className="hidden py-2 font-semibold sm:table-cell">Highest rated</th>
          <th className="hidden w-16 py-2 text-center font-semibold sm:table-cell">Reviews</th>
          <th className="w-24 py-2 pr-1 text-right font-semibold">Avg score</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-line">
        {artists.map((a, i) => (
          <tr key={a.slug} className="hover:bg-surface-2">
            <td className="py-3 text-right text-lg font-bold tabular-nums">{ranks[i]}</td>
            <td className="py-2 pl-3">
              <Link href={`/artists/${a.slug}`} className="flex items-center gap-3">
                <div className="w-12 shrink-0">
                  <Cover src={a.coverUrl} alt={a.name} />
                </div>
                <span className="min-w-0">
                  <span className="block truncate text-[15px] font-bold hover:underline">{a.name}</span>
                  <span className="block text-xs text-muted sm:hidden">
                    {a.reviewCount} review{a.reviewCount === 1 ? "" : "s"}
                  </span>
                </span>
              </Link>
            </td>
            <td className="hidden py-2 sm:table-cell">
              <Link href={`/reviews/${a.bestSlug}`} className="font-serif italic hover:underline">
                {a.bestTitle}
              </Link>{" "}
              <span className="text-muted">({formatScore(a.bestScore)})</span>
            </td>
            <td className="hidden py-2 text-center tabular-nums sm:table-cell">{a.reviewCount}</td>
            <td className="py-2 pr-1">
              <div className="flex items-center justify-end gap-2">
                <ScoreBadge score={a.averageScore} size="sm" />
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
