// Next loads .env automatically; Vitest does not, and the repository tests
// talk to the real database.
import "dotenv/config";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
    // The repository tests truncate shared tables, so they cannot safely run
    // beside each other.
    fileParallelism: false,
    // They also talk to a hosted database rather than a local one, so a loop
    // of a dozen votes is a hundred network round trips. The default 5s is a
    // statement about latency, not about the code.
    testTimeout: 30_000,
  },
  resolve: {
    alias: { "@": new URL("./src", import.meta.url).pathname },
  },
});
