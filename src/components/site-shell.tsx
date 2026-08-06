import type { ReactNode } from "react";

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-shell px-gutter pt-shell-top pb-s6">
      {children}
    </main>
  );
}
