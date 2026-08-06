# Toolchain

## pnpm only

`pnpm` is the package manager. Never run `npm install` or `yarn` — they will
produce a competing lockfile and bypass the security policy below.

```bash
pnpm install
pnpm add <pkg>
pnpm dlx <cli>        # not npx
```

## 7-day release cooldown

`pnpm-workspace.yaml` sets `minimumReleaseAge: 10080`. pnpm will refuse to
install any version published less than 7 days ago. This is deliberate
supply-chain hardening: most malicious publishes are caught and pulled well
inside that window.

Consequences to expect, and not to "fix":

- `pnpm outdated` and install output will report newer versions than the ones
  installed. **This is correct behaviour, not a problem to resolve.**
- Declare dependencies as **ranges** (`^16.2.0`), not exact pins. An exact pin
  on a version younger than 7 days makes the install unresolvable, whereas a
  range lets pnpm select the newest *eligible* version.
- Never lower or remove `minimumReleaseAge` to pick up a new release.
- A genuinely urgent security fix goes in `minimumReleaseAgeExclude`, scoped to
  the exact package and version, and should be called out to the user.

## Biome, not ESLint or Prettier

Biome handles linting **and** formatting. There is no ESLint or Prettier config
and none should be added.

```bash
pnpm lint          # biome check
pnpm format        # biome format --write
pnpm exec biome check --write   # lint + format + organize imports
```

Config is `biome.json`, with the `next` and `react` linter domains enabled.
2-space indent. Import organisation is automatic — don't hand-sort imports.

## Versions

Pinned deliberately; check with the user before changing a major:

- **Next.js 16** (App Router) — requires Node >= 20.9
- **React 19**
- **TypeScript 5.9.3** — pinned exact. TypeScript 7 (the native Go compiler) is
  available but the project stays on 5.x for ecosystem compatibility.
- **Tailwind 4** — CSS-first, no JS config

## Verifying work

```bash
pnpm lint && pnpm exec tsc --noEmit && pnpm build
```

Run these before claiming a change works. `tsc --noEmit` matters because
`next build` does not fail on every type error configuration.
