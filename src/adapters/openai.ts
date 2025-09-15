/**
 * OpenAI ChatGPT Platform Adapter
 *
 * This adapter provides platform-specific selectors and configuration
 * for OpenAI ChatGPT and ChatGPT.com websites.
 */

import type { PlatformAdapter } from './types';

/**
 * OpenAI ChatGPT Platform Adapter
 */
export const openaiAdapter: PlatformAdapter = {
  platform: 'openai',
  name: 'ChatGPT',
  urlPatterns: [
    'https://chat.openai.com/*',
    'https://chatgpt.com/*'
  ],
  selectors: {
    conversationContainer: 'main, [class*="conversation"], [class*="chat-history"]',
    messageContainer: '[data-message-author-role], [class*="message"], .group',
    userMessage: {
      container: '[data-message-author-role="user"], [class*="user"], [class*="human"]',
      actionBar: '[class*="flex"][class*="gap"]:has(button)'
    },
    assistantMessage: {
      container: '[data-message-author-role="assistant"], [class*="assistant"], [class*="bot"]',
      actionBar: '[class*="has-data-[state=open]:pointer-events-auto"][class*="has-data-[state=open]:[mask-position:0_0]"]:has(> button)'
    },
    messageContent: '.markdown, [class*="message-content"], .whitespace-pre-wrap, .prose',
    actionBar: '[class*="has-data-[state=open]:pointer-events-auto"][class*="has-data-[state=open]:[mask-position:0_0]"]:has(> button)',
    loadingIndicator: '[class*="loading"], [class*="thinking"], [class*="generating"], .text-token-text-secondary'
  },
  config: {
    hasStreamingResponse: true,
    contentLoadDelay: 500,
    isDynamicContent: true,
    isMessageComplete: (element) => {
      // Check if the message has finished streaming (no loading indicators nearby)
      const loadingIndicator = element.querySelector('[class*="loading"], [class*="thinking"]');
      return !loadingIndicator;
    },
    extractMessageText: (element) => {
      // Handle multiple possible content selectors
      const contentElement = element.querySelector('.markdown') ||
                            element.querySelector('[class*="message-content"]') ||
                            element.querySelector('.whitespace-pre-wrap');
      return contentElement?.textContent?.trim() || '';
    }
  }
};