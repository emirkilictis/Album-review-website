import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  // Fonts and logo read at runtime by the share-image route.
  outputFileTracingIncludes: {
    "/reviews/[slug]/image": ["./src/assets/fonts/*.ttf", "./src/assets/logo.png", "./public/demo-covers/*"],
  },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
