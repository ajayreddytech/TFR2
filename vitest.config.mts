import { defineConfig } from "vitest/config";
import path from "node:path";

// Mirrors the "@/*" -> "./src/*" path alias from tsconfig.json so tests can import app modules the same way the app does.
export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(process.cwd(), "src") },
  },
  test: {
    include: ["tests/**/*.test.{ts,tsx}"],
    setupFiles: ["tests/setup.ts"],
    // Node is the default. Component and store tests opt into jsdom with a "@vitest-environment jsdom" comment at the top of the file.
    environment: "node",
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      reporter: ["text", "html"],
      reportsDirectory: "coverage",
      // Floors set just below the current level, so coverage can't drop unnoticed. Raise them as tests improve.
      thresholds: { statements: 55, branches: 42, functions: 50, lines: 60 },
    },
  },
});
