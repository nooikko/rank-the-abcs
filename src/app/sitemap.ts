import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * `SITE_URL` bare, with no trailing slash, because that is what Next normalises
 * `canonical: "/"` down to — and a sitemap that disagrees with the canonical
 * about a slash is a sitemap arguing with itself about which URL is the real
 * one.
 *
 * No `priority` and no `changeFrequency`: Google has ignored both for years.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: SITE_URL, lastModified: new Date() }];
}
