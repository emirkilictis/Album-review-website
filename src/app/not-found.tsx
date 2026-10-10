import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-16 text-center">
      <p className="headline text-8xl">404</p>
      <h1 className="mt-2 font-serif text-2xl italic">This page skipped a beat</h1>
      <p className="mt-2 text-muted">The review or artist you are looking for does not exist.</p>
      <Link href="/reviews" className="btn-primary mt-6">
        Browse all reviews
      </Link>
    </div>
  );
}
