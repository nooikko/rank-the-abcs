import type { Metadata } from "next";
import { SITE_NAME, SITE_OG_IMAGE } from "./site";

/**
 * Builds a page's metadata from the one fact that distinguishes it: its path.
 *
 * This exists because of a Next merging rule that is easy to get wrong.
 * `openGraph` is merged **shallowly**, so the moment a page declares a single
 * key inside it, every key the root layout declared there is discarded — for
 * that page alone. Setting `openGraph.url` by hand on each page would fix the
 * URL and silently drop `siteName`, `locale`, and `type` along the way.
 *
 * The share card goes the same way, and less visibly: the `opengraph-image.png`
 * file convention only reaches a route that has left `openGraph` alone, so a
 * page that sets its own url loses the image unless the image is restated too.
 *
 * So the whole object is rebuilt here, once, and the canonical and the og:url
 * are derived from the same argument. They cannot disagree, which is the point:
 * a canonical that says one thing while og:url says another is worse than
 * having neither, because each is evidence for a different URL being the real
 * one.
 *
 * `title` stays bare. The root layout carries `title.template`, so a page hands
 * over "Privacy" and the composed "Privacy — Rank the ABCs" comes back out.
 * Pages with no title of their own omit it and inherit `title.default`.
 */
export function pageMetadata({
  title,
  description,
  path,
}: {
  title?: string;
  description?: string;
  path: string;
}): Metadata {
  assertRootedPath(path);

  return {
    ...(title === undefined ? {} : { title }),
    ...(description === undefined ? {} : { description }),
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: "en_US",
      url: path,
      images: [SITE_OG_IMAGE],
    },
  };
}

/**
 * Relative, rooted, and unslashed — the shape `metadataBase` resolves cleanly
 * and the shape the sitemap already emits. A bare "vote" would resolve against
 * whatever route was rendering, and "/vote/" would name a URL the sitemap and
 * the canonical both disagree with.
 */
function assertRootedPath(path: string): void {
  if (!path.startsWith("/") || path.startsWith("//")) {
    throw new Error(`Path must be site-relative and rooted, got: ${path}`);
  }
  if (path.length > 1 && path.endsWith("/")) {
    throw new Error(`Path must not end in a slash, got: ${path}`);
  }
}
