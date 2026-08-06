import type { SplitRow } from "@/lib/question-service";
import { cn } from "@/lib/utils";

export function RevealLedger({
  split,
  chosen,
}: {
  split: SplitRow[];
  chosen: string | null;
}) {
  return (
    <dl className="mt-s4 border-border border-t font-mono text-meta">
      {split.map((row) => {
        const mine = row.letter === chosen;
        return (
          <div
            key={row.letter}
            className={cn(
              "flex items-center justify-between border-border border-b py-s2",
              mine ? "text-foreground" : "text-muted-foreground",
            )}
          >
            <dt>
              {mine && (
                <span aria-hidden="true" className="mr-s1 text-signal">
                  &#9656;
                </span>
              )}
              {mine && <span className="sr-only">Your ruling: </span>}
              {row.label} first
            </dt>
            <dd className="tabular-nums">
              {Math.round(row.share * 100)}% &middot; {row.count}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
