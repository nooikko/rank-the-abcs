# Metadata, icons, and a real 404

**Date:** 2026-08-05
**Status:** approved, not committed (folds into an existing PR)

## Why

An audit of the site against the usual "was this vibecoded" checklist came back
mostly clean, with four genuine gaps: no favicon, no custom 404, no structured
data, no `llms.txt`. Two adjacent problems surfaced alongside them — `og:url`
pointed at the origin on every page regardless of route, and the stock 404
emitted two `<title>` tags.

This spec covers all six.

## 1. Favicon

`/favicon.ico` currently 404s. There is no `public/` directory and no
`icon.*` file convention in `src/app/`.

**Approach.** Outline the Newsreader `Q` once, offline, and commit the result.

A throwaway script (scratchpad, not committed) instances the Newsreader
variable font, extracts the `Q` outline via `fontTools.pens.svgPathPen`, and
normalises it into a square viewBox.

Two committed files:

| File | Purpose |
| --- | --- |
| `src/app/icon.svg` | modern browsers; `sizes="any"` |
| `src/app/favicon.ico` | 16/32/48 raster fallback |

Next's file convention emits the `<link>` tags automatically; no
`metadata.icons` entry is needed.

**Axis position: `wght 500` / `opsz 6`, not the `wght 350` / `opsz 72` the
`--font-weight-name` token uses.** A favicon is a 16–32px rendering problem, and
`opsz 6` is the cut Newsreader draws for small sizes — sturdier strokes, less
delicate detail. Rendering the display cut at 32px produced a ghost. Using the
optical-size axis for its actual purpose is the typographically correct answer
rather than a deviation from the brand.

**Colour: `#ff4400` — `--signal` — in both files, with no
`prefers-color-scheme` block.** The original plan was theme-aware black/white
ink. Orange proved better on inspection: it holds on both light and dark tab
strips, so it needs no media query, and it is far more recognisable at 16px than
neutral ink. `--signal` is the brand's pure value; it clears the 3:1 non-text
contrast threshold that applies to a graphic, which is what a favicon is. (The
`Q` on the 404 page is *text*, so it uses `--primary` instead, per the
styling rule.)

The `Q`'s tail descends to `yMin −465` in a 2000 upm box — the viewBox includes
it rather than clipping it flat.

Rejected: generating at build time with `ImageResponse` + a fetch to
`fonts.gstatic.com`. It makes every production build depend on Google being
reachable, and yields a raster that cannot respond to theme.

## 2. The 404 page

**Files.** `src/app/not-found.tsx`, `src/components/scattered-alphabet.tsx`.

The alphabet lies dropped across the viewport. Twenty-five letters are
scattered at hand-tuned angles; `Q` sits apart — upright, unrotated, in signal
orange. The copy ties the missing page to the site's own argument: this URL is
not in the index, and neither is `Q`, arguably, but `Q` has a spot anyway.

**`ScatteredAlphabet`** is a Server Component over a static table of
`{ letter, top, left, rotate, scale }`. Positions are hardcoded and
deterministic — no `Math.random()`, so server and client markup agree. The
layer is:

- `aria-hidden`, because it is decoration; screen readers get the message alone
- inside an `overflow-hidden` absolute container, so no scattered letter can
  create horizontal scroll
- `text-muted-foreground` at low opacity, so it never competes with the copy
- animated with the existing `rise-on-load` utility and staggered
  `[animation-delay:*]` values, which is already reduced-motion guarded

The page holds exactly one `h1`. Positions are chosen to leave the centre
column clear at every breakpoint.

**Supporting change.** `SiteFooter`'s `current` prop is
`"home" | "vote" | "rankings" | "privacy"`. Widen it to include `"none"` so the
404 can show all four links.

## 3. The duplicate `<title>`

Next's built-in 404 UI injects `<title>404: This page could not be found.</title>`
on top of the root layout's title. Adding `src/app/not-found.tsx` replaces that
built-in UI, and the duplicate goes with it.

`not-found.js` cannot export `metadata` — only the experimental
`global-not-found.js` can. The title therefore stays `Rank the ABCs`. This is
acceptable: Next auto-injects `<meta name="robots" content="noindex">` on 404
responses, so nothing indexes the page.

Rejected: `experimental.globalNotFound`. It would duplicate the root layout —
fonts, `globals.css`, `ThemeProvider` — in a second file, and pin a page nobody
sees to an experimental API. That sits badly in a project that runs a
deliberate seven-day dependency cooldown for stability.

## 4. `og:url`

Every page emitted `og:url = https://abc.findquinn.com` while its canonical
correctly pointed at the sub-path.

The cause is a Next merging rule: `openGraph` is **shallowly** merged, so a page
that declares any `openGraph` key discards the layout's `siteName`, `locale`,
and `type` wholesale. Setting `openGraph.url` per page naively fixes one bug and
introduces three.

**Approach.** One helper, `src/lib/metadata.ts`:

```ts
pageMetadata({ title, description, path }): Metadata
```

It derives `alternates.canonical` and `openGraph.url` from the same `path`, so
the two cannot disagree, and re-declares `siteName` / `locale` / `type` so the
shallow merge does not drop them. All four pages call it.

A new file rather than growing `site.ts`, which stays pure constants.

**The share card was the trap.** The check flagged for this step — does
declaring `openGraph` also drop the `opengraph-image.png` file convention —
came back yes. The convention only reaches routes that leave `openGraph`
untouched, so the first cut of this change fixed `og:url` on three pages and
silently stripped `og:image` and `twitter:image` from the same three. Every
share preview would have gone blank while the pages looked fine in a browser.

The fix: `SITE_OG_IMAGE` in `site.ts` — url, dimensions, and alt text — restated
by `pageMetadata` on every page. `src/app/opengraph-image.alt.txt` is deleted,
because the alt text now lives in `site.ts` and two copies of one sentence is
one copy too many. `opengraph-image.png` itself stays; it is still the file that
serves the card.

A regression test in `metadata.test.ts` asserts the images survive, since this
failure is invisible from the rendered page.

## 5. Structured data

**Files.** `src/components/json-ld.tsx` — one small component that serialises a
payload and replaces every `<` with its unicode escape, per the XSS note in the
Next JSON-LD guide — and `src/lib/structured-data.ts`, which holds the payloads
themselves.

The payloads live in `lib` rather than inline in the components because the
`/rankings` one is only reachable when the database has placed letters. Inline,
it could not be checked without writing votes into the shared database; as a
pure function it gets `src/lib/structured-data.test.ts` instead.

Two uses:

- **Root layout** — `WebSite`: name, url, description, `inLanguage: "en"`, and
  `creator` as a `Person` pointing at findquinn.com.
- **`/rankings`** — `ItemList` of the current ordering, each letter a
  `ListItem` carrying `position` and `name`.

The `ItemList` is the one that earns its place: it describes content that
genuinely is an ordered list.

Deliberately excluded: `WebPage` blocks on `/privacy` and `/vote`, and a
`SearchAction`. There is no search, and boilerplate markup restating a page
already fully present in the HTML is the decorative structured data that gets
ignored.

## 6. `llms.txt`

**File.** `src/app/llms.txt/route.ts` — a Route Handler returning `text/plain`,
built from `src/lib/site.ts` exactly as `robots.ts` and `sitemap.ts` are, so it
cannot drift out of sync with the site's own description.

Content follows the convention: `H1` name, blockquote summary, a paragraph of
context, an `## Pages` section of annotated links, and an `## Optional` section
for what an agent short on context can skip.

Note on expectations: `llms.txt` is a convention, not a standard. No major model
provider has confirmed reading it. It costs twenty lines and is a courtesy to
agents that do look; it is not an SEO measure.

## Files

**New**
`src/app/icon.svg`, `src/app/favicon.ico`, `src/app/not-found.tsx`,
`src/app/llms.txt/route.ts`, `src/components/scattered-alphabet.tsx`,
`src/components/json-ld.tsx`, `src/lib/metadata.ts`,
`src/lib/metadata.test.ts`, `src/lib/structured-data.ts`,
`src/lib/structured-data.test.ts`

**Edited**
`src/app/layout.tsx`, `src/app/page.tsx`, `src/app/vote/page.tsx`,
`src/app/rankings/page.tsx`, `src/app/privacy/page.tsx`, `src/lib/site.ts`,
`src/components/site-footer.tsx`, `src/components/rankings-body.tsx`

**Deleted**
`src/app/opengraph-image.alt.txt` — superseded by `SITE_OG_IMAGE.alt`

Nothing here touches `db.ts`, `votes.ts`, or `question-service.ts`, which are
being edited concurrently.

## Testing

`pageMetadata()` is a pure function and gets unit tests in
`src/lib/metadata.test.ts`, following the existing `src/lib/*.test.ts` pattern:
canonical and `og:url` agree, both track `path`, and `siteName` / `locale` /
`type` survive.

The rest is verified by building and inspecting output:

```bash
pnpm lint && pnpm exec tsc --noEmit && pnpm test && pnpm build
```

then serving and checking: one `<title>` per route including the 404, `og:url`
matching canonical on all four routes, the `og:image` still present, `/icon.svg`
and `/favicon.ico` returning 200, `/llms.txt` returning `text/plain`, and the
JSON-LD parsing as valid JSON.
