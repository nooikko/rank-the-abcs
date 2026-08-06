import { Suspense } from "react";
import { SettledMeter } from "@/components/settled-meter";
import { SiteFooter } from "@/components/site-footer";
import { TopBar } from "@/components/top-bar";
import { VoteLoop } from "@/components/vote-loop";
import { SettledMeterSkeleton, VoteSkeleton } from "@/components/vote-skeleton";
import { pageMetadata } from "@/lib/metadata";
import { serveQuestion } from "@/lib/question-service";
import { getRanking } from "@/lib/ranking-cache";
import { getSessionId, newPendingSessionId } from "@/lib/session";

// Every visitor gets a different question, and the vote table changes under
// it constantly, so there is nothing here worth caching.
export const dynamic = "force-dynamic";

export const metadata = pageMetadata({
  title: "Rule on something",
  description:
    "Two letters, one question: which should come first. Answer as many as you like.",
  path: "/vote",
});

export default async function Vote() {
  // No cookie is written here. A visitor with none gets a pending id that is
  // sealed into the question token and only becomes real if they vote.
  const sessionId = (await getSessionId()) ?? newPendingSessionId();

  // Do not await these. The first database call of a request pays a connection
  // handshake (see db.ts), and awaiting spends it on a blank screen.
  const question = serveQuestion(sessionId);
  const settledness = getRanking().then((r) => r.settledness);

  // Not SiteShell: this page fills the viewport rather than sitting in a
  // column, so the question centres in the space and the meter pins to the
  // bottom edge. It is also far wider than the shell's reading measure —
  // nothing here is prose to be read at 62ch, it is two things to hit.
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[88rem] flex-col px-gutter py-s4">
      <TopBar current="vote" />

      <Suspense fallback={<VoteSkeleton />}>
        <VoteLoop initial={question} />
      </Suspense>

      <div>
        <Suspense fallback={<SettledMeterSkeleton />}>
          <SettledMeter settledness={settledness} />
        </Suspense>
        <SiteFooter current="vote" />
      </div>
    </main>
  );
}
