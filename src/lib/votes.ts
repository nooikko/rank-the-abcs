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

/** Postgres unique-violation. A duplicate is expected, not exceptional. */
const UNIQUE_VIOLATION = "P2002";

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === UNIQUE_VIOLATION
  );
}

/** Returns false when this session already ruled on this cell. */
export async function recordVote(input: RecordVoteInput): Promise<boolean> {
  try {
    await prisma.vote.create({ data: input });
    return true;
  } catch (error) {
    if (isUniqueViolation(error)) return false;
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
