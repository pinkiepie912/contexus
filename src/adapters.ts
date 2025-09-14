/**
 * Site Adapters for LLM Platforms
 *
 * This module defines CSS selectors and configuration for different LLM platforms
 * to enable conversation detection and snippet capture functionality.
 * Each adapter contains platform-specific selectors for key elements.
 */

/**
 * Platform adapter interface defining the structure for each platform
 */
export interface PlatformAdapter {
  /** Platform identifier */
  platform: 'openai' | 'gemini' | 'claude' | 'other';

  /** Platform display name */
  name: string;

  /** URL patterns to match this platform */
  urlPatterns: string[];

  /** Selectors for conversation elements */
  selectors: {
    /** Main conversation container that holds all messages */
    conversationContainer: string;

    /** Individual message containers (both user and assistant) */
    messageContainer: string;

    /** User message containers specifically */
    userMessage: string;

    /** Assistant/AI message containers specifically */
    assistantMessage: string;

    /** Message content within each message container */
    messageContent: string;

    /** Loading/thinking indicators */
    loadingIndicator?: string;

    /** Input area where users type their messages */
    inputArea?: string;

    /** Send button for submitting messages */
    sendButton?: string;
  };

  /** Additional configuration options */
  config: {
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
  };
}

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
    userMessage: '[data-message-author-role="user"], [class*="user"], [class*="human"]',
    assistantMessage: '[data-message-author-role="assistant"], [class*="assistant"], [class*="bot"]',
    messageContent: '.markdown, [class*="message-content"], .whitespace-pre-wrap, .prose',
    loadingIndicator: '[class*="loading"], [class*="thinking"], [class*="generating"], .text-token-text-secondary',
    inputArea: 'textarea[placeholder*="Ask"], textarea[placeholder*="message"], #prompt-textarea, ._fallbackTextarea_ebv8s_2',
    sendButton: 'button[data-testid="send-button"], [class*="send"]'
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
    userMessage: '[class*="user"], [data-role="user"], .request-container, [class*="human"]',
    assistantMessage: '[class*="model"], [data-role="model"], [class*="assistant"], .response-container, [class*="bot"]',
    messageContent: '[class*="message-content"], .markdown, [class*="response-text"], .response-text, .request-text',
    loadingIndicator: '[class*="loading"], [class*="thinking"], [class*="generating"], mat-progress-spinner',
    inputArea: '[role="textbox"], .ql-editor, textarea[placeholder*="Enter"], rich-textarea',
    sendButton: 'button[aria-label*="Send"], button[class*="send"], .send-button'
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
    userMessage: '[class*="user"], [data-is-user="true"], [class*="human"], .human-message',
    assistantMessage: '[class*="assistant"], [data-is-user="false"], [class*="bot"], .assistant-message',
    messageContent: '[class*="message-content"], .prose, [class*="renderedMarkdown"], [class*="content"], .markdown',
    loadingIndicator: '[class*="loading"], [class*="thinking"], [class*="typing"], [class*="generating"]',
    inputArea: 'textarea[placeholder*="Talk"], div[contenteditable="true"], [role="textbox"], textarea, .ProseMirror',
    sendButton: 'button[aria-label*="Send"], button[class*="send"], [class*="submit"]'
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
    userMessage: '[class*="user"], [class*="human"], [class*="question"], .request-container, [data-role="user"]',
    assistantMessage: '[class*="assistant"], [class*="ai"], [class*="bot"], [class*="response"], .response-container, [data-role="assistant"]',
    messageContent: '[class*="content"], [class*="text"], [class*="message-content"], .content, .prose, .markdown',
    loadingIndicator: '[class*="loading"], [class*="thinking"], [class*="typing"], [class*="generating"], mat-progress-spinner',
    inputArea: 'textarea, input[type="text"], [contenteditable="true"], [role="textbox"], .ql-editor',
    sendButton: 'button[type="submit"], button[class*="send"], .send-button, button[aria-label*="Send"]'
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
 * Utility functions for working with platform adapters
 */
export const adapterUtils = {
  /**
   * Get the appropriate adapter for the current URL
   */
  getCurrentAdapter(): PlatformAdapter {
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
  },

  /**
   * Test if selectors work on the current page
   */
  testSelectors(adapter: PlatformAdapter): {
    conversationContainer: boolean;
    messageContainer: boolean;
    userMessage: boolean;
    assistantMessage: boolean;
    messageContent: boolean;
  } {
    return {
      conversationContainer: !!document.querySelector(adapter.selectors.conversationContainer),
      messageContainer: !!document.querySelector(adapter.selectors.messageContainer),
      userMessage: !!document.querySelector(adapter.selectors.userMessage),
      assistantMessage: !!document.querySelector(adapter.selectors.assistantMessage),
      messageContent: !!document.querySelector(adapter.selectors.messageContent)
    };
  },

  /**
   * Get all message elements using the current adapter
   */
  getAllMessages(adapter?: PlatformAdapter): Element[] {
    const currentAdapter = adapter || this.getCurrentAdapter();
    return Array.from(document.querySelectorAll(currentAdapter.selectors.messageContainer));
  },

  /**
   * Get conversation container using the current adapter
   */
  getConversationContainer(adapter?: PlatformAdapter): Element | null {
    const currentAdapter = adapter || this.getCurrentAdapter();
    return document.querySelector(currentAdapter.selectors.conversationContainer);
  },

  /**
   * Extract clean text from a message element
   */
  extractMessageText(element: Element, adapter?: PlatformAdapter): string {
    const currentAdapter = adapter || this.getCurrentAdapter();

    // Use custom extraction if available
    if (currentAdapter.config.extractMessageText) {
      return currentAdapter.config.extractMessageText(element);
    }

    // Default extraction
    const contentElement = element.querySelector(currentAdapter.selectors.messageContent);
    return contentElement?.textContent?.trim() || '';
  },

  /**
   * Check if a message is complete (not still loading/streaming)
   */
  isMessageComplete(element: Element, adapter?: PlatformAdapter): boolean {
    const currentAdapter = adapter || this.getCurrentAdapter();

    // Use custom completion check if available
    if (currentAdapter.config.isMessageComplete) {
      return currentAdapter.config.isMessageComplete(element);
    }

    // Default completion check
    return !element.querySelector(currentAdapter.selectors.loadingIndicator || '');
  },

  /**
   * Wait for content to load based on platform configuration
   */
  async waitForContentLoad(adapter?: PlatformAdapter): Promise<void> {
    const currentAdapter = adapter || this.getCurrentAdapter();
    return new Promise(resolve => {
      setTimeout(resolve, currentAdapter.config.contentLoadDelay);
    });
  }
};