# Repository Guidelines

## Project Structure & Module Organization
- Source: `src/` — key areas: `background/` (service worker), `content/` (content script, consolidated under `ContentManager`), `ui/popup/`, `ui/options/`, `sidepanel/`, `components/ui/`, `lib/`, `styles/`, `types.ts`, `manifest.ts`.
- Platform adapters: `src/adapters/` provides ChatGPT, Gemini, and Claude adapters plus `adapterUtils`.
- Build output: `dist/` (load as unpacked extension in Chrome).
- Path alias: `~/` → `src/` (e.g., `import { cn } from "~/lib/utils"`).
- Suggested tests: colocate as `__tests__/` or `*.test.ts(x)` under `src/`.

## Build, Test, and Development Commands
- Install: `pnpm install`.
- Dev server: `pnpm dev` (Vite + CRXJS; reload extension as needed).
- Build: `pnpm build` (TypeScript + Vite → `dist/`).
- Lint: `pnpm lint` (ESLint with TS rules).
- Preview: `pnpm preview` (serves built assets).
- Tests: none yet. When added, run `pnpm vitest` (unit) and `pnpm vitest --coverage`.

## Architecture Overview
- Manifest V3 defined in `src/manifest.ts` using CRXJS.
- Background service worker: `src/background/index.ts` handles lifecycle and messaging.
- Content script entry: `src/content/index.ts` creating a singleton `ContentManager`.
- Consolidated content manager: `src/content/ContentManager.ts` unifies detection, processing, and UI rendering.
- UI:
  - Popup: `src/ui/popup/`
  - Side Panel: `src/sidepanel/` (React app mounted from `index.html` → `main.tsx`)
  - Options Page: `src/ui/options/`

## Technology Stack
- Build: Vite + `@crxjs/vite-plugin` (MV3).
- Frontend: React 19 + TypeScript.
- Styling: Tailwind CSS 4.1.
- State: Zustand.
- Database: Dexie (IndexedDB wrapper).
- Testing: Vitest + Playwright (deps present; tests not yet implemented).

## Coding Style & Naming Conventions
- Language: TypeScript, React 19, Tailwind CSS.
- Formatting: Prettier (`semi: true`, `singleQuote: false`, `trailingComma: all`, 2‑space indent). Run via editor integration.
- Linting: ESLint (TS + import rules). Keep `import/order` groups separated with a newline.
- Files: use lowercase for files/dirs (`src/components/ui/button.tsx`); components named in PascalCase; functions/vars in camelCase.
- Utilities: prefer `cn(...)` from `~/lib/utils` for class merging.

### Code Architecture Rules
1. Consolidated content script: keep functionality in `ContentManager` with direct method calls (no service-resolution/DI layer).
2. Type-only imports: use `import type { ... } from '...';` for interfaces/types to improve build performance and clarity.
3. External deps and framework config: when adding/modifying external libraries or build config, consult official docs via Context7 MCP and follow recommended patterns.

## Testing Guidelines
- Frameworks: Vitest (unit), Playwright (e2e; deps present, not configured).
- Location: place unit tests near code (`*.test.ts`/`*.test.tsx`) or under `__tests__/`.
- Coverage: use `@vitest/coverage-v8`; target ≥80% on new/changed core logic in `lib/`.
- Example: `pnpm vitest --run --coverage`.

## Current Implementation Status
- Extension scaffold complete with optimized MV3 setup.
- React side panel wired with Tailwind.
- Background service worker and messaging utilities in place.
- Consolidated content script architecture with platform adapters.
- Tooling configured (ESLint, TS, Vite build). No unit/e2e tests yet.

## Commit & Pull Request Guidelines
- Commit style: history shows `feature:` and `chore:`. Prefer Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`).
- PRs must include:
  - Summary and rationale; link issues (`Closes #123`).
  - Screenshots/GIFs for UI changes (popup/sidepanel/options).
  - Test notes: how you verified; add/update unit tests when applicable.
  - Checks pass: `pnpm build` and `pnpm lint` locally. Do not commit `dist/`.

## Security & Extension Tips
- MV3 reload: after `pnpm build`, reload unpacked extension pointing to `dist/`.
- Avoid secrets in repo; review `src/manifest.ts` permissions before adding new APIs.

## Development Notes
- Despite CRXJS HMR, manual reload is sometimes required after builds.
- Load the extension via Chrome "Load unpacked" pointing to `dist/`.
- Side panel path is `src/sidepanel/index.html`; options page is `src/ui/options/index.html`.
