# Rank the ABCs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a site where visitors rule on pairs of letters, and those rulings are fitted into a new, community-sourced alphabet.

**Architecture:** Server-first Next.js App Router. A pure domain core (pairs, tokens, selection, ranking) with no framework dependencies sits under a thin Server Component / Server Action layer. Votes are the only source of truth; letter scores are fitted on demand by Bayesian Bradley-Terry and cached.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript 5.9, Prisma + Prisma Postgres, Tailwind 4, shadcn/ui, Vitest, Biome, pnpm.

## Global Constraints

- `pnpm` only. `pnpm-workspace.yaml` sets `minimumReleaseAge: 10080` — installed versions intentionally lag the newest published. Never lower it. Declare deps as ranges, never exact pins.
- Biome replaces ESLint *and* Prettier. Never add either. Format with `pnpm format`, check with `pnpm lint`.
- Tailwind 4 is CSS-first. There is no `tailwind.config.js` and none may be created. Theme lives in `src/app/globals.css`.
- Style with semantic tokens only: `bg-background`, `text-muted-foreground`, `border-border`. **Never** hardcode `bg-orange-500`, `bg-white`, `text-black`, or a hex value.
- **Orange is never a background fill.** It is hairlines, borders, markers, and focus rings only. Use `text-primary` for orange text; `text-signal` on a light ground is a contrast bug.
- Use the editorial scale, not raw Tailwind sizes, for page content: `text-name`, `text-title`, `text-lead`, `text-body`, `text-meta`, `text-micro`; `font-name`/`font-book`/`font-title`; spacing `s1`–`s6`, `section`, `gutter`, `shell-top`; measures `max-w-measure`, `max-w-lead`, `max-w-shell`.
- Server Components are the default. `"use client"` goes on the smallest interactive leaf — **never** on a `page.tsx` or `layout.tsx` to silence an error.
- `params`, `searchParams`, `cookies()`, and `headers()` are async — await them.
- Never hand-author a UI primitive that shadcn ships. Check `src/components/ui/`, then `pnpm dlx shadcn@latest search`, then `pnpm dlx shadcn@latest add <name>`. Never edit files in `src/components/ui/` — wrap them.
- Never add `@radix-ui/*` packages directly; this project depends on the unified `radix-ui` package.
- Letter scores: **higher score means earlier in the alphabet.**
- The question selector must never read letter scores, uncertainty, or the current ordering. This is a hard architectural rule, not a preference.
- Version-accurate Next.js docs for the installed release are in `node_modules/next/dist/docs/`. Prefer them over recalled API details.
- Full conventions: `.claude/rules/`. Design source of truth: `docs/superpowers/specs/2026-08-05-rank-the-abcs-design.md`.

---

## File Structure

**Domain core — pure, no framework, no database:**

- `src/lib/alphabet.ts` — letters, pairs, templates, answer interpretation. The vocabulary every other module speaks.
- `src/lib/question-token.ts` — HMAC mint/verify for served questions.
- `src/lib/select-question.ts` — coverage-weighted two-stage draw. Pure; takes counts, returns a cell.
- `src/lib/ranking.ts` — Bayesian Bradley-Terry fit, standard errors, bias coefficients, connectivity.
- `src/lib/matrix.ts` — small symmetric-matrix inverse used by the fit.

**Data:**

- `prisma/schema.prisma` — `Session`, `Vote`, `Template`.
- `src/lib/db.ts` — Prisma client singleton.
- `src/lib/votes.ts` — the only module that reads/writes votes. Aggregation queries for the selector and the fit.

**Server surface:**

- `src/lib/session.ts` — cookie read/create/clear.
- `src/app/actions.ts` — Server Actions: `submitVote`, `forgetMe`.
- `src/lib/ranking-cache.ts` — memoised fit.

**Pages and components:**

- `src/app/page.tsx` — vote page (Server Component).
- `src/components/vote-loop.tsx` — `"use client"` interaction leaf.
- `src/components/question-card.tsx` — question prose + two ruled cells.
- `src/components/reveal-ledger.tsx` — split ledger after a vote.
- `src/app/rankings/page.tsx` — rankings ledger.
- `src/components/ranking-row.tsx` — one letter row with confidence band.
- `src/app/privacy/page.tsx` — notice + forget-me.
- `src/components/forget-me.tsx` — `"use client"` button.
- `src/components/theme-provider.tsx` + `src/components/theme-toggle.tsx` — dark mode.

---

### Task 1: Test harness and the alphabet domain module

**Files:**
- Create: `vitest.config.ts`
- Create: `src/lib/alphabet.ts`
- Create: `src/lib/alphabet.test.ts`
- Modify: `package.json` (scripts, devDependencies)

**Interfaces:**
- Consumes: nothing.
- Produces: `LETTERS`, `Letter`, `Template`, `TEMPLATES`, `Observation`, `pairKey(a,b)`, `parsePairKey(key)`, `allPairKeys()`, `cellKey(pairKey, template, firstShown)`, `otherLetter(pairKey, letter)`, `answerOptions(template, first, second)`, `interpretAnswer(template, first, second, answer)`, `questionText(template, first, second)`.

- [ ] **Step 1: Install Vitest**

```bash
pnpm add -D vitest
```

- [ ] **Step 2: Create the Vitest config**

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
  resolve: {
    alias: { "@": new URL("./src", import.meta.url).pathname },
  },
});
```

- [ ] **Step 3: Add the test script**

In `package.json`, add to `"scripts"`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Write the failing test**

Create `src/lib/alphabet.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  allPairKeys,
  answerOptions,
  cellKey,
  interpretAnswer,
  LETTERS,
  otherLetter,
  pairKey,
  parsePairKey,
  TEMPLATES,
} from "./alphabet";

describe("pairs", () => {
  it("has 26 letters", () => {
    expect(LETTERS).toHaveLength(26);
  });

  it("builds a canonical key regardless of argument order", () => {
    expect(pairKey("Q", "E")).toBe("E:Q");
    expect(pairKey("E", "Q")).toBe("E:Q");
  });

  it("rejects a pair of the same letter", () => {
    expect(() => pairKey("A", "A")).toThrow();
  });

  it("round-trips a key", () => {
    expect(parsePairKey("E:Q")).toEqual(["E", "Q"]);
  });

  it("enumerates every unordered pair exactly once", () => {
    const keys = allPairKeys();
    expect(keys).toHaveLength(325);
    expect(new Set(keys).size).toBe(325);
  });

  it("returns the opposite letter of a pair", () => {
    expect(otherLetter("E:Q", "Q")).toBe("E");
    expect(otherLetter("E:Q", "E")).toBe("Q");
  });

  it("builds a distinct cell key per phrasing", () => {
    const keys = new Set<string>();
    for (const template of TEMPLATES) {
      for (const first of ["E", "Q"] as const) {
        keys.add(cellKey("E:Q", template, first));
      }
    }
    expect(keys.size).toBe(6);
  });
});

describe("answer interpretation", () => {
  it("WHICH_FIRST: the chosen letter wins", () => {
    expect(interpretAnswer("WHICH_FIRST", "Q", "E", "Q")).toBe("Q");
    expect(interpretAnswer("WHICH_FIRST", "Q", "E", "E")).toBe("E");
  });

  it("SHOULD_BEFORE: yes means the first letter wins", () => {
    expect(interpretAnswer("SHOULD_BEFORE", "Q", "E", "YES")).toBe("Q");
    expect(interpretAnswer("SHOULD_BEFORE", "Q", "E", "NO")).toBe("E");
  });

  it("SHOULD_AFTER: yes means the second letter wins", () => {
    expect(interpretAnswer("SHOULD_AFTER", "Q", "E", "YES")).toBe("E");
    expect(interpretAnswer("SHOULD_AFTER", "Q", "E", "NO")).toBe("Q");
  });

  it("SHOULD_BEFORE(a,b) and SHOULD_AFTER(b,a) agree — they are the same claim", () => {
    expect(interpretAnswer("SHOULD_BEFORE", "T", "V", "YES")).toBe(
      interpretAnswer("SHOULD_AFTER", "V", "T", "YES"),
    );
  });

  it("rejects an answer the template does not permit", () => {
    expect(() => interpretAnswer("WHICH_FIRST", "Q", "E", "YES")).toThrow();
    expect(() => interpretAnswer("SHOULD_BEFORE", "Q", "E", "Q")).toThrow();
    expect(() => interpretAnswer("WHICH_FIRST", "Q", "E", "Z")).toThrow();
  });

  it("offers two options whose values interpret cleanly", () => {
    for (const template of TEMPLATES) {
      const options = answerOptions(template, "Q", "E");
      expect(options).toHaveLength(2);
      const winners = options.map((o) =>
        interpretAnswer(template, "Q", "E", o.value),
      );
      expect(new Set(winners)).toEqual(new Set(["Q", "E"]));
    }
  });
});
```

- [ ] **Step 5: Run the test to verify it fails**

Run: `pnpm test`
Expected: FAIL — `Failed to resolve import "./alphabet"`

- [ ] **Step 6: Write the implementation**

Create `src/lib/alphabet.ts`:

```ts
export const LETTERS = [
  "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M",
  "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z",
] as const;

export type Letter = (typeof LETTERS)[number];

export const TEMPLATES = [
  "WHICH_FIRST",
  "SHOULD_BEFORE",
  "SHOULD_AFTER",
] as const;

export type Template = (typeof TEMPLATES)[number];

const LETTER_SET: ReadonlySet<string> = new Set(LETTERS);

export function isLetter(value: string): value is Letter {
  return LETTER_SET.has(value);
}

/** Canonical, order-independent identifier for an unordered pair. */
export function pairKey(a: Letter, b: Letter): string {
  if (a === b) throw new Error(`A pair needs two different letters, got ${a}`);
  return a < b ? `${a}:${b}` : `${b}:${a}`;
}

export function parsePairKey(key: string): [Letter, Letter] {
  const [a, b] = key.split(":");
  if (!a || !b || !isLetter(a) || !isLetter(b) || a >= b) {
    throw new Error(`Malformed pair key: ${key}`);
  }
  return [a, b];
}

export function allPairKeys(): string[] {
  const keys: string[] = [];
  for (let i = 0; i < LETTERS.length; i++) {
    for (let j = i + 1; j < LETTERS.length; j++) {
      keys.push(`${LETTERS[i]}:${LETTERS[j]}`);
    }
  }
  return keys;
}

/** Identifies one phrasing of one pair — the unit the selector balances. */
export function cellKey(
  pair: string,
  template: Template,
  firstShown: Letter,
): string {
  return `${pair}|${template}|${firstShown}`;
}

export function otherLetter(pair: string, letter: Letter): Letter {
  const [a, b] = parsePairKey(pair);
  if (letter === a) return b;
  if (letter === b) return a;
  throw new Error(`${letter} is not in pair ${pair}`);
}

export type AnswerOption = { label: string; value: string };

export function answerOptions(
  template: Template,
  first: Letter,
  second: Letter,
): [AnswerOption, AnswerOption] {
  if (template === "WHICH_FIRST") {
    return [
      { label: first, value: first },
      { label: second, value: second },
    ];
  }
  return [
    { label: "Yes", value: "YES" },
    { label: "No", value: "NO" },
  ];
}

/**
 * Reduces a raw response to the letter the voter placed first. This is the one
 * place the three templates stop being different from each other.
 */
export function interpretAnswer(
  template: Template,
  first: Letter,
  second: Letter,
  answer: string,
): Letter {
  if (template === "WHICH_FIRST") {
    if (answer === first || answer === second) return answer as Letter;
    throw new Error(`${answer} is not an option for ${first} vs ${second}`);
  }
  if (answer !== "YES" && answer !== "NO") {
    throw new Error(`${template} expects YES or NO, got ${answer}`);
  }
  const yesMeansFirst = template === "SHOULD_BEFORE";
  const first_wins = (answer === "YES") === yesMeansFirst;
  return first_wins ? first : second;
}

export function questionText(
  template: Template,
  first: Letter,
  second: Letter,
): string {
  switch (template) {
    case "WHICH_FIRST":
      return `Which should come first, ${first} or ${second}?`;
    case "SHOULD_BEFORE":
      return `Should ${first} come before ${second}?`;
    case "SHOULD_AFTER":
      return `Should ${first} come after ${second}?`;
  }
}

/**
 * One vote, reduced to what the fit consumes. Declared here rather than beside
 * the database or the engine so that neither has to depend on the other: the
 * repository produces these, the ranking engine eats them, and the engine
 * stays a pure function with no data-layer import.
 */
export type Observation = {
  first: Letter;
  second: Letter;
  firstWon: boolean;
  isYesNo: boolean;
  isAfter: boolean;
};
```

- [ ] **Step 7: Run the test to verify it passes**

Run: `pnpm test`
Expected: PASS — all tests in `alphabet.test.ts` green.

- [ ] **Step 8: Lint and typecheck**

Run: `pnpm lint && pnpm exec tsc --noEmit`
Expected: no errors. If Biome reports formatting, run `pnpm format` and re-run.

- [ ] **Step 9: Commit**

```bash
git add vitest.config.ts package.json pnpm-lock.yaml src/lib/alphabet.ts src/lib/alphabet.test.ts
git commit -m "Add the alphabet domain module and a test runner

Establishes the vocabulary the rest of the system speaks: canonical pair keys,
the three templates, and the one function that reduces any of them to a winner."
```

---

### Task 2: Prisma schema and the vote repository

**Files:**
- Create: `prisma/schema.prisma`
- Create: `src/lib/db.ts`
- Create: `src/lib/votes.ts`
- Modify: `package.json`, `.env`

**Interfaces:**
- Consumes: `Letter`, `Template`, `Observation`, `cellKey`, `parsePairKey`, `otherLetter` from Task 1.
- Produces: `prisma` client singleton; `RecordVoteInput`, `recordVote(input): Promise<boolean>`, `pairVoteCounts(): Promise<Map<string, number>>`, `cellVoteCounts(): Promise<Map<string, number>>`, `answeredCellKeys(sessionId): Promise<Set<string>>`, `pairSplit(pairKey): Promise<Map<Letter, number>>`, `allObservations(): Promise<Observation[]>`, `recentVoteCount(sessionId, windowMs): Promise<number>`, `detachSessionVotes(sessionId): Promise<void>`.

- [ ] **Step 1: Install Prisma**

```bash
pnpm add @prisma/client
pnpm add -D prisma
```

- [ ] **Step 2: Add the token secret to `.env`**

Append to `.env` (the file is gitignored; the database URLs are already present):

```bash
printf '\nQUESTION_TOKEN_SECRET="%s"\n' "$(openssl rand -hex 32)" >> .env
```

- [ ] **Step 3: Write the schema**

Create `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Template {
  WHICH_FIRST
  SHOULD_BEFORE
  SHOULD_AFTER
}

model Session {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  votes     Vote[]
}

model Vote {
  id         String   @id @default(cuid())
  // Nullable so "forget me" can sever the link without destroying the vote.
  // Postgres treats NULLs as distinct in a unique index, so detached votes do
  // not collide with each other.
  session    Session? @relation(fields: [sessionId], references: [id])
  sessionId  String?
  pairKey    String
  firstShown String
  template   Template
  answer     String
  winner     String
  createdAt  DateTime @default(now())

  @@unique([sessionId, pairKey, template, firstShown])
  @@index([pairKey])
  @@index([sessionId, createdAt])
}
```

- [ ] **Step 4: Push the schema and generate the client**

```bash
pnpm exec prisma migrate dev --name initial-vote-schema
```

Expected: a migration is created under `prisma/migrations/`, applied to Prisma Postgres, and the client generates.

- [ ] **Step 5: Write the client singleton**

Create `src/lib/db.ts`:

```ts
import { PrismaClient } from "@prisma/client";

// Next's dev server re-evaluates modules on every hot reload, which would open
// a new pool each time and exhaust the database's connection limit.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

- [ ] **Step 6: Write the failing test**

Create `src/lib/votes.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "./db";
import {
  allObservations,
  answeredCellKeys,
  cellVoteCounts,
  detachSessionVotes,
  pairSplit,
  pairVoteCounts,
  recordVote,
} from "./votes";

async function freshSession(): Promise<string> {
  const session = await prisma.session.create({ data: {} });
  return session.id;
}

describe("vote repository", () => {
  beforeEach(async () => {
    await prisma.vote.deleteMany();
    await prisma.session.deleteMany();
  });

  it("records a vote and counts it against its pair", async () => {
    const sessionId = await freshSession();
    await recordVote({
      sessionId,
      pairKey: "E:Q",
      template: "WHICH_FIRST",
      firstShown: "Q",
      answer: "Q",
      winner: "Q",
    });

    const counts = await pairVoteCounts();
    expect(counts.get("E:Q")).toBe(1);
  });

  it("rejects a second vote on the same cell from the same session", async () => {
    const sessionId = await freshSession();
    const input = {
      sessionId,
      pairKey: "E:Q",
      template: "WHICH_FIRST" as const,
      firstShown: "Q" as const,
      answer: "Q",
      winner: "Q" as const,
    };
    expect(await recordVote(input)).toBe(true);
    expect(await recordVote(input)).toBe(false);
    expect((await pairVoteCounts()).get("E:Q")).toBe(1);
  });

  it("allows the same pair in a different phrasing", async () => {
    const sessionId = await freshSession();
    await recordVote({
      sessionId, pairKey: "E:Q", template: "WHICH_FIRST",
      firstShown: "Q", answer: "Q", winner: "Q",
    });
    await recordVote({
      sessionId, pairKey: "E:Q", template: "SHOULD_BEFORE",
      firstShown: "Q", answer: "YES", winner: "Q",
    });
    expect((await pairVoteCounts()).get("E:Q")).toBe(2);
    expect((await cellVoteCounts()).get("E:Q|WHICH_FIRST|Q")).toBe(1);
  });

  it("lists the cells a session has already answered", async () => {
    const sessionId = await freshSession();
    await recordVote({
      sessionId, pairKey: "E:Q", template: "WHICH_FIRST",
      firstShown: "Q", answer: "Q", winner: "Q",
    });
    const answered = await answeredCellKeys(sessionId);
    expect(answered.has("E:Q|WHICH_FIRST|Q")).toBe(true);
    expect(answered.has("E:Q|WHICH_FIRST|E")).toBe(false);
  });

  it("reports the split for a cell", async () => {
    const a = await freshSession();
    const b = await freshSession();
    const c = await freshSession();
    for (const [sessionId, winner] of [[a, "Q"], [b, "Q"], [c, "E"]] as const) {
      await recordVote({
        sessionId, pairKey: "E:Q", template: "WHICH_FIRST",
        firstShown: "Q", answer: winner, winner,
      });
    }
    const split = await pairSplit("E:Q");
    expect(split.get("Q")).toBe(2);
    expect(split.get("E")).toBe(1);
  });

  it("detaches a session's votes without deleting them", async () => {
    const sessionId = await freshSession();
    await recordVote({
      sessionId, pairKey: "E:Q", template: "WHICH_FIRST",
      firstShown: "Q", answer: "Q", winner: "Q",
    });

    await detachSessionVotes(sessionId);

    expect(await prisma.session.count()).toBe(0);
    expect(await prisma.vote.count()).toBe(1);
    expect((await pairVoteCounts()).get("E:Q")).toBe(1);
    expect((await allObservations())).toHaveLength(1);
  });

  it("turns stored votes into fit observations", async () => {
    const sessionId = await freshSession();
    await recordVote({
      sessionId, pairKey: "E:Q", template: "SHOULD_AFTER",
      firstShown: "Q", answer: "YES", winner: "E",
    });

    const [observation] = await allObservations();
    expect(observation).toEqual({
      first: "Q",
      second: "E",
      firstWon: false,
      isYesNo: true,
      isAfter: true,
    });
  });
});
```

- [ ] **Step 7: Run the test to verify it fails**

Run: `pnpm test src/lib/votes.test.ts`
Expected: FAIL — `Failed to resolve import "./votes"`

- [ ] **Step 8: Write the implementation**

Create `src/lib/votes.ts`:

```ts
import { Prisma } from "@prisma/client";
import {
  cellKey,
  type Letter,
  type Observation,
  otherLetter,
  parsePairKey,
  type Template,
} from "./alphabet";
import { prisma } from "./db";

export type RecordVoteInput = {
  sessionId: string;
  pairKey: string;
  template: Template;
  firstShown: Letter;
  answer: string;
  winner: Letter;
};

/** Returns false when this session already ruled on this cell. */
export async function recordVote(input: RecordVoteInput): Promise<boolean> {
  try {
    await prisma.vote.create({ data: input });
    return true;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return false;
    }
    throw error;
  }
}

export async function pairVoteCounts(): Promise<Map<string, number>> {
  const rows = await prisma.vote.groupBy({
    by: ["pairKey"],
    _count: { _all: true },
  });
  return new Map(rows.map((row) => [row.pairKey, row._count._all]));
}

export async function cellVoteCounts(): Promise<Map<string, number>> {
  const rows = await prisma.vote.groupBy({
    by: ["pairKey", "template", "firstShown"],
    _count: { _all: true },
  });
  return new Map(
    rows.map((row) => [
      cellKey(row.pairKey, row.template, row.firstShown as Letter),
      row._count._all,
    ]),
  );
}

export async function answeredCellKeys(
  sessionId: string,
): Promise<Set<string>> {
  const rows = await prisma.vote.findMany({
    where: { sessionId },
    select: { pairKey: true, template: true, firstShown: true },
  });
  return new Set(
    rows.map((row) =>
      cellKey(row.pairKey, row.template, row.firstShown as Letter),
    ),
  );
}

/** Votes for each letter of a pair, across every phrasing of it. */
export async function pairSplit(pair: string): Promise<Map<Letter, number>> {
  const rows = await prisma.vote.groupBy({
    by: ["winner"],
    where: { pairKey: pair },
    _count: { _all: true },
  });
  const [a, b] = parsePairKey(pair);
  const split = new Map<Letter, number>([
    [a, 0],
    [b, 0],
  ]);
  for (const row of rows) split.set(row.winner as Letter, row._count._all);
  return split;
}

export async function allObservations(): Promise<Observation[]> {
  const rows = await prisma.vote.findMany({
    select: {
      pairKey: true,
      firstShown: true,
      template: true,
      winner: true,
    },
  });
  return rows.map((row) => {
    const first = row.firstShown as Letter;
    return {
      first,
      second: otherLetter(row.pairKey, first),
      firstWon: row.winner === first,
      isYesNo: row.template !== "WHICH_FIRST",
      isAfter: row.template === "SHOULD_AFTER",
    };
  });
}

export async function recentVoteCount(
  sessionId: string,
  windowMs: number,
): Promise<number> {
  return prisma.vote.count({
    where: { sessionId, createdAt: { gte: new Date(Date.now() - windowMs) } },
  });
}

/**
 * Severs the link between a session and its votes, then removes the session.
 * The votes survive: they were legitimately cast and belong to the crowd
 * result, and a null sessionId is genuine anonymisation rather than deletion.
 */
export async function detachSessionVotes(sessionId: string): Promise<void> {
  await prisma.$transaction([
    prisma.vote.updateMany({ where: { sessionId }, data: { sessionId: null } }),
    prisma.session.deleteMany({ where: { id: sessionId } }),
  ]);
}
```

- [ ] **Step 9: Run the test to verify it passes**

Run: `pnpm test src/lib/votes.test.ts`
Expected: PASS — all seven tests green. These hit the real Prisma Postgres database and clear their own tables in `beforeEach`.

- [ ] **Step 10: Lint and typecheck**

Run: `pnpm lint && pnpm exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 11: Commit**

```bash
git add prisma package.json pnpm-lock.yaml src/lib/db.ts src/lib/votes.ts src/lib/votes.test.ts
git commit -m "Add the vote schema and repository

Votes are the only source of truth; counts are aggregated on read rather than
kept in counter columns, so there is no second copy to drift.

sessionId is nullable so forget-me can sever the link without destroying a
vote that legitimately belongs to the crowd result."
```

---

### Task 3: Signed question tokens

**Files:**
- Create: `src/lib/question-token.ts`
- Create: `src/lib/question-token.test.ts`

**Interfaces:**
- Consumes: `Letter`, `Template` from Task 1.
- Produces: `QuestionPayload`, `mintQuestionToken(payload, opts?)`, `verifyQuestionToken(token, sessionId, opts?)` returning `{ ok: true; payload } | { ok: false; reason }`, and the constants `TOKEN_TTL_MS`, `MIN_ANSWER_MS`.

- [ ] **Step 1: Write the failing test**

Create `src/lib/question-token.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  MIN_ANSWER_MS,
  mintQuestionToken,
  type QuestionPayload,
  TOKEN_TTL_MS,
  verifyQuestionToken,
} from "./question-token";

const SECRET = "test-secret-value";
const OTHER_SECRET = "a-different-secret";

const payload: QuestionPayload = {
  pairKey: "E:Q",
  template: "WHICH_FIRST",
  firstShown: "Q",
  sessionId: "session-1",
  issuedAt: 1_000_000,
};

const readable = { secret: SECRET, now: 1_000_000 + MIN_ANSWER_MS + 500 };

describe("question tokens", () => {
  it("round-trips a valid token", () => {
    const token = mintQuestionToken(payload, { secret: SECRET });
    const result = verifyQuestionToken(token, "session-1", readable);
    expect(result).toEqual({ ok: true, payload });
  });

  it("rejects a forged signature", () => {
    const token = mintQuestionToken(payload, { secret: OTHER_SECRET });
    const result = verifyQuestionToken(token, "session-1", readable);
    expect(result).toEqual({ ok: false, reason: "bad-signature" });
  });

  it("rejects a tampered payload", () => {
    const token = mintQuestionToken(payload, { secret: SECRET });
    const [body, signature] = token.split(".");
    const forged = Buffer.from(
      JSON.stringify({ ...payload, firstShown: "E" }),
      "utf8",
    ).toString("base64url");
    expect(forged).not.toBe(body);
    const result = verifyQuestionToken(`${forged}.${signature}`, "session-1", readable);
    expect(result).toEqual({ ok: false, reason: "bad-signature" });
  });

  it("rejects a token past its TTL", () => {
    const token = mintQuestionToken(payload, { secret: SECRET });
    const result = verifyQuestionToken(token, "session-1", {
      secret: SECRET,
      now: payload.issuedAt + TOKEN_TTL_MS + 1,
    });
    expect(result).toEqual({ ok: false, reason: "expired" });
  });

  it("rejects an answer returned implausibly fast", () => {
    const token = mintQuestionToken(payload, { secret: SECRET });
    const result = verifyQuestionToken(token, "session-1", {
      secret: SECRET,
      now: payload.issuedAt + MIN_ANSWER_MS - 1,
    });
    expect(result).toEqual({ ok: false, reason: "too-fast" });
  });

  it("rejects a token minted for another session", () => {
    const token = mintQuestionToken(payload, { secret: SECRET });
    const result = verifyQuestionToken(token, "session-2", readable);
    expect(result).toEqual({ ok: false, reason: "session-mismatch" });
  });

  it("rejects structurally broken input without throwing", () => {
    for (const bad of ["", "nodot", "a.b.c", "!!!.???"]) {
      expect(verifyQuestionToken(bad, "session-1", readable).ok).toBe(false);
    }
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test src/lib/question-token.test.ts`
Expected: FAIL — `Failed to resolve import "./question-token"`

- [ ] **Step 3: Write the implementation**

Create `src/lib/question-token.ts`:

```ts
import { createHmac, timingSafeEqual } from "node:crypto";
import type { Letter, Template } from "./alphabet";

export type QuestionPayload = {
  pairKey: string;
  template: Template;
  firstShown: Letter;
  sessionId: string;
  issuedAt: number;
};

export type VerifyResult =
  | { ok: true; payload: QuestionPayload }
  | { ok: false; reason: VerifyFailure };

export type VerifyFailure =
  | "malformed"
  | "bad-signature"
  | "expired"
  | "too-fast"
  | "session-mismatch";

/** Minutes, not hours: a served question is answered now or not at all. */
export const TOKEN_TTL_MS = 10 * 60 * 1000;

/**
 * A token minted this recently and already returned was not read by a person.
 * Cheap, and it catches naive automation without inconveniencing anyone.
 */
export const MIN_ANSWER_MS = 400;

function secretOrThrow(override?: string): string {
  const secret = override ?? process.env.QUESTION_TOKEN_SECRET;
  if (!secret) throw new Error("QUESTION_TOKEN_SECRET is not set");
  return secret;
}

function sign(body: string, secret: string): string {
  return createHmac("sha256", secret).update(body).digest("base64url");
}

export function mintQuestionToken(
  payload: QuestionPayload,
  opts: { secret?: string } = {},
): string {
  const secret = secretOrThrow(opts.secret);
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString(
    "base64url",
  );
  return `${body}.${sign(body, secret)}`;
}

export function verifyQuestionToken(
  token: string,
  sessionId: string,
  opts: { secret?: string; now?: number } = {},
): VerifyResult {
  const secret = secretOrThrow(opts.secret);
  const now = opts.now ?? Date.now();

  const parts = token.split(".");
  if (parts.length !== 2) return { ok: false, reason: "malformed" };
  const [body, signature] = parts;

  // Compared through timingSafeEqual, which throws on a length mismatch, so
  // the lengths are checked first rather than letting it raise.
  const expected = Buffer.from(sign(body, secret), "utf8");
  const provided = Buffer.from(signature, "utf8");
  if (
    expected.length !== provided.length ||
    !timingSafeEqual(expected, provided)
  ) {
    return { ok: false, reason: "bad-signature" };
  }

  let payload: QuestionPayload;
  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    return { ok: false, reason: "malformed" };
  }

  const age = now - payload.issuedAt;
  if (age > TOKEN_TTL_MS) return { ok: false, reason: "expired" };
  if (age < MIN_ANSWER_MS) return { ok: false, reason: "too-fast" };
  if (payload.sessionId !== sessionId) {
    return { ok: false, reason: "session-mismatch" };
  }

  return { ok: true, payload };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test src/lib/question-token.test.ts`
Expected: PASS — all seven tests green.

- [ ] **Step 5: Lint and typecheck**

Run: `pnpm lint && pnpm exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/lib/question-token.ts src/lib/question-token.test.ts
git commit -m "Add signed question tokens

A vote requires a token the server minted when it chose to ask that question,
so the ballot cannot be enumerated by posting into every cell.

Replay needs no nonce store: resubmitting a token resubmits a vote for a cell
the session has answered, which the unique constraint already rejects."
```

---

### Task 4: Coverage-weighted question selection

**Files:**
- Create: `src/lib/select-question.ts`
- Create: `src/lib/select-question.test.ts`

**Interfaces:**
- Consumes: `allPairKeys`, `cellKey`, `parsePairKey`, `TEMPLATES`, `Letter`, `Template` from Task 1.
- Produces: `SelectedQuestion` (`{ pairKey; template; firstShown }`), `selectQuestion(pairCounts, cellCounts, answeredCells, rng)`, `pairWeight(count)`.

- [ ] **Step 1: Write the failing test**

Create `src/lib/select-question.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { allPairKeys, cellKey, TEMPLATES } from "./alphabet";
import { pairWeight, selectQuestion } from "./select-question";

/** Deterministic generator so a statistical test cannot flake. */
function seeded(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1_664_525 + 1_013_904_223) >>> 0;
    return state / 0x1_0000_0000;
  };
}

const NO_CELLS = new Map<string, number>();
const NONE_ANSWERED = new Set<string>();

describe("pair weighting", () => {
  it("falls as the vote count rises", () => {
    expect(pairWeight(0)).toBeGreaterThan(pairWeight(1));
    expect(pairWeight(1)).toBeGreaterThan(pairWeight(10));
  });

  it("never reaches zero, so a well-voted pair still comes up", () => {
    expect(pairWeight(10_000)).toBeGreaterThan(0);
  });
});

describe("selectQuestion", () => {
  it("returns a well-formed question", () => {
    const result = selectQuestion(new Map(), NO_CELLS, NONE_ANSWERED, seeded(1));
    expect(result).not.toBeNull();
    if (!result) return;
    expect(allPairKeys()).toContain(result.pairKey);
    expect(TEMPLATES).toContain(result.template);
    expect(result.pairKey.split(":")).toContain(result.firstShown);
  });

  it("favours thinly-voted pairs without starving well-voted ones", () => {
    const pairCounts = new Map(allPairKeys().map((key) => [key, 50]));
    pairCounts.set("A:B", 0);

    const rng = seeded(7);
    let thin = 0;
    let other = 0;
    for (let i = 0; i < 4000; i++) {
      const result = selectQuestion(pairCounts, NO_CELLS, NONE_ANSWERED, rng);
      if (result?.pairKey === "A:B") thin++;
      else other++;
    }

    // 1/(0+1) against 324 pairs at 1/(50+1): the thin pair should dominate
    // relative to any single rival, while the rest still collectively appear.
    expect(thin).toBeGreaterThan(4000 * 0.1);
    expect(other).toBeGreaterThan(0);
  });

  it("scatters across pairs rather than marching in order", () => {
    const rng = seeded(3);
    const seen = new Set<string>();
    for (let i = 0; i < 60; i++) {
      const result = selectQuestion(new Map(), NO_CELLS, NONE_ANSWERED, rng);
      if (result) seen.add(result.pairKey);
    }
    expect(seen.size).toBeGreaterThan(40);
  });

  it("prefers the least-voted phrasing within the chosen pair", () => {
    const pairCounts = new Map([["A:B", 5]]);
    for (const key of allPairKeys()) {
      if (key !== "A:B") pairCounts.set(key, 100_000);
    }
    const cellCounts = new Map<string, number>();
    for (const template of TEMPLATES) {
      for (const first of ["A", "B"] as const) {
        cellCounts.set(cellKey("A:B", template, first), 9);
      }
    }
    cellCounts.set(cellKey("A:B", "SHOULD_AFTER", "B"), 0);

    const rng = seeded(11);
    for (let i = 0; i < 50; i++) {
      const result = selectQuestion(pairCounts, cellCounts, NONE_ANSWERED, rng);
      if (result?.pairKey !== "A:B") continue;
      expect(result.template).toBe("SHOULD_AFTER");
      expect(result.firstShown).toBe("B");
    }
  });

  it("never serves a cell the session already answered", () => {
    const answered = new Set<string>();
    for (const template of TEMPLATES) {
      for (const first of ["A", "B"] as const) {
        answered.add(cellKey("A:B", template, first));
      }
    }
    const pairCounts = new Map(allPairKeys().map((key) => [key, 500]));
    pairCounts.set("A:B", 0);

    const rng = seeded(5);
    for (let i = 0; i < 500; i++) {
      const result = selectQuestion(pairCounts, NO_CELLS, answered, rng);
      expect(result?.pairKey).not.toBe("A:B");
    }
  });

  it("returns null once the session has answered every cell", () => {
    const answered = new Set<string>();
    for (const pair of allPairKeys()) {
      for (const template of TEMPLATES) {
        const [a, b] = pair.split(":") as ["A", "B"];
        answered.add(cellKey(pair, template, a));
        answered.add(cellKey(pair, template, b));
      }
    }
    expect(
      selectQuestion(new Map(), NO_CELLS, answered, seeded(1)),
    ).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test src/lib/select-question.test.ts`
Expected: FAIL — `Failed to resolve import "./select-question"`

- [ ] **Step 3: Write the implementation**

Create `src/lib/select-question.ts`:

```ts
import {
  allPairKeys,
  cellKey,
  type Letter,
  parsePairKey,
  type Template,
  TEMPLATES,
} from "./alphabet";

export type SelectedQuestion = {
  pairKey: string;
  template: Template;
  firstShown: Letter;
};

/**
 * Selection is coverage-driven and never consults the ranking model — it
 * cannot see scores, uncertainty, or the current ordering. A selector that
 * hunted for questions likely to upend the alphabet would be a churn machine,
 * and the alphabet would never settle.
 */
export function pairWeight(voteCount: number): number {
  return 1 / (voteCount + 1);
}

function cellsFor(pair: string): SelectedQuestion[] {
  const [a, b] = parsePairKey(pair);
  const cells: SelectedQuestion[] = [];
  for (const template of TEMPLATES) {
    for (const firstShown of [a, b]) {
      cells.push({ pairKey: pair, template, firstShown });
    }
  }
  return cells;
}

export function selectQuestion(
  pairCounts: ReadonlyMap<string, number>,
  cellCounts: ReadonlyMap<string, number>,
  answeredCells: ReadonlySet<string>,
  rng: () => number = Math.random,
): SelectedQuestion | null {
  // Stage one: draw a pair, weighted toward thin coverage. Pairs with nothing
  // left for this session to answer are excluded before weighting, so an
  // exhausted pair cannot absorb the draw.
  const candidates: { pair: string; weight: number }[] = [];
  let total = 0;
  for (const pair of allPairKeys()) {
    const open = cellsFor(pair).some(
      (cell) =>
        !answeredCells.has(cellKey(pair, cell.template, cell.firstShown)),
    );
    if (!open) continue;
    const weight = pairWeight(pairCounts.get(pair) ?? 0);
    candidates.push({ pair, weight });
    total += weight;
  }
  if (candidates.length === 0) return null;

  let threshold = rng() * total;
  let chosen = candidates[candidates.length - 1].pair;
  for (const candidate of candidates) {
    threshold -= candidate.weight;
    if (threshold <= 0) {
      chosen = candidate.pair;
      break;
    }
  }

  // Stage two: within that pair take the least-voted phrasing, breaking ties
  // at random so concurrent visitors do not all land on the same cell.
  const open = cellsFor(chosen).filter(
    (cell) => !answeredCells.has(cellKey(chosen, cell.template, cell.firstShown)),
  );
  let lowest = Number.POSITIVE_INFINITY;
  let tied: SelectedQuestion[] = [];
  for (const cell of open) {
    const count = cellCounts.get(cellKey(chosen, cell.template, cell.firstShown)) ?? 0;
    if (count < lowest) {
      lowest = count;
      tied = [cell];
    } else if (count === lowest) {
      tied.push(cell);
    }
  }
  return tied[Math.floor(rng() * tied.length)] ?? null;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test src/lib/select-question.test.ts`
Expected: PASS — all seven tests green.

- [ ] **Step 5: Lint and typecheck**

Run: `pnpm lint && pnpm exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/lib/select-question.ts src/lib/select-question.test.ts
git commit -m "Add coverage-weighted question selection

Weighted randomness rather than a strict minimum-first rule: it stops
concurrent visitors all receiving the same lowest-count question, and avoids
the marching A-B, A-C, A-D sequence that lockstep cell counts produce.

The selector cannot see the ranking model, so it cannot steer toward results."
```

---

### Task 5: The Bradley-Terry ranking engine

**Files:**
- Create: `src/lib/matrix.ts`
- Create: `src/lib/matrix.test.ts`
- Create: `src/lib/ranking.ts`
- Create: `src/lib/ranking.test.ts`

**Interfaces:**
- Consumes: `LETTERS`, `Letter`, `Observation` from Task 1.
- Produces: `invertSymmetric(matrix, size)`; `PRIOR_SIGMA`, `LetterScore`, `Ranking` (with `placed`, `unplaced`, `bias`, `observations`, `settledness`, `converged`), `fitRanking(observations)`.

- [ ] **Step 1: Write the failing matrix test**

Create `src/lib/matrix.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { invertSymmetric } from "./matrix";

describe("invertSymmetric", () => {
  it("inverts the identity to itself", () => {
    const identity = new Float64Array([1, 0, 0, 0, 1, 0, 0, 0, 1]);
    const result = invertSymmetric(identity, 3);
    expect(Array.from(result)).toEqual([1, 0, 0, 0, 1, 0, 0, 0, 1]);
  });

  it("inverts a known 2x2", () => {
    // [[4,1],[1,3]] has inverse [[3,-1],[-1,4]] / 11
    const result = invertSymmetric(new Float64Array([4, 1, 1, 3]), 2);
    expect(result[0]).toBeCloseTo(3 / 11, 10);
    expect(result[1]).toBeCloseTo(-1 / 11, 10);
    expect(result[3]).toBeCloseTo(4 / 11, 10);
  });

  it("multiplies back to the identity", () => {
    const a = new Float64Array([5, 2, 1, 2, 6, 3, 1, 3, 7]);
    const inverse = invertSymmetric(a, 3);
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        let sum = 0;
        for (let k = 0; k < 3; k++) sum += a[i * 3 + k] * inverse[k * 3 + j];
        expect(sum).toBeCloseTo(i === j ? 1 : 0, 10);
      }
    }
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm test src/lib/matrix.test.ts`
Expected: FAIL — `Failed to resolve import "./matrix"`

- [ ] **Step 3: Write the matrix implementation**

Create `src/lib/matrix.ts`:

```ts
/**
 * Gauss-Jordan inverse with partial pivoting, for the ~29x29 penalised
 * information matrix. Small enough that a dedicated Cholesky routine would buy
 * nothing; the same inverse serves as both the Newton step and the source of
 * the standard errors.
 *
 * `matrix` is row-major and is not modified.
 */
export function invertSymmetric(
  matrix: Float64Array,
  size: number,
): Float64Array {
  const a = Float64Array.from(matrix);
  const inverse = new Float64Array(size * size);
  for (let i = 0; i < size; i++) inverse[i * size + i] = 1;

  for (let column = 0; column < size; column++) {
    let pivotRow = column;
    let best = Math.abs(a[column * size + column]);
    for (let row = column + 1; row < size; row++) {
      const candidate = Math.abs(a[row * size + column]);
      if (candidate > best) {
        best = candidate;
        pivotRow = row;
      }
    }
    if (best === 0) throw new Error("Matrix is singular");

    if (pivotRow !== column) {
      for (let k = 0; k < size; k++) {
        const tmpA = a[column * size + k];
        a[column * size + k] = a[pivotRow * size + k];
        a[pivotRow * size + k] = tmpA;
        const tmpI = inverse[column * size + k];
        inverse[column * size + k] = inverse[pivotRow * size + k];
        inverse[pivotRow * size + k] = tmpI;
      }
    }

    const pivot = a[column * size + column];
    for (let k = 0; k < size; k++) {
      a[column * size + k] /= pivot;
      inverse[column * size + k] /= pivot;
    }

    for (let row = 0; row < size; row++) {
      if (row === column) continue;
      const factor = a[row * size + column];
      if (factor === 0) continue;
      for (let k = 0; k < size; k++) {
        a[row * size + k] -= factor * a[column * size + k];
        inverse[row * size + k] -= factor * inverse[column * size + k];
      }
    }
  }

  return inverse;
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `pnpm test src/lib/matrix.test.ts`
Expected: PASS — three tests green.

- [ ] **Step 5: Write the failing ranking test**

Create `src/lib/ranking.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { LETTERS, type Letter, type Observation } from "./alphabet";
import { fitRanking } from "./ranking";

function seeded(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1_664_525 + 1_013_904_223) >>> 0;
    return state / 0x1_0000_0000;
  };
}

/** Simulates votes from a known truth, so the fit can be checked against it. */
function simulate(
  truth: Map<Letter, number>,
  rounds: number,
  rng: () => number,
  bias = 0,
): Observation[] {
  const letters = [...truth.keys()];
  const observations: Observation[] = [];
  for (let i = 0; i < rounds; i++) {
    for (let a = 0; a < letters.length; a++) {
      for (let b = a + 1; b < letters.length; b++) {
        const swap = rng() < 0.5;
        const first = swap ? letters[b] : letters[a];
        const second = swap ? letters[a] : letters[b];
        const eta = (truth.get(first) ?? 0) - (truth.get(second) ?? 0) + bias;
        const p = 1 / (1 + Math.exp(-eta));
        observations.push({
          first,
          second,
          firstWon: rng() < p,
          isYesNo: false,
          isAfter: false,
        });
      }
    }
  }
  return observations;
}

describe("fitRanking", () => {
  it("reports every letter unplaced when there are no votes", () => {
    const ranking = fitRanking([]);
    expect(ranking.placed).toHaveLength(0);
    expect(ranking.unplaced).toHaveLength(26);
  });

  it("recovers a planted ordering", () => {
    const truth = new Map<Letter, number>([
      ["A", 2.0], ["B", 1.0], ["C", 0.0], ["D", -1.0], ["E", -2.0],
    ]);
    const ranking = fitRanking(simulate(truth, 60, seeded(42)));
    expect(ranking.placed.map((entry) => entry.letter)).toEqual([
      "A", "B", "C", "D", "E",
    ]);
    expect(ranking.placed[0].position).toBe(1);
    expect(ranking.converged).toBe(true);
  });

  it("recovers a planted position bias without distorting the order", () => {
    const truth = new Map<Letter, number>([
      ["A", 1.5], ["B", 0.5], ["C", -0.5], ["D", -1.5],
    ]);
    const ranking = fitRanking(simulate(truth, 120, seeded(9), 0.8));
    expect(ranking.bias.position).toBeGreaterThan(0.4);
    expect(ranking.bias.position).toBeLessThan(1.2);
    expect(ranking.placed.map((entry) => entry.letter)).toEqual([
      "A", "B", "C", "D",
    ]);
  });

  it("keeps a unanimous pair finite, because the prior binds", () => {
    const observations: Observation[] = Array.from({ length: 40 }, () => ({
      first: "A" as Letter,
      second: "B" as Letter,
      firstWon: true,
      isYesNo: false,
      isAfter: false,
    }));
    const ranking = fitRanking(observations);
    for (const entry of ranking.placed) {
      expect(Number.isFinite(entry.score)).toBe(true);
      expect(Math.abs(entry.score)).toBeLessThan(10);
    }
  });

  it("collapses a vote cycle into a tight cluster instead of diverging", () => {
    const observations: Observation[] = [];
    const cycle: [Letter, Letter][] = [["A", "B"], ["B", "C"], ["C", "A"]];
    for (let i = 0; i < 30; i++) {
      for (const [first, second] of cycle) {
        observations.push({
          first, second, firstWon: true, isYesNo: false, isAfter: false,
        });
      }
    }
    const ranking = fitRanking(observations);
    const scores = ranking.placed.map((entry) => entry.score);
    expect(Math.max(...scores) - Math.min(...scores)).toBeLessThan(0.5);
    expect(ranking.converged).toBe(true);
  });

  it("flags letters outside the connected component as unplaced", () => {
    const observations: Observation[] = [
      { first: "A", second: "B", firstWon: true, isYesNo: false, isAfter: false },
      { first: "B", second: "C", firstWon: true, isYesNo: false, isAfter: false },
      { first: "Y", second: "Z", firstWon: true, isYesNo: false, isAfter: false },
    ];
    const ranking = fitRanking(observations);
    expect(ranking.placed.map((entry) => entry.letter).sort()).toEqual([
      "A", "B", "C",
    ]);
    expect(ranking.unplaced).toContain("Y");
    expect(ranking.unplaced).toContain("Z");
    expect(ranking.unplaced).toContain("M");
    expect(ranking.placed.length + ranking.unplaced.length).toBe(26);
  });

  it("reports wider uncertainty on thin evidence than on thick", () => {
    const truth = new Map<Letter, number>([["A", 1], ["B", 0], ["C", -1]]);
    const thin = fitRanking(simulate(truth, 2, seeded(4)));
    const thick = fitRanking(simulate(truth, 200, seeded(4)));
    const widest = (r: typeof thin) =>
      Math.max(...r.placed.map((entry) => entry.stderr));
    expect(widest(thin)).toBeGreaterThan(widest(thick));
  });

  it("centres scores so they are comparable across fits", () => {
    const truth = new Map<Letter, number>([["A", 3], ["B", 2], ["C", 1]]);
    const ranking = fitRanking(simulate(truth, 40, seeded(8)));
    const mean =
      ranking.placed.reduce((sum, entry) => sum + entry.score, 0) /
      ranking.placed.length;
    expect(mean).toBeCloseTo(0, 8);
  });

  it("assigns contiguous positions starting at 1", () => {
    const truth = new Map<Letter, number>(
      LETTERS.map((letter, index) => [letter, (13 - index) / 6]),
    );
    const ranking = fitRanking(simulate(truth, 3, seeded(21)));
    expect(ranking.placed.map((entry) => entry.position)).toEqual(
      ranking.placed.map((_, index) => index + 1),
    );
  });

  it("reports zero settledness with no votes and rising settledness with more", () => {
    const truth = new Map<Letter, number>([["A", 1], ["B", 0], ["C", -1]]);
    expect(fitRanking([]).settledness).toBe(0);

    const thin = fitRanking(simulate(truth, 2, seeded(4))).settledness;
    const thick = fitRanking(simulate(truth, 200, seeded(4))).settledness;

    expect(thin).toBeGreaterThan(0);
    expect(thick).toBeGreaterThan(thin);
    expect(thick).toBeLessThanOrEqual(1);
  });
});
```

- [ ] **Step 6: Run it to verify it fails**

Run: `pnpm test src/lib/ranking.test.ts`
Expected: FAIL — `Failed to resolve import "./ranking"`

- [ ] **Step 7: Write the ranking implementation**

Create `src/lib/ranking.ts`:

```ts
import { LETTERS, type Letter, type Observation } from "./alphabet";
import { invertSymmetric } from "./matrix";

export type LetterScore = {
  letter: Letter;
  score: number;
  stderr: number;
  position: number;
};

export type Ranking = {
  placed: LetterScore[];
  unplaced: Letter[];
  bias: { position: number; acquiescence: number; negation: number };
  observations: number;
  /**
   * How much of the prior's uncertainty the evidence has removed, 0 to 1.
   * With no votes every letter's uncertainty is still the prior's, so this is
   * 0; it approaches 1 as the fit tightens. This is the site's progress
   * measure — a raw vote count reads as sad at realistic volumes and gives
   * nobody a collective goal.
   */
  settledness: number;
  converged: boolean;
};

/**
 * The volatility dial, and an honest one: it is a statement about how much
 * evidence a claim needs, not a smoothing filter laid over the result. Tight
 * enough that a handful of votes cannot fling a letter across the alphabet,
 * loose enough that a few hundred can move it decisively. It also keeps
 * unanimous pairs finite, where unpenalised fitting would push their scores
 * infinitely apart.
 */
export const PRIOR_SIGMA = 1.0;

/** The bias terms are barely penalised; they are estimated, not regularised. */
const BIAS_PRIOR_SIGMA = 5.0;

const LETTER_COUNT = LETTERS.length;
const GAMMA = LETTER_COUNT;
const DELTA = LETTER_COUNT + 1;
const EPSILON = LETTER_COUNT + 2;
const PARAMS = LETTER_COUNT + 3;

const MAX_ITERATIONS = 100;
const CONVERGENCE_TOL = 1e-10;

function largestComponent(observations: Observation[]): Set<Letter> {
  const parent = new Map<Letter, Letter>(LETTERS.map((l) => [l, l]));
  const find = (letter: Letter): Letter => {
    let root = letter;
    while (parent.get(root) !== root) root = parent.get(root) as Letter;
    let walk = letter;
    while (parent.get(walk) !== root) {
      const next = parent.get(walk) as Letter;
      parent.set(walk, root);
      walk = next;
    }
    return root;
  };

  const seen = new Set<Letter>();
  for (const observation of observations) {
    seen.add(observation.first);
    seen.add(observation.second);
    const a = find(observation.first);
    const b = find(observation.second);
    if (a !== b) parent.set(a, b);
  }

  const groups = new Map<Letter, Letter[]>();
  for (const letter of seen) {
    const root = find(letter);
    const group = groups.get(root);
    if (group) group.push(letter);
    else groups.set(root, [letter]);
  }

  let best: Letter[] = [];
  for (const group of groups.values()) {
    if (group.length > best.length) best = group;
  }
  // A single comparison places two letters relative to each other, which is a
  // real if thin claim; anything smaller is not a component worth reporting.
  return best.length >= 2 ? new Set(best) : new Set();
}

export function fitRanking(observations: Observation[]): Ranking {
  const placedSet = largestComponent(observations);
  const relevant = observations.filter(
    (o) => placedSet.has(o.first) && placedSet.has(o.second),
  );

  const index = new Map<Letter, number>(LETTERS.map((l, i) => [l, i]));
  const theta = new Float64Array(PARAMS);
  const penalty = new Float64Array(PARAMS);
  for (let j = 0; j < LETTER_COUNT; j++) penalty[j] = 1 / PRIOR_SIGMA ** 2;
  for (let j = GAMMA; j < PARAMS; j++) penalty[j] = 1 / BIAS_PRIOR_SIGMA ** 2;

  let converged = relevant.length === 0;

  // Seeded with the prior's precision so the matrix is invertible even when
  // the loop below never runs. With no evidence the inverse is the prior
  // variance, which is the honest answer: every letter is exactly as uncertain
  // as it was before anyone voted.
  let information = new Float64Array(PARAMS * PARAMS);
  for (let j = 0; j < PARAMS; j++) information[j * PARAMS + j] = penalty[j];

  for (let iteration = 0; iteration < MAX_ITERATIONS && !converged; iteration++) {
    const gradient = new Float64Array(PARAMS);
    information = new Float64Array(PARAMS * PARAMS);

    for (const observation of relevant) {
      const f = index.get(observation.first) as number;
      const s = index.get(observation.second) as number;

      // Design row is sparse: +1 on the first letter, -1 on the second, and
      // the bias indicators. gamma is always on because the model predicts
      // "the first-shown letter wins".
      const terms: [number, number][] = [[f, 1], [s, -1], [GAMMA, 1]];
      if (observation.isYesNo) terms.push([DELTA, 1]);
      if (observation.isAfter) terms.push([EPSILON, 1]);

      let eta = 0;
      for (const [j, value] of terms) eta += theta[j] * value;
      const p = 1 / (1 + Math.exp(-eta));
      const weight = p * (1 - p);
      const residual = (observation.firstWon ? 1 : 0) - p;

      for (const [a, va] of terms) {
        gradient[a] += residual * va;
        for (const [b, vb] of terms) {
          information[a * PARAMS + b] += weight * va * vb;
        }
      }
    }

    for (let j = 0; j < PARAMS; j++) {
      gradient[j] -= penalty[j] * theta[j];
      information[j * PARAMS + j] += penalty[j];
    }

    const covariance = invertSymmetric(information, PARAMS);
    let largestStep = 0;
    for (let a = 0; a < PARAMS; a++) {
      let step = 0;
      for (let b = 0; b < PARAMS; b++) step += covariance[a * PARAMS + b] * gradient[b];
      theta[a] += step;
      largestStep = Math.max(largestStep, Math.abs(step));
    }
    if (largestStep < CONVERGENCE_TOL) converged = true;
  }

  const covariance = invertSymmetric(information, PARAMS);

  const placed: LetterScore[] = [...placedSet]
    .map((letter) => {
      const j = index.get(letter) as number;
      return {
        letter,
        score: theta[j],
        stderr: Math.sqrt(Math.max(covariance[j * PARAMS + j], 0)),
        position: 0,
      };
    })
    .sort((a, b) => b.score - a.score);

  // Centring makes scores comparable between fits: the prior pins the overall
  // level only weakly, so the absolute value carries no meaning on its own.
  const mean =
    placed.reduce((sum, entry) => sum + entry.score, 0) / (placed.length || 1);
  for (const [i, entry] of placed.entries()) {
    entry.score -= mean;
    entry.position = i + 1;
  }

  // Every letter starts at the prior's uncertainty. Averaging over all 26 —
  // not just the placed ones — means an unplaced letter counts as fully
  // unsettled, which it is.
  const totalStderr =
    placed.reduce((sum, entry) => sum + entry.stderr, 0) +
    (LETTER_COUNT - placed.length) * PRIOR_SIGMA;
  const settledness = Math.min(
    1,
    Math.max(0, 1 - totalStderr / (LETTER_COUNT * PRIOR_SIGMA)),
  );

  return {
    placed,
    unplaced: LETTERS.filter((letter) => !placedSet.has(letter)),
    bias: {
      position: theta[GAMMA],
      acquiescence: theta[DELTA],
      negation: theta[EPSILON],
    },
    observations: relevant.length,
    settledness,
    converged,
  };
}
```

- [ ] **Step 8: Run it to verify it passes**

Run: `pnpm test src/lib/ranking.test.ts`
Expected: PASS — all nine tests green.

- [ ] **Step 9: Run the whole suite, lint, and typecheck**

Run: `pnpm test && pnpm lint && pnpm exec tsc --noEmit`
Expected: every suite green, no lint or type errors.

- [ ] **Step 10: Commit**

```bash
git add src/lib/matrix.ts src/lib/matrix.test.ts src/lib/ranking.ts src/lib/ranking.test.ts
git commit -m "Add the Bayesian Bradley-Terry ranking engine

Letter scores and the three bias coefficients are fitted together in one
penalised logistic regression, so debiasing is a coefficient rather than a
correction applied afterwards.

Contradictions need no special handling: a cycle collapses into a tight
cluster, which is a truer description than any order forced onto it."
```

---

### Task 6: Session cookie, ranking cache, and the vote Server Action

**Files:**
- Create: `src/lib/session.ts`
- Create: `src/lib/ranking-cache.ts`
- Create: `src/lib/question-service.ts`
- Create: `src/lib/question-service.test.ts`
- Create: `src/app/actions.ts`

**Interfaces:**
- Consumes: everything from Tasks 1–5.
- Produces: `getSessionId()`, `ensureSessionId()`, `clearSession()`; `getRanking()`, `invalidateRanking()`; `ServedQuestion`, `serveQuestion(sessionId)`, `applyVote(sessionId, token, answer)`; Server Actions `submitVote(token, answer)` and `forgetMe()`.

- [ ] **Step 1: Write the session module**

Create `src/lib/session.ts`:

```ts
import { cookies } from "next/headers";
import { prisma } from "./db";

export const SESSION_COOKIE = "rtabc_sid";
const SIX_MONTHS_SECONDS = 60 * 60 * 24 * 180;

export async function getSessionId(): Promise<string | null> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value ?? null;
}

/**
 * Creates the session row and cookie on demand. Called from the vote path
 * only — a visitor who reads the rankings and leaves is never tagged, which is
 * load-bearing for the strictly-necessary exemption the site relies on.
 */
export async function ensureSessionId(): Promise<string> {
  const existing = await getSessionId();
  if (existing) {
    const known = await prisma.session.findUnique({ where: { id: existing } });
    if (known) return existing;
  }

  const session = await prisma.session.create({ data: {} });
  const store = await cookies();
  store.set(SESSION_COOKIE, session.id, {
    maxAge: SIX_MONTHS_SECONDS,
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
  return session.id;
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
```

- [ ] **Step 2: Write the ranking cache**

Create `src/lib/ranking-cache.ts`:

```ts
import { fitRanking, type Ranking } from "./ranking";
import { allObservations } from "./votes";

// The fit takes milliseconds, so this exists to avoid refitting several times
// within one render rather than to make it affordable. Invalidated on write.
let cached: Ranking | null = null;

export async function getRanking(): Promise<Ranking> {
  if (cached) return cached;
  cached = fitRanking(await allObservations());
  return cached;
}

export function invalidateRanking(): void {
  cached = null;
}
```

- [ ] **Step 3: Write the failing question-service test**

Create `src/lib/question-service.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "./db";
import { mintQuestionToken, MIN_ANSWER_MS } from "./question-token";
import { applyVote, serveQuestion } from "./question-service";

const SECRET = process.env.QUESTION_TOKEN_SECRET as string;

async function freshSession(): Promise<string> {
  return (await prisma.session.create({ data: {} })).id;
}

/** Tokens younger than MIN_ANSWER_MS are rejected, so age them deliberately. */
function agedToken(sessionId: string, question: Awaited<ReturnType<typeof serveQuestion>>) {
  if (!question) throw new Error("expected a question");
  return mintQuestionToken(
    {
      pairKey: question.pairKey,
      template: question.template,
      firstShown: question.firstShown,
      sessionId,
      issuedAt: Date.now() - MIN_ANSWER_MS - 100,
    },
    { secret: SECRET },
  );
}

describe("question service", () => {
  beforeEach(async () => {
    await prisma.vote.deleteMany();
    await prisma.session.deleteMany();
  });

  it("serves a question with a token that verifies", async () => {
    const sessionId = await freshSession();
    const question = await serveQuestion(sessionId);
    expect(question).not.toBeNull();
    expect(question?.token).toContain(".");
    expect(question?.options).toHaveLength(2);
  });

  it("records a vote and returns the split", async () => {
    const sessionId = await freshSession();
    const question = await serveQuestion(sessionId);
    if (!question) throw new Error("expected a question");

    const result = await applyVote(
      sessionId,
      agedToken(sessionId, question),
      question.options[0].value,
    );

    expect(result.accepted).toBe(true);
    expect(result.split).not.toBeNull();
    const total = result.split?.reduce((sum, row) => sum + row.count, 0);
    expect(total).toBe(1);
    expect(result.next).not.toBeNull();
  });

  it("refuses a forged token but still serves the next question", async () => {
    const sessionId = await freshSession();
    const question = await serveQuestion(sessionId);
    if (!question) throw new Error("expected a question");

    const result = await applyVote(sessionId, "forged.token", question.options[0].value);

    expect(result.accepted).toBe(false);
    expect(result.next).not.toBeNull();
    expect(await prisma.vote.count()).toBe(0);
  });

  it("refuses an answer the template does not permit", async () => {
    const sessionId = await freshSession();
    const question = await serveQuestion(sessionId);
    if (!question) throw new Error("expected a question");

    const result = await applyVote(sessionId, agedToken(sessionId, question), "NONSENSE");

    expect(result.accepted).toBe(false);
    expect(await prisma.vote.count()).toBe(0);
  });

  it("refuses a replayed token", async () => {
    const sessionId = await freshSession();
    const question = await serveQuestion(sessionId);
    if (!question) throw new Error("expected a question");
    const token = agedToken(sessionId, question);

    await applyVote(sessionId, token, question.options[0].value);
    const replay = await applyVote(sessionId, token, question.options[0].value);

    expect(replay.accepted).toBe(false);
    expect(await prisma.vote.count()).toBe(1);
  });

  it("never serves a cell this session already answered", async () => {
    const sessionId = await freshSession();
    for (let i = 0; i < 12; i++) {
      const question = await serveQuestion(sessionId);
      if (!question) break;
      await applyVote(sessionId, agedToken(sessionId, question), question.options[0].value);
    }
    const rows = await prisma.vote.findMany({
      select: { pairKey: true, template: true, firstShown: true },
    });
    const keys = rows.map((r) => `${r.pairKey}|${r.template}|${r.firstShown}`);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
```

- [ ] **Step 4: Run it to verify it fails**

Run: `pnpm test src/lib/question-service.test.ts`
Expected: FAIL — `Failed to resolve import "./question-service"`

- [ ] **Step 5: Write the question service**

Create `src/lib/question-service.ts`:

```ts
import {
  type AnswerOption,
  answerOptions,
  interpretAnswer,
  type Letter,
  otherLetter,
  questionText,
  type Template,
} from "./alphabet";
import { mintQuestionToken, verifyQuestionToken } from "./question-token";
import { invalidateRanking } from "./ranking-cache";
import { selectQuestion } from "./select-question";
import {
  answeredCellKeys,
  cellVoteCounts,
  pairSplit,
  pairVoteCounts,
  recentVoteCount,
  recordVote,
} from "./votes";

export type ServedQuestion = {
  token: string;
  prompt: string;
  pairKey: string;
  template: Template;
  firstShown: Letter;
  options: [AnswerOption, AnswerOption];
};

export type SplitRow = { label: string; letter: Letter; count: number; share: number };

export type VoteResult = {
  accepted: boolean;
  split: SplitRow[] | null;
  chosen: Letter | null;
  next: ServedQuestion | null;
};

/** A session answering faster than this over a minute is not reading. */
const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT = 60;

export async function serveQuestion(
  sessionId: string,
): Promise<ServedQuestion | null> {
  const [pairCounts, cellCounts, answered] = await Promise.all([
    pairVoteCounts(),
    cellVoteCounts(),
    answeredCellKeys(sessionId),
  ]);

  const selected = selectQuestion(pairCounts, cellCounts, answered);
  if (!selected) return null;

  const second = otherLetter(selected.pairKey, selected.firstShown);
  return {
    token: mintQuestionToken({
      pairKey: selected.pairKey,
      template: selected.template,
      firstShown: selected.firstShown,
      sessionId,
      issuedAt: Date.now(),
    }),
    prompt: questionText(selected.template, selected.firstShown, second),
    pairKey: selected.pairKey,
    template: selected.template,
    firstShown: selected.firstShown,
    options: answerOptions(selected.template, selected.firstShown, second),
  };
}

async function splitFor(pair: string): Promise<SplitRow[]> {
  const counts = await pairSplit(pair);
  const total = [...counts.values()].reduce((sum, count) => sum + count, 0);
  return [...counts.entries()]
    .map(([letter, count]) => ({
      label: letter,
      letter,
      count,
      share: total === 0 ? 0 : count / total,
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Every rejection returns a fresh question rather than an error. The common
 * case is a tab left open overnight, and an attacker learns nothing from the
 * response either way.
 */
export async function applyVote(
  sessionId: string,
  token: string,
  answer: string,
): Promise<VoteResult> {
  const rejected = async (): Promise<VoteResult> => ({
    accepted: false,
    split: null,
    chosen: null,
    next: await serveQuestion(sessionId),
  });

  if ((await recentVoteCount(sessionId, RATE_WINDOW_MS)) >= RATE_LIMIT) {
    return rejected();
  }

  const verified = verifyQuestionToken(token, sessionId);
  if (!verified.ok) return rejected();

  const { pairKey, template, firstShown } = verified.payload;
  const second = otherLetter(pairKey, firstShown);

  let winner: Letter;
  try {
    winner = interpretAnswer(template, firstShown, second, answer);
  } catch {
    return rejected();
  }

  const stored = await recordVote({
    sessionId,
    pairKey,
    template,
    firstShown,
    answer,
    winner,
  });
  if (!stored) return rejected();

  invalidateRanking();

  return {
    accepted: true,
    split: await splitFor(pairKey),
    chosen: winner,
    next: await serveQuestion(sessionId),
  };
}
```

- [ ] **Step 6: Run it to verify it passes**

Run: `pnpm test src/lib/question-service.test.ts`
Expected: PASS — all six tests green.

- [ ] **Step 7: Write the Server Actions**

Create `src/app/actions.ts`:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { applyVote, type VoteResult } from "@/lib/question-service";
import { invalidateRanking } from "@/lib/ranking-cache";
import { clearSession, ensureSessionId, getSessionId } from "@/lib/session";
import { detachSessionVotes } from "@/lib/votes";

export async function submitVote(
  token: string,
  answer: string,
): Promise<VoteResult> {
  const sessionId = await ensureSessionId();
  return applyVote(sessionId, token, answer);
}

export async function forgetMe(): Promise<void> {
  const sessionId = await getSessionId();
  if (sessionId) await detachSessionVotes(sessionId);
  await clearSession();
  invalidateRanking();
  revalidatePath("/privacy");
}
```

- [ ] **Step 8: Run the whole suite, lint, and typecheck**

Run: `pnpm test && pnpm lint && pnpm exec tsc --noEmit`
Expected: every suite green, no errors.

- [ ] **Step 9: Commit**

```bash
git add src/lib/session.ts src/lib/ranking-cache.ts src/lib/question-service.ts src/lib/question-service.test.ts src/app/actions.ts
git commit -m "Wire question serving and voting behind Server Actions

Every rejection path returns a fresh question rather than an error: the common
case is a tab left open overnight, and a rejection that explained itself would
be a hint for anyone probing the endpoint.

The session cookie is created on the vote path only, so a visitor who reads
the rankings and leaves is never tagged."
```

---

### Task 7: The vote page

**Files:**
- Create: `src/components/question-card.tsx`
- Create: `src/components/reveal-ledger.tsx`
- Create: `src/components/vote-loop.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/lib/site.ts`

**Interfaces:**
- Consumes: `ServedQuestion`, `SplitRow`, `VoteResult`, `serveQuestion` from Task 6; `ensureSessionId` from Task 6.
- Produces: the `/` surface. No exports other tasks depend on.

- [ ] **Step 1: Fill in the site metadata**

Replace the contents of `src/lib/site.ts`:

```ts
/**
 * The facts the site asserts about itself, in one place — read by both the
 * rendered page and the `<head>` metadata, so the two cannot disagree.
 */

export const SITE_NAME = "Rank the ABCs";
export const SITE_HOST = "example.com";
export const SITE_URL = `https://${SITE_HOST}`;

export const SITE_DESCRIPTION =
  "Q is in a weird place in the alphabet. Rule on one pair of letters at a time, and watch a new alphabet get built out of everyone's answers.";
```

- [ ] **Step 2: Write the question card**

Create `src/components/question-card.tsx`:

```tsx
import type { AnswerOption } from "@/lib/alphabet";
import { cn } from "@/lib/utils";

export function QuestionCard({
  prompt,
  options,
  chosen,
  disabled,
  onAnswer,
}: {
  prompt: string;
  options: readonly [AnswerOption, AnswerOption];
  chosen: string | null;
  disabled: boolean;
  onAnswer: (value: string) => void;
}) {
  return (
    <div>
      <h1 className="mb-s5 max-w-lead text-balance font-title text-title">
        {prompt}
      </h1>
      <div className="flex border-border border-t">
        {options.map((option, index) => (
          <button
            key={option.value}
            type="button"
            disabled={disabled}
            onClick={() => onAnswer(option.value)}
            // The selected state is an inset hairline; the focus ring sits
            // outside the cell at an offset. Both are orange and they mean
            // different things, so the separation has to stay.
            className={cn(
              "flex-1 border-border border-b px-s2 py-s4 text-center font-name text-[2.25rem] leading-none transition-colors",
              index > 0 && "border-border border-l",
              chosen === option.value && "shadow-[inset_0_0_0_1px_var(--signal)]",
              !disabled && "hover:text-primary",
            )}
          >
            {option.label}
            <span className="mt-s2 block font-mono text-micro uppercase tracking-caps text-muted-foreground">
              press {index + 1}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Write the reveal ledger**

Create `src/components/reveal-ledger.tsx`:

```tsx
import type { SplitRow } from "@/lib/question-service";
import { cn } from "@/lib/utils";

export function RevealLedger({
  split,
  chosen,
}: {
  split: SplitRow[];
  chosen: string | null;
}) {
  return (
    <dl className="mt-s4 border-border border-t font-mono text-meta">
      {split.map((row) => {
        const mine = row.letter === chosen;
        return (
          <div
            key={row.letter}
            className={cn(
              "flex items-center justify-between border-border border-b py-s2",
              mine ? "text-foreground" : "text-muted-foreground",
            )}
          >
            <dt>
              {mine && (
                <span aria-hidden="true" className="mr-s1 text-signal">
                  &#9656;
                </span>
              )}
              {mine && <span className="sr-only">Your ruling: </span>}
              {row.label} first
            </dt>
            <dd>
              {Math.round(row.share * 100)}% &middot; {row.count}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
```

- [ ] **Step 4: Write the client interaction leaf**

Create `src/components/vote-loop.tsx`:

```tsx
"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { submitVote } from "@/app/actions";
import { QuestionCard } from "@/components/question-card";
import { RevealLedger } from "@/components/reveal-ledger";
import type { ServedQuestion, SplitRow } from "@/lib/question-service";

export function VoteLoop({
  initial,
  settledness,
}: {
  initial: ServedQuestion | null;
  settledness: number;
}) {
  const [question, setQuestion] = useState(initial);
  const [nextQuestion, setNextQuestion] = useState<ServedQuestion | null>(null);
  const [split, setSplit] = useState<SplitRow[] | null>(null);
  const [chosen, setChosen] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const answer = useCallback(
    (value: string) => {
      if (!question || split) return;
      setChosen(value);
      startTransition(async () => {
        const result = await submitVote(question.token, value);
        if (result.accepted) {
          setSplit(result.split);
          setNextQuestion(result.next);
          return;
        }
        // A rejected ruling is silent by design: the usual cause is a tab left
        // open past the token's life, and an explanation would only be a hint
        // to anyone probing. The next question simply replaces it.
        setChosen(null);
        setQuestion(result.next);
      });
    },
    [question, split],
  );

  const advance = useCallback(() => {
    setSplit(null);
    setChosen(null);
    setQuestion(nextQuestion);
    setNextQuestion(null);
  }, [nextQuestion]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (split) {
        if (event.key === " " || event.key === "Enter") {
          event.preventDefault();
          advance();
        }
        return;
      }
      if (!question) return;
      if (event.key === "1") answer(question.options[0].value);
      if (event.key === "2") answer(question.options[1].value);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [question, split, answer, advance]);

  if (!question) {
    return (
      <p className="max-w-lead text-pretty text-lead">
        You have ruled on every question there is. That is genuinely all of
        them. Go and look at what you did to the alphabet.
      </p>
    );
  }

  return (
    <div>
      <QuestionCard
        prompt={question.prompt}
        options={question.options}
        chosen={chosen}
        disabled={pending || split !== null}
        onAnswer={answer}
      />
      {split && (
        <>
          <RevealLedger split={split} chosen={chosen} />
          <button
            type="button"
            onClick={advance}
            className="group relative mt-s4 inline-flex min-h-11 items-center font-mono text-meta uppercase tracking-caps"
          >
            Next ruling &rarr;
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-3 h-px origin-left scale-x-0 bg-signal transition-transform duration-[var(--duration-hairline)] ease-rise group-hover:scale-x-100 group-focus-visible:scale-x-100"
            />
          </button>
        </>
      )}
      <SettledMeter settledness={settledness} />
    </div>
  );
}
```

- [ ] **Step 5: Write the progress meter**

Create `src/components/settled-meter.tsx`:

```tsx
/**
 * Progress is how settled the alphabet is, not how many votes have been cast.
 * A raw count reads as sad at realistic volumes and gives nobody a collective
 * goal; remaining uncertainty is a target everyone is pushing at together.
 */
export function SettledMeter({ settledness }: { settledness: number }) {
  const percent = Math.round(settledness * 100);

  return (
    <div className="mt-section border-border border-t pt-s3">
      <div
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="How settled the alphabet is"
        className="relative h-px w-full bg-border"
      >
        <span
          className="absolute inset-y-0 left-0 bg-foreground"
          style={{ width: `${percent}%` }}
        />
        <span
          aria-hidden="true"
          className="absolute -inset-y-1 w-px bg-signal"
          style={{ left: `${percent}%` }}
        />
      </div>
      <p className="mt-s2 font-mono text-meta uppercase tracking-caps text-muted-foreground">
        The alphabet is {percent}% settled
      </p>
    </div>
  );
}
```

Then add `import { SettledMeter } from "@/components/settled-meter";` to `src/components/vote-loop.tsx`.

- [ ] **Step 6: Write the page**

Replace `src/app/page.tsx`:

```tsx
import { SiteShell } from "@/components/site-shell";
import { VoteLoop } from "@/components/vote-loop";
import { serveQuestion } from "@/lib/question-service";
import { getRanking } from "@/lib/ranking-cache";
import { ensureSessionId } from "@/lib/session";

// Every visitor gets a different question, and the vote table changes under
// it constantly, so there is nothing here worth caching.
export const dynamic = "force-dynamic";

export default async function Home() {
  const sessionId = await ensureSessionId();
  const [question, ranking] = await Promise.all([
    serveQuestion(sessionId),
    getRanking(),
  ]);

  return (
    <SiteShell>
      <VoteLoop initial={question} settledness={ranking.settledness} />
    </SiteShell>
  );
}
```

- [ ] **Step 7: Verify it builds and runs**

Run: `pnpm exec tsc --noEmit && pnpm build`
Expected: type check clean, build succeeds.

Then run `pnpm dev`, open `http://localhost:3001`, and confirm by hand:
- a question renders with two cells and `press 1` / `press 2` hints
- clicking a cell shows the inset orange border and the ledger appears
- pressing `1` or `2` votes; pressing space advances
- "Next ruling" loads a different question
- tabbing to a cell shows the focus ring *outside* the cell, distinct from the selection border

- [ ] **Step 8: Commit**

```bash
git add src/app/page.tsx src/components/question-card.tsx src/components/reveal-ledger.tsx src/components/vote-loop.tsx src/lib/site.ts
git commit -m "Add the vote page

One layout carries all three templates: the yes/no framings put Yes and No in
the cells where the pick-a-letter framing puts letters, so nothing about the
page changes between them.

Advance is explicit. Auto-advancing would steal the reveal from anyone reading
slowly and would catch a mistimed click on the following question."
```

---

### Task 8: The rankings page

**Files:**
- Create: `src/components/ranking-row.tsx`
- Create: `src/app/rankings/page.tsx`
- Modify: `src/app/sitemap.ts`

**Interfaces:**
- Consumes: `getRanking` from Task 6; `Ranking`, `LetterScore` from Task 5.
- Produces: the `/rankings` surface.

- [ ] **Step 1: Write the ranking row**

Create `src/components/ranking-row.tsx`:

```tsx
import type { LetterScore } from "@/lib/ranking";

/**
 * The confidence band is the point of this page: it is the one view where the
 * model's actual claim, including how unsure it is, is visible rather than
 * implied by the ordering.
 */
export function RankingRow({
  entry,
  domain,
}: {
  entry: LetterScore;
  domain: { min: number; max: number };
}) {
  const span = domain.max - domain.min || 1;
  const toPercent = (value: number) =>
    ((value - domain.min) / span) * 100;

  const low = Math.max(0, toPercent(entry.score - 1.96 * entry.stderr));
  const high = Math.min(100, toPercent(entry.score + 1.96 * entry.stderr));

  return (
    <div className="flex items-center gap-s2 border-border border-b py-s2">
      <span className="w-6 text-right font-mono text-micro text-muted-foreground">
        {entry.position}
      </span>
      <span className="w-6 font-name text-[1.375rem] leading-none">
        {entry.letter}
      </span>
      <span className="relative h-2 flex-1">
        <span className="absolute inset-x-0 top-1 h-px bg-border" />
        <span
          className="absolute inset-y-0 bg-muted-foreground/25"
          style={{ left: `${low}%`, width: `${Math.max(high - low, 0.4)}%` }}
        />
        <span
          className="absolute -inset-y-0.5 w-px bg-signal"
          style={{ left: `${toPercent(entry.score)}%` }}
        />
      </span>
      <span className="w-14 text-right font-mono text-micro text-muted-foreground tabular-nums">
        {entry.score >= 0 ? "+" : ""}
        {entry.score.toFixed(2)}
      </span>
    </div>
  );
}
```

- [ ] **Step 2: Write the rankings page**

Create `src/app/rankings/page.tsx`:

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { RankingRow } from "@/components/ranking-row";
import { SiteShell } from "@/components/site-shell";
import { getRanking } from "@/lib/ranking-cache";
import { SITE_NAME } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `The alphabet so far — ${SITE_NAME}`,
  description:
    "The current community-sourced ordering of the alphabet, with the uncertainty behind every position.",
  alternates: { canonical: "/rankings" },
};

export default async function Rankings() {
  const ranking = await getRanking();

  if (ranking.placed.length === 0) {
    return (
      <SiteShell>
        <h1 className="mb-s3 text-balance font-name text-name">
          Nothing yet
        </h1>
        <p className="mb-s4 max-w-lead text-pretty text-lead">
          Not a single ruling has been cast, so there is no alphabet to show.
          Showing you the old one dressed up as a result would be a lie.
        </p>
        <Link href="/" className="font-mono text-meta uppercase tracking-caps underline underline-offset-4">
          Go and rule on something &rarr;
        </Link>
      </SiteShell>
    );
  }

  const scores = ranking.placed.map((entry) => entry.score);
  const errors = ranking.placed.map((entry) => 1.96 * entry.stderr);
  const domain = {
    min: Math.min(...scores.map((s, i) => s - errors[i])),
    max: Math.max(...scores.map((s, i) => s + errors[i])),
  };

  return (
    <SiteShell>
      <h1 className="mb-s3 text-balance font-name text-name">
        The alphabet so far
      </h1>
      <p className="mb-s5 max-w-lead text-pretty text-lead">
        Fitted from {ranking.observations} rulings. The grey band is how unsure
        the model is; where two bands overlap, those letters are not genuinely
        separated yet.
      </p>

      <div className="mb-s5 border-border border-t">
        {ranking.placed.map((entry) => (
          <RankingRow key={entry.letter} entry={entry} domain={domain} />
        ))}
      </div>

      {ranking.unplaced.length > 0 && (
        <section className="mb-s5">
          <h2 className="mb-s2 font-mono text-meta uppercase tracking-caps text-muted-foreground">
            Unplaced
          </h2>
          <p className="max-w-measure text-pretty">
            <span className="font-name text-title">
              {ranking.unplaced.join(" ")}
            </span>
            <br />
            No one has yet ruled on these against the rest, so they have no
            position. Inventing one would be making it up.
          </p>
        </section>
      )}

      <section>
        <h2 className="mb-s2 font-mono text-meta uppercase tracking-caps text-muted-foreground">
          Methodology
        </h2>
        <dl className="border-border border-t font-mono text-meta text-muted-foreground">
          {[
            ["Position bias", ranking.bias.position, "toward the first-named letter"],
            ["Acquiescence bias", ranking.bias.acquiescence, "toward yes on yes/no prompts"],
            ["Negation drag", ranking.bias.negation, "on “comes after” phrasings"],
          ].map(([label, value, note]) => (
            <div
              key={label as string}
              className="flex items-baseline justify-between gap-s2 border-border border-b py-s2"
            >
              <dt>{label}</dt>
              <dd className="text-right tabular-nums">
                {(value as number) >= 0 ? "+" : ""}
                {(value as number).toFixed(3)}
                <span className="ml-s1 hidden text-micro sm:inline">{note}</span>
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-s3 max-w-measure text-pretty text-muted-foreground">
          Scores above are adjusted for all three. Asking “should T come after
          V” and “which comes first, V or T” gets measurably different answers
          from the same people, so the phrasing of every question is recorded
          and its effect estimated alongside the letters themselves.
        </p>
      </section>
    </SiteShell>
  );
}
```

- [ ] **Step 3: Add the route to the sitemap**

Replace the return in `src/app/sitemap.ts`:

```ts
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    { url: SITE_URL, lastModified },
    { url: `${SITE_URL}/rankings`, lastModified },
    { url: `${SITE_URL}/privacy`, lastModified },
  ];
}
```

- [ ] **Step 4: Verify**

Run: `pnpm exec tsc --noEmit && pnpm lint && pnpm build`
Expected: clean.

Then with `pnpm dev`: visit `/rankings` before voting and confirm the empty state; cast a few votes at `/` and confirm rows, bands, unplaced letters, and the methodology figures render.

- [ ] **Step 5: Commit**

```bash
git add src/app/rankings src/components/ranking-row.tsx src/app/sitemap.ts
git commit -m "Add the rankings page

Reports unplaced letters rather than inventing positions for them: until the
comparison graph connects, a position for an unconnected letter would be
fabricated.

The empty state says there is no alphabet rather than showing the old one
dressed up as a result."
```

---

### Task 9: Privacy page and forget-me

**Files:**
- Create: `src/components/forget-me.tsx`
- Create: `src/app/privacy/page.tsx`
- Create: `src/components/site-footer.tsx`
- Modify: `src/app/page.tsx`, `src/app/rankings/page.tsx`

**Interfaces:**
- Consumes: `forgetMe` Server Action from Task 6.
- Produces: the `/privacy` surface and a shared footer.

- [ ] **Step 1: Write the forget-me control**

Create `src/components/forget-me.tsx`:

```tsx
"use client";

import { useState, useTransition } from "react";
import { forgetMe } from "@/app/actions";

export function ForgetMe() {
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  if (done) {
    return (
      <p className="font-mono text-meta uppercase tracking-caps text-muted-foreground">
        Done. Your rulings are still counted; nothing connects them to you.
      </p>
    );
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(async () => {
        await forgetMe();
        setDone(true);
      })}
      className="inline-flex min-h-11 items-center font-mono text-meta uppercase tracking-caps underline underline-offset-4 transition-colors hover:text-primary"
    >
      {pending ? "Forgetting…" : "Forget me"}
    </button>
  );
}
```

- [ ] **Step 2: Write the privacy page**

Create `src/app/privacy/page.tsx`:

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { ForgetMe } from "@/components/forget-me";
import { SiteShell } from "@/components/site-shell";
import { SITE_NAME } from "@/lib/site";

/**
 * Hardcoded, not `new Date()`. This tracks the last time the *policy* changed;
 * a value that ticked on every deploy would claim a revision that never
 * happened.
 */
const LAST_UPDATED = "5 August 2026";

export const metadata: Metadata = {
  title: `Privacy — ${SITE_NAME}`,
  description:
    "One cookie, doing one job: making sure you are not asked the same question twice. Nothing is sold, shared, or used to identify you.",
  alternates: { canonical: "/privacy" },
};

export default function Privacy() {
  return (
    <SiteShell>
      <h1 className="mb-s4 text-balance font-name text-name">Privacy</h1>

      <div className="max-w-measure space-y-s3 text-pretty">
        <p>
          When you cast your first ruling, this site sets one cookie: a random
          string with no meaning outside this database. It exists so you are
          not handed the same question twice, and so the same phrasing asked
          two different ways can be compared. That is the whole job.
        </p>
        <p>
          There is no account system, no login, no advertising, and no
          third-party scripts. Nothing you type is collected, because there is
          nothing to type. Nothing is sold or shared. The cookie is not used to
          profile you, target you, or personalise anything.
        </p>
        <p>
          Page views are counted through Vercel Web Analytics, which is
          cookieless and stores no persistent identifier. Your theme preference
          is kept in your own browser and never reaches the server.
        </p>
        <p>
          You can sever the link whenever you like. Your rulings stay — they
          were legitimately cast and belong to the result everyone is building
          — but nothing will connect them to you, and this browser starts over.
        </p>
      </div>

      <div className="mt-s4">
        <ForgetMe />
      </div>

      <p className="mt-s5 font-mono text-meta uppercase tracking-caps text-muted-foreground">
        Last updated {LAST_UPDATED}
      </p>

      <p className="mt-s4">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center font-mono text-meta uppercase tracking-caps underline underline-offset-4"
        >
          &larr; Back to the questions
        </Link>
      </p>
    </SiteShell>
  );
}
```

- [ ] **Step 3: Write the shared footer**

Create `src/components/site-footer.tsx`:

```tsx
import Link from "next/link";

const LINK =
  "inline-flex min-h-11 items-center underline underline-offset-4 transition-colors hover:text-foreground";

export function SiteFooter({ current }: { current: "vote" | "rankings" }) {
  return (
    <footer className="mt-section flex flex-wrap items-center gap-x-s2 border-border border-t pt-s3 font-mono text-meta uppercase tracking-caps text-muted-foreground">
      <Link href={current === "vote" ? "/rankings" : "/"} className={LINK}>
        {current === "vote" ? "The alphabet so far" : "Rule on something"}
      </Link>
      <span aria-hidden="true" className="text-border">
        &middot;
      </span>
      <Link href="/privacy" className={LINK}>
        Privacy
      </Link>
    </footer>
  );
}
```

The theme toggle joins this footer in Task 10, once it exists.

- [ ] **Step 4: Mount the footer on both surfaces**

In `src/app/page.tsx`, add `import { SiteFooter } from "@/components/site-footer";` and place `<SiteFooter current="vote" />` immediately after `<VoteLoop … />` inside `<SiteShell>`.

In `src/app/rankings/page.tsx`, add the same import and place `<SiteFooter current="rankings" />` as the last child of `<SiteShell>` in **both** the empty-state return and the main return.

- [ ] **Step 5: Verify**

Run: `pnpm exec tsc --noEmit && pnpm lint && pnpm build`
Expected: clean.

Then with `pnpm dev`: cast a vote, go to `/privacy`, press "Forget me", and confirm in the database that the session row is gone, the vote row survives with a null `sessionId`, and `/rankings` totals are unchanged:

```bash
pnpm exec prisma studio
```

- [ ] **Step 6: Commit**

```bash
git add src/app/privacy src/components/forget-me.tsx src/components/site-footer.tsx src/app/page.tsx src/app/rankings/page.tsx
git commit -m "Add the privacy notice and a working forget-me

The strictly-necessary exemption is what keeps a consent banner off this site,
and forget-me is the part of that argument that has to actually work.

It nulls the link rather than deleting the votes: they were legitimately cast
and belong to the crowd result, and severing the link is real anonymisation."
```

---

### Task 10: Dark mode

**Files:**
- Create: `src/components/theme-provider.tsx`
- Create: `src/components/theme-toggle.tsx`
- Modify: `src/app/layout.tsx`, `package.json`

**Interfaces:**
- Consumes: nothing.
- Produces: `ThemeProvider`, `ThemeToggle`.

- [ ] **Step 1: Install next-themes**

```bash
pnpm add next-themes
```

- [ ] **Step 2: Write the provider**

Create `src/components/theme-provider.tsx`:

```tsx
"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ReactNode } from "react";

/**
 * A thin client boundary so `layout.tsx` stays a Server Component. Children
 * are passed through as a slot rather than imported here, so everything below
 * still renders on the server.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
```

- [ ] **Step 3: Write the toggle**

Create `src/components/theme-toggle.tsx`:

```tsx
"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // The server cannot know the resolved theme, so the label is withheld until
  // after hydration rather than rendered wrong and corrected.
  useEffect(() => setMounted(true), []);

  return (
    <button
      type="button"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="inline-flex min-h-11 items-center underline underline-offset-4 transition-colors hover:text-foreground"
    >
      {mounted ? (resolvedTheme === "dark" ? "Light" : "Dark") : "Theme"}
    </button>
  );
}
```

- [ ] **Step 4: Add the toggle to the footer**

In `src/components/site-footer.tsx`, add `import { ThemeToggle } from "@/components/theme-toggle";` and append these two elements as the last children of the `<footer>`:

```tsx
      <span aria-hidden="true" className="text-border">
        &middot;
      </span>
      <ThemeToggle />
```

- [ ] **Step 5: Mount the provider**

In `src/app/layout.tsx`:

1. Add `import { ThemeProvider } from "@/components/theme-provider";`
2. Add `suppressHydrationWarning` to the `<html>` element — `next-themes` writes the class before paint, which would otherwise be flagged as a mismatch.
3. Wrap the body's children:

```tsx
    <html
      lang="en"
      suppressHydrationWarning
      className={`${newsreader.variable} ${plexMono.variable} h-full`}
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider>{children}</ThemeProvider>
        <Analytics />
      </body>
    </html>
```

- [ ] **Step 6: Verify**

Run: `pnpm exec tsc --noEmit && pnpm lint && pnpm build`
Expected: clean.

With `pnpm dev`, confirm on every page:
- the toggle flips light and dark with no flash on reload
- the choice survives a refresh
- in dark mode, orange is still only borders, markers and focus rings — never a fill
- the selection border and the focus ring are still distinguishable

- [ ] **Step 7: Commit**

```bash
git add package.json pnpm-lock.yaml src/components/theme-provider.tsx src/components/theme-toggle.tsx src/components/site-footer.tsx src/app/layout.tsx
git commit -m "Add a dark mode toggle

The .dark tokens have been accurate since the theme was written but nothing
applied them. The preference lives in localStorage, never reaches the server,
and is not an identifier, so it stays outside the consent analysis."
```

---

### Task 11: End-to-end verification and README

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Run everything**

```bash
pnpm test && pnpm lint && pnpm exec tsc --noEmit && pnpm build
```

Expected: all suites green, no lint or type errors, build succeeds with `/`, `/rankings`, `/privacy`, `/robots.txt`, `/sitemap.xml` in the route list.

- [ ] **Step 2: Walk the whole loop by hand**

With `pnpm dev` at `http://localhost:3001`:

1. Vote about twenty times, using the keyboard only.
2. Confirm no pair-and-phrasing is ever repeated.
3. Visit `/rankings`; confirm the ordering, the bands, unplaced letters, and non-zero methodology figures.
4. Open a second browser profile, vote there, confirm both sessions' votes land.
5. Press "Forget me" on `/privacy`; confirm `/rankings` totals do not drop.
6. Toggle dark mode on each page.

- [ ] **Step 3: Update the README's project description**

Replace the opening two lines of `README.md` with:

```markdown
# rank-the-abcs

Q is in a weird place in the alphabet. This site asks visitors to rule on one
pair of letters at a time and fits every ruling into a new, community-sourced
ordering.
```

Then replace the `src/lib/site.ts` line in the Layout block with:

```
src/lib/alphabet.ts  letters, pairs, templates — the shared vocabulary
src/lib/ranking.ts   Bradley-Terry fit: scores, error bars, bias terms
src/lib/site.ts      name, URL, description — page and metadata both read it
```

- [ ] **Step 4: Fill in the real host**

`SITE_HOST` in `src/lib/site.ts` is still `example.com`. Set it to the real domain before deploying — `metadataBase`, the canonical URLs, `robots.ts`, and `sitemap.ts` all read it.

- [ ] **Step 5: Commit**

```bash
git add README.md src/lib/site.ts
git commit -m "Describe the project in the README"
```

---

## Deferred, deliberately

- **IP rate limiting.** The spec calls for it alongside session rate limiting. Session limiting is implemented in Task 6; IP limiting needs state shared across serverless invocations (a table or Redis) and is not worth building before there is traffic to justify it. The signed token already prevents ballot enumeration, which is the attack that matters.
- **Ranking history over time.** A spec non-goal. Adding it later requires no change to the tables in Task 2.
