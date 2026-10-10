import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AdminBar } from "@/components/admin/admin-bar";
import { DeleteButton } from "@/components/admin/delete-button";
import { Cover, EmptyState, ScoreBadge, TypePill } from "@/components/review-bits";
import { requireAdmin } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { listReviewsForAdmin } from "@/lib/queries";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

export default function AdminPage(props: PageProps<"/admin">) {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse bg-line/40" />}>
      <Dashboard searchParams={props.searchParams} />
    </Suspense>
  );
}

async function Dashboard({ searchParams }: { searchParams: PageProps<"/admin">["searchParams"] }) {
  await requireAdmin();
  const [sp, reviews] = await Promise.all([searchParams, listReviewsForAdmin()]);
  const saved = typeof sp.saved === "string" ? sp.saved : null;

  return (
    <div>
      <AdminBar title={`Reviews (${reviews.length})`} />
      {saved && (
        <p className="mb-6 border border-ink px-4 py-3 text-sm text-ink">
          Saved!{" "}
          <Link href={`/reviews/${saved}`} className="font-semibold underline">
            View the public page →
          </Link>
        </p>
      )}
      {sp.deleted && (
        <p className="mb-6 border border-line px-4 py-3 text-sm text-muted">Review deleted.</p>
      )}
      {reviews.length === 0 ? (
        <EmptyState title="No reviews yet">
          <Link href="/admin/new" className="text-accent underline">
            Write the first one
          </Link>
        </EmptyState>
      ) : (
        <ul className="divide-y divide-line border-y border-line">
          {reviews.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center gap-4 p-3 sm:flex-nowrap">
              <Cover src={r.coverUrl} alt={r.title} className="!w-12 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">
                  {r.title} <span className="font-normal text-muted">· {r.artist}</span>
                </p>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted">
                  <TypePill type={r.type} />
                  <span>{formatDate(r.publishedAt)}</span>
                  {r.featured && <span className="text-accent">Essential</span>}
                </div>
              </div>
              <ScoreBadge score={r.score} size="sm" />
              <div className="flex gap-2">
                <Link href={`/reviews/${r.slug}`} className="btn-ghost px-3 py-1.5 text-xs">
                  View
                </Link>
                <Link href={`/admin/${r.id}/edit`} className="btn-ghost px-3 py-1.5 text-xs">
                  Edit
                </Link>
                <DeleteButton id={r.id} title={r.title} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
