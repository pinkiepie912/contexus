import path from "path";

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { crx } from "@crxjs/vite-plugin";
import tailwindcss from "@tailwindcss/vite";

import manifest from "./src/manifest";

export default defineConfig({
  plugins: [tailwindcss(), react(), crx({ manifest })],
  build: {
    sourcemap: true,
    outDir: "dist"
  },
  server: { port: 5173 },
  base: "./", // Chrome Extension에서 상대 경로 사용
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "./src"),
    },
  },
});
