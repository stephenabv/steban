import type { Metadata, Viewport } from "next";
import { connection } from "next/server";
import { Analytics } from "@vercel/analytics/next";
import { siteConfig } from "@/config/site";
import { defaultSeo } from "@/config/seo";
import { searchVerification } from "@/lib/seo/searchVerification";
import { MotionProvider } from "@/components/layout/MotionProvider";
import { RouteTransitions } from "@/components/layout/RouteTransitions";
import { THEME_COLOR } from "@/lib/theme/theme";
import { hudFont } from "@/lib/theme/fonts";
import "@/styles/globals.less";

export const viewport: Viewport = {
  themeColor: THEME_COLOR,
  colorScheme: "dark",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: defaultSeo.title,
    template: `%s | ${siteConfig.name}`,
  },
  description: defaultSeo.description,
  applicationName: siteConfig.name,
  keywords: [...siteConfig.keywords],
  authors: [{ name: siteConfig.author.name, url: siteConfig.url }],
  creator: siteConfig.author.name,
  publisher: siteConfig.author.name,
  category: "technology",
  openGraph: {
    ...defaultSeo.openGraph,
    type: "website",
  },
  twitter: defaultSeo.twitter,
  robots: defaultSeo.robots,
  alternates: {
    canonical: siteConfig.url,
  },
  verification: searchVerification(),
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Forces dynamic rendering so Next.js applies the per-request nonce
  // (set by proxy.ts) to all inline scripts it generates — required for nonce-based CSP.
  await connection();

  return (
    // data-scroll-behavior: Next.js 16 no longer turns off the smooth
    // `scroll-behavior` (globals.less) while it positions a new route. Without
    // it, its scroll-into-view calls animate and stack, and a navigation could
    // glide down to the "Have a project in mind?" band instead of the top.
    <html lang="en" className={hudFont.variable} data-scroll-behavior="smooth">
      <body>
        <a href="#main-content" id="skip-nav">
          Skip to main content
        </a>
        <RouteTransitions />
        <MotionProvider>{children}</MotionProvider>
        <Analytics />
      </body>
    </html>
  );
}
