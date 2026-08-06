import { Suspense } from "react";
import { RankingsBody, RankingsSkeleton } from "@/components/rankings-body";
import { SiteFooter } from "@/components/site-footer";
import { SiteShell } from "@/components/site-shell";
import { TopBar } from "@/components/top-bar";
import { pageMetadata } from "@/lib/metadata";

export const dynamic = "force-dynamic";

export const metadata = pageMetadata({
  title: "The alphabet so far",
  description:
    "The current community-sourced ordering of the alphabet, with the uncertainty behind every position.",
  path: "/rankings",
});

export default function Rankings() {
  return (
    <SiteShell wide>
      <TopBar current="rankings" />
      <Suspense fallback={<RankingsSkeleton />}>
        <RankingsBody />
      </Suspense>
      <SiteFooter current="rankings" />
    </SiteShell>
  );
}
