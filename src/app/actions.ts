"use server";

import { revalidatePath } from "next/cache";
import { applyVote, type VoteResult } from "@/lib/question-service";
import { invalidateRanking } from "@/lib/ranking-cache";
import {
  clearSession,
  getSessionId,
  persistSession,
  setSessionCookie,
} from "@/lib/session";
import { detachSessionVotes } from "@/lib/votes";

export async function submitVote(
  token: string,
  answer: string,
): Promise<VoteResult> {
  const cookieSessionId = await getSessionId();
  const result = await applyVote(
    cookieSessionId,
    token,
    answer,
    persistSession,
  );

  // First vote: the session was adopted from the signed token, so the cookie
  // is written now rather than during the render that served the question.
  if (
    result.accepted &&
    result.sessionId &&
    result.sessionId !== cookieSessionId
  ) {
    await setSessionCookie(result.sessionId);
  }

  return result;
}

export async function forgetMe(): Promise<void> {
  const sessionId = await getSessionId();
  if (sessionId) await detachSessionVotes(sessionId);
  await clearSession();
  invalidateRanking();
  revalidatePath("/");
  revalidatePath("/vote");
  revalidatePath("/privacy");
}
