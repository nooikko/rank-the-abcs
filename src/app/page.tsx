import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteShell } from "@/components/site-shell";
import { getRanking } from "@/lib/ranking-cache";

// The settled figure comes from the vote table, which moves constantly.
export const dynamic = "force-dynamic";

export default async function Home() {
  const ranking = await getRanking();
  const settled = Math.round(ranking.settledness * 100);

  return (
    <SiteShell>
      <p className="mb-s3 font-mono text-meta uppercase tracking-eyebrow text-muted-foreground rise-on-load [animation-delay:40ms]">
        A referendum on the alphabet
      </p>

      <h1 className="mb-s3 max-w-[16ch] text-balance font-name text-name rise-on-load [animation-delay:100ms]">
        Q is in a weird place in the alphabet.
      </h1>

      <p className="mb-s3 max-w-lead text-pretty text-lead rise-on-load [animation-delay:160ms]">
        A friend said that out loud once, and I have not been able to put it
        down since. Because look at it. What is it doing there.
      </p>

      <p className="mb-s4 max-w-measure text-pretty">
        Nobody chose this order &mdash; it arrived through Phoenician traders
        and a few Roman decisions, then stopped changing. So here is a second
        opinion. Two letters, one question: which comes first. Enough small
        answers, from enough people, and a whole new alphabet falls out of them.
        It will be worse than the real one. That is not the point.
      </p>

      <p className="mb-s3">
        <Link
          href="/vote"
          className="group relative inline-flex min-h-11 items-center font-title text-title"
        >
          Rule on something &rarr;
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-1 h-px origin-left scale-x-0 bg-signal transition-transform duration-[var(--duration-hairline)] ease-rise group-hover:scale-x-100 group-focus-visible:scale-x-100"
          />
        </Link>
      </p>

      <p className="mb-s6 font-mono text-meta uppercase tracking-caps text-muted-foreground">
        {ranking.observations === 0
          ? "No rulings yet. Yours would be the first."
          : `${ranking.observations.toLocaleString("en-US")} rulings so far · the alphabet is ${settled}% settled`}
      </p>

      <SiteFooter current="home" />
    </SiteShell>
  );
}
