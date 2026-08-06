---
paths:
  - "src/**/*.tsx"
  - "src/**/*.css"
---

# Styling: Tailwind 4 + design tokens

## Tailwind 4 is CSS-first

There is **no `tailwind.config.js`** and none should be created. Configuration
lives in `src/app/globals.css`:

- `@import "tailwindcss"` — the framework
- `@theme inline { … }` — maps *colour* tokens to Tailwind utility names
- `:root` / `.dark` — the actual colour values, in OKLCH

To add a colour token, declare the CSS variable in `:root` and `.dark`, then
expose it in `@theme inline`. Don't reach for a JS config file.

Non-colour scales (type, space, easing) belong in a **non-inline** `@theme`
block, so the variables are emitted to `:root` and can be referenced from custom
utilities.

## Two oranges, one hue

The base scale is `neutral` — a true white/black greyscale. **Orange is the only
chromatic colour in the system.** It exists at two values because one value
cannot do both jobs:

| Token       | Light     | On white | Use for                                     |
| ----------- | --------- | -------- | ------------------------------------------- |
| `--primary` | `#D93600` | 4.69:1   | Text, emphasis, the primary action          |
| `--signal`  | `#FF4400` | 3.45:1   | Hairlines, markers, focus rings, strikeouts |

`--signal` is the pure brand value. It clears the 3:1 threshold for non-text
contrast but **not** the 4.5:1 one for text, so `text-signal` on a light ground
is a bug. Reach for `text-primary` instead. `--signal-wash` (8% alpha) is the
selection highlight.

In dark mode the ground inverts and so does the relationship: `--primary`
lightens *past* `--signal`, because on near-black the brighter value is the
readable one.

- `--ring` matches `--signal` — focus is a marker, not text.
- `--chart-1` … `--chart-5` are an orange ramp.
- `background`, `foreground`, `card`, `muted`, `secondary`, `accent`, and
  `border` stay neutral. Keep them that way — the palette reads as premium
  because orange is scarce.

**Never introduce a second accent hue without being asked.**

Dark mode is class-based (`@custom-variant dark (&:is(.dark *))`) and is a real,
user-togglable mode on this project — not a defined-but-unused set of values.
Both grounds must be checked when adding anything.

## The editorial scale

Sizes carry their own leading and tracking, so `text-title` needs no
`leading-*` beside it. Don't reintroduce raw `text-lg`/`text-2xl` for page
content:

- **Type** — `text-name`, `text-title`, `text-lead`, `text-body`, `text-meta`
  (uppercase labels), `text-code`, `text-micro`. The first four are fluid
  `clamp()`s and need no responsive variants.
- **Weight** — `font-name` (350), `font-book` (380), `font-title` (420). Real
  variable-font axis positions, not the nearest static cut.
- **Tracking** — `tracking-caps`, `tracking-eyebrow`.
- **Space** — `s1`…`s6`, a ~1.6 modular scale (8·13·21·34·55·88px), plus fluid
  `section`, `gutter`, and `shell-top`. Use `mb-s4`, not `mb-8`.
- **Measure** — `max-w-measure` (62ch), `max-w-lead`, `max-w-summary`,
  `max-w-caption`, `max-w-shell`.
- **Motion** — `ease-rise`, plus the `rise-on-load` and `rise-in-view`
  utilities. `rise-in-view` is scroll-driven via `animation-timeline: view()`,
  so it costs no scroll listener and is inert under `prefers-reduced-motion`.

Fonts are Newsreader (variable, with the `opsz` axis requested so
`font-optical-sizing` has something to act on) and IBM Plex Mono, loaded in
`layout.tsx` via `next/font/google`. Body copy is the serif; mono is for meta
lines, labels, and figures.

## Use tokens, not raw colours

Style with semantic utilities that resolve to tokens: `bg-background`,
`text-foreground`, `bg-primary`, `text-muted-foreground`, `border-border`.

- **Never** hardcode `bg-orange-500`, `bg-white`, `text-black`, or a hex value.
  These break dark mode and detach from the brand.

Because components are written against tokens, `dark:` variants are rarely
needed — if you find yourself writing many, you are probably bypassing a token.

## Composition

Merge classes with `cn()` from `@/lib/utils`. Build variants with `cva` rather
than branching on strings. Radii derive from `--radius`; use `rounded-md`,
`rounded-lg`, etc. instead of arbitrary pixel values.

Animation utilities come from `tw-animate-css`, already imported.

For accessibility and interaction review, invoke the `web-design-guidelines`
skill.
