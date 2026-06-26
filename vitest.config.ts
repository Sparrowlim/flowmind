import { defineConfig } from "vitest/config";
import { fileURLToPath, URL } from "node:url";

// core/는 IO·DOM 의존 0(core/README.md) — node 환경으로 충분, jsdom 불필요.
export default defineConfig({
  resolve: {
    alias: {
      "@core": fileURLToPath(new URL("./core", import.meta.url)),
      "@data": fileURLToPath(new URL("./data", import.meta.url)),
      "@ui": fileURLToPath(new URL("./src", import.meta.url)),
      "@platform": fileURLToPath(new URL("./platform", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["core/**/*.test.ts", "data/**/*.test.ts"],
  },
});
