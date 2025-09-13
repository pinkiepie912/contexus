**Contexus**

- Transform one-off LLM chats into a lasting personal knowledge base. Contexus captures context from conversations, lets you reapply it through reusable roles (personas), and helps you generate higher‑quality results across your workflows.

**Why Contexus**

- End context loss after chat sessions; keep what matters.
- Turn transient ideas into searchable, reusable knowledge.
- Explore topics from multiple expert perspectives, on demand.

**Core Features**

- Phase 1 — The Tool
  - Intelligent Context Snippets: Save selected parts of a conversation (your prompt + AI answer) with one click; auto‑tagging and one‑line summaries for fast recall; searchable personal library by tag, keyword, and date.
  - Dynamic Role Switching: Continue a conversation from any snippet by applying preset personas with one click (e.g., Analyst/Critic, Summarizer, Creative Ideator, Code Reviewer). Fully customizable roles you can define and save.
  - Workflow Integration: Desktop app and browser extension entry points; clipboard integration to save copied text or paste snippets elsewhere instantly.
- Phase 2 — The Platform
  - Team Spaces & Shared Libraries: Share and co‑edit snippets and role templates; project libraries to accumulate team knowledge.
  - Template Marketplace: Share or sell “context + role” templates (e.g., interview prep snippet + pressure interviewer role; blog draft + SEO expert role).
  - API & Integrations: Access Contexus from Notion, Slack, Jira, VS Code, and more without leaving your tools.
- Phase 3 — Intelligence Layer
  - Proactive Context Suggestions: Surface relevant snippets automatically based on your current task (e.g., suggest a prior auth snippet while coding).
  - Hyper‑Personalized AI: Fine‑tuned models on your long‑term library to reflect your tone, domain expertise, and reasoning style.

**Target Audience**

- Initially: Developers, writers/planners, researchers/students.
- Later: Teams/enterprises and all knowledge workers.

**Business Model**

- B2C/B2B subscriptions, marketplace fees, API usage.

**Long‑Term Roadmap**

- Phase 1 (Years 1–3): Best‑in‑class personal productivity tool.
- Phase 2 (Years 4–6): Collaboration and sharing platform.
- Phase 3 (Years 7–10+): Predictive, suggestion‑driven intelligent agent.

**Competitive Advantage**

- Early: Frictionless, intuitive UX.
- Mid: Integration ecosystem and marketplace network effects.
- Long: Unique “personal thinking process” data and hyper‑personalized models.

**Project Status**

- This repository currently scaffolds a Chromium extension using Vite and CRXJS. It provides a background service worker, a popup UI, and a content script as a starting point for Phase 1 features.

**Tech Stack**

- Vite + TypeScript
- CRXJS (`@crxjs/vite-plugin`) for Manifest V3
- Playwright + Vitest (configured in dev dependencies)

**Getting Started**

- Prerequisites
  - `pnpm` (project uses `pnpm@10.x`)
  - Node.js 18+ recommended
- Install
  - `pnpm install`
- Build
  - `pnpm vite build`
  - Output is generated in `dist/`
- Load in Chrome (Unpacked)
  - Open `chrome://extensions`.
  - Enable Developer mode.
  - Click “Load unpacked” and select the `dist/` folder.

**Project Structure**

- `src/manifest.ts` — Extension Manifest V3 via CRXJS.
- `src/background/index.ts` — Service worker entry.
- `src/content/index.ts` — Content script injected into pages.
- `src/ui/popup/index.html` and `src/ui/popup/main.ts` — Popup UI.
- `vite.config.ts` — Vite + CRXJS config (outputs to `dist/`).

Note: `manifest.ts` references `ui/options/index.html`, but the repo currently includes an empty `src/ui/options/index.html`. Rename/create `src/ui/options/index.html` to enable the options page.

**Development Tips**

- Add convenient scripts to `package.json` (optional):
  - `"dev": "vite"` to run the CRXJS dev server.
  - `"build": "vite build"` to bundle for distribution.
- While CRXJS supports HMR‑like flows, Chrome sometimes requires a manual reload of the extension after builds.

**Contributing**

- Issues and PRs are welcome. Focus areas for early contributions:
  - Implementing Context Snippets (capture + library + tagging/summary).
  - Role templates and one‑click role switching.
  - Options page UX for managing snippets, tags, and personas.
  - Integrations and clipboard workflows.

**License**

- ISC (see `package.json`).

