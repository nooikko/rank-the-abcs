import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

// Next's dev server re-evaluates modules on every hot reload, which would open
// a new pool each time and exhaust the database's connection limit.
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaWarm?: Promise<void>;
};

/**
 * Opening a connection to the hosted database costs roughly 250ms — TLS plus
 * the Postgres handshake — against about 45ms for a query on a connection that
 * already exists. That made `Promise.all` a trap: two queries fired together on
 * a single-connection pool spent a quarter of a second opening the second one,
 * and ran slower than the same two queries in sequence.
 *
 * Measured on the vote path: 305ms cold against 47ms warm.
 */
const POOL_SIZE = 5;
const WARM_CONNECTIONS = 3;

function createClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set");
  // Prisma 7 requires a driver adapter; the connection string lives here
  // rather than in the schema.
  return new PrismaClient({
    adapter: new PrismaPg({
      connectionString,
      max: POOL_SIZE,
      // Long enough to outlive the gap between one visitor's votes, so a
      // steady trickle of traffic never pays the handshake twice.
      idleTimeoutMillis: 60_000,
    }),
  });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/**
 * Opens several connections up front so the first visitor does not pay for
 * them. Fire-and-forget, and deliberately swallowing failures: this also runs
 * when the module is imported during a build, where the database may be
 * unreachable and where nothing needs it anyway.
 */
export function warmPool(): Promise<void> {
  globalForPrisma.prismaWarm ??= Promise.all(
    Array.from({ length: WARM_CONNECTIONS }, () =>
      prisma.$queryRawUnsafe("select 1"),
    ),
  )
    .then(() => undefined)
    .catch(() => undefined);
  return globalForPrisma.prismaWarm;
}

void warmPool();
