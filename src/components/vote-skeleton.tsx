/**
 * Sizes are duplicated from question-card.tsx on purpose and have to stay in
 * step with it: if they drift, the page resizes under the reader as the real
 * question arrives.
 */
export function VoteSkeleton() {
  return (
    <div className="flex flex-1 flex-col pt-s4" aria-hidden="true">
      <div className="mb-s4 h-[1.1em] w-[min(100%,22ch)] animate-pulse rounded-sm bg-muted text-name" />
      <div className="flex min-h-[13rem] flex-1 border-border border-t border-b sm:min-h-[16rem]">
        <div className="flex-1" />
        <div className="flex-1 border-border border-l" />
      </div>
      <div className="min-h-40 sm:min-h-42" />
    </div>
  );
}

export function SettledMeterSkeleton() {
  return (
    <div className="mb-s3 border-border border-t pt-s3" aria-hidden="true">
      <div className="h-px w-full bg-border" />
      <div className="mt-s2 h-[1em] w-56 animate-pulse rounded-sm bg-muted text-meta" />
    </div>
  );
}
