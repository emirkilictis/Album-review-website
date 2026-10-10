import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { AdminBar } from "@/components/admin/admin-bar";
import { ReviewForm } from "@/components/admin/review-form";
import { requireAdmin } from "@/lib/auth";
import { collectGenres, listReviewsForAdmin } from "@/lib/queries";

export const metadata: Metadata = { title: "New review", robots: { index: false } };

export default function NewReviewPage() {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse bg-line/40" />}>
      <Content />
    </Suspense>
  );
}

async function Content() {
  await requireAdmin();
  await connection();
  const knownGenres = collectGenres(await listReviewsForAdmin());
  return (
    <div>
      <AdminBar title="New review" />
      <ReviewForm today={new Date().toISOString().slice(0, 10)} knownGenres={knownGenres} />
    </div>
  );
}
