import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.{ts,tsx}"],
    setupFiles: ["tests/setup.ts"],
    coverage: {
      provider: "v8",
      include: ["src/lib/**/*.ts", "src/components/**/*.tsx", "src/hooks/**/*.ts", "src/app/api/**/*.ts"],
      exclude: ["src/**/*.d.ts"],
      reporter: ["text-summary", "text", "json-summary"],
      thresholds: { lines: 80, functions: 80, statements: 80, branches: 70 },
    },
  },
});
