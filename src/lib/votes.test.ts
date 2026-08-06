import { afterAll, beforeEach, describe, expect, it } from "vitest";
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

  // Cleaning up only before each test leaves the last test's rows behind, and
  // this suite points at the same database the site reads.
  afterAll(async () => {
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
      sessionId,
      pairKey: "E:Q",
      template: "WHICH_FIRST",
      firstShown: "Q",
      answer: "Q",
      winner: "Q",
    });
    await recordVote({
      sessionId,
      pairKey: "E:Q",
      template: "SHOULD_BEFORE",
      firstShown: "Q",
      answer: "YES",
      winner: "Q",
    });
    expect((await pairVoteCounts()).get("E:Q")).toBe(2);
    expect((await cellVoteCounts()).get("E:Q|WHICH_FIRST|Q")).toBe(1);
  });

  it("lists the cells a session has already answered", async () => {
    const sessionId = await freshSession();
    await recordVote({
      sessionId,
      pairKey: "E:Q",
      template: "WHICH_FIRST",
      firstShown: "Q",
      answer: "Q",
      winner: "Q",
    });
    const answered = await answeredCellKeys(sessionId);
    expect(answered.has("E:Q|WHICH_FIRST|Q")).toBe(true);
    expect(answered.has("E:Q|WHICH_FIRST|E")).toBe(false);
  });

  it("reports the split for a pair", async () => {
    const a = await freshSession();
    const b = await freshSession();
    const c = await freshSession();
    for (const [sessionId, winner] of [
      [a, "Q"],
      [b, "Q"],
      [c, "E"],
    ] as const) {
      await recordVote({
        sessionId,
        pairKey: "E:Q",
        template: "WHICH_FIRST",
        firstShown: "Q",
        answer: winner,
        winner,
      });
    }
    const split = await pairSplit("E:Q");
    expect(split.get("Q")).toBe(2);
    expect(split.get("E")).toBe(1);
  });

  it("detaches a session's votes without deleting them", async () => {
    const sessionId = await freshSession();
    await recordVote({
      sessionId,
      pairKey: "E:Q",
      template: "WHICH_FIRST",
      firstShown: "Q",
      answer: "Q",
      winner: "Q",
    });

    await detachSessionVotes(sessionId);

    expect(await prisma.session.count()).toBe(0);
    expect(await prisma.vote.count()).toBe(1);
    expect((await pairVoteCounts()).get("E:Q")).toBe(1);
    expect(await allObservations()).toHaveLength(1);
  });

  it("turns stored votes into fit observations", async () => {
    const sessionId = await freshSession();
    await recordVote({
      sessionId,
      pairKey: "E:Q",
      template: "SHOULD_AFTER",
      firstShown: "Q",
      answer: "YES",
      winner: "E",
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
