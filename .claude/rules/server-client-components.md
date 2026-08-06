---
paths:
  - "src/**/*.tsx"
  - "src/**/*.ts"
---

# Server vs Client Components (App Router)

Server Components are the **default**. A file needs no directive to be one.
Reach for `"use client"` only when something on this list forces it:

- State or event handlers — `useState`, `onClick`, `onChange`
- Lifecycle effects — `useEffect`, `useLayoutEffect`
- Browser-only APIs — `window`, `localStorage`, `navigator`
- Custom hooks that depend on any of the above
- Class components

Keep work on the server when you can, to fetch data close to the source, use
secrets without exposing them, and ship less JavaScript.

## `"use client"` is a boundary, not a label

Once a file is marked `"use client"`, **everything it imports and every
component it directly renders joins the client bundle.** You therefore do not
repeat the directive in child components — and you must not hoist it upward.

- **Never** put `"use client"` at the top of `layout.tsx` or `page.tsx` to make
  an error go away. That drags the whole subtree into the browser bundle.
- **Do** push the directive down to the smallest interactive leaf.

If a mostly-static page needs one interactive button, the button is the Client
Component — not the page.

## Keep server content server-rendered inside client components

Passing a Server Component as `children` (or any prop) to a Client Component
keeps it on the server. Importing it *into* the client file does not.

```tsx
// ✅ layout.tsx stays a Server Component
<ClientProvider>
  <ServerOnlyContent />   {/* rendered on the server, passed through as a slot */}
</ClientProvider>
```

```tsx
// ❌ inside a "use client" file — ServerOnlyContent is now client code
import { ServerOnlyContent } from "./server-only-content"
```

Wrap context providers in a thin `"use client"` component and render it in a
server layout with `children` passed through.

## Data fetching

Fetch in Server Components with `async`/`await` directly. Don't add a
`useEffect` + `fetch` pair in a client component for data the server can render.

Fire independent requests concurrently with `Promise.all` — sequential `await`s
create request waterfalls.

Mutations go through Server Actions (`"use server"`), not hand-rolled route
handlers, unless an external caller needs the endpoint.

## Async request APIs

`params`, `searchParams`, `cookies()`, `headers()`, and `draftMode()` are all
**asynchronous**. Type and await them:

```tsx
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  // ...
}
```

## Never leak secrets

Server-only values must not be imported into a `"use client"` module. Only
`NEXT_PUBLIC_*` env vars reach the browser. Guard genuinely sensitive modules
with the `server-only` package.

## Related skills

For deeper performance work — waterfalls, bundle size, memoization — invoke the
`vercel-react-best-practices` skill. For component API design, use
`vercel-composition-patterns`. Detailed, version-accurate reference docs for the
installed Next.js version live in `node_modules/next/dist/docs/`.
