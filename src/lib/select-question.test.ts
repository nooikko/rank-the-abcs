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
    const result = selectQuestion(
      new Map(),
      NO_CELLS,
      NONE_ANSWERED,
      seeded(1),
    );
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
      const [a, b] = pair.split(":") as ["A", "B"];
      for (const template of TEMPLATES) {
        answered.add(cellKey(pair, template, a));
        answered.add(cellKey(pair, template, b));
      }
    }
    expect(selectQuestion(new Map(), NO_CELLS, answered, seeded(1))).toBeNull();
  });
});
