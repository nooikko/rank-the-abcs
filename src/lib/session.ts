import { cookies } from "next/headers";
import { prisma } from "./db";

export const SESSION_COOKIE = "rtabc_sid";
const SIX_MONTHS_SECONDS = 60 * 60 * 24 * 180;

export async function getSessionId(): Promise<string | null> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value ?? null;
}

/**
 * Creates the session row and cookie on demand. Called from the vote path
 * only — a visitor who reads the rankings and leaves is never tagged, which is
 * load-bearing for the strictly-necessary exemption the site relies on.
 */
export async function ensureSessionId(): Promise<string> {
  const existing = await getSessionId();
  if (existing) {
    const known = await prisma.session.findUnique({ where: { id: existing } });
    if (known) return existing;
  }

  const session = await prisma.session.create({ data: {} });
  const store = await cookies();
  store.set(SESSION_COOKIE, session.id, {
    maxAge: SIX_MONTHS_SECONDS,
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
  return session.id;
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
