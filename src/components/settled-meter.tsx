/**
 * Progress is how settled the alphabet is, not how many votes have been cast.
 * A raw count reads as sad at realistic volumes and gives nobody a collective
 * goal; remaining uncertainty is a target everyone is pushing at together.
 */
export function SettledMeter({ settledness }: { settledness: number }) {
  const percent = Math.round(settledness * 100);

  return (
    <div className="mb-s3 border-border border-t pt-s3">
      <div
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="How settled the alphabet is"
        className="relative h-px w-full bg-border"
      >
        <span
          className="absolute inset-y-0 left-0 bg-foreground"
          style={{ width: `${percent}%` }}
        />
        <span
          aria-hidden="true"
          className="-inset-y-1 absolute w-px bg-signal"
          style={{ left: `${percent}%` }}
        />
      </div>
      <p className="mt-s2 font-mono text-meta uppercase tracking-caps text-muted-foreground">
        The alphabet is {percent}% settled
      </p>
    </div>
  );
}
