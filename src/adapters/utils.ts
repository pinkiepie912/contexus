/**
 * Utility functions for working with platform adapters
 *
 * Simplified utility functions for adapter selection and common operations.
 * Removed unnecessary interface abstraction for Chrome extension optimization.
 */

import type { PlatformAdapter } from './types';
import { openaiAdapter } from './openai';
import { geminiAdapter } from './gemini';
import { claudeAdapter } from './claude';
import { genericAdapter } from './generic';

/**
 * Registry of all platform adapters
 */
export const platformAdapters: PlatformAdapter[] = [
  openaiAdapter,
  geminiAdapter,
  claudeAdapter,
  genericAdapter
];

/**
 * Get the appropriate adapter for the current URL
 */
export function getCurrentAdapter(): PlatformAdapter {
  const currentUrl = window.location.href;

  // Find the first adapter that matches the current URL
  const matchedAdapter = platformAdapters.find(adapter =>
    adapter.urlPatterns.some(pattern => {
      if (pattern === '*') return false; // Skip generic pattern in first pass
      return currentUrl.includes(pattern.replace('/*', '').replace('*', ''));
    })
  );

  // Return matched adapter or fall back to generic
  return matchedAdapter || genericAdapter;
}

/**
 * Test if selectors work on the current page
 */
export function testSelectors(adapter: PlatformAdapter): {
  conversationContainer: boolean;
  messageContainer: boolean;
  userMessage: boolean;
  assistantMessage: boolean;
  messageContent: boolean;
} {
  return {
    conversationContainer: !!document.querySelector(adapter.selectors.conversationContainer),
    messageContainer: !!document.querySelector(adapter.selectors.messageContainer),
    userMessage: !!document.querySelector(adapter.selectors.userMessage.container),
    assistantMessage: !!document.querySelector(adapter.selectors.assistantMessage.container),
    messageContent: !!document.querySelector(adapter.selectors.messageContent)
  };
}

/**
 * Get all message elements using the current adapter
 */
export function getAllMessages(adapter?: PlatformAdapter): Element[] {
  const currentAdapter = adapter || getCurrentAdapter();
  return Array.from(document.querySelectorAll(currentAdapter.selectors.messageContainer));
}

/**
 * Get conversation container using the current adapter
 */
export function getConversationContainer(adapter?: PlatformAdapter): Element | null {
  const currentAdapter = adapter || getCurrentAdapter();
  return document.querySelector(currentAdapter.selectors.conversationContainer);
}

/**
 * Extract clean text from a message element
 */
export function extractMessageText(element: Element, adapter?: PlatformAdapter): string {
  const currentAdapter = adapter || getCurrentAdapter();

  // Use custom extractor if provided
  if (currentAdapter.config.extractMessageText) {
    return currentAdapter.config.extractMessageText(element);
  }

  // Default extraction logic
  const contentElement = element.querySelector(currentAdapter.selectors.messageContent);
  if (!contentElement) {
    return element.textContent?.trim() || '';
  }

  // Clean up the text
  let text = contentElement.textContent?.trim() || '';

  // Remove common UI noise
  text = text.replace(/\s+/g, ' '); // Normalize whitespace
  text = text.replace(/^(Copy|Copied|Edit|Delete)\s*/, ''); // Remove action button text
  text = text.replace(/\s*(Copy|Copied|Edit|Delete)\s*$/, ''); // Remove trailing action text

  return text;
}

/**
 * Check if a message is complete (not still loading/streaming)
 */
export function isMessageComplete(element: Element, adapter?: PlatformAdapter): boolean {
  const currentAdapter = adapter || getCurrentAdapter();

  // Use custom completion checker if provided
  if (currentAdapter.config.isMessageComplete) {
    return currentAdapter.config.isMessageComplete(element);
  }

  // Default completion logic
  if (!currentAdapter.config.hasStreamingResponse) {
    return true; // If no streaming, assume always complete
  }

  // Check for loading indicators
  if (currentAdapter.selectors.loadingIndicator) {
    const loadingIndicator = element.querySelector(currentAdapter.selectors.loadingIndicator);
    if (loadingIndicator) {
      return false; // Still loading
    }
  }

  // Check for empty or very short content (likely still loading)
  const text = extractMessageText(element, currentAdapter);
  if (text.length < 3) {
    return false;
  }

  // Additional platform-specific checks could be added here
  return true;
}

/**
 * Wait for content to load based on platform configuration
 */
export async function waitForContentLoad(adapter?: PlatformAdapter): Promise<void> {
  const currentAdapter = adapter || getCurrentAdapter();

  if (currentAdapter.config.contentLoadDelay > 0) {
    await new Promise(resolve =>
      setTimeout(resolve, currentAdapter.config.contentLoadDelay)
    );
  }
}

// Legacy compatibility - create object with same interface
export const adapterUtils = {
  getCurrentAdapter,
  testSelectors,
  getAllMessages,
  getConversationContainer,
  extractMessageText,
  isMessageComplete,
  waitForContentLoad
};