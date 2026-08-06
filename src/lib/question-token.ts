import { createHmac, timingSafeEqual } from "node:crypto";
import type { Letter, Template } from "./alphabet";

export type QuestionPayload = {
  pairKey: string;
  template: Template;
  firstShown: Letter;
  sessionId: string;
  issuedAt: number;
};

export type VerifyFailure =
  | "malformed"
  | "bad-signature"
  | "expired"
  | "too-fast"
  | "session-mismatch";

export type VerifyResult =
  | { ok: true; payload: QuestionPayload }
  | { ok: false; reason: VerifyFailure };

/** Minutes, not hours: a served question is answered now or not at all. */
export const TOKEN_TTL_MS = 10 * 60 * 1000;

/**
 * A token minted this recently and already returned was not read by a person.
 * Cheap, and it catches naive automation without inconveniencing anyone.
 */
export const MIN_ANSWER_MS = 400;

function secretOrThrow(override?: string): string {
  const secret = override ?? process.env.QUESTION_TOKEN_SECRET;
  if (!secret) throw new Error("QUESTION_TOKEN_SECRET is not set");
  return secret;
}

function sign(body: string, secret: string): string {
  return createHmac("sha256", secret).update(body).digest("base64url");
}

export function mintQuestionToken(
  payload: QuestionPayload,
  opts: { secret?: string } = {},
): string {
  const secret = secretOrThrow(opts.secret);
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString(
    "base64url",
  );
  return `${body}.${sign(body, secret)}`;
}

export function verifyQuestionToken(
  token: string,
  sessionId: string,
  opts: { secret?: string; now?: number } = {},
): VerifyResult {
  const secret = secretOrThrow(opts.secret);
  const now = opts.now ?? Date.now();

  const parts = token.split(".");
  if (parts.length !== 2) return { ok: false, reason: "malformed" };
  const [body, signature] = parts;

  // Compared through timingSafeEqual, which throws on a length mismatch, so
  // the lengths are checked first rather than letting it raise.
  const expected = Buffer.from(sign(body, secret), "utf8");
  const provided = Buffer.from(signature, "utf8");
  if (
    expected.length !== provided.length ||
    !timingSafeEqual(expected, provided)
  ) {
    return { ok: false, reason: "bad-signature" };
  }

  let payload: QuestionPayload;
  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    return { ok: false, reason: "malformed" };
  }

  const age = now - payload.issuedAt;
  if (age > TOKEN_TTL_MS) return { ok: false, reason: "expired" };
  if (age < MIN_ANSWER_MS) return { ok: false, reason: "too-fast" };
  if (payload.sessionId !== sessionId) {
    return { ok: false, reason: "session-mismatch" };
  }

  return { ok: true, payload };
}
