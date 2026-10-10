import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { FilterForm } from "@/components/filter-form";
import { Cover, EmptyState, ScoreBadge, ScoreBar } from "@/components/review-bits";
import { formatScore } from "@/lib/format";
import { ARTIST_SORTS, getArtists, sortArtists, type ArtistSort } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Artists",
  description: "Every AI music artist we have reviewed, ranked by average AItunes score.",
};

export default function ArtistsPage(props: PageProps<"/artists">) {
  return (
    <div className="panel space-y-4 p-4">
      <header>
        <h1 className="text-2xl font-extrabold">Artists</h1>
        <p className="text-[13px] text-muted">Ranked by the average score of all their reviewed releases.</p>
      </header>
      <Suspense fallback={<div className="h-96 animate-pulse bg-line/40" />}>
        <Leaderboard searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

async function Leaderboard({ searchParams }: { searchParams: PageProps<"/artists">["searchParams"] }) {
  const sp = await searchParams;
  const q = one(sp.q);
  const sort = (one(sp.sort) in ARTIST_SORTS ? one(sp.sort) : "average") as ArtistSort;
  const artists = sortArtists(await getArtists(), sort, q);

  return (
    <div className="space-y-4">
      <FilterForm
        key={`${q}|${sort}`}
        action="/artists"
        q={q}
        searchPlaceholder="Search artists…"
        selects={[
          {
            name: "sort",
            label: "Sort",
            value: sort,
            options: Object.entries(ARTIST_SORTS).map(([value, label]) => ({ value, label })),
          },
        ]}
      />
      {artists.length === 0 ? (
        <EmptyState title="No artists found" />
      ) : (
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
                <td className="py-2 text-right font-bold text-muted tabular-nums">{i + 1}</td>
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
      )}
    </div>
  );
}
