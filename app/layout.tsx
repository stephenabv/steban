import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { connection } from "next/server";
import { siteConfig } from "@/config/site";
import { defaultSeo } from "@/config/seo";
import { MotionProvider } from "@/components/layout/MotionProvider";
import { THEME_COLORS } from "@/lib/theme/theme";
import { getServerTheme } from "@/lib/theme/getServerTheme";
import "@/styles/globals.less";

// Graphite type: IBM Plex Sans for UI and headings, Plex Mono for metadata.
// Self-hosted by next/font, so CSP font-src 'self' holds.
const plexSans = IBM_Plex_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export async function generateViewport(): Promise<Viewport> {
  const theme = await getServerTheme();

  if (theme) {
    return { themeColor: THEME_COLORS[theme], colorScheme: theme };
  }

  return {
    themeColor: [
      { media: "(prefers-color-scheme: dark)", color: THEME_COLORS.dark },
      { media: "(prefers-color-scheme: light)", color: THEME_COLORS.light },
    ],
    colorScheme: "dark light",
  };
}

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
  // Rendered server-side so the stored theme is painted on the first frame.
  const theme = await getServerTheme();

  return (
    <html
      lang="en"
      className={`${plexSans.variable} ${plexMono.variable}`}
      data-theme={theme ?? undefined}
    >
      <body>
        <a href="#main-content" id="skip-nav">
          Skip to main content
        </a>
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
