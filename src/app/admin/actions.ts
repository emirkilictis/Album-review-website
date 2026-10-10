"use server";

import { eq, like, or } from "drizzle-orm";
import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { checkPassword, createSession, destroySession, requireAdmin } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { RELEASE_TYPES, reviews, tracks, type ReleaseType } from "@/lib/db/schema";
import { slugify } from "@/lib/format";
import { REVIEWS_TAG } from "@/lib/queries";

export type FormState = { error?: string } | undefined;

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const password = String(formData.get("password") ?? "");
  if (!checkPassword(password)) {
    // Slow down brute-force attempts a little.
    await new Promise((r) => setTimeout(r, 800));
    return { error: "Wrong password." };
  }
  await createSession();
  redirect("/admin");
}

export async function logout() {
  await destroySession();
  redirect("/admin/login");
}

type TrackInput = { title: string; rating: number | null; standout: boolean };

function parseScore(raw: FormDataEntryValue | null, label: string, required: boolean): number | null {
  const text = String(raw ?? "").trim().replace(",", ".");
  if (text === "") {
    if (required) throw new ValidationError(`${label} is required.`);
    return null;
  }
  const value = Number(text);
  if (!Number.isFinite(value) || value < 0 || value > 10) {
    throw new ValidationError(`${label} must be a number between 0 and 10.`);
  }
  return Math.round(value * 10) / 10;
}

class ValidationError extends Error {}

function parseReview(formData: FormData) {
  const str = (key: string) => String(formData.get(key) ?? "").trim();

  const title = str("title");
  const artist = str("artist");
  if (!title) throw new ValidationError("Title is required.");
  if (!artist) throw new ValidationError("Artist is required.");

  const type = str("type") as ReleaseType;
  if (!RELEASE_TYPES.includes(type)) throw new ValidationError("Pick a release type.");

  // Genres: comma separated, duplicates (case-insensitive) dropped.
  const genres: string[] = [];
  for (const raw of str("genres").split(",")) {
    const g = raw.trim().replace(/\s+/g, " ");
    if (g && !genres.some((x) => x.toLowerCase() === g.toLowerCase())) genres.push(g);
  }
  genres.splice(8);

  // Streaming links: one per line.
  const links = [...new Set(str("links").split(/\s+/).map((l) => l.trim()).filter(Boolean))];
  const badLink = links.find((l) => !/^https?:\/\/[^\s]+\.[^\s]+/i.test(l));
  if (badLink) throw new ValidationError(`"${badLink}" is not a valid link. Links must start with https://`);

  const coverUrl = str("coverUrl");
  if (coverUrl && !/^(https?:\/\/|\/)/i.test(coverUrl)) {
    throw new ValidationError("Cover URL must start with http://, https:// or /");
  }

  const dateRe = /^\d{4}-\d{2}-\d{2}$/;
  const releaseDate = str("releaseDate");
  if (releaseDate && !dateRe.test(releaseDate)) throw new ValidationError("Release date must be YYYY-MM-DD.");
  const publishedAt = str("publishedAt") || new Date().toISOString().slice(0, 10);
  if (!dateRe.test(publishedAt)) throw new ValidationError("Publish date must be YYYY-MM-DD.");

  let trackList: TrackInput[] = [];
  try {
    const raw = JSON.parse(str("tracks") || "[]") as { title?: unknown; rating?: unknown; standout?: unknown }[];
    trackList = raw
      .map((t, i) => ({
        title: String(t.title ?? "").trim(),
        rating: parseScore(t.rating == null ? null : String(t.rating), `Track ${i + 1} rating`, false),
        standout: Boolean(t.standout),
      }))
      .filter((t) => t.title !== "");
  } catch (err) {
    if (err instanceof ValidationError) throw err;
    throw new ValidationError("Tracklist could not be read.");
  }

  return {
    title,
    artist,
    artistSlug: slugify(artist),
    type,
    coverUrl: coverUrl || null,
    releaseDate: releaseDate || null,
    publishedAt,
    score: parseScore(formData.get("score"), "Score", true)!,
    genres: JSON.stringify(genres),
    links: JSON.stringify(links),
    summary: str("summary") || null,
    body: str("body"),
    author: str("author") || "AItunes",
    featured: formData.get("featured") === "on",
    tracks: trackList,
  };
}

async function uniqueSlug(base: string): Promise<string> {
  const db = await getDb();
  const taken = new Set(
    (
      await db
        .select({ slug: reviews.slug })
        .from(reviews)
        .where(or(eq(reviews.slug, base), like(reviews.slug, `${base}-%`)))
    ).map((r) => r.slug),
  );
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

export async function saveReview(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();

  let data: ReturnType<typeof parseReview>;
  try {
    data = parseReview(formData);
  } catch (err) {
    if (err instanceof ValidationError) return { error: err.message };
    throw err;
  }

  const { tracks: trackList, ...fields } = data;
  const idRaw = formData.get("id");
  const id = idRaw ? Number(idRaw) : null;
  const db = await getDb();
  let slug: string;

  if (id) {
    // The slug (permalink) never changes after publishing, so links shared
    // elsewhere (e.g. on AOTY or social media) keep working.
    const [existing] = await db.select({ slug: reviews.slug }).from(reviews).where(eq(reviews.id, id)).limit(1);
    if (!existing) return { error: "This review no longer exists." };
    slug = existing.slug;
    await db.transaction(async (tx) => {
      await tx
        .update(reviews)
        .set({ ...fields, updatedAt: new Date().toISOString().replace("T", " ").slice(0, 19) })
        .where(eq(reviews.id, id));
      await tx.delete(tracks).where(eq(tracks.reviewId, id));
      if (trackList.length) {
        await tx.insert(tracks).values(trackList.map((t, i) => ({ ...t, reviewId: id, position: i + 1 })));
      }
    });
  } else {
    slug = await uniqueSlug(slugify(`${fields.artist} ${fields.title}`));
    await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(reviews)
        .values({ ...fields, slug })
        .returning({ id: reviews.id });
      if (trackList.length) {
        await tx.insert(tracks).values(trackList.map((t, i) => ({ ...t, reviewId: created.id, position: i + 1 })));
      }
    });
  }

  updateTag(REVIEWS_TAG);
  redirect(`/admin?saved=${encodeURIComponent(slug)}`);
}

export async function deleteReview(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!id) return;
  const db = await getDb();
  await db.transaction(async (tx) => {
    await tx.delete(tracks).where(eq(tracks.reviewId, id));
    await tx.delete(reviews).where(eq(reviews.id, id));
  });
  updateTag(REVIEWS_TAG);
  redirect("/admin?deleted=1");
}
