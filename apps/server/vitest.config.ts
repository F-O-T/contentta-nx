import { defineConfig } from "vitest/config";

export default defineConfig({
   test: {
      globals: true,
      environment: "node",
      include: ["**/__tests__/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts}"],
      exclude: ["node_modules", "dist", ".idea", ".git", ".cache"],
   },
});
