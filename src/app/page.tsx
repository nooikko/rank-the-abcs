import { VoteLoop } from "@/components/vote-loop";
import { serveQuestion } from "@/lib/question-service";
import { getRanking } from "@/lib/ranking-cache";
import { getSessionId, newPendingSessionId } from "@/lib/session";

// Every visitor gets a different question, and the vote table changes under
// it constantly, so there is nothing here worth caching.
export const dynamic = "force-dynamic";

export default async function Home() {
  // No cookie is written here. A visitor with none gets a pending id that is
  // sealed into the question token and only becomes real if they vote.
  const sessionId = (await getSessionId()) ?? newPendingSessionId();
  const [question, ranking] = await Promise.all([
    serveQuestion(sessionId),
    getRanking(),
  ]);

  // Not SiteShell: this page fills the viewport rather than sitting in a
  // column, so the question centres in the space and the meter pins to the
  // bottom edge. It is also far wider than the shell's reading measure —
  // nothing here is prose to be read at 62ch, it is two things to hit.
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[88rem] flex-col px-gutter py-s4">
      <VoteLoop initial={question} settledness={ranking.settledness} />
    </main>
  );
}
