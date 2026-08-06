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

  for (
    let iteration = 0;
    iteration < MAX_ITERATIONS && !converged;
    iteration++
  ) {
    const gradient = new Float64Array(PARAMS);
    information = new Float64Array(PARAMS * PARAMS);

    for (const observation of relevant) {
      const f = index.get(observation.first) as number;
      const s = index.get(observation.second) as number;

      // Design row is sparse: +1 on the first letter, -1 on the second, and
      // the bias indicators. gamma is always on because the model predicts
      // "the first-shown letter wins".
      const terms: [number, number][] = [
        [f, 1],
        [s, -1],
        [GAMMA, 1],
      ];
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
      for (let b = 0; b < PARAMS; b++) {
        step += covariance[a * PARAMS + b] * gradient[b];
      }
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
