import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "./db";
import {
  applyVote,
  type ServedQuestion,
  serveQuestion,
} from "./question-service";
import { MIN_ANSWER_MS, mintQuestionToken } from "./question-token";
import { newPendingSessionId, persistSession } from "./session";

async function freshSession(): Promise<string> {
  return (await prisma.session.create({ data: {} })).id;
}

/** Tokens younger than MIN_ANSWER_MS are rejected, so age them deliberately. */
function agedToken(sessionId: string, question: ServedQuestion): string {
  return mintQuestionToken({
    pairKey: question.pairKey,
    template: question.template,
    firstShown: question.firstShown,
    sessionId,
    issuedAt: Date.now() - MIN_ANSWER_MS - 100,
  });
}

function required(question: ServedQuestion | null): ServedQuestion {
  if (!question) throw new Error("expected a question");
  return question;
}

describe("question service", () => {
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

  it("serves a question with a token and two options", async () => {
    const sessionId = await freshSession();
    const question = required(await serveQuestion(sessionId));
    expect(question.token).toContain(".");
    expect(question.options).toHaveLength(2);
    expect(question.prompt.length).toBeGreaterThan(0);
  });

  it("records a vote and returns the split", async () => {
    const sessionId = await freshSession();
    const question = required(await serveQuestion(sessionId));

    const result = await applyVote(
      sessionId,
      agedToken(sessionId, question),
      question.options[0].value,
      persistSession,
    );

    expect(result.accepted).toBe(true);
    expect(result.split).not.toBeNull();
    expect(result.split?.reduce((sum, row) => sum + row.count, 0)).toBe(1);
    expect(result.next).not.toBeNull();
  });

  it("refuses a forged token but still serves the next question", async () => {
    const sessionId = await freshSession();
    const question = required(await serveQuestion(sessionId));

    const result = await applyVote(
      sessionId,
      "forged.token",
      question.options[0].value,
      persistSession,
    );

    expect(result.accepted).toBe(false);
    expect(result.next).not.toBeNull();
    expect(await prisma.vote.count()).toBe(0);
  });

  it("refuses an answer the template does not permit", async () => {
    const sessionId = await freshSession();
    const question = required(await serveQuestion(sessionId));

    const result = await applyVote(
      sessionId,
      agedToken(sessionId, question),
      "NONSENSE",
      persistSession,
    );

    expect(result.accepted).toBe(false);
    expect(await prisma.vote.count()).toBe(0);
  });

  it("refuses a replayed token", async () => {
    const sessionId = await freshSession();
    const question = required(await serveQuestion(sessionId));
    const token = agedToken(sessionId, question);

    await applyVote(
      sessionId,
      token,
      question.options[0].value,
      persistSession,
    );
    const replay = await applyVote(
      sessionId,
      token,
      question.options[0].value,
      persistSession,
    );

    expect(replay.accepted).toBe(false);
    expect(await prisma.vote.count()).toBe(1);
  });

  it("adopts the token's session on a first vote, creating no row before it", async () => {
    const pending = newPendingSessionId();
    const question = required(await serveQuestion(pending));

    // Nothing exists yet: serving a question must not tag anyone.
    expect(await prisma.session.count()).toBe(0);

    const result = await applyVote(
      null,
      agedToken(pending, question),
      question.options[0].value,
      persistSession,
    );

    expect(result.accepted).toBe(true);
    expect(result.sessionId).toBe(pending);
    expect(await prisma.session.count()).toBe(1);
    expect(await prisma.vote.count()).toBe(1);
  });

  it("refuses a token belonging to a different session than the cookie", async () => {
    const mine = await freshSession();
    const theirs = newPendingSessionId();
    const question = required(await serveQuestion(theirs));

    const result = await applyVote(
      mine,
      agedToken(theirs, question),
      question.options[0].value,
      persistSession,
    );

    expect(result.accepted).toBe(false);
    expect(await prisma.vote.count()).toBe(0);
  });

  it("never serves a cell this session already answered", async () => {
    const sessionId = await freshSession();
    for (let i = 0; i < 12; i++) {
      const question = await serveQuestion(sessionId);
      if (!question) break;
      await applyVote(
        sessionId,
        agedToken(sessionId, question),
        question.options[0].value,
        persistSession,
      );
    }
    const rows = await prisma.vote.findMany({
      select: { pairKey: true, template: true, firstShown: true },
    });
    const keys = rows.map(
      (row) => `${row.pairKey}|${row.template}|${row.firstShown}`,
    );
    expect(keys).toHaveLength(12);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
