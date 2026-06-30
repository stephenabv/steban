import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { headers } from "next/headers";
import { siteConfig } from "@/config/site";
import { defaultSeo } from "@/config/seo";
import { GoogleAnalytics } from "@/components/layout/GoogleAnalytics";
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
  const headerList = await headers();
  const nonce = headerList.get("x-nonce") ?? "";

  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body>
        <a href="#main-content" id="skip-nav">
          Skip to main content
        </a>
        {children}
        {analyticsConfig.googleAnalytics.enabled && (
          <GoogleAnalytics
            measurementId={analyticsConfig.googleAnalytics.measurementId}
            nonce={nonce}
          />
        )}
      </body>
    </html>
  );
}
