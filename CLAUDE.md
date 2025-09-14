# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Contexus is a Chrome extension that transforms one-off LLM chats into a lasting personal knowledge base. The extension captures context from conversations, lets users reapply it through reusable roles (personas), and helps generate higher-quality results across workflows.

This is currently a Phase 1 project providing the foundation for intelligent context snippets, dynamic role switching, and workflow integration via a Chrome extension.

## Development Commands

- **Install dependencies**: `pnpm install`
- **Development server**: `pnpm dev` (runs Vite dev server with CRXJS HMR)
- **Build extension**: `pnpm build` (TypeScript compilation + Vite build to `dist/`)
- **Lint code**: `pnpm lint` (ESLint with TypeScript rules)
- **Preview build**: `pnpm preview`

## Architecture Overview

### Chrome Extension Structure
- **Manifest V3**: Defined in `src/manifest.ts` using CRXJS
- **Service Worker**: `src/background/index.ts` - handles extension lifecycle and messaging
- **Content Script**: `src/content/index.ts` - injected into chat platforms (OpenAI, Gemini, Claude)
- **Popup UI**: `src/ui/popup/` - extension popup interface
- **Side Panel**: `src/sidepanel/` - React-based side panel for main UI
- **Options Page**: `src/ui/options/` - extension settings (currently empty)

### Technology Stack
- **Build System**: Vite + CRXJS plugin for Manifest V3 extensions
- **Frontend**: React 19 + TypeScript
- **Styling**: Tailwind CSS 4.1
- **State Management**: Zustand
- **Database**: Dexie (IndexedDB wrapper)
- **Testing**: Vitest + Playwright (configured but not implemented)

### Key Technical Patterns
- **Target Platforms**: Content script matches OpenAI ChatGPT, Google Gemini, and Claude AI
- **Permissions**: Storage API for data persistence, Side Panel API for main interface
- **Module System**: ES modules with strict TypeScript configuration
- **Path Aliases**: `~/` maps to `src/` directory

### Current Implementation Status
- Basic Chrome extension scaffold is complete
- React setup in side panel with Tailwind styling
- Background service worker with basic messaging
- Content script injection markers on target platforms
- Development tooling configured (ESLint, TypeScript, build system)

## Development Notes

- Chrome extension requires manual reload after builds despite CRXJS HMR support
- Load extension in Chrome via "Load unpacked" pointing to `dist/` folder
- Side panel path in manifest points to `src/sidepanel/index.html` (non-standard location)
- Options page references `ui/options/index.html` but actual file is at `src/ui/options/index.html`
- No tests currently implemented despite testing framework setup