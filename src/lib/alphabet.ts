export const LETTERS = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
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
  const firstWins = (answer === "YES") === yesMeansFirst;
  return firstWins ? first : second;
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
