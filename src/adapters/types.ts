/**
 * Platform Adapter Interface and Types
 *
 * This module defines the interface and types for platform adapters,
 * enabling platform-specific behavior for different LLM chat platforms.
 */

/**
 * Platform identifier types
 */
export type Platform = 'openai' | 'gemini' | 'claude' | 'other';

/**
 * Message selectors for specific message types (simplified)
 */
export interface MessageSelectors {
  /** Message container */
  container: string;
  /** Message action bar */
  actionBar?: string;
}

/**
 * Platform adapter selectors interface
 */
export interface PlatformSelectors {
  /** Main conversation container that holds all messages */
  conversationContainer: string;

  /** Individual message containers (both user and assistant) */
  messageContainer: string;

  /** User message specific selectors */
  userMessage: MessageSelectors;

  /** Assistant/AI message specific selectors */
  assistantMessage: MessageSelectors;

  /** Generic message content fallback */
  messageContent: string;

  /** Generic action bar fallback */
  actionBar?: string;

  /** Loading/thinking indicators */
  loadingIndicator?: string;

  /** Input field selector for prompt injection */
  inputField?: string;

}

/**
 * Platform adapter configuration interface
 */
export interface PlatformConfig {
  /** Whether this platform uses streaming responses */
  hasStreamingResponse: boolean;

  /** Delay to wait for content to load (ms) */
  contentLoadDelay: number;

  /** Whether messages are added dynamically (SPA behavior) */
  isDynamicContent: boolean;

  /** Custom logic for detecting complete messages */
  isMessageComplete?: (element: Element) => boolean;

  /** Custom logic for extracting message text */
  extractMessageText?: (element: Element) => string;
}

/**
 * Platform adapter interface defining the structure for each platform
 */
export interface PlatformAdapter {
  /** Platform identifier */
  platform: Platform;

  /** Platform display name */
  name: string;

  /** URL patterns to match this platform */
  urlPatterns: string[];

  /** Selectors for conversation elements */
  selectors: PlatformSelectors;

  /** Additional configuration options */
  config: PlatformConfig;
}

// Removed AdapterUtils interface - now using direct function exports
// This eliminates unnecessary abstraction for Chrome extension optimization