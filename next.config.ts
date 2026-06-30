import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,

  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400,
  },

  experimental: {
    optimizePackageImports: ["framer-motion"],
  },

  turbopack: {
    rules: {
      "*.less": {
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
