import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import { IBM_Plex_Mono, Newsreader } from "next/font/google";
import { GitHubCorner } from "@/components/github-corner";
import { JsonLd } from "@/components/json-ld";
import { ThemeProvider } from "@/components/theme-provider";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import { siteStructuredData } from "@/lib/structured-data";
import "./globals.css";

// Variable font: no `weight`, so the whole 300–600 range is available to the
// weight tokens in globals.css. `opsz` has to be requested explicitly for
// `font-optical-sizing: auto` to have an axis to act on.
const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  // Resolves every relative URL below to an absolute one. Without it Next falls
  // back to the deployment origin, which would aim the canonical at the
  // .vercel.app alias — the exact duplicate the canonical exists to collapse.
  metadataBase: new URL(SITE_URL),
  title: {
    // `default` covers the two routes that state no title of their own: the
    // home page, whose title is the site's, and the 404, which cannot export
    // metadata at all. `template` spares every other page from spelling out
    // the suffix — they hand over "Privacy" and get "Privacy — Rank the ABCs".
    default: SITE_NAME,
    template: `%s — ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  twitter: {
    card: "summary_large_image",
  },
  // No `alternates` or `openGraph` here on purpose. Both are per-page facts,
  // and `openGraph` in particular is merged shallowly — a layout-level copy
  // would be silently discarded by any page that declared its own, which is
  // exactly how every page came to advertise the origin as its og:url. They
  // are built by `pageMetadata` instead, from a single path per page.
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      // next-themes writes the class before paint, which React would otherwise
      // report as a server/client mismatch.
      suppressHydrationWarning
      // globals.css sets `scroll-behavior: smooth` for in-page movement. Next
      // 16 stopped overriding that during route transitions unless this
      // attribute is present, and without it a navigation would animate its
      // way to the top of the new page instead of arriving there.
      data-scroll-behavior="smooth"
      className={`${newsreader.variable} ${plexMono.variable} h-full`}
    >
      <body className="flex min-h-full flex-col">
        <JsonLd data={siteStructuredData} />
        <ThemeProvider>
          <GitHubCorner />
          {children}
        </ThemeProvider>
        {/*
          The `/next` entry point, not the bare package: it reads the App Router
          pathname so a client-side navigation registers as a page view, and it
          no-ops outside production, so `pnpm dev` sends nothing.
        */}
        <Analytics />
      </body>
    </html>
  );
}
