import type { MetadataRoute } from "next";
import { getAllReviews, getArtists } from "@/lib/queries";
import { SITE } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [reviews, artists] = await Promise.all([getAllReviews(), getArtists()]);
  return [
    { url: SITE.url },
    { url: `${SITE.url}/reviews` },
    { url: `${SITE.url}/artists` },
    { url: `${SITE.url}/about` },
    ...reviews.map((r) => ({ url: `${SITE.url}/reviews/${r.slug}`, lastModified: r.updatedAt.replace(" ", "T") + "Z" })),
    ...artists.map((a) => ({ url: `${SITE.url}/artists/${a.slug}` })),
  ];
}
