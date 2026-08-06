import type { Metadata } from "next";
import { ForgetMe } from "@/components/forget-me";
import { SiteFooter } from "@/components/site-footer";
import { SiteShell } from "@/components/site-shell";
import { SITE_NAME } from "@/lib/site";

/**
 * Hardcoded, not `new Date()`. This tracks the last time the *policy* changed;
 * a value that ticked on every deploy would claim a revision that never
 * happened. Change it only when the wording below changes.
 */
const LAST_UPDATED = "5 August 2026";

export const metadata: Metadata = {
  title: `Privacy — ${SITE_NAME}`,
  description:
    "One cookie, doing one job: making sure you are not asked the same question twice. Nothing is sold, shared, or used to identify you.",
  alternates: { canonical: "/privacy" },
};

export default function Privacy() {
  return (
    <SiteShell>
      <h1 className="mb-s4 text-balance font-name text-name">Privacy</h1>

      <div className="max-w-measure space-y-s3 text-pretty">
        <p>
          When you cast your first ruling, this site sets one cookie: a random
          string that means nothing outside this database. It exists so you are
          not handed the same question twice, and so the same comparison asked
          two different ways can be told apart. That is the whole job.
        </p>
        <p>
          Nothing is set before you vote. If you read the rankings and leave,
          you were never tagged at all.
        </p>
        <p>
          There is no account system, no login, no advertising, and no
          third-party scripts. Nothing you type is collected, because there is
          nothing to type. Nothing is sold or shared. The cookie is never used
          to profile you, target you, or personalise anything.
        </p>
        <p>
          Page views are counted through Vercel Web Analytics, which is
          cookieless and keeps no persistent identifier. Your light or dark
          preference is kept in your own browser and never reaches the server.
        </p>
        <p>
          You can sever the link whenever you like. Your rulings stay — they
          were legitimately cast and belong to the thing everyone is building —
          but nothing will connect them to you, and this browser starts over.
        </p>
      </div>

      <div className="mt-s4">
        <ForgetMe />
      </div>

      <p className="mt-s5 mb-s5 font-mono text-meta uppercase tracking-caps text-muted-foreground">
        Last updated {LAST_UPDATED}
      </p>

      <SiteFooter current="privacy" />
    </SiteShell>
  );
}
