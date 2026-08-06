---
paths:
  - "src/**/*.tsx"
  - "src/**/*.ts"
  - "components.json"
---

# shadcn/ui: add, don't author

This project uses shadcn/ui (`style: radix-nova`, Radix primitives, Lucide icons).
Component source lives in the repo, which makes it tempting to hand-write UI
primitives. Don't. Re-implementing a primitive that the registry already ships
is the single most common failure mode here.

## Before writing any UI primitive

1. Look in `src/components/ui/` — it may already exist.
2. If not, check the registry before assuming it doesn't exist:
   ```bash
   pnpm dlx shadcn@latest search        # list everything available
   pnpm dlx shadcn@latest view button   # inspect before adding
   pnpm dlx shadcn@latest docs dialog   # API reference + usage examples
   ```
3. Add it with the CLI:
   ```bash
   pnpm dlx shadcn@latest add dialog
   ```

Never hand-author a `Dialog`, `Popover`, `Select`, `Dropdown`, `Tooltip`,
`Accordion`, `Command`, `Sheet`, `Toast`, or any other component the registry
provides. Never copy component source out of the docs by hand — the CLI resolves
dependencies, registry deps, and CSS variables that a manual copy silently
misses.

Never add `@radix-ui/*` packages directly. This project depends on the unified
`radix-ui` package, and `shadcn add` wires it up correctly.

## Treat `src/components/ui/` as generated

Files in `src/components/ui/` are registry output. Editing them creates drift
that `shadcn add --diff` can no longer reconcile.

- **Don't** restyle, rename, or refactor them to taste.
- **Don't** add app-specific business logic, data fetching, or copy to them.
- **Do** extend by composing a new component in `src/components/` that wraps the
  primitive.
- **Do** change appearance through the design tokens in `src/app/globals.css`
  (see the styling rule) rather than by editing the primitive.

A genuine upstream fix is the one exception. If you must edit a file in
`ui/`, keep the change minimal and say so explicitly in your response so it can
be re-applied after an upgrade.

## Variants and class merging

Extend appearance with `cva` variants and merge classes with `cn()` from
`@/lib/utils`. Never concatenate Tailwind class strings by hand — `cn()` exists
so conflicting utilities resolve predictably.

```tsx
import { cn } from "@/lib/utils"
<Button className={cn("w-full", isWide && "max-w-lg")} />
```

## Upgrading

`pnpm dlx shadcn@latest add <component> --diff` shows registry changes against
local files. Review before overwriting; local edits will be lost.
