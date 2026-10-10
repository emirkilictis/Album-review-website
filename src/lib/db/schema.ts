import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text, index } from "drizzle-orm/sqlite-core";

export const RELEASE_TYPES = ["album", "ep", "single"] as const;
export type ReleaseType = (typeof RELEASE_TYPES)[number];

export const reviews = sqliteTable(
  "reviews",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    artist: text("artist").notNull(),
    artistSlug: text("artist_slug").notNull(),
    type: text("type", { enum: RELEASE_TYPES }).notNull().default("album"),
    releaseDate: text("release_date"),
    coverUrl: text("cover_url"),
    /** 0–10, one decimal */
    score: real("score").notNull(),
    /** JSON array of genre names, e.g. ["Synth-pop","Electronic"] */
    genres: text("genres").notNull().default("[]"),
    /** JSON array of streaming URLs (Spotify, Apple Music, YouTube…) */
    links: text("links").notNull().default("[]"),
    summary: text("summary"),
    body: text("body").notNull().default(""),
    author: text("author").notNull().default("AItunes"),
    featured: integer("featured", { mode: "boolean" }).notNull().default(false),
    publishedAt: text("published_at").notNull(),
    createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
    updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
  },
  (t) => [index("reviews_artist_slug_idx").on(t.artistSlug), index("reviews_published_idx").on(t.publishedAt)],
);

export const tracks = sqliteTable(
  "tracks",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    reviewId: integer("review_id")
      .notNull()
      .references(() => reviews.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    title: text("title").notNull(),
    /** 0–10, one decimal */
    rating: real("rating"),
    standout: integer("standout", { mode: "boolean" }).notNull().default(false),
  },
  (t) => [index("tracks_review_idx").on(t.reviewId)],
);

export type Review = typeof reviews.$inferSelect;
export type Track = typeof tracks.$inferSelect;
export type ReviewWithTracks = Review & { tracks: Track[] };

// Kept in sync with the tables above. Run on first DB access so a fresh
// database (local file or Turso) works without a separate migration step.
export const BOOTSTRAP_SQL = [
  `CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    artist TEXT NOT NULL,
    artist_slug TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'album',
    release_date TEXT,
    cover_url TEXT,
    score REAL NOT NULL,
    genres TEXT NOT NULL DEFAULT '[]',
    links TEXT NOT NULL DEFAULT '[]',
    summary TEXT,
    body TEXT NOT NULL DEFAULT '',
    author TEXT NOT NULL DEFAULT 'AItunes',
    featured INTEGER NOT NULL DEFAULT 0,
    published_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE INDEX IF NOT EXISTS reviews_artist_slug_idx ON reviews (artist_slug)`,
  `CREATE INDEX IF NOT EXISTS reviews_published_idx ON reviews (published_at)`,
  `CREATE TABLE IF NOT EXISTS tracks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    review_id INTEGER NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    title TEXT NOT NULL,
    rating REAL,
    standout INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE INDEX IF NOT EXISTS tracks_review_idx ON tracks (review_id)`,
];

// Columns added after the first release: [table, column, definition].
// Added with ALTER TABLE when an older database is missing them.
export const ADDED_COLUMNS: [string, string, string][] = [
  ["reviews", "genres", "TEXT NOT NULL DEFAULT '[]'"],
  ["reviews", "links", "TEXT NOT NULL DEFAULT '[]'"],
];
