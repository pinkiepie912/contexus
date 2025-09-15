/**
 * Platform Adapters Entry Point
 *
 * This module exports all platform adapters, types, and utilities
 * for use throughout the application.
 */

// Export types (removed AdapterUtils interface)
export type {
  Platform,
  MessageSelectors,
  PlatformSelectors,
  PlatformConfig,
  PlatformAdapter
} from './types';

// Export individual adapters
export { openaiAdapter } from './openai';
export { geminiAdapter } from './gemini';
export { claudeAdapter } from './claude';
export { genericAdapter } from './generic';

// Export utilities and registry (both functions and legacy object)
export {
  platformAdapters,
  adapterUtils,
  getCurrentAdapter,
  testSelectors,
  getAllMessages,
  getConversationContainer,
  extractMessageText,
  isMessageComplete,
  waitForContentLoad
} from './utils';