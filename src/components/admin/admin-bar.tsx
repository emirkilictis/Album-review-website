import Link from "next/link";
import { logout } from "@/app/admin/actions";

export function AdminBar({ title }: { title: string }) {
  return (
    <div className="mb-8 flex flex-wrap items-center justify-between gap-4 panel px-4 py-3">
      <div>
        <p className="text-[11px] font-bold tracking-wider text-accent uppercase">Admin</p>
        <h1 className="text-2xl font-extrabold">{title}</h1>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link href="/admin" className="btn-ghost">
          All reviews
        </Link>
        <Link href="/admin/new" className="btn-primary">
          + New review
        </Link>
        <form action={logout}>
          <button type="submit" className="btn-ghost">
            Log out
          </button>
        </form>
      </div>
    </div>
  );
}
