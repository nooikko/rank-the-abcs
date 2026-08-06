# rank-the-abcs

Q is in a weird place in the alphabet. This site asks visitors to rule on one
pair of letters at a time and fits every ruling into a new, community-sourced
ordering.

Next.js 16 (App Router) · React 19 · TypeScript 5.9 · Tailwind 4 · Prisma ·
Vitest · Biome · pnpm.

## Running it

```bash
pnpm install
pnpm dev        # http://localhost:3001
```

`pnpm` only — see the release cooldown below. `.env` must supply `DATABASE_URL`
and `QUESTION_TOKEN_SECRET`.

| Command                  | Does                        |
| ------------------------ | --------------------------- |
| `pnpm dev`               | dev server on port 3001     |
| `pnpm build`             | production build            |
| `pnpm start`             | serve the build             |
| `pnpm test`              | vitest                      |
| `pnpm lint`              | `biome check`               |
| `pnpm exec tsc --noEmit` | type check                  |

Before pushing: `pnpm test && pnpm lint && pnpm exec tsc --noEmit && pnpm build`.

Import order is a Biome *assist* action, so `pnpm format` will not fix it.
`pnpm exec biome check --write` will.

## How it works

Every vote is a relative claim between two letters — never a position. "Q
before E" means *wherever Q ends up, E is after it*, at any distance.

Each pair is asked in several ways, and **which way is recorded**:

| Template        | Prompt                            | Maps to                       |
| --------------- | --------------------------------- | ----------------------------- |
| `WHICH_FIRST`   | "Which should come first, a or b" | chosen letter wins            |
| `SHOULD_BEFORE` | "Should a come before b?"         | yes → `a` wins; no → `b` wins |
| `SHOULD_AFTER`  | "Should a come after b?"          | yes → `b` wins; no → `a` wins |

Logically identical prompts get measurably different answers, so `ranking.ts`
estimates position bias, acquiescence bias and negation drag *alongside* the
letter scores in one penalised logistic regression. Debiasing is a coefficient,
not a correction bolted on afterwards.

Question selection is coverage-driven and **never consults the ranking model**.
A selector that hunted for questions likely to upend the alphabet would be a
churn machine and the alphabet would never settle.

## Layout

```
src/app/              routes, layout, actions, globals.css (all design tokens)
src/components/       the app's own components
  ui/                 shadcn registry output; treat as generated, don't edit
src/lib/alphabet.ts   letters, pairs, templates — the shared vocabulary
src/lib/ranking.ts    Bradley-Terry fit: scores, error bars, bias terms
src/lib/votes.ts      the only module that reads or writes votes
src/lib/site.ts       name, URL, description — page and metadata both read it
prisma/schema.prisma  Session and Vote
.claude/rules/        detailed conventions
skills/               vendored agent skills
```

## Before deploying

`SITE_HOST` in `src/lib/site.ts` is still `example.com`. Set it to the real
domain — `metadataBase`, the canonical URLs, `robots.ts` and `sitemap.ts` all
read from it.

There is no favicon, no `apple-icon.png`, and no OG image. Drop
`src/app/icon.svg`, `src/app/apple-icon.png`, and `src/app/opengraph-image.png`
in and Next wires each one up through the file convention.

## Things that look wrong and aren't

- **`pnpm outdated` reports newer versions than are installed.**
  `pnpm-workspace.yaml` sets `minimumReleaseAge: 10080` — a 7-day cooldown on
  any newly published version, as supply-chain hardening. Don't lower it to
  pick up a release. Declare deps as ranges, never exact pins.
- **The Prisma client is gitignored.** Prisma 7 generates to
  `src/generated/prisma`; `postinstall` and `build` rebuild it.
- **`prisma/schema.prisma` has no `url`.** Prisma 7 moved it to
  `prisma.config.ts` for migrations, and to the driver adapter at runtime.
- **The tests hit the real database and truncate `Vote` and `Session`.** Point
  `DATABASE_URL` somewhere disposable before running them.
- **There is no `tailwind.config.js`.** Tailwind 4 is CSS-first; the theme
  lives in `src/app/globals.css`.
- **There is no ESLint or Prettier.** Biome does both.
- **The palette is white, black, and orange, and nothing else.** Two oranges at
  different lightnesses, because one value can't be both safe body text and a
  bright marker. Orange is never a background fill. See
  `.claude/rules/styling-and-theme.md`.
- **`robots.ts` blocks nothing.** An AI-crawler block would go there; not
  adding one was a decision, not an omission.
- **Letters can be reported as unplaced.** Bradley-Terry needs a connected
  comparison graph, and until one exists a position would be fabricated.

## Deploying

Vercel. `DATABASE_URL` and `QUESTION_TOKEN_SECRET` are the only environment
variables.
