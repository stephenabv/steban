import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { connection } from "next/server";
import { siteConfig } from "@/config/site";
import { defaultSeo } from "@/config/seo";
import { FirebaseAnalytics } from "@/components/layout/FirebaseAnalytics";
import { analyticsConfig } from "@/config/analytics";
import "@/styles/globals.less";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: defaultSeo.title,
    template: `%s | ${siteConfig.name}`,
  },
  description: defaultSeo.description,
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
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body>
        <a href="#main-content" id="skip-nav">
          Skip to main content
        </a>
        {children}
        {analyticsConfig.firebase.enabled && <FirebaseAnalytics />}
      </body>
    </html>
  );
}
