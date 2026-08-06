import { getRanking } from "@/lib/ranking-cache";

const LINE =
  "font-mono text-meta uppercase tracking-caps text-muted-foreground";

export async function VoteTally() {
  const ranking = await getRanking();
  const settled = Math.round(ranking.settledness * 100);

  return (
    <p className={LINE}>
      {ranking.observations === 0
        ? "No rulings yet. Yours would be the first."
        : `${ranking.observations.toLocaleString("en-US")} rulings so far · the alphabet is ${settled}% settled`}
    </p>
  );
}

export function VoteTallySkeleton() {
  return (
    <p className={LINE} aria-hidden="true">
      <span className="inline-block h-[1em] w-64 max-w-full animate-pulse rounded-sm bg-muted align-middle" />
    </p>
  );
}
