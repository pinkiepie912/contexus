import { defineConfig } from "vite";
import { crx } from "@crxjs/vite-plugin";
import manifest from "./src/manifest";

export default defineConfig({
  plugins: [crx({ manifest })],
  build: { sourcemap: true, outDir: "dist" },
  server: { port: 5173 }
});
