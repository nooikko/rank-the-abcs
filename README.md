<div align="center">

# Rank the ABCs

**Q is in a weird place in the alphabet. This is a referendum on that.**

[abc.findquinn.com](https://abc.findquinn.com)

[![CI](https://github.com/nooikko/rank-the-abcs/actions/workflows/ci.yml/badge.svg)](https://github.com/nooikko/rank-the-abcs/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-MIT%20%2B%20attribution-blue)](LICENSE)

</div>

---

## What it does

You get two letters and one question — which should come first — and you
answer it. That is the entire interaction.

Nobody is asked to rank all twenty-six at once, because nobody has an opinion
about all twenty-six at once. But everyone has an opinion about Q and E. Enough
of those small answers, from enough people, and an ordering falls out of them:
a whole alphabet nobody designed.

It will be worse than the real one. That is not the point.

## Why it's interesting

The fun part is that this is a genuinely hard measurement problem wearing a
stupid hat.

**Votes are relative, never positional.** "Q before E" means *wherever Q ends
up, E is after it*, at any distance. The current alphabet is not a baseline
being edited — positions are an output, never an input.

**Contradictions are data, not noise.** A crowd will happily assert E before D,
D before Q, and Q before E. No ordering satisfies all three. Rather than
picking a winner, the model puts those three scores on top of each other, which
is a truer description than any order forced onto them.

**The same question asked two ways gets different answers.** So each pair is
asked several ways and *which way is recorded*:

| Template        | Prompt                              | Maps to                       |
| --------------- | ----------------------------------- | ----------------------------- |
| `WHICH_FIRST`   | "Which should come first, a or b?"  | chosen letter wins            |
| `SHOULD_BEFORE` | "Should a come before b?"           | yes → `a` wins; no → `b` wins |
| `SHOULD_AFTER`  | "Should a come after b?"            | yes → `b` wins; no → `a` wins |

Position bias, acquiescence bias and negation drag are then estimated
*alongside* the letter scores in one penalised logistic regression, so
debiasing is a coefficient rather than a correction bolted on afterwards. The
measured values are published on the rankings page.

**Question selection never consults the ranking model.** It is coverage-driven
and structurally cannot see scores. A selector that hunted for questions likely
to upend the alphabet would be a churn machine, and the alphabet would never
settle.

**Uncertainty is shown, not hidden.** Letters the comparison graph hasn't
connected yet are reported as unplaced rather than given a fabricated position.

## Getting started

Requires Node 20.9+ and a Postgres database.

```bash
pnpm install
cp .env.example .env          # fill in DATABASE_URL and QUESTION_TOKEN_SECRET
pnpm exec prisma migrate dev
pnpm dev                      # http://localhost:3001
```

| Command          | Does                              |
| ---------------- | --------------------------------- |
| `pnpm dev`       | dev server on port 3001           |
| `pnpm build`     | production build                  |
| `pnpm start`     | serve the build                   |
| `pnpm test`      | vitest                            |
| `pnpm lint`      | biome check                       |
| `pnpm lint:fix`  | biome check, writing fixes        |
| `pnpm typecheck` | `tsc --noEmit`                    |

> [!WARNING]
> The test suite talks to a real database and **truncates the `Vote` and
> `Session` tables**. Point `DATABASE_URL` at a throwaway database before
> running it.

## How it's built

Next.js 16 (App Router) · React 19 · TypeScript 5.9 · Tailwind 4 · Prisma 7 ·
Vitest · Biome · pnpm.

```
src/app/              routes, layout, Server Actions, globals.css (design tokens)
src/components/       the app's own components
src/lib/alphabet.ts   letters, pairs, templates — the shared vocabulary
src/lib/ranking.ts    Bradley-Terry fit: scores, error bars, bias terms
src/lib/votes.ts      the only module that reads or writes votes
prisma/schema.prisma  Session and Vote
.claude/rules/        detailed conventions
```

Voting goes through a Server Action, not a public endpoint, and every question
carries an HMAC token binding the pair, the phrasing, the presentation order
and the session. You cannot vote on a question the server did not ask you,
which is what stops the ballot being enumerated.

The full design rationale is in
[`docs/superpowers/specs/`](docs/superpowers/specs/).

## Things that look wrong and aren't

- **`pnpm outdated` reports newer versions than are installed.**
  `pnpm-workspace.yaml` sets a 7-day cooldown on newly published versions as
  supply-chain hardening. Don't lower it to pick up a release.
- **The Prisma client is gitignored.** Prisma 7 generates it to
  `src/generated/prisma`; `postinstall` and `build` rebuild it.
- **`prisma/schema.prisma` has no `url`.** Prisma 7 moved it to
  `prisma.config.ts` for migrations and to the driver adapter at runtime.
- **There is no `tailwind.config.js`.** Tailwind 4 is CSS-first; the theme is
  in `src/app/globals.css`.
- **There is no ESLint or Prettier.** Biome does both.
- **`pnpm format` doesn't fix import order.** That's a Biome *assist* action —
  use `pnpm lint:fix`.
- **Orange is never a background fill.** Two oranges at different lightnesses,
  because one value can't be both safe body text and a bright marker.
- **`robots.ts` blocks nothing.** An AI-crawler block would go there; not
  adding one was a decision, not an omission.

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) first — it lists the things that
will be turned down and why, which will save you building something that gets
declined.

Security issues go through a
[security advisory](https://github.com/nooikko/rank-the-abcs/security/advisories/new),
never a public issue. See [SECURITY.md](SECURITY.md).

## License

[MIT with an attribution requirement](LICENSE). Use it, fork it, sell it — but
if you deploy it somewhere other people can reach, put a visible credit linking
back to this repository or to [findquinn.com](https://findquinn.com).

## Maintainer

Built and maintained by [Quinn](https://findquinn.com) ([@nooikko](https://github.com/nooikko)).
