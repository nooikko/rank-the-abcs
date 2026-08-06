# Contributing to Rank the ABCs

Thanks for looking. This is a small project with an intentionally narrow scope,
so the most useful thing you can do is read this first — it will save you
building something that gets turned down.

## What this project is

A site that asks visitors which of two letters should come first, and fits
those answers into a new alphabet. That is the whole product.

## Ways to contribute

- **Bug reports** — something broken, wrong, or unreadable on the site.
- **Accessibility fixes** — these are always welcome and rarely controversial.
- **Question phrasings** — a new way of asking "which of these comes first"
  that is genuinely a different psychological framing, not just different
  words. See below.
- **Code quality** — performance, clearer types, better tests.

## Things that will be turned down

Not because they are bad ideas, but because they break something the design is
deliberately protecting:

- **Making the question selector aware of the ranking model.** Selection is
  coverage-driven on purpose. A selector that picks questions likely to change
  the alphabet is a churn machine, and the alphabet would never settle.
- **Showing per-vote movement in the ordering.** "Your vote moved T from 19th
  to 17th" makes individual votes feel consequential in exactly the way that
  pushes toward a volatile result. The reveal reports the split, nothing else.
- **Fabricating positions for unplaced letters.** Until the comparison graph
  connects, an unconnected letter has no position, and the site says so.
- **Accounts, logins, or any persistent identity beyond the anonymous
  session.** There is a privacy promise on the site and it is load-bearing.
- **Orange as a background fill.** It is hairlines, borders, markers and focus
  rings only.

If you think one of these is wrong, open an issue and argue for it before
writing code.

## Adding a question phrasing

Phrasings are instrumentation, not variety. Each one is recorded so its
distorting effect can be estimated. A new template needs to be a genuinely
different framing — one that a person could plausibly answer differently
without changing their underlying opinion.

A template lives in `src/lib/alphabet.ts` and needs:

1. An entry in `TEMPLATES`.
2. A case in `questionText` and `answerOptions`.
3. A case in `interpretAnswer` mapping every permitted answer to a winner.
4. A matching value in the `Template` enum in `prisma/schema.prisma`, plus a
   migration.
5. Tests, including one asserting it agrees with a logically identical existing
   template.

## Local setup

```bash
pnpm install
cp .env.example .env    # then fill in DATABASE_URL and QUESTION_TOKEN_SECRET
pnpm exec prisma migrate dev
pnpm dev                # http://localhost:3001
```

**The test suite talks to a real database and truncates the `Vote` and
`Session` tables.** Point `DATABASE_URL` at a throwaway database before running
it. Do not point it at anything you care about.

## Before opening a PR

```bash
pnpm test
pnpm lint
pnpm typecheck
pnpm build
```

`pnpm lint:fix` will fix most style complaints, including import order, which
`pnpm format` alone does not touch.

One change per PR, please. If you are unsure whether something is in scope,
open an issue first — that is cheaper than writing it twice.

## Conventions

Detailed conventions live in `.claude/rules/`. The ones that catch people out:

- Style with design tokens, never raw colours or hex values.
- Server Components are the default; `"use client"` goes on the smallest
  interactive leaf.
- Comments explain *why*, not *what*. If the code already says it, delete it.
