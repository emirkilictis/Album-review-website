import Form from "next/form";
import Link from "next/link";
import { SITE } from "@/lib/site";

const NAV = [
  { href: "/reviews", label: "Reviews" },
  { href: "/rankings", label: "Rankings" },
  { href: "/artists", label: "Artists" },
  { href: "/about", label: "About" },
];

/** Text version of the AItunes Reviews logo. Swap for the real logo image when we have it. */
export function Logo({ className = "", stacked = false }: { className?: string; stacked?: boolean }) {
  return (
    <span className={`font-brand leading-[0.9] font-bold tracking-wide text-accent uppercase ${stacked ? "inline-flex flex-col items-center" : ""} ${className}`}>
      <span>AItunes</span>
      {stacked ? <span>Reviews</span> : <span> Reviews</span>}
    </span>
  );
}

export function SiteHeader() {
  return (
    <header className="border-b border-ink bg-white">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex justify-center py-4 sm:py-5">
          <Link href="/" aria-label={`${SITE.name} home`}>
            <Logo stacked className="text-3xl sm:text-4xl" />
          </Link>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-line py-2.5">
          <nav className="flex gap-5 overflow-x-auto text-[12px] font-bold tracking-[0.14em] uppercase">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className="whitespace-nowrap hover:text-accent">
                {item.label}
              </Link>
            ))}
          </nav>
          <Form action="/reviews" className="ml-auto w-full sm:w-auto">
            <label className="sr-only" htmlFor="site-search">
              Search
            </label>
            <input
              id="site-search"
              type="search"
              name="q"
              placeholder="Search artists & releases"
              className="w-full border-0 border-b border-line bg-transparent px-0 py-1 text-[13px] outline-none placeholder:text-muted focus:border-ink sm:w-60"
            />
          </Form>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-12 bg-header text-[13px] text-white/60">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Logo stacked className="text-xl !text-white" />
          <span>{SITE.tagline}</span>
        </div>
        <div className="flex gap-5">
          <Link href="/rss.xml" className="hover:text-white">
            RSS
          </Link>
          {SITE.socials.map((s) => (
            <a key={s.href} href={s.href} className="hover:text-white" target="_blank" rel="noreferrer">
              {s.label}
            </a>
          ))}
          <Link href="/admin" className="hover:text-white">
            Admin
          </Link>
        </div>
      </div>
    </footer>
  );
}
