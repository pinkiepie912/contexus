import { defineManifest } from "@crxjs/vite-plugin";

export default defineManifest({
  manifest_version: 3,
  name: "My Chrome Extension",
  version: "0.0.1",
  action: { default_popup: "ui/popup/index.html" },
  options_page: "ui/options/index.html",
  background: { service_worker: "background/index.js", type: "module" },
  icons: {
    "16": "assets/icon16.png",
    "48": "assets/icon48.png",
    "128": "assets/icon128.png"
  },
  content_scripts: [
    {
      matches: ["https://*/*", "http://*/*"],
      js: ["content/index.js"],
      run_at: "document_idle"
    }
  ],
  permissions: [],
  host_permissions: []
});

