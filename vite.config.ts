import { defineConfig } from "vite";
import { crx } from "@crxjs/vite-plugin";
import manifest from "./src/manifest";
import react from "@vitejs/plugin-react"

export default defineConfig({
  plugins: [react(), crx({ manifest })],
  build: { sourcemap: true, outDir: "dist" },
  server: { port: 5173 }
});
