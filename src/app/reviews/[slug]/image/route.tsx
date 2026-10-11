import type { NextRequest } from "next/server";
import { getReviewBySlug } from "@/lib/queries";
import { renderShareImage } from "@/lib/share-image";

// GET /reviews/<slug>/image            → share image (PNG, 1600×900)
// GET /reviews/<slug>/image?download=1 → same image as a file download
export async function GET(req: NextRequest, ctx: RouteContext<"/reviews/[slug]/image">) {
  const { slug } = await ctx.params;
  const review = await getReviewBySlug(slug);
  if (!review) return new Response("Review not found", { status: 404 });

  const image = await renderShareImage(review);
  if (req.nextUrl.searchParams.has("download")) {
    image.headers.set("Content-Disposition", `attachment; filename="${review.slug}.png"`);
  }
  return image;
}
