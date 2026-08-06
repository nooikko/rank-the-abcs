"use server";

import { revalidatePath } from "next/cache";
import { applyVote, type VoteResult } from "@/lib/question-service";
import { invalidateRanking } from "@/lib/ranking-cache";
import { clearSession, ensureSessionId, getSessionId } from "@/lib/session";
import { detachSessionVotes } from "@/lib/votes";

export async function submitVote(
  token: string,
  answer: string,
): Promise<VoteResult> {
  const sessionId = await ensureSessionId();
  return applyVote(sessionId, token, answer);
}

export async function forgetMe(): Promise<void> {
  const sessionId = await getSessionId();
  if (sessionId) await detachSessionVotes(sessionId);
  await clearSession();
  invalidateRanking();
  revalidatePath("/privacy");
}
