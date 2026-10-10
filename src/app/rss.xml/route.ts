import { excerpt, RELEASE_TYPE_LABEL } from "@/lib/format";
import { getAllReviews } from "@/lib/queries";
import { SITE } from "@/lib/site";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export async function GET() {
  const items = (await getAllReviews()).slice(0, 50).map((r) => {
    const url = `${SITE.url}/reviews/${r.slug}`;
    return `    <item>
      <title>${esc(`${r.artist} – ${r.title} (${RELEASE_TYPE_LABEL[r.type]}) · ${r.score.toFixed(1)}/10`)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${new Date(`${r.publishedAt}T12:00:00Z`).toUTCString()}</pubDate>
      <description>${esc(excerpt(r.summary || r.body, 400))}</description>
    </item>`;
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${esc(SITE.name)}</title>
    <link>${SITE.url}</link>
    <description>${esc(SITE.description)}</description>
    <language>en</language>
${items.join("\n")}
  </channel>
</rss>`;

  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
