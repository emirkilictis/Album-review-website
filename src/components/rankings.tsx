import Link from "next/link";
import { Cover, ScoreBadge, ScoreBar } from "@/components/review-bits";
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
    <li className="grid grid-cols-[2rem_3rem_minmax(0,1fr)_auto] items-center gap-3 py-2 sm:grid-cols-[2.5rem_3.5rem_minmax(0,1fr)_8rem_auto]">
      <span className="text-right text-base font-extrabold text-muted tabular-nums">{rank}</span>
      <Link href={href} className="border border-line">
        <Cover src={cover} alt="" />
      </Link>
      <div className="min-w-0 leading-tight">
        <div className="truncate text-[14px] font-bold">{primary}</div>
        <div className="truncate text-[13px] text-muted">{secondary}</div>
        {meta && <div className="mt-0.5 truncate text-[11px] tracking-wide text-muted uppercase">{meta}</div>}
      </div>
      <ScoreBar score={score} className="hidden sm:block" />
      <ScoreBadge score={score} size="sm" />
    </li>
  );
}

export function ReleaseRanking({ reviews }: { reviews: Review[] }) {
  const ranks = competitionRanks(reviews.map((r) => r.score));
  return (
    <ol className="divide-y divide-line">
      {reviews.map((r, i) => (
        <RankedRow
          key={r.id}
          rank={ranks[i]}
          href={`/reviews/${r.slug}`}
          cover={r.coverUrl}
          primary={
            <Link href={`/reviews/${r.slug}`} className="hover:text-accent hover:underline">
              {r.title}
            </Link>
          }
          secondary={
            <Link href={`/artists/${r.artistSlug}`} className="hover:text-accent hover:underline">
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

export function SongRanking({ songs }: { songs: SongEntry[] }) {
  const ranks = competitionRanks(songs.map((s) => s.rating));
  return (
    <ol className="divide-y divide-line">
      {songs.map((s, i) => (
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
            <Link href={`/artists/${s.artistSlug}`} className="hover:text-accent hover:underline">
              {s.artist}
            </Link>
          }
          meta={
            <Link href={`/reviews/${s.releaseSlug}`} className="hover:text-accent hover:underline">
              {s.releaseType === "single" ? "Single" : `From ${s.releaseTitle} (${RELEASE_TYPE_LABEL[s.releaseType]})`}
            </Link>
          }
          score={s.rating}
        />
      ))}
    </ol>
  );
}

export function ArtistTable({ artists, ranked = true }: { artists: ArtistSummary[]; ranked?: boolean }) {
  const ranks = ranked ? competitionRanks(artists.map((a) => a.averageScore)) : artists.map((_, i) => i + 1);
  return (
    <table className="w-full text-[13px]">
      <thead>
        <tr className="border-b-2 border-ink text-left text-[11px] tracking-wider text-muted uppercase">
          <th className="w-10 py-2 text-right font-semibold">#</th>
          <th className="py-2 pl-3 font-semibold">Artist</th>
          <th className="hidden py-2 font-semibold sm:table-cell">Highest rated</th>
          <th className="hidden w-16 py-2 text-center font-semibold sm:table-cell">Reviews</th>
          <th className="w-36 py-2 pr-1 text-right font-semibold">Avg score</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-line">
        {artists.map((a, i) => (
          <tr key={a.slug} className="hover:bg-surface-2">
            <td className="py-2 text-right font-bold text-muted tabular-nums">{ranks[i]}</td>
            <td className="py-2 pl-3">
              <Link href={`/artists/${a.slug}`} className="flex items-center gap-3">
                <div className="w-11 shrink-0 border border-line">
                  <Cover src={a.coverUrl} alt={a.name} />
                </div>
                <span className="min-w-0">
                  <span className="block truncate font-bold hover:text-accent hover:underline">{a.name}</span>
                  <span className="block text-xs text-muted sm:hidden">
                    {a.reviewCount} review{a.reviewCount === 1 ? "" : "s"}
                  </span>
                </span>
              </Link>
            </td>
            <td className="hidden py-2 sm:table-cell">
              <Link href={`/reviews/${a.bestSlug}`} className="hover:text-accent hover:underline">
                {a.bestTitle}
              </Link>{" "}
              <span className="text-muted">({formatScore(a.bestScore)})</span>
            </td>
            <td className="hidden py-2 text-center tabular-nums sm:table-cell">{a.reviewCount}</td>
            <td className="py-2 pr-1">
              <div className="flex items-center justify-end gap-2">
                <ScoreBar score={a.averageScore} className="hidden w-16 sm:block" />
                <ScoreBadge score={a.averageScore} size="xs" />
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
