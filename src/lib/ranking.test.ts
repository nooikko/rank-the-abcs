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
      ["A", 2.0],
      ["B", 1.0],
      ["C", 0.0],
      ["D", -1.0],
      ["E", -2.0],
    ]);
    const ranking = fitRanking(simulate(truth, 60, seeded(42)));
    expect(ranking.placed.map((entry) => entry.letter)).toEqual([
      "A",
      "B",
      "C",
      "D",
      "E",
    ]);
    expect(ranking.placed[0].position).toBe(1);
    expect(ranking.converged).toBe(true);
  });

  it("recovers a planted position bias without distorting the order", () => {
    const truth = new Map<Letter, number>([
      ["A", 1.5],
      ["B", 0.5],
      ["C", -0.5],
      ["D", -1.5],
    ]);
    const ranking = fitRanking(simulate(truth, 120, seeded(9), 0.8));
    expect(ranking.bias.position).toBeGreaterThan(0.4);
    expect(ranking.bias.position).toBeLessThan(1.2);
    expect(ranking.placed.map((entry) => entry.letter)).toEqual([
      "A",
      "B",
      "C",
      "D",
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
    const cycle: [Letter, Letter][] = [
      ["A", "B"],
      ["B", "C"],
      ["C", "A"],
    ];
    for (let i = 0; i < 30; i++) {
      for (const [first, second] of cycle) {
        observations.push({
          first,
          second,
          firstWon: true,
          isYesNo: false,
          isAfter: false,
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
      {
        first: "A",
        second: "B",
        firstWon: true,
        isYesNo: false,
        isAfter: false,
      },
      {
        first: "B",
        second: "C",
        firstWon: true,
        isYesNo: false,
        isAfter: false,
      },
      {
        first: "Y",
        second: "Z",
        firstWon: true,
        isYesNo: false,
        isAfter: false,
      },
    ];
    const ranking = fitRanking(observations);
    expect(ranking.placed.map((entry) => entry.letter).sort()).toEqual([
      "A",
      "B",
      "C",
    ]);
    expect(ranking.unplaced).toContain("Y");
    expect(ranking.unplaced).toContain("Z");
    expect(ranking.unplaced).toContain("M");
    expect(ranking.placed.length + ranking.unplaced.length).toBe(26);
  });

  it("reports wider uncertainty on thin evidence than on thick", () => {
    const truth = new Map<Letter, number>([
      ["A", 1],
      ["B", 0],
      ["C", -1],
    ]);
    const thin = fitRanking(simulate(truth, 2, seeded(4)));
    const thick = fitRanking(simulate(truth, 200, seeded(4)));
    const widest = (r: typeof thin) =>
      Math.max(...r.placed.map((entry) => entry.stderr));
    expect(widest(thin)).toBeGreaterThan(widest(thick));
  });

  it("centres scores so they are comparable across fits", () => {
    const truth = new Map<Letter, number>([
      ["A", 3],
      ["B", 2],
      ["C", 1],
    ]);
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
    const truth = new Map<Letter, number>([
      ["A", 1],
      ["B", 0],
      ["C", -1],
    ]);
    expect(fitRanking([]).settledness).toBe(0);

    const thin = fitRanking(simulate(truth, 2, seeded(4))).settledness;
    const thick = fitRanking(simulate(truth, 200, seeded(4))).settledness;

    expect(thin).toBeGreaterThan(0);
    expect(thick).toBeGreaterThan(thin);
    expect(thick).toBeLessThanOrEqual(1);
  });
});
