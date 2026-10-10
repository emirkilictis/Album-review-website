import { NextResponse, type NextRequest } from "next/server";
import { isAdmin } from "@/lib/auth";

// Admin helper: search the public iTunes catalogue (no API key needed) so a
// review can be pre-filled with cover art, release date and tracklist.

type ItunesItem = {
  wrapperType: string;
  collectionType?: string;
  collectionId: number;
  collectionName: string;
  artistName: string;
  artworkUrl100?: string;
  releaseDate?: string;
  trackCount?: number;
  primaryGenreName?: string;
  collectionViewUrl?: string;
  trackName?: string;
  trackNumber?: number;
  discNumber?: number;
  kind?: string;
};

export type ItunesAlbum = {
  id: number;
  title: string;
  artist: string;
  coverUrl: string | null;
  releaseDate: string | null;
  trackCount: number;
  type: "album" | "ep" | "single";
  genre: string | null;
  /** Apple Music page of the release */
  url: string | null;
};

const hiRes = (url?: string) => (url ? url.replace(/\/\d+x\d+bb\./, "/1000x1000bb.") : null);

// iTunes appends " - Single" / " - EP" to collection names.
function cleanTitle(name: string): { title: string; type: ItunesAlbum["type"] } {
  const match = name.match(/\s+-\s+(Single|EP)$/i);
  if (!match) return { title: name, type: "album" };
  return { title: name.slice(0, match.index), type: match[1].toLowerCase() === "ep" ? "ep" : "single" };
}

function toAlbum(item: ItunesItem): ItunesAlbum {
  const { title, type } = cleanTitle(item.collectionName);
  return {
    id: item.collectionId,
    title,
    artist: item.artistName,
    coverUrl: hiRes(item.artworkUrl100),
    releaseDate: item.releaseDate?.slice(0, 10) ?? null,
    trackCount: item.trackCount ?? 0,
    type,
    genre: item.primaryGenreName ?? null,
    url: item.collectionViewUrl?.replace(/[?&]uo=\d+/, "") ?? null,
  };
}

async function itunes(path: string, params: Record<string, string>): Promise<ItunesItem[]> {
  const url = `https://itunes.apple.com/${path}?${new URLSearchParams(params)}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`iTunes responded with ${res.status}`);
  const json = (await res.json()) as { results?: ItunesItem[] };
  return json.results ?? [];
}

export async function GET(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = req.nextUrl.searchParams.get("q")?.trim();
  const id = req.nextUrl.searchParams.get("id")?.trim();
  const country = req.nextUrl.searchParams.get("country")?.trim() || "US";

  try {
    if (id) {
      const items = await itunes("lookup", { id, entity: "song", country, limit: "200" });
      const collection = items.find((i) => i.wrapperType === "collection");
      if (!collection) return NextResponse.json({ error: "Not found" }, { status: 404 });
      const songs = items
        .filter((i) => i.wrapperType === "track" && i.trackName)
        .sort((a, b) => (a.discNumber ?? 1) - (b.discNumber ?? 1) || (a.trackNumber ?? 0) - (b.trackNumber ?? 0))
        .map((i) => i.trackName!);
      return NextResponse.json({ album: toAlbum(collection), tracks: songs });
    }

    if (!q) return NextResponse.json({ results: [] });
    const items = await itunes("search", { term: q, entity: "album", country, limit: "15" });
    return NextResponse.json({ results: items.filter((i) => i.wrapperType === "collection").map(toAlbum) });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Lookup failed" }, { status: 502 });
  }
}
