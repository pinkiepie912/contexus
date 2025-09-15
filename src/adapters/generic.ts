/**
 * Generic/Other Platform Adapter
 *
 * This adapter provides fallback selectors and configuration
 * for unknown or other LLM platforms.
 */

import type { PlatformAdapter } from './types';

/**
 * Generic/Other Platform Adapter
 * Used as fallback for unknown or other LLM platforms
 */
export const genericAdapter: PlatformAdapter = {
  platform: 'other',
  name: 'Other LLM Platform',
  urlPatterns: ['*'],
  selectors: {
    conversationContainer: 'main, [class*="conversation"], [class*="chat"], [class*="messages"], .chat-app, .chat-history',
    messageContainer: '[class*="message"], [class*="response"], [class*="turn"], [class*="chat-turn"], .message, .group',
    userMessage: {
      container: '[class*="user"], [class*="human"], [class*="question"], .request-container, [data-role="user"]',
      actionBar: '[class*="user-actions"], [class*="request-actions"]'
    },
    assistantMessage: {
      container: '[class*="assistant"], [class*="ai"], [class*="bot"], [class*="response"], .response-container, [data-role="assistant"]',
      actionBar: '[role="toolbar"], [class*="actions"], [class*="controls"], footer, div:has(button[aria-label*="Copy"])'
    },
    messageContent: '[class*="content"], [class*="text"], [class*="message-content"], .content, .prose, .markdown',
    actionBar: '[role="toolbar"], [class*="actions"], [class*="controls"], footer, div:has(button[aria-label*="Copy"])',
    loadingIndicator: '[class*="loading"], [class*="thinking"], [class*="typing"], [class*="generating"], mat-progress-spinner'
  },
  config: {
    hasStreamingResponse: false,
    contentLoadDelay: 200,
    isDynamicContent: true,
    extractMessageText: (element) => {
      return element.textContent?.trim() || '';
    }
  }
};
