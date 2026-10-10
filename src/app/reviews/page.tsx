import type { Metadata } from "next";
import { Suspense } from "react";
import { FilterForm } from "@/components/filter-form";
import { AlbumGrid, EmptyState, GridSkeleton } from "@/components/review-bits";
import { RELEASE_TYPES, type ReleaseType } from "@/lib/db/schema";
import { RELEASE_TYPE_LABEL } from "@/lib/format";
import { collectGenres, filterReviews, getAllReviews, REVIEW_SORTS, type ReviewSort } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Reviews archive",
  description: "Every AItunes review — search by title or artist, filter by release type and sort by score.",
};

const MIN_SCORES = ["0", "5", "6", "7", "8", "9"];

export default function ReviewsPage(props: PageProps<"/reviews">) {
  return (
    <div className="space-y-6">
      <header className="border-b border-ink pb-6 text-center">
        <h1 className="headline text-5xl sm:text-6xl">Reviews</h1>
        <p className="mt-2 text-[15px] text-muted">Every album, EP and single reviewed by AItunes.</p>
      </header>
      <Suspense fallback={<GridSkeleton />}>
        <Results searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

async function Results({ searchParams }: { searchParams: PageProps<"/reviews">["searchParams"] }) {
  const sp = await searchParams;
  const q = one(sp.q);
  const type = (RELEASE_TYPES as readonly string[]).includes(one(sp.type)) ? (one(sp.type) as ReleaseType) : "all";
  const sort = (one(sp.sort) in REVIEW_SORTS ? one(sp.sort) : "newest") as ReviewSort;
  const min = MIN_SCORES.includes(one(sp.min)) ? one(sp.min) : "0";

  const all = await getAllReviews();
  const genres = collectGenres(all);
  const genre = genres.find((g) => g.toLowerCase() === one(sp.genre).toLowerCase()) ?? "";
  const results = filterReviews(all, { q, type, sort, minScore: Number(min) || undefined, genre });

  return (
    <div className="space-y-5">
      <FilterForm
        key={`${q}|${type}|${genre}|${min}|${sort}`}
        action="/reviews"
        q={q}
        searchPlaceholder="Search title or artist…"
        selects={[
          {
            name: "type",
            label: "Type",
            value: type,
            options: [{ value: "all", label: "All" }, ...RELEASE_TYPES.map((t) => ({ value: t, label: RELEASE_TYPE_LABEL[t] }))],
          },
          ...(genres.length
            ? [
                {
                  name: "genre",
                  label: "Genre",
                  value: genre,
                  options: [{ value: "", label: "All" }, ...genres.map((g) => ({ value: g, label: g }))],
                },
              ]
            : []),
          {
            name: "min",
            label: "Min score",
            value: min,
            options: MIN_SCORES.map((s) => ({ value: s, label: s === "0" ? "Any" : `${s}+` })),
          },
          {
            name: "sort",
            label: "Sort",
            value: sort,
            options: Object.entries(REVIEW_SORTS).map(([value, label]) => ({ value, label })),
          },
        ]}
      />
      <p className="text-xs text-muted">
        {results.length} of {all.length} review{all.length === 1 ? "" : "s"}
      </p>
      {results.length ? (
        <AlbumGrid reviews={results} showDate />
      ) : (
        <EmptyState title="Nothing matches">Try a different search or clear the filters.</EmptyState>
      )}
    </div>
  );
}
