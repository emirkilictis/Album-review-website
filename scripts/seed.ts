/**
 * Fills the database with DEMO reviews so the site can be previewed.
 * All artists and reviews below are made up.
 *
 *   npm run seed           # adds demo data (skips if reviews already exist)
 *   npm run seed -- --reset  # wipes ALL reviews first
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@libsql/client";
import { BOOTSTRAP_SQL } from "../src/lib/db/schema";
import { slugify } from "../src/lib/format";

type Demo = {
  title: string;
  artist: string;
  type: "album" | "ep" | "single";
  score: number;
  releaseDate: string;
  publishedAt: string;
  featured?: boolean;
  summary: string;
  body: string;
  colors: [string, string, string];
  tracks: [string, number, boolean?][];
};

const DEMO: Demo[] = [
  {
    title: "Neon Requiem",
    artist: "Aurora Vector",
    type: "album",
    score: 8.7,
    releaseDate: "2026-08-14",
    publishedAt: "2026-09-02",
    featured: true,
    summary: "A gorgeous, haunting synth-pop record that proves AI music can carry real emotional weight.",
    body: "Neon Requiem opens with a wash of detuned pads and a voice that sounds like it is singing from the bottom of a swimming pool. It is a bold first impression, and the rest of the record mostly earns it.\n\nThe middle stretch is where the album truly shines: the run from “Glasshouse” to “Static Saints” is as cohesive a sequence as anything we have heard this year.\n\nNot every experiment lands — the closing track drifts on a few minutes too long — but this is the most confident release in Aurora Vector’s catalogue so far.",
    colors: ["#7c3aed", "#ec4899", "#0f172a"],
    tracks: [
      ["Overture for Machines", 7.5],
      ["Glasshouse", 9.2, true],
      ["Paper Satellites", 8.4],
      ["Static Saints", 9.0, true],
      ["Lowlight", 7.8],
      ["Requiem (Neon)", 8.1],
      ["Afterglow Protocol", 6.9],
    ],
  },
  {
    title: "Silicon Summer",
    artist: "Lumen Drift",
    type: "ep",
    score: 7.4,
    releaseDate: "2026-07-01",
    publishedAt: "2026-08-20",
    summary: "Five breezy, sun-bleached tracks that are pure fun, even if they rarely go deep.",
    body: "Lumen Drift’s new EP is built for car windows rolled down. The production is crisp and the hooks are immediate.\n\nIt is a light listen, and that is both its charm and its limit.",
    colors: ["#f59e0b", "#ef4444", "#1e1b4b"],
    tracks: [
      ["Coastline.exe", 7.9, true],
      ["Heatwave Loop", 7.2],
      ["Polaroid Sky", 7.6],
      ["Sunburn Memory", 6.8],
      ["Last Day of July", 7.3],
    ],
  },
  {
    title: "Ghost in the Chorus",
    artist: "Aurora Vector",
    type: "single",
    score: 9.1,
    releaseDate: "2026-09-20",
    publishedAt: "2026-09-25",
    summary: "Aurora Vector’s best song yet: a soaring, bittersweet anthem with a chorus that will not leave your head.",
    body: "Some songs feel like they have always existed. “Ghost in the Chorus” is one of them.\n\nThe build into the final chorus is pure catharsis.",
    colors: ["#06b6d4", "#8b5cf6", "#020617"],
    tracks: [["Ghost in the Chorus", 9.1, true]],
  },
  {
    title: "Error 404: Heart Not Found",
    artist: "Byte Romance",
    type: "album",
    score: 5.6,
    releaseDate: "2026-06-11",
    publishedAt: "2026-07-15",
    summary: "A promising concept undone by repetitive production and too much filler.",
    body: "There is a great 30-minute album hidden inside this 58-minute one.\n\nThe singles are strong, but the deep cuts blur together.",
    colors: ["#22c55e", "#0ea5e9", "#111827"],
    tracks: [
      ["Boot Sequence", 5.0],
      ["Heart Not Found", 7.2, true],
      ["Ctrl+Z", 6.1],
      ["Buffering Love", 4.8],
      ["Firewall", 5.5],
      ["Reboot", 5.2],
    ],
  },
  {
    title: "Midnight Algorithms",
    artist: "Nova Synthetica",
    type: "album",
    score: 8.2,
    releaseDate: "2026-05-03",
    publishedAt: "2026-06-01",
    summary: "Dark, glossy R&B with immaculate production and surprisingly human vocals.",
    body: "Nova Synthetica has always had the sound; on Midnight Algorithms she finally has the songs to match.\n\nThe album is sequenced like a late-night drive, and it rewards listening start to finish.",
    colors: ["#1d4ed8", "#9333ea", "#030712"],
    tracks: [
      ["Midnight Algorithms", 8.5, true],
      ["Velvet Code", 8.0],
      ["Afterhours", 7.6],
      ["Mirror Mode", 8.8, true],
      ["Slow Render", 7.4],
    ],
  },
  {
    title: "Dial-Up Dreams",
    artist: "Byte Romance",
    type: "single",
    score: 6.8,
    releaseDate: "2026-09-05",
    publishedAt: "2026-09-10",
    summary: "A nostalgic, fizzy pop single that shows real growth.",
    body: "Built around an actual modem handshake sample, “Dial-Up Dreams” is cheeky, catchy and a clear step up.",
    colors: ["#e11d48", "#fb923c", "#18181b"],
    tracks: [["Dial-Up Dreams", 6.8]],
  },
];

function coverSvg([a, b, bg]: [string, string, string], seed: number): string {
  const r = (n: number) => ((Math.sin(seed * 999 + n) + 1) / 2) * 600;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>
    <filter id="blur"><feGaussianBlur stdDeviation="40"/></filter>
  </defs>
  <rect width="600" height="600" fill="${bg}"/>
  <circle cx="${r(1)}" cy="${r(2)}" r="220" fill="url(#g)" filter="url(#blur)" opacity="0.9"/>
  <circle cx="${r(3)}" cy="${r(4)}" r="140" fill="${b}" filter="url(#blur)" opacity="0.7"/>
  <circle cx="300" cy="300" r="${120 + (seed % 3) * 30}" fill="none" stroke="white" stroke-opacity="0.35" stroke-width="2"/>
  <circle cx="300" cy="300" r="${60 + (seed % 4) * 15}" fill="none" stroke="white" stroke-opacity="0.2" stroke-width="1"/>
</svg>`;
}

async function main() {
  const reset = process.argv.includes("--reset");
  const client = createClient({
    url: process.env.DATABASE_URL ?? "file:local.db",
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });
  await client.batch(BOOTSTRAP_SQL, "write");

  if (reset) {
    await client.batch(["DELETE FROM tracks", "DELETE FROM reviews"], "write");
    console.log("Deleted all existing reviews.");
  } else {
    const { rows } = await client.execute("SELECT COUNT(*) AS n FROM reviews");
    if (Number(rows[0].n) > 0) {
      console.log("Reviews already exist — skipping. Use `npm run seed -- --reset` to start over.");
      return;
    }
  }

  const coverDir = join(process.cwd(), "public", "demo-covers");
  mkdirSync(coverDir, { recursive: true });

  for (const [i, d] of DEMO.entries()) {
    const slug = slugify(`${d.artist} ${d.title}`);
    writeFileSync(join(coverDir, `${slug}.svg`), coverSvg(d.colors, i + 1));
    const res = await client.execute({
      sql: `INSERT INTO reviews (slug, title, artist, artist_slug, type, release_date, cover_url, score, summary, body, featured, published_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
      args: [
        slug,
        d.title,
        d.artist,
        slugify(d.artist),
        d.type,
        d.releaseDate,
        `/demo-covers/${slug}.svg`,
        d.score,
        d.summary,
        d.body,
        d.featured ? 1 : 0,
        d.publishedAt,
      ],
    });
    const reviewId = Number(res.rows[0].id);
    await client.batch(
      d.tracks.map(([title, rating, standout], idx) => ({
        sql: "INSERT INTO tracks (review_id, position, title, rating, standout) VALUES (?, ?, ?, ?, ?)",
        args: [reviewId, idx + 1, title, rating, standout ? 1 : 0],
      })),
      "write",
    );
  }
  console.log(`Seeded ${DEMO.length} demo reviews.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
