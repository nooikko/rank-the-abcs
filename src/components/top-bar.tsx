import Link from "next/link";
import { SITE_NAME } from "@/lib/site";

/**
 * `pr-s6` keeps the nav clear of the GitHub corner, which is fixed to the
 * viewport rather than laid out in flow and would otherwise sit on top of it.
 */
export function TopBar({ current }: { current: "vote" | "rankings" }) {
  return (
    <header className="flex items-baseline justify-between gap-s3 border-border border-b pr-s6 pb-s3 font-mono text-meta uppercase tracking-caps">
      <Link
        href="/"
        className="whitespace-nowrap text-foreground transition-colors"
      >
        {SITE_NAME}
      </Link>
      <Link
        href={current === "vote" ? "/rankings" : "/vote"}
        className="inline-flex min-h-11 items-center whitespace-nowrap text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
      >
        {current === "vote" ? "The alphabet so far" : "Rule on something"}
      </Link>
    </header>
  );
}
