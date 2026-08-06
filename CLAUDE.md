@AGENTS.md

# rank-the-abcs

Next.js 16 (App Router) · React 19 · TypeScript 5.9 · Tailwind 4 · shadcn/ui · Biome · pnpm

## Commands

```bash
pnpm dev                       # dev server
pnpm build                     # production build
pnpm lint                      # biome check
pnpm format                    # biome format --write
pnpm exec tsc --noEmit         # type check
pnpm dlx shadcn@latest add <c> # add a UI component
```

## Layout

```
src/app/          App Router routes, layouts, globals.css (theme tokens)
src/components/   application components  ← your components go here
src/components/ui/  shadcn registry output ← treat as generated, don't edit
src/lib/site.ts   site name, URL, description — page and metadata both read it
src/lib/utils.ts  cn() class merger
.claude/rules/    detailed conventions, loaded automatically
```

## The three rules that matter most

1. **Don't hand-write UI primitives.** Check `src/components/ui/`, then
   `pnpm dlx shadcn@latest search`. Add via the CLI. Never re-implement a
   dialog, select, dropdown, or tooltip from scratch, and never edit files in
   `src/components/ui/` — wrap them instead.
2. **Server Components are the default.** Add `"use client"` only at the
   smallest interactive leaf, never on a `page.tsx` or `layout.tsx` to silence
   an error.
3. **Style with tokens, never raw colours.** `bg-primary`, not `bg-orange-500`.
   The palette is white, black, and orange — orange only for primary actions,
   focus, and emphasis. Dark mode is real; check both grounds.

Full detail lives in `.claude/rules/`: `shadcn-components.md`,
`server-client-components.md`, `styling-and-theme.md`, `tooling.md`.

## Gotchas

- `pnpm` only. A 7-day release cooldown is active, so installed versions will
  intentionally lag the newest published ones — that is not a bug to fix.
- Biome replaces ESLint *and* Prettier. Don't add either.
- Tailwind 4 has no `tailwind.config.js`. Configure in `src/app/globals.css`.
- `params`, `searchParams`, `cookies()`, and `headers()` are async — await them.


Version-accurate Next.js docs for the installed release are in
`node_modules/next/dist/docs/`. Prefer them over recalled API details.
