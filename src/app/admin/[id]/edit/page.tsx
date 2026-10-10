import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AdminBar } from "@/components/admin/admin-bar";
import { ReviewForm } from "@/components/admin/review-form";
import { requireAdmin } from "@/lib/auth";
import { getReviewForEdit } from "@/lib/queries";

export const metadata: Metadata = { title: "Edit review", robots: { index: false } };

export default function EditReviewPage(props: PageProps<"/admin/[id]/edit">) {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse bg-line/40" />}>
      <Content params={props.params} />
    </Suspense>
  );
}

async function Content({ params }: { params: PageProps<"/admin/[id]/edit">["params"] }) {
  await requireAdmin();
  const { id } = await params;
  const review = Number.isInteger(Number(id)) ? await getReviewForEdit(Number(id)) : null;
  if (!review) notFound();
  return (
    <div>
      <AdminBar title={`Edit: ${review.title}`} />
      <ReviewForm review={review} today={review.publishedAt} />
    </div>
  );
}
