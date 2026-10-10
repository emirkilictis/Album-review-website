import type { Metadata } from "next";
import { Inter, Oswald, Playfair_Display } from "next/font/google";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { SITE } from "@/lib/site";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const serif = Playfair_Display({ variable: "--font-serif-face", subsets: ["latin"], weight: ["400", "700", "900"], style: ["normal", "italic"] });
const brand = Oswald({ variable: "--font-brand-face", subsets: ["latin"], weight: ["600", "700"] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: `${SITE.name} — ${SITE.tagline}`, template: `%s · ${SITE.name}` },
  description: SITE.description,
  openGraph: { siteName: SITE.name, type: "website" },
  alternates: { types: { "application/rss+xml": "/rss.xml" } },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${serif.variable} ${brand.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans text-sm">
        <SiteHeader />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:py-10">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
