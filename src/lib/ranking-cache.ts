import { fitRanking, type Ranking } from "./ranking";
import { allObservations } from "./votes";

/**
 * The fit takes milliseconds, so this exists to avoid refitting several times
 * within one render rather than to make it affordable.
 *
 * It is invalidated on write, but only by writes this process saw. A second
 * instance recording a vote leaves this copy stale, so it also expires on a
 * timer — short enough that nobody sees a meaningfully old alphabet, long
 * enough that a burst of traffic still shares one fit.
 */
const TTL_MS = 15_000;

let cached: { ranking: Ranking; at: number } | null = null;

export async function getRanking(): Promise<Ranking> {
  if (cached && Date.now() - cached.at < TTL_MS) return cached.ranking;
  const ranking = fitRanking(await allObservations());
  cached = { ranking, at: Date.now() };
  return ranking;
}

export function invalidateRanking(): void {
  cached = null;
}
