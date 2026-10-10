"use client";

import { deleteReview } from "@/app/admin/actions";

export function DeleteButton({ id, title }: { id: number; title: string }) {
  return (
    <form
      action={deleteReview}
      onSubmit={(e) => {
        if (!confirm(`Delete the review of "${title}"? This cannot be undone.`)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="btn-danger px-3 py-1.5 text-xs">
        Delete
      </button>
    </form>
  );
}
