import Link from "next/link";

export default function NotFound() {
  return (
    <div className="panel py-16 text-center">
      <p className="text-7xl font-black text-accent">404</p>
      <h1 className="mt-2 text-2xl font-extrabold">This page skipped a beat</h1>
      <p className="mt-2 text-muted">The review or artist you are looking for does not exist.</p>
      <Link href="/reviews" className="btn-primary mt-6">
        Browse all reviews
      </Link>
    </div>
  );
}
