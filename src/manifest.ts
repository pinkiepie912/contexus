import { defineManifest } from "@crxjs/vite-plugin";

export default defineManifest({
  manifest_version: 3,
  name: "Contexus",
  version: "0.0.1",

  action: { default_popup: "src/ui/popup/index.html" },
  side_panel: { default_path: "src/sidepanel/index.html" },
  options_page: "src/ui/options/index.html",
  background: { service_worker: "src/background/index.ts", type: "module" },

  icons: {
    // "16": "assets/icon16.png",
    // "48": "assets/icon48.png",
    // "128": "assets/icon128.png"
  },
  content_scripts: [
    {
      matches: [
        "https://chat.openai.com/*",
        "https://chatgpt.com/*",
        "https://gemini.google.com/*",
        "https://claude.ai/*",
      ],
      js: ["src/content/index.ts"],
      run_at: "document_idle",
    },
  ],
  permissions: [
    'sidePanel',
    'storage',
    'notifications',
  ],
  host_permissions: [],
});
