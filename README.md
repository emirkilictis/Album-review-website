# AItunes — album review website

Review site for **AItunes, the AI music critic**. The critics publish reviews from a password-protected admin panel; visitors browse the archive, the review pages and the artist leaderboard. The layout follows album-database sites like AOTY: light and dense, with a score number and colored bar on every release.

Built with Next.js 16 (App Router, Cache Components), Tailwind CSS 4, Drizzle ORM and SQLite/libSQL.

## Features

**Public site**
- **Home**: latest reviews, highest rated albums & EPs, "Essential" picks, top songs and top artists.
- **Reviews archive** (`/reviews`): search by title or artist, filter by type (album / EP / single) and minimum score, sort by newest, oldest, highest, lowest, title or artist.
- **Review page** (`/reviews/[slug]`): cover, title and artist, a big AItunes score (0–10), the review, and below it the full tracklist with a rating per track. Standout tracks get a ★.
- **Rankings** (`/rankings`): highest rated albums & EPs (filterable to albums or EPs only), highest rated songs across all album tracks, EP tracks and singles, and artists by average score. Tied scores share a rank. A single with no rated track counts as one song carrying the review score.
- **Artists** (`/artists`): leaderboard sorted by average score, review count, name or most recently reviewed. Each artist has a page showing their average and every reviewed release.
- **About** page with the scoring guide.
- RSS feed (`/rss.xml`), `sitemap.xml`, `robots.txt`, Open Graph tags and schema.org `Review` JSON-LD on every review. These help with search engines, link previews and an AOTY submission.

**Admin panel** (`/admin`)
- One shared password (`ADMIN_PASSWORD`). No accounts or email.
- Create, edit and delete reviews: title, artist, type, release date, cover URL, score, summary, full text, byline, publish date and an "Essential" flag.
- Tracklist editor: add, remove and reorder tracks, rate each one, mark standouts, or paste a whole tracklist at once.
- **Quick fill from Apple Music**: search a release to fill in the title, artist, cover, release date and tracklist automatically. It uses the public iTunes Search API, so no API key is needed.
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
3. Deploy. The database tables are created automatically on first use.

## Project layout

```
src/app/            pages (public + /admin) and route handlers (rss, api/itunes)
src/components/     UI pieces (album blocks, score badge and bar, ranking lists, filter form, admin form)
src/lib/db/         Drizzle schema + client (tables auto-created)
src/lib/queries.ts  cached public queries and sorting/filtering helpers
src/lib/auth.ts     password check + signed session cookie
src/lib/site.ts     site name, tagline, social links
scripts/seed.ts     demo data
```

## Open questions for the client

- Score scale: 0–10 with one decimal (current), or 0–100 like AOTY?
- More than one critic? If so, should each have their own byline or profile?
- Extra release info: genres, label, streaming links?
- Domain name, logo and brand colors.
- Covers are linked by URL, either pasted in or filled from Apple Music. Do they also need to upload image files?
