import { defineConfig } from "vitest/config";

export default defineConfig({
  base: "./",
  build: {
    outDir: "dist",
    sourcemap: true,
    rollupOptions: {
      input: {
        tv: "index.html",
        programschema: "programschema/index.html",
      },
    },
  },
  test: {
    include: ["tests/**/*.test.ts", "tests/**/*.test.mjs"],
  },
});
