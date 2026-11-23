import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disabled: cacheComponents/PPR caused runtime crashes on client updates (status change).
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
