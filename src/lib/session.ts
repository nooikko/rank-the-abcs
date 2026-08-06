import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "./db";

export const SESSION_COOKIE = "rtabc_sid";
const SIX_MONTHS_SECONDS = 60 * 60 * 24 * 180;

export async function getSessionId(): Promise<string | null> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value ?? null;
}

/**
 * An id for a visitor who has not voted yet. It is minted during the page
 * render and sealed into the question token, but no row and no cookie exist
 * until a vote actually arrives.
 *
 * Next only permits writing cookies from a Server Action or Route Handler, and
 * that restriction happens to enforce exactly what the privacy notice
 * promises: someone who reads and leaves is never tagged.
 */
export function newPendingSessionId(): string {
  return randomUUID();
}

/**
 * Materialises the session the token was issued against. The id came from a
 * signed token, so it is the server's own value rather than anything the
 * client chose.
 */
export async function persistSession(id: string): Promise<void> {
  await prisma.session.upsert({
    where: { id },
    update: {},
    create: { id },
  });
}

export async function setSessionCookie(id: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, id, {
    maxAge: SIX_MONTHS_SECONDS,
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
