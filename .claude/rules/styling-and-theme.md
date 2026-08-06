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

## Type and spacing

Stock Tailwind: `text-sm`, `text-3xl`, `p-4`, `gap-6`. There is no bespoke
editorial scale. If the design grows one, declare it in the non-inline `@theme`
block rather than scattering `clamp()` calls through components.

Fonts are Geist and Geist Mono, loaded in `layout.tsx` via `next/font/google`
and wired to `--font-sans` / `--font-mono`.

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
