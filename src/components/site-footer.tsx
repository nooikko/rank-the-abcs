import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { PORTFOLIO_LABEL, PORTFOLIO_URL } from "@/lib/site";

const LINK =
  "inline-flex min-h-11 items-center underline underline-offset-4 transition-colors hover:text-foreground";

const Dot = () => (
  <span aria-hidden="true" className="text-border">
    &middot;
  </span>
);

export function SiteFooter({
  current,
}: {
  // "none" is for pages that are not one of the destinations — the 404 — where
  // every link is worth offering because none of them is where you already are.
  current: "home" | "vote" | "rankings" | "privacy" | "none";
}) {
  return (
    <footer className="flex flex-wrap items-center gap-x-s2 font-mono text-meta uppercase tracking-caps text-muted-foreground">
      {current !== "vote" && (
        <Link href="/vote" className={LINK}>
          Rule on something
        </Link>
      )}
      {current !== "rankings" && (
        <>
          {current !== "vote" && <Dot />}
          <Link href="/rankings" className={LINK}>
            The alphabet so far
          </Link>
        </>
      )}
      {current !== "privacy" && (
        <>
          <Dot />
          <Link href="/privacy" className={LINK}>
            Privacy
          </Link>
        </>
      )}
      <Dot />
      <ThemeToggle />
      <Dot />
      <a href={PORTFOLIO_URL} className={LINK}>
        {PORTFOLIO_LABEL}
      </a>
    </footer>
  );
}
