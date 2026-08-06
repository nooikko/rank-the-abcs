"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // The server cannot know the resolved theme, so the label is withheld until
  // after hydration rather than rendered wrong and then corrected.
  useEffect(() => setMounted(true), []);

  return (
    <button
      type="button"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="inline-flex min-h-11 items-center underline underline-offset-4 transition-colors hover:text-foreground"
    >
      {mounted ? (resolvedTheme === "dark" ? "Light" : "Dark") : "Theme"}
    </button>
  );
}
