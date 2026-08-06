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

export type SplitRow = {
  label: string;
  letter: Letter;
  count: number;
  share: number;
};

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
 * case is a tab left open past the token's life, and an attacker learns
 * nothing from the response either way.
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
