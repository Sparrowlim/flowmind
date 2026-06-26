import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // ADR-0002 §3 계층 별칭 (tsconfig.app.json paths와 동기화). ui 계층 = src/(Vite 기본, 별도 ui/ 없음)
  resolve: {
    alias: {
      "@core": fileURLToPath(new URL("./core", import.meta.url)),
      "@data": fileURLToPath(new URL("./data", import.meta.url)),
      "@ui": fileURLToPath(new URL("./src", import.meta.url)),
      "@platform": fileURLToPath(new URL("./platform", import.meta.url)),
    },
  },
});
