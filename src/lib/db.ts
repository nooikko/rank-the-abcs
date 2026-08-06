import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

// Next's dev server re-evaluates modules on every hot reload, which would open
// a new pool each time and exhaust the database's connection limit.
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaWarm?: Promise<void>;
};

/**
 * A query on an existing connection costs about 45ms; opening a new one costs
 * about 250ms. Parallel queries are therefore only quick once the pool has
 * connections to hand them — fired at a cold pool, they are slower than the
 * same queries run in sequence.
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
 * Failures are swallowed because this also runs when the module is imported
 * during a build, where the database may be unreachable and nothing needs it.
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
