// Site-wide settings. Change the name, tagline or socials here.
export const SITE = {
  name: "AItunes",
  tagline: "The AI music critic",
  description: "Album, EP and single reviews of AI music artists — scores, track-by-track ratings and an artist leaderboard.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  socials: [{ label: "X / Twitter", href: "https://x.com/" }],
};
