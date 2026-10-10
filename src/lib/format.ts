import type { ReleaseType } from "./db/schema";

export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "untitled";
}

/** Scores and track ratings go from 0 to 10 with one decimal. */
export function formatScore(score: number | null | undefined): string {
  if (score == null || Number.isNaN(score)) return "–";
  return score.toFixed(1);
}

/** Colour band used for score badges, AOTY-style (green / yellow / red). */
export function scoreTone(score: number | null | undefined): "high" | "mid" | "low" | "none" {
  if (score == null) return "none";
  if (score >= 7) return "high";
  if (score >= 5) return "mid";
  return "low";
}

/** Reads one of the JSON-array text columns (genres, links). */
export function parseList(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string" && v.trim() !== "") : [];
  } catch {
    return [];
  }
}

export const PLATFORMS = [
  { id: "spotify", label: "Spotify", hosts: ["open.spotify.com", "spotify.link"], color: "#1db954" },
  { id: "apple", label: "Apple Music", hosts: ["music.apple.com", "itunes.apple.com"], color: "#fa243c" },
  { id: "youtube-music", label: "YouTube Music", hosts: ["music.youtube.com"], color: "#ff0000" },
  { id: "youtube", label: "YouTube", hosts: ["youtube.com", "youtu.be"], color: "#ff0000" },
  { id: "soundcloud", label: "SoundCloud", hosts: ["soundcloud.com", "on.soundcloud.com"], color: "#ff5500" },
  { id: "deezer", label: "Deezer", hosts: ["deezer.com", "deezer.page.link", "link.deezer.com"], color: "#a238ff" },
  { id: "tidal", label: "TIDAL", hosts: ["tidal.com", "listen.tidal.com"], color: "#000000" },
  { id: "amazon", label: "Amazon Music", hosts: ["music.amazon.com", "amazon.com"], color: "#25d1da" },
  { id: "bandcamp", label: "Bandcamp", hosts: ["bandcamp.com"], color: "#1da0c3" },
  { id: "suno", label: "Suno", hosts: ["suno.com", "suno.ai"], color: "#000000" },
] as const;

export type Platform = { id: string; label: string; color: string };

/** Works out which streaming service a URL belongs to (falls back to "Listen"). */
export function platformFor(url: string): Platform {
  let host = "";
  try {
    host = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return { id: "other", label: "Listen", color: "#1b1b1b" };
  }
  const match = PLATFORMS.find((p) => p.hosts.some((h) => host === h || host.endsWith(`.${h}`)));
  return match ?? { id: "other", label: host || "Listen", color: "#1b1b1b" };
}

export const RELEASE_TYPE_LABEL: Record<ReleaseType, string> = {
  album: "Album",
  ep: "EP",
  single: "Single",
};

export function formatDate(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value.length === 10 ? `${value}T00:00:00Z` : value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
}

export function excerpt(text: string | null | undefined, max = 160): string {
  if (!text) return "";
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean;
}
