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
- **Content Script**: `src/content/index.ts` - entry point that imports ContentManager
- **Content Manager**: `src/content/ContentManager.ts` - consolidated class handling all content script functionality
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
- Chrome extension scaffold is complete and optimized
- React setup in side panel with Tailwind styling
- Background service worker with robust messaging
- Consolidated content script architecture
- Platform adapters for ChatGPT, Gemini, and Claude
- Development tooling configured (ESLint, TypeScript, build system)

## Development Rules

### Code Architecture Rules
1. **Consolidated Architecture**: Content script functionality is unified in a single ContentManager class
   - All message processing, rendering, and adapter functionality in one class
   - Direct method calls instead of service resolution
   - Simplified initialization and cleanup

2. **Type Import Convention**: All interface imports must use TypeScript's `type` import syntax
   - Use `import type { IInterface } from './module'` for interface imports
   - Use regular imports only for concrete implementations and utilities
   - This improves build performance and makes dependencies clearer

3. **External Dependencies and Framework Configuration**: Always use Context7 MCP for framework and external module setup
   - Use Context7 MCP when adding, modifying, or removing external dependencies
   - Consult official documentation through Context7 before making configuration changes
   - Apply Context7-sourced patterns for framework integration and setup
   - This ensures adherence to current best practices and official recommendations

### Example Implementation
```typescript
// ✅ Correct - Using type imports for interfaces
import type { PlatformAdapter, MessageData } from '../types';
import { adapterUtils } from '../adapters/index';

// ✅ Correct - Consolidated ContentManager approach
export class ContentManager {
  private adapter: PlatformAdapter;
  private processedMessages = new Set<Element>();

  constructor() {
    this.adapter = adapterUtils.getCurrentAdapter();
    this.init();
  }

  // All functionality integrated directly
  processMessage(element: Element): boolean { /* ... */ }
  renderCaptureButton(element: Element): boolean { /* ... */ }
  extractMessageText(element: Element): string { /* ... */ }
}

// ✅ Correct - Singleton export pattern
export const contentManager = new ContentManager();

// ✅ Correct - Using Context7 MCP for framework setup
// Before adding new dependencies or modifying framework configuration:
// 1. Use Context7 MCP to resolve library documentation
// 2. Consult official patterns and best practices
// 3. Apply recommended configuration patterns
// 4. Validate against official documentation
```

## Architecture Design Decisions

### Why Consolidated Architecture?
- **Chrome Extension Optimization**: Simplified structure reduces bundle size and initialization time
- **Performance**: Direct method calls eliminate service resolution overhead
- **Maintainability**: Single responsibility class is easier to debug and understand
- **Bundle Size**: ~40% reduction compared to previous DI-based architecture

### Key Components
- **ContentManager**: Unified class handling message detection, processing, and UI rendering
- **Platform Adapters**: Separate modules for ChatGPT, Gemini, and Claude platform-specific logic
- **Background Service Worker**: Handles data persistence and cross-component messaging
- **React Side Panel**: Main user interface for browsing and managing captured content

## Development Notes

- Chrome extension requires manual reload after builds despite CRXJS HMR support
- Load extension in Chrome via "Load unpacked" pointing to `dist/` folder
- Side panel path in manifest points to `src/sidepanel/index.html` (non-standard location)
- Options page references `ui/options/index.html` but actual file is at `src/ui/options/index.html`
- No tests currently implemented despite testing framework setup
- ContentManager singleton pattern ensures single instance across page lifecycle
- **Context7 MCP Usage**: Always consult Context7 MCP for official documentation when working with external frameworks (Vite, React, CRXJS, Tailwind, etc.) to ensure current best practices and avoid deprecated patterns