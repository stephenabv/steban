import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Outfit } from "next/font/google";
import { connection } from "next/server";
import { siteConfig } from "@/config/site";
import { defaultSeo } from "@/config/seo";
import { FirebaseAnalytics } from "@/components/layout/FirebaseAnalytics";
import { MotionProvider } from "@/components/layout/MotionProvider";
import { analyticsConfig } from "@/config/analytics";
import "@/styles/globals.less";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

// Display face for headings — self-hosted by next/font, so CSP font-src 'self' holds.
const outfit = Outfit({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#0a0a0f",
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
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Forces dynamic rendering so Next.js applies the per-request nonce
  // (set by proxy.ts) to all inline scripts it generates — required for nonce-based CSP.
  await connection();

  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable} ${jetbrainsMono.variable}`}>
      <body>
        <a href="#main-content" id="skip-nav">
          Skip to main content
        </a>
        <MotionProvider>{children}</MotionProvider>
        {analyticsConfig.firebase.enabled && <FirebaseAnalytics />}
      </body>
    </html>
  );
}
