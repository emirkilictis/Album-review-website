"use client";

import { useActionState, useState } from "react";
import { saveReview } from "@/app/admin/actions";
import type { ItunesAlbum } from "@/app/api/itunes/route";
import { Cover, ScoreBadge } from "@/components/review-bits";
import type { ReleaseType, ReviewWithTracks } from "@/lib/db/schema";
import { parseList, platformFor, RELEASE_TYPE_LABEL } from "@/lib/format";

type TrackRow = { key: number; title: string; rating: string; standout: boolean };

let nextKey = 1;
const row = (title = "", rating = "", standout = false): TrackRow => ({ key: nextKey++, title, rating, standout });

export function ReviewForm({
  review,
  today,
  knownGenres = [],
}: {
  review?: ReviewWithTracks;
  today: string;
  /** Genres already used on other reviews, offered as one-click suggestions. */
  knownGenres?: string[];
}) {
  const [state, action, pending] = useActionState(saveReview, undefined);

  // All fields are controlled so nothing is lost if the server returns a validation error.
  const [f, setF] = useState({
    title: review?.title ?? "",
    artist: review?.artist ?? "",
    type: (review?.type ?? "album") as ReleaseType,
    releaseDate: review?.releaseDate ?? "",
    publishedAt: review?.publishedAt ?? today,
    coverUrl: review?.coverUrl ?? "",
    genres: parseList(review?.genres).join(", "),
    links: parseList(review?.links).join("\n"),
    score: review ? String(review.score) : "",
    summary: review?.summary ?? "",
    body: review?.body ?? "",
    author: review?.author ?? "AItunes",
    featured: review?.featured ?? false,
  });
  const set = <K extends keyof typeof f>(key: K, value: (typeof f)[K]) => setF((prev) => ({ ...prev, [key]: value }));

  const [trackRows, setTrackRows] = useState<TrackRow[]>(() =>
    review?.tracks.length
      ? review.tracks.map((t) => row(t.title, t.rating == null ? "" : String(t.rating), t.standout))
      : [row()],
  );
  const updateTrack = (key: number, patch: Partial<TrackRow>) =>
    setTrackRows((rows) => rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const moveTrack = (index: number, dir: -1 | 1) =>
    setTrackRows((rows) => {
      const to = index + dir;
      if (to < 0 || to >= rows.length) return rows;
      const copy = [...rows];
      [copy[index], copy[to]] = [copy[to], copy[index]];
      return copy;
    });

  const tracksJson = JSON.stringify(
    trackRows.map((t) => ({ title: t.title, rating: t.rating.trim() === "" ? null : t.rating, standout: t.standout })),
  );

  const applyImport = (album: ItunesAlbum, titles: string[]) => {
    setF((prev) => ({
      ...prev,
      title: album.title,
      artist: album.artist,
      type: album.type,
      releaseDate: album.releaseDate ?? prev.releaseDate,
      coverUrl: album.coverUrl ?? prev.coverUrl,
      genres: prev.genres || (album.genre ?? ""),
      links: album.url && !prev.links.includes(album.url) ? [prev.links, album.url].filter(Boolean).join("\n") : prev.links,
    }));
    if (titles.length) setTrackRows(titles.map((t) => row(t)));
  };

  const scoreNum = Number(f.score.replace(",", "."));
  const currentGenres = f.genres.split(",").map((g) => g.trim().toLowerCase()).filter(Boolean);
  const addGenre = (g: string) => set("genres", [f.genres.trim().replace(/,$/, ""), g].filter(Boolean).join(", "));
  const linkList = f.links.split(/\s+/).filter(Boolean);

  return (
    <div className="space-y-8">
      {!review && <ItunesImport onPick={applyImport} />}

      <form action={action} className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <input type="hidden" name="id" value={review?.id ?? ""} />
        <input type="hidden" name="tracks" value={tracksJson} />

        <div className="space-y-8">
          <Section title="Release">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Title *">
                <input name="title" required value={f.title} onChange={(e) => set("title", e.target.value)} className="field" />
              </Field>
              <Field label="Artist *">
                <input name="artist" required value={f.artist} onChange={(e) => set("artist", e.target.value)} className="field" />
              </Field>
              <Field label="Type">
                <select name="type" value={f.type} onChange={(e) => set("type", e.target.value as ReleaseType)} className="field">
                  {Object.entries(RELEASE_TYPE_LABEL).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Release date">
                <input type="date" name="releaseDate" value={f.releaseDate} onChange={(e) => set("releaseDate", e.target.value)} className="field" />
              </Field>
              <Field label="Cover image URL" hint="Paste a link to the cover (Apple Music import fills this in)." className="sm:col-span-2">
                <input
                  name="coverUrl"
                  placeholder="https://…"
                  value={f.coverUrl}
                  onChange={(e) => set("coverUrl", e.target.value)}
                  className="field"
                />
              </Field>
              <Field label="Genres" hint="Separate with commas, e.g. Synth-pop, Electronic" className="sm:col-span-2">
                <input name="genres" value={f.genres} onChange={(e) => set("genres", e.target.value)} placeholder="Synth-pop, Electronic" className="field" />
              </Field>
              {knownGenres.some((g) => !currentGenres.includes(g.toLowerCase())) && (
                <div className="-mt-2 flex flex-wrap gap-1.5 sm:col-span-2">
                  {knownGenres
                    .filter((g) => !currentGenres.includes(g.toLowerCase()))
                    .map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => addGenre(g)}
                        className="rounded-full border border-line px-2.5 py-0.5 text-xs text-muted hover:border-ink hover:text-ink"
                      >
                        + {g}
                      </button>
                    ))}
                </div>
              )}
              <Field
                label="Listen links"
                hint="Paste one link per line (Spotify, Apple Music, YouTube, SoundCloud…). The platform is detected automatically."
                className="sm:col-span-2"
              >
                <textarea
                  name="links"
                  rows={3}
                  value={f.links}
                  onChange={(e) => set("links", e.target.value)}
                  placeholder={"https://open.spotify.com/album/…\nhttps://music.apple.com/…"}
                  className="field font-mono text-xs"
                />
              </Field>
              {linkList.length > 0 && (
                <div className="-mt-2 flex flex-wrap gap-1.5 sm:col-span-2">
                  {linkList.map((l) => (
                    <span key={l} className="rounded-[3px] bg-surface-2 px-2 py-0.5 text-xs font-semibold">
                      ✓ {platformFor(l).label}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </Section>

          <Section title="Review">
            <div className="space-y-4">
              <Field label="Score (0–10) *" hint="One decimal allowed, e.g. 7.8">
                <input
                  name="score"
                  required
                  inputMode="decimal"
                  placeholder="7.8"
                  value={f.score}
                  onChange={(e) => set("score", e.target.value)}
                  className="field max-w-32"
                />
              </Field>
              <Field label="Summary" hint="One or two sentences shown on cards and at the top of the review.">
                <textarea name="summary" rows={2} value={f.summary} onChange={(e) => set("summary", e.target.value)} className="field" />
              </Field>
              <Field label="Full review" hint="Leave an empty line between paragraphs.">
                <textarea name="body" rows={12} value={f.body} onChange={(e) => set("body", e.target.value)} className="field leading-relaxed" />
              </Field>
            </div>
          </Section>

          <Section title={`Tracklist (${trackRows.filter((t) => t.title.trim()).length})`}>
            <TrackEditor
              rows={trackRows}
              onChange={updateTrack}
              onMove={moveTrack}
              onRemove={(key) => setTrackRows((rows) => (rows.length > 1 ? rows.filter((r) => r.key !== key) : [row()]))}
              onAdd={() => setTrackRows((rows) => [...rows, row()])}
              onPaste={(titles) => setTrackRows(titles.map((t) => row(t)))}
            />
          </Section>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:h-fit">
          <div className="border border-line">
            <Cover src={f.coverUrl || null} alt={f.title || "Cover"} />
            <div className="flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="truncate font-semibold">{f.title || "Untitled"}</p>
                <p className="truncate text-sm text-muted">{f.artist || "Artist"}</p>
              </div>
              <ScoreBadge score={f.score && Number.isFinite(scoreNum) ? scoreNum : null} size="sm" />
            </div>
          </div>
          <div className="space-y-4 border border-line p-4">
            <Field label="Publish date">
              <input type="date" name="publishedAt" value={f.publishedAt} onChange={(e) => set("publishedAt", e.target.value)} className="field" />
            </Field>
            <Field label="Author / byline">
              <input name="author" value={f.author} onChange={(e) => set("author", e.target.value)} className="field" />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="featured" checked={f.featured} onChange={(e) => set("featured", e.target.checked)} className="accent-accent" />
              <span>
                Mark as <span className="font-semibold text-accent">Essential</span> (featured on home page)
              </span>
            </label>
          </div>
          {state?.error && <p className="border border-score-low/40 bg-score-low/10 px-4 py-3 text-sm text-score-low">{state.error}</p>}
          <button type="submit" disabled={pending} className="btn-primary w-full py-2.5 text-sm">
            {pending ? "Saving…" : review ? "Save changes" : "Publish review"}
          </button>
        </aside>
      </form>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 border border-line p-4">
      <h2 className="section-title">{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, hint, className = "", children }: { label: string; hint?: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={`block space-y-1.5 ${className}`}>
      <span className="block text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="block text-xs text-muted">{hint}</span>}
    </label>
  );
}

function TrackEditor({
  rows,
  onChange,
  onMove,
  onRemove,
  onAdd,
  onPaste,
}: {
  rows: TrackRow[];
  onChange: (key: number, patch: Partial<TrackRow>) => void;
  onMove: (index: number, dir: -1 | 1) => void;
  onRemove: (key: number) => void;
  onAdd: () => void;
  onPaste: (titles: string[]) => void;
}) {
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");

  return (
    <div className="space-y-3">
      <div className="hidden grid-cols-[2rem_minmax(0,1fr)_5rem_5.5rem_6rem] gap-2 px-1 text-xs text-muted sm:grid">
        <span>#</span>
        <span>Track title</span>
        <span>Rating</span>
        <span>Standout</span>
        <span />
      </div>
      {rows.map((t, i) => (
        <div key={t.key} className="grid grid-cols-[2rem_minmax(0,1fr)_4.5rem] items-center gap-2 sm:grid-cols-[2rem_minmax(0,1fr)_5rem_5.5rem_6rem]">
          <span className="text-center text-sm tabular-nums text-muted">{i + 1}</span>
          <input
            aria-label={`Track ${i + 1} title`}
            value={t.title}
            onChange={(e) => onChange(t.key, { title: e.target.value })}
            placeholder="Track title"
            className="field"
          />
          <input
            aria-label={`Track ${i + 1} rating`}
            value={t.rating}
            onChange={(e) => onChange(t.key, { rating: e.target.value })}
            placeholder="0–10"
            inputMode="decimal"
            className="field text-center"
          />
          <label className="col-start-2 flex items-center gap-2 text-xs text-muted sm:col-start-auto sm:justify-center">
            <input type="checkbox" checked={t.standout} onChange={(e) => onChange(t.key, { standout: e.target.checked })} className="accent-accent" />
            <span className="sm:sr-only">Standout</span>
          </label>
          <div className="flex justify-end gap-1">
            <IconButton label="Move up" onClick={() => onMove(i, -1)} disabled={i === 0}>
              ↑
            </IconButton>
            <IconButton label="Move down" onClick={() => onMove(i, 1)} disabled={i === rows.length - 1}>
              ↓
            </IconButton>
            <IconButton label="Remove track" onClick={() => onRemove(t.key)}>
              ✕
            </IconButton>
          </div>
        </div>
      ))}
      <div className="flex flex-wrap gap-2 pt-2">
        <button type="button" onClick={onAdd} className="btn-ghost">
          + Add track
        </button>
        <button type="button" onClick={() => setPasteOpen((v) => !v)} className="btn-ghost">
          Paste tracklist
        </button>
      </div>
      {pasteOpen && (
        <div className="space-y-2 border border-line bg-surface-2 p-3">
          <p className="text-xs text-muted">One track per line. Leading numbers like “1.” or “01 -” are removed. This replaces the current list.</p>
          <textarea rows={6} value={pasteText} onChange={(e) => setPasteText(e.target.value)} className="field" />
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              const titles = pasteText
                .split("\n")
                .map((l) => l.replace(/^\s*\d+\s*[.)\-–:]?\s*/, "").trim())
                .filter(Boolean);
              if (titles.length) onPaste(titles);
              setPasteOpen(false);
              setPasteText("");
            }}
          >
            Use these tracks
          </button>
        </div>
      )}
    </div>
  );
}

function IconButton({ label, children, ...props }: { label: string; children: React.ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className="h-8 w-8 rounded-[3px] border border-line text-sm text-muted transition hover:border-accent hover:text-ink disabled:opacity-30"
      {...props}
    >
      {children}
    </button>
  );
}

function ItunesImport({ onPick }: { onPick: (album: ItunesAlbum, tracks: string[]) => void }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<ItunesAlbum[] | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function search() {
    if (!q.trim()) return;
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch(`/api/itunes?q=${encodeURIComponent(q)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Search failed");
      setResults(json.results);
      if (json.results.length === 0) setStatus("No matches on Apple Music. You can still fill in the form by hand.");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Search failed");
    } finally {
      setBusy(false);
    }
  }

  async function pick(album: ItunesAlbum) {
    setBusy(true);
    try {
      const res = await fetch(`/api/itunes?id=${album.id}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Lookup failed");
      onPick(json.album, json.tracks);
      setResults(null);
      setStatus(`Imported “${album.title}” — check the details below.`);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Lookup failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-3 border border-accent/40 bg-accent/5 p-4">
      <div>
        <h2 className="text-base font-extrabold">Quick fill from Apple Music</h2>
        <p className="text-sm text-muted">Search a release to auto-fill the title, artist, cover, release date and tracklist.</p>
      </div>
      <div className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              search();
            }
          }}
          placeholder="Artist and album name…"
          className="field"
        />
        <button type="button" onClick={search} disabled={busy} className="btn-primary">
          {busy ? "…" : "Search"}
        </button>
      </div>
      {status && <p className="text-sm text-muted">{status}</p>}
      {results && results.length > 0 && (
        <ul className="grid gap-2 sm:grid-cols-2">
          {results.map((a) => (
            <li key={a.id}>
              <button
                type="button"
                onClick={() => pick(a)}
                disabled={busy}
                className="flex w-full items-center gap-3 border border-line bg-white p-2 text-left transition hover:border-accent"
              >
                <Cover src={a.coverUrl} alt={a.title} className="!w-12 shrink-0" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{a.title}</span>
                  <span className="block truncate text-xs text-muted">
                    {a.artist} · {RELEASE_TYPE_LABEL[a.type]} · {a.releaseDate?.slice(0, 4)} · {a.trackCount} tracks
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
