import { REPO_URL, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

/**
 * `/llms.txt` — a plain-Markdown summary of the site for language models, in
 * the convention Jeremy Howard proposed in 2024: an H1 name, a blockquote
 * summary, a paragraph of context, then annotated links. The `## Optional`
 * heading is load-bearing in that convention — it marks what an agent short on
 * context can skip.
 *
 * Worth being honest about what this is: a courtesy, not a standard. No model
 * provider has committed to reading it. It is built from `site.ts` for the same
 * reason `robots.ts` and `sitemap.ts` are — a hand-maintained copy of the site's
 * own description is a copy that goes stale.
 *
 * Route Handlers are uncached by default; this one is the same bytes for
 * everyone, so it is pinned static and served from the build.
 */
export const dynamic = "force-static";

export function GET(): Response {
  const body = `# ${SITE_NAME}

> ${SITE_DESCRIPTION}

Visitors are shown two letters and asked which of them should come first.
Enough pairwise answers are aggregated into a full ordering, with the
uncertainty behind each position tracked and shown. The result is expected to
be worse than the real alphabet. That is not the point.

## Pages

- [Rule on something](${SITE_URL}/vote): the voting loop — one pair of letters, one question, repeatable
- [The alphabet so far](${SITE_URL}/rankings): the current community ordering, with confidence intervals and measured response biases

## Optional

- [Privacy](${SITE_URL}/privacy): one cookie, set only after a first vote; no accounts, no third-party scripts
- [Source](${REPO_URL}): MIT licensed
`;

  return new Response(body, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
