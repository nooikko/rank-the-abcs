# rank-the-abcs

Next.js 16 (App Router) · React 19 · TypeScript 5.9 · Tailwind 4 · shadcn/ui ·
Biome · pnpm.

## Running it

```bash
pnpm install
pnpm dev        # http://localhost:3001
```

`pnpm` only — see the release cooldown below.

| Command                  | Does                    |
| ------------------------ | ----------------------- |
| `pnpm dev`               | dev server on port 3001 |
| `pnpm build`             | production build        |
| `pnpm start`             | serve the build         |
| `pnpm lint`              | `biome check`           |
| `pnpm format`            | `biome format --write`  |
| `pnpm exec tsc --noEmit` | type check              |

Before pushing a change: `pnpm lint && pnpm exec tsc --noEmit && pnpm build`.

## Layout

```
src/app/            routes, layout, globals.css (all design tokens)
src/components/     the app's own components
  ui/               shadcn registry output; treat as generated, don't edit
src/lib/site.ts     name, URL, description — the page and the metadata both read it
src/lib/utils.ts    cn() class merger
.claude/rules/      detailed conventions
skills/             vendored agent skills
```

`src/lib/site.ts` holds placeholder values. Fill in `SITE_HOST` and
`SITE_DESCRIPTION` before deploying — `metadataBase`, the canonical URL,
`robots.ts` and `sitemap.ts` all read from it.

There is no favicon, no `apple-icon.png`, and no OG image. Drop
`src/app/icon.svg`, `src/app/apple-icon.png`, and `src/app/opengraph-image.png`
in and Next wires each one up through the file convention.

## Things that look wrong and aren't

- **`pnpm outdated` reports newer versions than are installed.**
  `pnpm-workspace.yaml` sets `minimumReleaseAge: 10080` — a 7-day cooldown on
  any newly published version, as supply-chain hardening. Don't lower it to pick
  up a release. Declare deps as ranges, never exact pins.
- **There is no `tailwind.config.js`.** Tailwind 4 is CSS-first; the theme lives
  in `src/app/globals.css`.
- **There is no ESLint or Prettier.** Biome does both.
- **The palette is white, black, and orange, and nothing else.** Two oranges at
  different lightnesses, because one value can't be both safe body text and a
  bright marker. See `.claude/rules/styling-and-theme.md`.
- **`robots.ts` blocks nothing.** An AI-crawler block would go there; not adding
  one was a decision, not an omission.

## Deploying

Vercel. Nothing outside the repo is needed — no environment variables, no
external services.
