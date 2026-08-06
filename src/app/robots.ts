import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * The file's job is not to forbid anything — it is to exist and to name the
 * sitemap. Its absence is the part that reads as an oversight.
 *
 * An AI-crawler block (GPTBot, ClaudeBot, CCBot, Google-Extended) would go here
 * as further `rules` entries. Deliberately not added: that is a decision about
 * what you want, not a gap in the setup.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
