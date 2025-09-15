/**
 * Legacy Adapter Module (Deprecated)
 *
 * This module re-exports from the new adapters directory structure.
 * Use 'src/adapters/index.js' for new imports.
 *
 * @deprecated Use individual adapter imports from src/adapters/ instead
 */

// Re-export types from new adapter structure
export type {
  PlatformAdapter,
  Platform,
  MessageSelectors,
  PlatformSelectors,
  PlatformConfig
} from './adapters/index';

// Re-export adapters from new structure
export {
  openaiAdapter,
  geminiAdapter,
  claudeAdapter,
  genericAdapter,
  platformAdapters
} from './adapters/index';





// Re-export utilities from new structure
export { adapterUtils } from './adapters/index';
