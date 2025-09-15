/**
 * Google Gemini Platform Adapter
 *
 * This adapter provides platform-specific selectors and configuration
 * for Google Gemini and Bard websites.
 */

import type { PlatformAdapter } from './types';

/**
 * Google Gemini Platform Adapter
 */
export const geminiAdapter: PlatformAdapter = {
  platform: 'gemini',
  name: 'Google Gemini',
  urlPatterns: [
    'https://gemini.google.com/*',
    'https://bard.google.com/*'
  ],
  selectors: {
    conversationContainer: 'main.chat-app, .chat-history-scroll-container, infinite-scroller.chat-history, [data-test-id="chat-history-container"]',
    messageContainer: '[class*="message"], [class*="conversation-turn"], [class*="chat-turn"], .response-container, .request-container',
    userMessage: {
      container: '[class*="user"], [data-role="user"], .request-container, [class*="human"]',
      actionBar: '[class*="user-actions"], [class*="request-actions"]'
    },
    assistantMessage: {
      container: '[class*="model"], [data-role="model"], [class*="assistant"], .response-container, [class*="bot"]',
      actionBar: '[class*="action-toolbar"], [class*="message-actions"], .action-buttons, [class*="controls"]'
    },
    messageContent: '[class*="message-content"], .markdown, [class*="response-text"], .response-text, .request-text',
    actionBar: '[class*="action-toolbar"], [class*="message-actions"], .action-buttons, [class*="controls"]',
    loadingIndicator: '[class*="loading"], [class*="thinking"], [class*="generating"], mat-progress-spinner'
  },
  config: {
    hasStreamingResponse: true,
    contentLoadDelay: 300,
    isDynamicContent: true,
    isMessageComplete: (element) => {
      // Check if Gemini has finished generating response
      const parent = element.closest('[class*="conversation-turn"]') || element;
      const loadingIndicator = parent.querySelector('[class*="loading"], [class*="generating"]');
      return !loadingIndicator;
    },
    extractMessageText: (element) => {
      const contentElement = element.querySelector('[class*="message-content"]') ||
                            element.querySelector('.markdown') ||
                            element.querySelector('[class*="response-text"]');
      return contentElement?.textContent?.trim() || '';
    }
  }
};
