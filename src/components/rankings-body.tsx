import { JsonLd } from "@/components/json-ld";
import { RankingRow } from "@/components/ranking-row";
import { LETTERS } from "@/lib/alphabet";
import { getRanking } from "@/lib/ranking-cache";
import { rankingStructuredData } from "@/lib/structured-data";

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

const HEADING = "mt-s5 mb-s3 text-balance font-name text-name";
const SECTION_LABEL =
  "mb-s2 font-mono text-meta uppercase tracking-caps text-muted-foreground";

export async function RankingsBody() {
  const ranking = await getRanking();

  if (ranking.placed.length === 0) {
    return (
      <>
        <h1 className={HEADING}>Nothing yet</h1>
        <p className="mb-s5 max-w-lead text-pretty text-lead">
          Not one ruling has been cast, so there is no alphabet to show. Putting
          the old one here dressed up as a result would be a lie.
        </p>
      </>
    );
  }

  const bounds = ranking.placed.flatMap((entry) => [
    entry.score - 1.96 * entry.stderr,
    entry.score + 1.96 * entry.stderr,
  ]);
  const domain = { min: Math.min(...bounds), max: Math.max(...bounds) };

  return (
    <>
      <JsonLd data={rankingStructuredData(ranking.placed)} />
      <h1 className={HEADING}>The alphabet so far</h1>
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
          <h2 className={SECTION_LABEL}>Unplaced</h2>
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
        <h2 className={SECTION_LABEL}>Methodology</h2>
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
      </section>
    </>
  );
}

export function RankingsSkeleton() {
  return (
    <div aria-hidden="true">
      <div className={HEADING}>
        <span className="inline-block h-[0.9em] w-[14ch] max-w-full animate-pulse rounded-sm bg-muted align-middle" />
      </div>
      <div className="mb-s5 h-[1em] w-full max-w-lead animate-pulse rounded-sm bg-muted text-lead" />
      <div className="mb-s6 border-border border-t">
        {LETTERS.map((letter) => (
          <div
            key={letter}
            className="flex items-center gap-s2 border-border border-b py-s2"
          >
            <span className="w-7" />
            <span className="w-7 font-name text-title leading-none opacity-20">
              {letter}
            </span>
            <span className="relative h-3 flex-1">
              <span className="absolute inset-x-0 top-1/2 h-px bg-border" />
            </span>
            <span className="w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
