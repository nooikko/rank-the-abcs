"use client";

import { useState, useTransition } from "react";
import { forgetMe } from "@/app/actions";

export function ForgetMe() {
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  if (done) {
    return (
      <p className="font-mono text-meta uppercase tracking-caps text-muted-foreground">
        Done. Your rulings still count; nothing connects them to you.
      </p>
    );
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await forgetMe();
          setDone(true);
        })
      }
      className="group relative inline-flex min-h-11 items-center font-mono text-meta uppercase tracking-caps"
    >
      {pending ? "Forgetting…" : "Forget me"}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-3 h-px origin-left bg-signal transition-transform duration-(--duration-hairline) ease-rise group-hover:scale-x-100 group-focus-visible:scale-x-100"
      />
    </button>
  );
}
