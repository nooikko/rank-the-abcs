import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import { IBM_Plex_Mono, Newsreader } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
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
  title: SITE_NAME,
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: SITE_NAME,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
  },
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
      className={`${newsreader.variable} ${plexMono.variable} h-full`}
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider>{children}</ThemeProvider>
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
