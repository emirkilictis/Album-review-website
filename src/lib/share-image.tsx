import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import type { ReviewWithTracks } from "./db/schema";
import { formatScore, RELEASE_TYPE_LABEL } from "./format";

// Share card for X / Instagram, styled like the AItunes Reviews post images:
// title, artist, year, cover and big score on the left, track scores on the right.

export const SHARE_IMAGE_SIZE = { width: 1600, height: 900 };

const ASSETS = join(process.cwd(), "src/assets");
const font = (file: string) => readFile(join(ASSETS, "fonts", file));

// Read once per server instance (they never change).
const assets = Promise.all([
  font("PlayfairDisplay-BlackItalic.ttf"),
  font("PlayfairDisplay-BlackItalic-ext.ttf"),
  font("Inter-Regular.ttf"),
  font("Inter-Regular-ext.ttf"),
  font("Inter-SemiBold.ttf"),
  font("Inter-SemiBold-ext.ttf"),
  readFile(join(ASSETS, "logo.png")),
]).then(([serif, serifExt, regular, regularExt, semibold, semiboldExt, logo]) => ({
  fonts: [
    { name: "Playfair", data: serif, weight: 900 as const, style: "italic" as const },
    { name: "Playfair", data: serifExt, weight: 900 as const, style: "italic" as const },
    { name: "Inter", data: regular, weight: 400 as const, style: "normal" as const },
    { name: "Inter", data: regularExt, weight: 400 as const, style: "normal" as const },
    { name: "Inter", data: semibold, weight: 600 as const, style: "normal" as const },
    { name: "Inter", data: semiboldExt, weight: 600 as const, style: "normal" as const },
  ],
  logo: `data:image/png;base64,${logo.toString("base64")}`,
}));

/**
 * Loads the cover and inlines it as a data URI, so a broken or slow cover link
 * degrades to a blank square instead of failing the whole image.
 */
async function loadCover(coverUrl: string | null): Promise<string | null> {
  if (!coverUrl) return null;
  try {
    if (coverUrl.startsWith("/")) {
      const file = join(process.cwd(), "public", coverUrl.split("?")[0]);
      const type = file.endsWith(".svg") ? "image/svg+xml" : file.endsWith(".png") ? "image/png" : "image/jpeg";
      return `data:${type};base64,${(await readFile(file)).toString("base64")}`;
    }
    const res = await fetch(coverUrl, { signal: AbortSignal.timeout(6000) });
    const type = res.headers.get("content-type") ?? "";
    if (!res.ok || !type.startsWith("image/")) return null;
    const bytes = Buffer.from(await res.arrayBuffer());
    if (bytes.length > 8_000_000) return null;
    return `data:${type.split(";")[0]};base64,${bytes.toString("base64")}`;
  } catch {
    return null;
  }
}

function Star({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ marginLeft: 8, flexShrink: 0 }}>
      <path fill="#1800ac" d="M12 2l2.9 6.9 7.1.6-5.4 4.7 1.6 7L12 17.5 5.8 21.2l1.6-7L2 9.5l7.1-.6z" />
    </svg>
  );
}

const INK = "#111111";
const MUTED = "#8a8a8a";
const LINE = "#e4e4e4";

function ScoreCircle({ score, size, border }: { score: number | null; size: number; border: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size,
        border: `${border}px solid ${INK}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Inter",
        fontWeight: 600,
        fontSize: Math.round(size * 0.36),
        color: score == null ? MUTED : INK,
        flexShrink: 0,
      }}
    >
      {formatScore(score)}
    </div>
  );
}

export async function renderShareImage(review: ReviewWithTracks) {
  const [{ fonts, logo }, cover] = await Promise.all([assets, loadCover(review.coverUrl)]);
  const year = review.releaseDate?.slice(0, 4);

  // Shrink the title for long names so it fits in two or three lines.
  const titleSize = review.title.length > 40 ? 52 : review.title.length > 22 ? 64 : 80;

  // Fit the tracklist: one column up to 16 tracks, two columns above that (max 32).
  const MAX_TRACKS = 32;
  const shown = review.tracks.slice(0, MAX_TRACKS);
  const hidden = review.tracks.length - shown.length;
  const twoColumns = shown.length > 16;
  const half = Math.ceil(shown.length / 2);
  const columns = twoColumns ? [shown.slice(0, half), shown.slice(half)] : [shown];
  const rowsPerColumn = Math.max(1, columns[0].length);
  // Short tracklists leave room for a big logo under them, like the AItunes post cards.
  const logoOnRight = shown.length <= 7;
  const listHeight = 900 - 2 * 64 - 64 - (logoOnRight ? 300 : 0);
  const rowHeight = Math.min(84, Math.floor(listHeight / rowsPerColumn));
  const circle = Math.min(54, rowHeight - 10);
  const trackFont = Math.min(twoColumns ? 20 : 24, Math.round(rowHeight * 0.4));

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#ffffff",
          padding: 64,
          gap: 64,
          fontFamily: "Inter",
          color: INK,
        }}
      >
        {/* Left: release + score */}
        <div style={{ width: 640, display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
          <div
            style={{
              fontFamily: "Playfair",
              fontStyle: "italic",
              fontWeight: 900,
              fontSize: titleSize,
              lineHeight: 1.05,
              textAlign: "center",
              letterSpacing: -1,
              display: "flex",
              justifyContent: "center",
            }}
          >
            {review.title}
          </div>
          <div style={{ fontSize: 40, marginTop: 18, textAlign: "center" }}>{review.artist}</div>
          <div style={{ fontSize: 28, marginTop: 10, color: "#333" }}>
            {[year, RELEASE_TYPE_LABEL[review.type]].filter(Boolean).join(" · ")}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 44, marginTop: "auto", marginBottom: "auto" }}>
            {cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cover} width={300} height={300} style={{ objectFit: "cover", boxShadow: "0 10px 30px rgba(0,0,0,0.18)" }} alt="" />
            ) : (
              <div style={{ width: 300, height: 300, background: "#f2f2f2", display: "flex" }} />
            )}
            <ScoreCircle score={review.score} size={230} border={7} />
          </div>

          {!logoOnRight && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} width={190} height={100} style={{ objectFit: "contain" }} alt="" />
          )}
        </div>

        {/* Right: track scores */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          {shown.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 34, paddingBottom: 14, borderBottom: `2px solid ${LINE}`, display: "flex" }}>Track Scores</div>
              <div style={{ display: "flex", gap: 36 }}>
                {columns.map((col, ci) => (
                  <div key={ci} style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
                    {col.map((t) => (
                      <div
                        key={t.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          height: rowHeight,
                          borderBottom: `1.5px solid ${LINE}`,
                          gap: 16,
                        }}
                      >
                        <div style={{ width: 34, fontSize: Math.max(14, trackFont * 0.8), display: "flex" }}>
                          {String(t.position).padStart(2, "0")}
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", minWidth: 0 }}>
                            <div
                              style={{
                                fontSize: trackFont,
                                fontWeight: 600,
                                textTransform: "uppercase",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                display: "block",
                              }}
                            >
                              {t.title}
                            </div>
                            {t.standout && <Star size={trackFont} />}
                          </div>
                          {rowHeight >= 60 && (
                            <div style={{ fontSize: Math.round(trackFont * 0.62), color: MUTED, display: "flex" }}>{review.artist}</div>
                          )}
                        </div>
                        <ScoreCircle score={t.rating} size={circle} border={2} />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
              {hidden > 0 && <div style={{ fontSize: 20, color: MUTED, marginTop: 10, display: "flex" }}>{`+ ${hidden} more tracks`}</div>}
            </div>
          )}
          {logoOnRight && (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logo} width={shown.length ? 480 : 600} height={shown.length ? 252 : 315} style={{ objectFit: "contain" }} alt="" />
            </div>
          )}
        </div>
      </div>
    ),
    { ...SHARE_IMAGE_SIZE, fonts },
  );
}
