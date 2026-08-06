import {
  allPairKeys,
  cellKey,
  type Letter,
  parsePairKey,
  TEMPLATES,
  type Template,
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
    (cell) =>
      !answeredCells.has(cellKey(chosen, cell.template, cell.firstShown)),
  );
  let lowest = Number.POSITIVE_INFINITY;
  let tied: SelectedQuestion[] = [];
  for (const cell of open) {
    const count =
      cellCounts.get(cellKey(chosen, cell.template, cell.firstShown)) ?? 0;
    if (count < lowest) {
      lowest = count;
      tied = [cell];
    } else if (count === lowest) {
      tied.push(cell);
    }
  }
  return tied[Math.floor(rng() * tied.length)] ?? null;
}
