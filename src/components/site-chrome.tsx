import Form from "next/form";
import Link from "next/link";
import { SITE } from "@/lib/site";

const NAV = [
  { href: "/reviews", label: "Reviews" },
  { href: "/reviews?sort=highest", label: "Highest Rated" },
  { href: "/artists", label: "Artists" },
  { href: "/about", label: "About" },
];

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`text-[22px] leading-none font-black tracking-tight ${className}`}>
      <span className="rounded-[3px] bg-accent px-1 text-white">AI</span>tunes
    </span>
  );
}

export function SiteHeader() {
  return (
    <header className="bg-header text-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <Link href="/" aria-label={`${SITE.name} home`}>
          <Logo />
        </Link>
        <nav className="order-3 flex w-full gap-4 overflow-x-auto text-[13px] font-semibold sm:order-none sm:w-auto">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="whitespace-nowrap text-white/75 hover:text-white">
              {item.label}
            </Link>
          ))}
        </nav>
        <Form action="/reviews" className="ml-auto">
          <label className="sr-only" htmlFor="site-search">
            Search
          </label>
          <input
            id="site-search"
            type="search"
            name="q"
            placeholder="Search artists & releases"
            className="w-44 rounded-[3px] border border-white/15 bg-white/10 px-2.5 py-1.5 text-[13px] text-white outline-none placeholder:text-white/50 focus:bg-white focus:text-ink sm:w-64"
          />
        </Form>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-10 bg-header text-[13px] text-white/60">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Logo className="text-lg text-white" />
          <span>{SITE.tagline}</span>
        </div>
        <div className="flex gap-4">
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
