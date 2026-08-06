import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * The page is one column at every breakpoint — no grid, no sidebar.
 *
 * `wide` is for pages whose content is a table rather than prose: the reading
 * measure exists to keep sentences short, and it only cramps a row of figures.
 * Prose inside a wide shell still caps itself with `max-w-lead` or
 * `max-w-measure`.
 */
export function SiteShell({
  children,
  wide = false,
}: {
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <main
      className={cn(
        "mx-auto w-full px-gutter pt-shell-top pb-s6",
        wide ? "max-w-5xl" : "max-w-shell",
      )}
    >
      {children}
    </main>
  );
}
