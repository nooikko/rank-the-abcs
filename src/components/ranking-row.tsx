import type { LetterScore } from "@/lib/ranking";

/**
 * The confidence band is the point of this page: it is the one view where the
 * model's actual claim, including how unsure it is, is visible rather than
 * implied by the ordering.
 */
export function RankingRow({
  entry,
  domain,
}: {
  entry: LetterScore;
  domain: { min: number; max: number };
}) {
  const span = domain.max - domain.min || 1;
  const toPercent = (value: number) => ((value - domain.min) / span) * 100;

  const low = Math.max(0, toPercent(entry.score - 1.96 * entry.stderr));
  const high = Math.min(100, toPercent(entry.score + 1.96 * entry.stderr));

  return (
    <div className="flex items-center gap-s2 border-border border-b py-s2">
      <span className="w-7 text-right font-mono text-micro text-muted-foreground tabular-nums">
        {entry.position}
      </span>
      <span className="w-7 font-name text-title leading-none">
        {entry.letter}
      </span>
      <span className="relative h-3 flex-1">
        <span className="absolute inset-x-0 top-1/2 h-px bg-border" />
        <span
          className="absolute inset-y-0 bg-muted-foreground/20"
          style={{ left: `${low}%`, width: `${Math.max(high - low, 0.3)}%` }}
        />
        <span
          className="absolute inset-y-0 w-px bg-signal"
          style={{ left: `${toPercent(entry.score)}%` }}
        />
      </span>
      <span className="w-16 text-right font-mono text-micro text-muted-foreground tabular-nums">
        {entry.score >= 0 ? "+" : "−"}
        {Math.abs(entry.score).toFixed(2)}
      </span>
    </div>
  );
}
