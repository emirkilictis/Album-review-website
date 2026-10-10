import type { Metadata } from "next";
import { Suspense } from "react";
import { FilterForm } from "@/components/filter-form";
import { ArtistTable } from "@/components/rankings";
import { EmptyState } from "@/components/review-bits";
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
        <ArtistTable artists={artists} ranked={sort === "average"} />
      )}
    </div>
  );
}
