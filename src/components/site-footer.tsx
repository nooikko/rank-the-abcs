import Link from "next/link";

const LINK =
  "inline-flex min-h-11 items-center underline underline-offset-4 transition-colors hover:text-foreground";

export function SiteFooter({
  current,
}: {
  current: "vote" | "rankings" | "privacy";
}) {
  return (
    <footer className="flex flex-wrap items-center gap-x-s2 font-mono text-meta uppercase tracking-caps text-muted-foreground">
      {current !== "vote" && (
        <Link href="/" className={LINK}>
          Rule on something
        </Link>
      )}
      {current !== "rankings" && (
        <Link href="/rankings" className={LINK}>
          The alphabet so far
        </Link>
      )}
      {current !== "privacy" && (
        <>
          <span aria-hidden="true" className="text-border">
            &middot;
          </span>
          <Link href="/privacy" className={LINK}>
            Privacy
          </Link>
        </>
      )}
    </footer>
  );
}
