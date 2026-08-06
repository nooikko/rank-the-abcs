import { fitRanking, type Ranking } from "./ranking";
import { allObservations } from "./votes";

// The fit takes milliseconds, so this exists to avoid refitting several times
// within one render rather than to make it affordable. Invalidated on write.
let cached: Ranking | null = null;

export async function getRanking(): Promise<Ranking> {
  if (cached) return cached;
  cached = fitRanking(await allObservations());
  return cached;
}

export function invalidateRanking(): void {
  cached = null;
}
