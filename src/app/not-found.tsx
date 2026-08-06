import { ScatteredAlphabet } from "@/components/scattered-alphabet";
import { SiteFooter } from "@/components/site-footer";

/**
 * No `metadata` export: Next only supports one on the experimental
 * `global-not-found`, so this page inherits the layout's `title.default`. That
 * is fine — Next serves a 404 with `noindex`, so there is nothing here for a
 * descriptive title to help.
 *
 * Its presence is what removes Next's built-in 404 screen, which was rendering
 * a second `<title>` on top of the layout's.
 */
export default function NotFound() {
  return (
    <main className="relative flex min-h-dvh w-full flex-col items-center justify-center overflow-hidden px-gutter py-s6">
      <ScatteredAlphabet />

      <div className="relative flex flex-col items-center">
        <div className="max-w-lead text-center">
          <p className="mb-s3 font-mono text-meta uppercase tracking-eyebrow text-muted-foreground rise-on-load [animation-delay:40ms]">
            404
          </p>

          <h1 className="mb-s3 text-balance font-name text-name rise-on-load [animation-delay:100ms]">
            This page is not in the index.
          </h1>

          <p className="mb-s4 text-pretty text-lead rise-on-load [animation-delay:160ms]">
            Neither is Q, arguably, but it has a spot anyway. Yours does not.
          </p>
        </div>

        {/* Outside the measure: the links are a single row of short labels, and
            capping them at the reading width is what makes them wrap. */}
        <div className="flex justify-center">
          <SiteFooter current="none" />
        </div>
      </div>
    </main>
  );
}
