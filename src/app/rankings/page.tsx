import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArtistTable, ReleaseRanking, SongRanking } from "@/components/rankings";
import { EmptyState } from "@/components/review-bits";
import { getAllReviews, getAllSongs, getArtists, sortArtists } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Rankings",
  description: "The highest rated albums, EPs and songs, and the artists with the highest average AItunes score.",
};

const TABS = {
  releases: "Albums & EPs",
  songs: "Songs",
  artists: "Artists",
} as const;
type Tab = keyof typeof TABS;

const RELEASE_FILTERS = { both: "Albums & EPs", album: "Albums", ep: "EPs" } as const;
type ReleaseFilter = keyof typeof RELEASE_FILTERS;

const LIMIT = 100;

export default function RankingsPage(props: PageProps<"/rankings">) {
  return (
    <div className="space-y-6">
      <header className="border-b border-ink pb-6 text-center">
        <h1 className="headline text-5xl sm:text-6xl">Rankings</h1>
        <p className="mt-2 text-[15px] text-muted">The highest rated releases, songs and artists on AItunes.</p>
      </header>
      <Suspense fallback={<div className="h-96 animate-pulse bg-line/40" />}>
        <Content searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

async function Content({ searchParams }: { searchParams: PageProps<"/rankings">["searchParams"] }) {
  const sp = await searchParams;
  const tab: Tab = one(sp.tab) in TABS ? (one(sp.tab) as Tab) : "releases";
  const filter: ReleaseFilter = one(sp.type) in RELEASE_FILTERS ? (one(sp.type) as ReleaseFilter) : "both";

  return (
    <div className="space-y-4">
      <nav className="flex justify-center gap-1" aria-label="Ranking type">
        {(Object.keys(TABS) as Tab[]).map((t) => (
          <Link
            key={t}
            href={`/rankings?tab=${t}`}
            aria-current={t === tab ? "page" : undefined}
            className={`px-4 py-2 text-[12px] font-bold tracking-[0.14em] uppercase ${
              t === tab ? "bg-ink text-white" : "text-muted hover:text-ink"
            }`}
          >
            {TABS[t]}
          </Link>
        ))}
      </nav>
      {tab === "releases" && <Releases filter={filter} />}
      {tab === "songs" && <Songs />}
      {tab === "artists" && <Artists />}
    </div>
  );
}

async function Releases({ filter }: { filter: ReleaseFilter }) {
  const list = (await getAllReviews())
    .filter((r) => (filter === "both" ? r.type !== "single" : r.type === filter))
    .toSorted((a, b) => b.score - a.score || b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, LIMIT);

  return (
    <>
      <div className="flex justify-center gap-4 text-[13px]">
        {(Object.keys(RELEASE_FILTERS) as ReleaseFilter[]).map((f) => (
          <Link
            key={f}
            href={f === "both" ? "/rankings" : `/rankings?type=${f}`}
            className={f === filter ? "font-bold text-ink underline underline-offset-4" : "text-muted hover:text-ink"}
          >
            {RELEASE_FILTERS[f]}
          </Link>
        ))}
      </div>
      {list.length ? <ReleaseRanking reviews={list} /> : <EmptyState title="Nothing ranked yet" />}
    </>
  );
}

async function Songs() {
  const songs = (await getAllSongs())
    .toSorted((a, b) => b.rating - a.rating || b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, LIMIT);
  return (
    <>
      <p className="text-[13px] text-muted">Every rated track, from albums, EPs and singles.</p>
      {songs.length ? <SongRanking songs={songs} /> : <EmptyState title="No rated songs yet" />}
    </>
  );
}

async function Artists() {
  const artists = sortArtists(await getArtists(), "average").slice(0, LIMIT);
  return (
    <>
      <p className="text-[13px] text-muted">
        Average of every reviewed release.{" "}
        <Link href="/artists" className="link">
          Search all artists ›
        </Link>
      </p>
      {artists.length ? <ArtistTable artists={artists} /> : <EmptyState title="No artists yet" />}
    </>
  );
}
