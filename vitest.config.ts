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
  },
  resolve: {
    alias: { "@": new URL("./src", import.meta.url).pathname },
  },
});
