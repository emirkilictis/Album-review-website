import "server-only";
import { asc, desc, eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { getDb } from "./db";
import { reviews, tracks, type Review, type ReviewWithTracks, type ReleaseType } from "./db/schema";

export const REVIEWS_TAG = "reviews";

export type ArtistSummary = {
  name: string;
  slug: string;
  reviewCount: number;
  averageScore: number;
  bestScore: number;
  bestTitle: string;
  bestSlug: string;
  coverUrl: string | null;
  latestPublishedAt: string;
};

// ---------------------------------------------------------------------------
// Public, cached reads. Invalidated with updateTag(REVIEWS_TAG) after admin edits.
// ---------------------------------------------------------------------------

export async function getAllReviews(): Promise<Review[]> {
  "use cache";
  cacheLife("max");
  cacheTag(REVIEWS_TAG);
  const db = await getDb();
  return db.select().from(reviews).orderBy(desc(reviews.publishedAt), desc(reviews.id));
}

export async function getReviewBySlug(slug: string): Promise<ReviewWithTracks | null> {
  "use cache";
  cacheLife("max");
  cacheTag(REVIEWS_TAG);
  const db = await getDb();
  const [review] = await db.select().from(reviews).where(eq(reviews.slug, slug)).limit(1);
  if (!review) return null;
  const trackRows = await db.select().from(tracks).where(eq(tracks.reviewId, review.id)).orderBy(asc(tracks.position));
  return { ...review, tracks: trackRows };
}

export async function getArtists(): Promise<ArtistSummary[]> {
  "use cache";
  cacheLife("max");
  cacheTag(REVIEWS_TAG);
  return summarizeArtists(await getAllReviews());
}

export async function getArtist(slug: string): Promise<{ artist: ArtistSummary; reviews: Review[] } | null> {
  "use cache";
  cacheLife("max");
  cacheTag(REVIEWS_TAG);
  const all = await getAllReviews();
  const own = all.filter((r) => r.artistSlug === slug);
  if (own.length === 0) return null;
  return { artist: summarizeArtists(own)[0], reviews: own };
}

// ---------------------------------------------------------------------------
// Pure helpers (filtering / sorting happen in memory: a critic archive stays small).
// ---------------------------------------------------------------------------

export const REVIEW_SORTS = {
  newest: "Newest",
  oldest: "Oldest",
  highest: "Highest rated",
  lowest: "Lowest rated",
  title: "Title A–Z",
  artist: "Artist A–Z",
} as const;
export type ReviewSort = keyof typeof REVIEW_SORTS;

export type ReviewFilters = { q?: string; type?: ReleaseType | "all"; sort?: ReviewSort; minScore?: number };

export function filterReviews(list: Review[], filters: ReviewFilters): Review[] {
  const q = filters.q?.trim().toLowerCase();
  let out = list.filter((r) => {
    if (filters.type && filters.type !== "all" && r.type !== filters.type) return false;
    if (filters.minScore != null && r.score < filters.minScore) return false;
    if (q && !`${r.title} ${r.artist}`.toLowerCase().includes(q)) return false;
    return true;
  });
  const byDate = (a: Review, b: Review) => a.publishedAt.localeCompare(b.publishedAt) || a.id - b.id;
  switch (filters.sort ?? "newest") {
    case "oldest":
      out = out.toSorted(byDate);
      break;
    case "highest":
      out = out.toSorted((a, b) => b.score - a.score || byDate(b, a));
      break;
    case "lowest":
      out = out.toSorted((a, b) => a.score - b.score || byDate(b, a));
      break;
    case "title":
      out = out.toSorted((a, b) => a.title.localeCompare(b.title));
      break;
    case "artist":
      out = out.toSorted((a, b) => a.artist.localeCompare(b.artist) || a.title.localeCompare(b.title));
      break;
    default:
      out = out.toSorted((a, b) => byDate(b, a));
  }
  return out;
}

export const ARTIST_SORTS = {
  average: "Highest average",
  count: "Most reviewed",
  name: "Name A–Z",
  recent: "Recently reviewed",
} as const;
export type ArtistSort = keyof typeof ARTIST_SORTS;

export function sortArtists(list: ArtistSummary[], sort: ArtistSort = "average", q?: string): ArtistSummary[] {
  const needle = q?.trim().toLowerCase();
  const filtered = needle ? list.filter((a) => a.name.toLowerCase().includes(needle)) : list;
  switch (sort) {
    case "count":
      return filtered.toSorted((a, b) => b.reviewCount - a.reviewCount || b.averageScore - a.averageScore);
    case "name":
      return filtered.toSorted((a, b) => a.name.localeCompare(b.name));
    case "recent":
      return filtered.toSorted((a, b) => b.latestPublishedAt.localeCompare(a.latestPublishedAt));
    default:
      return filtered.toSorted((a, b) => b.averageScore - a.averageScore || b.reviewCount - a.reviewCount);
  }
}

function summarizeArtists(list: Review[]): ArtistSummary[] {
  const groups = new Map<string, Review[]>();
  for (const r of list) {
    const group = groups.get(r.artistSlug);
    if (group) group.push(r);
    else groups.set(r.artistSlug, [r]);
  }
  return [...groups.entries()].map(([slug, items]) => {
    const best = items.reduce((a, b) => (b.score > a.score ? b : a));
    const latest = items.reduce((a, b) => (b.publishedAt > a.publishedAt ? b : a));
    const avg = items.reduce((sum, r) => sum + r.score, 0) / items.length;
    return {
      name: latest.artist,
      slug,
      reviewCount: items.length,
      averageScore: Math.round(avg * 10) / 10,
      bestScore: best.score,
      bestTitle: best.title,
      bestSlug: best.slug,
      coverUrl: latest.coverUrl ?? best.coverUrl,
      latestPublishedAt: latest.publishedAt,
    };
  });
}

export function averageTrackRating(list: { rating: number | null }[]): number | null {
  const rated = list.filter((t) => t.rating != null) as { rating: number }[];
  if (rated.length === 0) return null;
  return Math.round((rated.reduce((s, t) => s + t.rating, 0) / rated.length) * 10) / 10;
}

// ---------------------------------------------------------------------------
// Admin reads: always fresh, never cached.
// ---------------------------------------------------------------------------

export async function getReviewForEdit(id: number): Promise<ReviewWithTracks | null> {
  const db = await getDb();
  const [review] = await db.select().from(reviews).where(eq(reviews.id, id)).limit(1);
  if (!review) return null;
  const trackRows = await db.select().from(tracks).where(eq(tracks.reviewId, id)).orderBy(asc(tracks.position));
  return { ...review, tracks: trackRows };
}

export async function listReviewsForAdmin(): Promise<Review[]> {
  const db = await getDb();
  return db.select().from(reviews).orderBy(desc(reviews.publishedAt), desc(reviews.id));
}
