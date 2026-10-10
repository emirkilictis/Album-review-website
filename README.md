# AItunes Reviews — album review website

Review site for **AItunes Reviews, the AI music critic** (Pitchfork-style). The editors publish reviews from a password-protected admin panel; visitors browse the archive, the review pages and the rankings. The design matches the AItunes Reviews share cards: white page, bold italic serif titles, scores in black outlined circles and the blue logo.

Built with Next.js 16 (App Router, Cache Components), Tailwind CSS 4, Drizzle ORM and SQLite/libSQL.

## Features

**Public site**
- **Home**: latest reviews, highest rated albums & EPs, "Essential" picks, top songs and top artists.
- **Reviews archive** (`/reviews`): search by title or artist, filter by type (album / EP / single), genre and minimum score, sort by newest, oldest, highest, lowest, title or artist.
- **Review page** (`/reviews/[slug]`): laid out like the share card — title, artist, year, genres, cover and a big score circle (0–10, one decimal) on the left; "Track Scores" with a score per track on the right; "Listen on" buttons for the streaming links; the written review below. Standout tracks get a ★.
- **Rankings** (`/rankings`): highest rated albums & EPs (filterable to albums or EPs only), highest rated songs across all album tracks, EP tracks and singles, and artists by average score. Tied scores share a rank. A single with no rated track counts as one song carrying the review score.
- **Artists** (`/artists`): leaderboard sorted by average score, review count, name or most recently reviewed. Each artist has a page showing their average and every reviewed release.
- **About** page with the scoring guide.
- RSS feed (`/rss.xml`), `sitemap.xml`, `robots.txt`, Open Graph tags and schema.org `Review` JSON-LD on every review. These help with search engines, link previews and an AOTY submission.

**Admin panel** (`/admin`)
- One shared password (`ADMIN_PASSWORD`). No accounts or email.
- Create, edit and delete reviews: title, artist, type, release date, cover URL, genres (with one-click suggestions from earlier reviews), streaming links (paste one per line; Spotify, Apple Music, YouTube, SoundCloud, Deezer, TIDAL, Amazon Music, Bandcamp and Suno are recognised automatically), score, summary, full text, byline, publish date and an "Essential" flag.
- Tracklist editor: add, remove and reorder tracks, rate each one, mark standouts, or paste a whole tracklist at once.
- **Quick fill from Apple Music**: search a release to fill in the title, artist, cover, release date, genre, Apple Music link and tracklist automatically. It uses the public iTunes Search API, so no API key is needed.
- A review's link never changes after publishing, even if you edit the title.

## Run locally

```bash
npm install
cp .env.example .env.local   # then set ADMIN_PASSWORD
npm run seed                 # optional: 6 made-up demo reviews
npm run dev                  # http://localhost:3000, admin at /admin
```

`npm run seed -- --reset` deletes **all** reviews and re-inserts the demo data. If the server is running, restart it afterwards: pages are cached and are only refreshed automatically when changes come through the admin panel.

## Deploy (free)

1. Create a free database on [Turso](https://turso.tech) and get its URL and an auth token.
2. Import the repo on [Vercel](https://vercel.com) and set these environment variables: `ADMIN_PASSWORD`, `DATABASE_URL` (`libsql://…`), `DATABASE_AUTH_TOKEN`, `NEXT_PUBLIC_SITE_URL`.
3. Deploy. The database tables (and any columns added in later versions) are created automatically on first use.

No custom domain is needed: the site runs on the free Vercel address (e.g. `https://aitunes-reviews.vercel.app`). Put that address in `NEXT_PUBLIC_SITE_URL`.

## Project layout

```
src/app/            pages (public + /admin) and route handlers (rss, api/itunes)
src/components/     UI pieces (album blocks, score badge and bar, ranking lists, filter form, admin form)
src/lib/db/         Drizzle schema + client (tables auto-created)
src/lib/queries.ts  cached public queries and sorting/filtering helpers
src/lib/auth.ts     password check + signed session cookie
src/lib/site.ts     site name, tagline, social links
src/assets/         logo images
scripts/seed.ts     demo data
```

## Decided

- Only the AItunes editors publish reviews and scores; visitors can only read them.
- All editors share one admin password. There are no per-editor accounts or profile pages; the optional byline field on each review is enough.
- Scores are out of 10 with one decimal (track ratings too).
- Each review has genres and streaming-platform links.
- No custom domain; the free `.vercel.app` address is used.
- Design follows the AItunes Reviews share cards (Pitchfork-style).

- Covers come from Apple Music import or a pasted image link; no file upload needed.
- The official logo is used in the header, footer, favicon and share image (`src/assets`, `src/app/icon.png`, `src/app/opengraph-image.png`).

## Open questions for the client

- About page text (the current copy is a placeholder).
