import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,

  images: {
    formats: ["image/avif", "image/webp"],
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
