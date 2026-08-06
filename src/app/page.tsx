import { SiteShell } from "@/components/site-shell";
import { SITE_NAME } from "@/lib/site";

export default function Home() {
  return (
    <SiteShell>
      <h1 className="text-balance font-name text-name">{SITE_NAME}</h1>
    </SiteShell>
  );
}
