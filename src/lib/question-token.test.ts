import { describe, expect, it } from "vitest";
import {
  MIN_ANSWER_MS,
  mintQuestionToken,
  type QuestionPayload,
  TOKEN_TTL_MS,
  verifyQuestionToken,
} from "./question-token";

const SECRET = "test-secret-value";
const OTHER_SECRET = "a-different-secret";

const payload: QuestionPayload = {
  pairKey: "E:Q",
  template: "WHICH_FIRST",
  firstShown: "Q",
  sessionId: "session-1",
  issuedAt: 1_000_000,
};

const readable = { secret: SECRET, now: 1_000_000 + MIN_ANSWER_MS + 500 };

describe("question tokens", () => {
  it("round-trips a valid token", () => {
    const token = mintQuestionToken(payload, { secret: SECRET });
    expect(verifyQuestionToken(token, "session-1", readable)).toEqual({
      ok: true,
      payload,
    });
  });

  it("rejects a forged signature", () => {
    const token = mintQuestionToken(payload, { secret: OTHER_SECRET });
    expect(verifyQuestionToken(token, "session-1", readable)).toEqual({
      ok: false,
      reason: "bad-signature",
    });
  });

  it("rejects a tampered payload", () => {
    const token = mintQuestionToken(payload, { secret: SECRET });
    const [body, signature] = token.split(".");
    const forged = Buffer.from(
      JSON.stringify({ ...payload, firstShown: "E" }),
      "utf8",
    ).toString("base64url");
    expect(forged).not.toBe(body);
    expect(
      verifyQuestionToken(`${forged}.${signature}`, "session-1", readable),
    ).toEqual({ ok: false, reason: "bad-signature" });
  });

  it("rejects a token past its TTL", () => {
    const token = mintQuestionToken(payload, { secret: SECRET });
    expect(
      verifyQuestionToken(token, "session-1", {
        secret: SECRET,
        now: payload.issuedAt + TOKEN_TTL_MS + 1,
      }),
    ).toEqual({ ok: false, reason: "expired" });
  });

  it("rejects an answer returned implausibly fast", () => {
    const token = mintQuestionToken(payload, { secret: SECRET });
    expect(
      verifyQuestionToken(token, "session-1", {
        secret: SECRET,
        now: payload.issuedAt + MIN_ANSWER_MS - 1,
      }),
    ).toEqual({ ok: false, reason: "too-fast" });
  });

  it("rejects a token minted for another session", () => {
    const token = mintQuestionToken(payload, { secret: SECRET });
    expect(verifyQuestionToken(token, "session-2", readable)).toEqual({
      ok: false,
      reason: "session-mismatch",
    });
  });

  it("adopts the token's session when the visitor has none yet", () => {
    const token = mintQuestionToken(payload, { secret: SECRET });
    const result = verifyQuestionToken(token, null, readable);
    expect(result).toEqual({ ok: true, payload });
  });

  it("still enforces the signature when adopting a session", () => {
    const token = mintQuestionToken(payload, { secret: OTHER_SECRET });
    expect(verifyQuestionToken(token, null, readable)).toEqual({
      ok: false,
      reason: "bad-signature",
    });
  });

  it("rejects structurally broken input without throwing", () => {
    for (const bad of ["", "nodot", "a.b.c", "!!!.???"]) {
      expect(verifyQuestionToken(bad, "session-1", readable).ok).toBe(false);
    }
  });
});
