import type { Metadata } from "next";
import Link from "next/link";
import { RankingRow } from "@/components/ranking-row";
import { SiteFooter } from "@/components/site-footer";
import { SiteShell } from "@/components/site-shell";
import { getRanking } from "@/lib/ranking-cache";
import { SITE_NAME } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `The alphabet so far — ${SITE_NAME}`,
  description:
    "The current community-sourced ordering of the alphabet, with the uncertainty behind every position.",
  alternates: { canonical: "/rankings" },
};

const BIAS_ROWS = [
  {
    label: "Position bias",
    key: "position",
    note: "toward the first-named letter",
  },
  {
    label: "Acquiescence bias",
    key: "acquiescence",
    note: "toward yes on yes/no prompts",
  },
  {
    label: "Negation drag",
    key: "negation",
    note: "on “comes after” phrasings",
  },
] as const;

export default async function Rankings() {
  const ranking = await getRanking();

  if (ranking.placed.length === 0) {
    return (
      <SiteShell>
        <h1 className="mb-s3 text-balance font-name text-name">Nothing yet</h1>
        <p className="mb-s5 max-w-lead text-pretty text-lead">
          Not one ruling has been cast, so there is no alphabet to show. Putting
          the old one here dressed up as a result would be a lie.
        </p>
        <SiteFooter current="rankings" />
      </SiteShell>
    );
  }

  const bounds = ranking.placed.flatMap((entry) => [
    entry.score - 1.96 * entry.stderr,
    entry.score + 1.96 * entry.stderr,
  ]);
  const domain = { min: Math.min(...bounds), max: Math.max(...bounds) };

  return (
    <SiteShell wide>
      <h1 className="mb-s3 text-balance font-name text-name">
        The alphabet so far
      </h1>
      <p className="mb-s5 max-w-lead text-pretty text-lead">
        Fitted from {ranking.observations.toLocaleString("en-US")}{" "}
        {ranking.observations === 1 ? "ruling" : "rulings"}. The grey band is
        how unsure the model is; where two bands overlap, those letters are not
        genuinely separated yet.
      </p>

      <div className="mb-s6 border-border border-t">
        {ranking.placed.map((entry) => (
          <RankingRow key={entry.letter} entry={entry} domain={domain} />
        ))}
      </div>

      {ranking.unplaced.length > 0 && (
        <section className="mb-s6">
          <h2 className="mb-s2 font-mono text-meta uppercase tracking-caps text-muted-foreground">
            Unplaced
          </h2>
          <p className="mb-s2 font-name text-title">
            {ranking.unplaced.join(" ")}
          </p>
          <p className="max-w-measure text-pretty text-muted-foreground">
            Nobody has yet ruled on these against the rest, so they have no
            position. Inventing one would be making it up.
          </p>
        </section>
      )}

      <section className="mb-s6">
        <h2 className="mb-s2 font-mono text-meta uppercase tracking-caps text-muted-foreground">
          Methodology
        </h2>
        <dl className="border-border border-t font-mono text-meta text-muted-foreground">
          {BIAS_ROWS.map((row) => {
            const value = ranking.bias[row.key];
            return (
              <div
                key={row.key}
                className="flex items-baseline justify-between gap-s2 border-border border-b py-s2"
              >
                <dt>{row.label}</dt>
                <dd className="text-right">
                  <span className="tabular-nums">
                    {value >= 0 ? "+" : "−"}
                    {Math.abs(value).toFixed(3)}
                  </span>
                  <span className="ml-s2 hidden text-micro sm:inline">
                    {row.note}
                  </span>
                </dd>
              </div>
            );
          })}
        </dl>
        <p className="mt-s3 max-w-measure text-pretty text-muted-foreground">
          The scores above are adjusted for all three. Asking &ldquo;should T
          come after V&rdquo; and &ldquo;which comes first, V or T&rdquo; gets
          measurably different answers out of the same people, so the phrasing
          of every question is recorded and its effect estimated alongside the
          letters themselves.
        </p>
      </section>

      <p className="mb-s5">
        <Link
          href="/"
          className="group relative inline-flex min-h-11 items-center font-mono text-meta uppercase tracking-caps"
        >
          Rule on something &rarr;
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-3 h-px origin-left scale-x-0 bg-signal transition-transform duration-[var(--duration-hairline)] ease-rise group-hover:scale-x-100 group-focus-visible:scale-x-100"
          />
        </Link>
      </p>

      <SiteFooter current="rankings" />
    </SiteShell>
  );
}
