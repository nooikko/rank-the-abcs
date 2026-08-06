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

/** A duplicate vote and a missing session are both expected, not exceptional. */
const UNIQUE_VIOLATION = "P2002";
const FOREIGN_KEY_VIOLATION = "P2003";

function hasCode(error: unknown, code: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === code
  );
}

export type RecordVoteResult = "stored" | "duplicate" | "no-session";

/**
 * The session row is not checked or created first. Almost every vote comes from
 * a session that already exists, so an upsert beforehand was a guaranteed round
 * trip to learn something the insert itself will tell us.
 */
export async function recordVote(
  input: RecordVoteInput,
): Promise<RecordVoteResult> {
  try {
    await prisma.vote.create({ data: input });
    return "stored";
  } catch (error) {
    if (hasCode(error, UNIQUE_VIOLATION)) return "duplicate";
    if (hasCode(error, FOREIGN_KEY_VIOLATION)) return "no-session";
    throw error;
  }
}

export type VoteCounts = {
  pairs: Map<string, number>;
  cells: Map<string, number>;
};

/**
 * Both count maps from one aggregation. Pair totals are the cell totals summed,
 * so asking the database for them separately was a second full scan and a
 * second network round trip for a number already in hand.
 */
export async function voteCounts(): Promise<VoteCounts> {
  const rows = await prisma.vote.groupBy({
    by: ["pairKey", "template", "firstShown"],
    _count: { _all: true },
  });

  const pairs = new Map<string, number>();
  const cells = new Map<string, number>();
  for (const row of rows) {
    const n = row._count._all;
    cells.set(cellKey(row.pairKey, row.template, row.firstShown as Letter), n);
    pairs.set(row.pairKey, (pairs.get(row.pairKey) ?? 0) + n);
  }
  return { pairs, cells };
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
    select: { pairKey: true, firstShown: true, template: true, winner: true },
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
