import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,

  // Render metadata (title, description, canonical, robots) in the initial
  // <head> for every visitor instead of streaming it into <body> for all but a
  // short list of bots. Googlebot is not on that list, and Google ignores a
  // rel="canonical" outside <head>, so the apex and www hosts were reported as
  // "Duplicate without user-selected canonical". Metadata here reads the same
  // cached content the page renders, so blocking on it costs no extra fetch.
  htmlLimitedBots: /.*/,

  images: {
    formats: ["image/avif", "image/webp"],
    // Defaults plus 480: the hero photo renders ~240 CSS px wide on phones, and
    // without a step between 384 and 640 a 2x screen downloads 640 px.
    imageSizes: [32, 48, 64, 96, 128, 256, 384, 480],
    minimumCacheTTL: 86400,
    // Project cover/gallery images are pasted as external URLs in the admin (e.g. Vercel Blob).
    remotePatterns: [{ protocol: "https", hostname: "**" }],
    // The only local images are uploaded profile photos, versioned in the path.
    // Query strings are refused so the optimizer can't be used to enumerate URLs.
    localPatterns: [{ pathname: "/profile-photo/**", search: "" }],
  },

  experimental: {
    optimizePackageImports: ["framer-motion"],
  },

  turbopack: {
    rules: {
      "*.less": {
        condition: { not: { path: /\.module\.less$/ } },
        loaders: [
          {
            loader: "less-loader",
            options: {
              lessOptions: { javascriptEnabled: true, paths: [process.cwd()] },
              webpackImporter: false,
            },
          },
        ],
        as: "*.css",
      },
      "*.module.less": {
        loaders: [
          {
            loader: "less-loader",
            options: {
              lessOptions: { javascriptEnabled: true, paths: [process.cwd()] },
              webpackImporter: false,
            },
          },
        ],
        as: "*.module.css",
      },
    },
  },
};

export default nextConfig;
