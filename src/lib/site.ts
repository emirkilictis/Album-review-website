// Public address of the site: NEXT_PUBLIC_SITE_URL if set, otherwise the
// production address Vercel provides automatically.
function siteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return "http://localhost:3000";
}

// Site-wide settings. Change the name, tagline or socials here.
export const SITE = {
  name: "AItunes Reviews",
  tagline: "The AI music critic",
  description: "Album, EP and single reviews of AI music artists — scores, track-by-track ratings and an artist leaderboard.",
  url: siteUrl(),
  socials: [{ label: "X / Twitter", href: "https://x.com/AItunesReviews" }],
};
