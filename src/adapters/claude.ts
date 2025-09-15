/**
 * Anthropic Claude Platform Adapter
 *
 * This adapter provides platform-specific selectors and configuration
 * for Anthropic Claude AI website.
 */

import type { PlatformAdapter } from './types';

/**
 * Anthropic Claude Platform Adapter
 */
export const claudeAdapter: PlatformAdapter = {
  platform: 'claude',
  name: 'Claude',
  urlPatterns: [
    'https://claude.ai/*'
  ],
  selectors: {
    conversationContainer: 'main, [class*="conversation"], [class*="chat-container"], [class*="chat-history"], .grid',
    messageContainer: '[class*="message"], [class*="chat-turn"], [class*="conversation-turn"], .group, [role="presentation"]',
    userMessage: {
      container: '[class*="user"], [data-is-user="true"], [class*="human"], .human-message, .font-user-message',
      actionBar: '[class*="flex"]:has(button[data-testid*="edit"])'
    },
    assistantMessage: {
      container: '[class*="assistant"], [data-is-user="false"], [class*="bot"], .assistant-message, [class*="grid-cols-1 grid gap-2.5"]',
      actionBar: 'div:has(button[data-testid="action-bar-copy"]), [class*="flex"]:has(button[data-testid*="action-bar"])'
    },
    messageContent: '[class*="message-content"], .prose, [class*="renderedMarkdown"], [class*="content"], .markdown',
    actionBar: 'div:has(button[data-testid="action-bar-copy"]), [class*="flex"]:has(button[data-testid*="action-bar"])',
    loadingIndicator: '[class*="loading"], [class*="thinking"], [class*="typing"], [class*="generating"]'
  },
  config: {
    hasStreamingResponse: true,
    contentLoadDelay: 400,
    isDynamicContent: true,
    isMessageComplete: (element) => {
      // Check for Claude-specific completion indicators
      const parent = element.closest('[class*="chat-turn"]') || element;
      const loadingIndicator = parent.querySelector('[class*="loading"], [class*="typing"]');
      return !loadingIndicator;
    },
    extractMessageText: (element) => {
      const contentElement = element.querySelector('[class*="message-content"]') ||
                            element.querySelector('.prose') ||
                            element.querySelector('[class*="renderedMarkdown"]');
      return contentElement?.textContent?.trim() || '';
    }
  }
};
