/**
 * Content Script for Contexus Chrome Extension
 *
 * This script runs on LLM platform pages (ChatGPT, Gemini, Claude) and:
 * - Detects conversation elements using platform-specific adapters
 * - Monitors for new messages using MutationObserver
 * - Prepares the foundation for capture UI rendering
 * - Provides utilities for text selection and snippet capture
 */

import { adapterUtils, type PlatformAdapter } from '../adapters.js';
import { content as messagingContent, saveSnippet } from '../lib/messaging.js';

/**
 * Content Script Manager Class
 * Handles all content script functionality including conversation detection,
 * message monitoring, and capture preparation
 */
class ContentScriptManager {
  private adapter: PlatformAdapter;
  private observer: MutationObserver | null = null;
  private isInitialized = false;
  private detectedMessages = new Set<Element>();

  constructor() {
    // Get the appropriate adapter for current platform
    this.adapter = adapterUtils.getCurrentAdapter();
    this.init();
  }

  /**
   * Initialize the content script
   */
  private async init(): Promise<void> {
    console.log(`[Contexus] Initializing on ${this.adapter.name} platform`);

    // Mark extension as injected
    (window as any).__CONTEXUS_INJECTED__ = true;
    document.documentElement.setAttribute('data-contexus-extension', 'active');

    // Wait for page to load
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupObserver());
    } else {
      this.setupObserver();
    }

    // Handle SPA navigation
    this.setupNavigationListener();

    console.log('[Contexus] Content script initialized');
  }

  /**
   * Set up MutationObserver to detect conversation changes
   */
  private async setupObserver(): Promise<void> {
    if (this.isInitialized) return;

    console.log('[Contexus] Setting up conversation observer');

    // Wait for content to load based on platform configuration
    await adapterUtils.waitForContentLoad(this.adapter);

    // Test selectors to ensure they work on this page
    const selectorTest = adapterUtils.testSelectors(this.adapter);
    console.log('[Contexus] Selector test results:', selectorTest);

    // Find conversation container
    const conversationContainer = adapterUtils.getConversationContainer(this.adapter);

    if (!conversationContainer) {
      console.warn('[Contexus] No conversation container found, retrying in 2s...');
      setTimeout(() => this.setupObserver(), 2000);
      return;
    }

    console.log('[Contexus] Found conversation container:', conversationContainer);

    // Process existing messages
    this.processExistingMessages();

    // Set up observer for new messages
    this.observer = new MutationObserver((mutations) => {
      this.handleMutations(mutations);
    });

    // Start observing with comprehensive options
    this.observer.observe(conversationContainer, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['class', 'data-message-author-role', 'data-is-user']
    });

    console.log('[Contexus] MutationObserver active');
    this.isInitialized = true;

    // Also observe document body for dynamic content updates
    if (this.adapter.config.isDynamicContent) {
      const bodyObserver = new MutationObserver((mutations) => {
        // Check if conversation container was added/removed
        for (const mutation of mutations) {
          Array.from(mutation.addedNodes).forEach(node => {
            if (node instanceof Element) {
              const newContainer = node.querySelector?.(this.adapter.selectors.conversationContainer);
              if (newContainer && newContainer !== conversationContainer) {
                console.log('[Contexus] New conversation container detected');
                this.observer?.disconnect();
                this.isInitialized = false;
                this.setupObserver();
                return;
              }
            }
          });
        }
      });

      bodyObserver.observe(document.body, {
        childList: true,
        subtree: true
      });
    }
  }

  /**
   * Handle MutationObserver mutations
   */
  private handleMutations(mutations: MutationRecord[]): void {
    let hasNewMessages = false;

    for (const mutation of mutations) {
      // Handle added nodes (new messages)
      Array.from(mutation.addedNodes).forEach(node => {
        if (node instanceof Element) {
          // Check if the node itself is a message
          if (this.isMessageElement(node)) {
            this.processNewMessage(node);
            hasNewMessages = true;
          }

          // Check for message elements within the added node
          const messageElements = node.querySelectorAll(this.adapter.selectors.messageContainer);
          Array.from(messageElements).forEach(messageEl => {
            if (this.isMessageElement(messageEl)) {
              this.processNewMessage(messageEl);
              hasNewMessages = true;
            }
          });
        }
      });

      // Handle character data changes (streaming content)
      if (mutation.type === 'characterData' && this.adapter.config.hasStreamingResponse) {
        const messageElement = this.findParentMessage(mutation.target);
        if (messageElement) {
          this.handleStreamingUpdate(messageElement);
        }
      }

      // Handle attribute changes (message completion indicators)
      if (mutation.type === 'attributes' && mutation.target instanceof Element) {
        const messageElement = this.findParentMessage(mutation.target);
        if (messageElement) {
          this.handleMessageUpdate(messageElement);
        }
      }
    }

    // Dispatch event if new messages were detected
    if (hasNewMessages) {
      this.dispatchConversationUpdate();
    }
  }

  /**
   * Process existing messages on page load
   */
  private processExistingMessages(): void {
    const existingMessages = adapterUtils.getAllMessages(this.adapter);
    console.log(`[Contexus] Found ${existingMessages.length} existing messages`);

    existingMessages.forEach(messageEl => {
      this.processNewMessage(messageEl);
    });
  }

  /**
   * Process a new message element
   */
  private processNewMessage(messageElement: Element): void {
    // Avoid duplicate processing
    if (this.detectedMessages.has(messageElement)) return;

    this.detectedMessages.add(messageElement);

    const messageText = adapterUtils.extractMessageText(messageElement, this.adapter);
    const isComplete = adapterUtils.isMessageComplete(messageElement, this.adapter);

    console.log('[Contexus] New message detected:', {
      element: messageElement,
      text: messageText.substring(0, 100) + (messageText.length > 100 ? '...' : ''),
      isComplete,
      isUser: messageElement.matches(this.adapter.selectors.userMessage),
      isAssistant: messageElement.matches(this.adapter.selectors.assistantMessage)
    });

    // Mark element for future capture UI
    messageElement.setAttribute('data-contexus-message', 'true');
    messageElement.setAttribute('data-contexus-complete', isComplete.toString());

    // Add message type classes for easier styling
    if (messageElement.matches(this.adapter.selectors.userMessage)) {
      messageElement.setAttribute('data-contexus-type', 'user');
    } else if (messageElement.matches(this.adapter.selectors.assistantMessage)) {
      messageElement.setAttribute('data-contexus-type', 'assistant');
    }

    // If message is complete and substantial, prepare for capture
    if (isComplete && messageText.length > 20) {
      this.prepareMessageForCapture(messageElement, messageText);
    }
  }

  /**
   * Handle streaming content updates
   */
  private handleStreamingUpdate(messageElement: Element): void {
    // Update completion status
    const isComplete = adapterUtils.isMessageComplete(messageElement, this.adapter);
    messageElement.setAttribute('data-contexus-complete', isComplete.toString());

    // If message just completed, prepare for capture
    if (isComplete && messageElement.getAttribute('data-contexus-complete') !== 'true') {
      const messageText = adapterUtils.extractMessageText(messageElement, this.adapter);
      if (messageText.length > 20) {
        this.prepareMessageForCapture(messageElement, messageText);
      }
    }
  }

  /**
   * Handle message updates (attribute changes, etc.)
   */
  private handleMessageUpdate(messageElement: Element): void {
    // Re-evaluate message completion
    const isComplete = adapterUtils.isMessageComplete(messageElement, this.adapter);
    const wasComplete = messageElement.getAttribute('data-contexus-complete') === 'true';

    messageElement.setAttribute('data-contexus-complete', isComplete.toString());

    // If message just completed, update capture readiness
    if (isComplete && !wasComplete) {
      const messageText = adapterUtils.extractMessageText(messageElement, this.adapter);
      if (messageText.length > 20) {
        this.prepareMessageForCapture(messageElement, messageText);
      }
    }
  }

  /**
   * Prepare a message for capture UI (placeholder for Feature 4)
   */
  private prepareMessageForCapture(messageElement: Element, messageText: string): void {
    console.log('[Contexus] Preparing message for capture:', messageText.substring(0, 50) + '...');

    // Mark as capture-ready
    messageElement.setAttribute('data-contexus-capture-ready', 'true');

    // Store message data for future use
    const messageData = {
      text: messageText,
      timestamp: Date.now(),
      platform: this.adapter.platform,
      url: window.location.href,
      title: document.title,
      isUser: messageElement.matches(this.adapter.selectors.userMessage),
      isAssistant: messageElement.matches(this.adapter.selectors.assistantMessage)
    };

    // Store in element for later retrieval
    (messageElement as any).__contextusCaptureData = messageData;

    // TODO: This is where Feature 4 will add capture button UI
    // For now, we just prepare the foundation
  }

  /**
   * Check if an element is a message element
   */
  private isMessageElement(element: Element): boolean {
    return element.matches(this.adapter.selectors.messageContainer);
  }

  /**
   * Find the parent message element for a given node
   */
  private findParentMessage(node: Node): Element | null {
    let current = node.parentElement;
    while (current) {
      if (this.isMessageElement(current)) {
        return current;
      }
      current = current.parentElement;
    }
    return null;
  }

  /**
   * Dispatch custom event when conversation updates
   */
  private dispatchConversationUpdate(): void {
    const event = new CustomEvent('contextus:conversation-update', {
      detail: {
        platform: this.adapter.platform,
        messageCount: this.detectedMessages.size,
        timestamp: Date.now()
      }
    });
    document.dispatchEvent(event);
  }

  /**
   * Set up navigation listener for SPA apps
   */
  private setupNavigationListener(): void {
    // Listen for navigation changes (pushstate/popstate)
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function(...args) {
      originalPushState.apply(history, args);
      setTimeout(() => contentManager.handleNavigation(), 100);
    };

    history.replaceState = function(...args) {
      originalReplaceState.apply(history, args);
      setTimeout(() => contentManager.handleNavigation(), 100);
    };

    window.addEventListener('popstate', () => {
      setTimeout(() => this.handleNavigation(), 100);
    });
  }

  /**
   * Handle navigation changes in SPA
   */
  private handleNavigation(): void {
    console.log('[Contexus] Navigation detected, reinitializing...');

    // Clean up existing observer
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    // Reset state
    this.isInitialized = false;
    this.detectedMessages.clear();

    // Reinitialize with delay
    setTimeout(() => {
      this.setupObserver();
    }, 500);
  }

  /**
   * Public methods for external access
   */
  public getAdapter(): PlatformAdapter {
    return this.adapter;
  }

  public getDetectedMessages(): Element[] {
    return Array.from(this.detectedMessages);
  }

  public getCaptureReadyMessages(): Element[] {
    return this.getDetectedMessages().filter(el =>
      el.getAttribute('data-contexus-capture-ready') === 'true'
    );
  }

  /**
   * Quick capture method for testing
   */
  public async quickCapture(messageElement?: Element): Promise<void> {
    if (!messageElement) {
      // Try to capture selected text
      try {
        const result = await messagingContent.captureSelection({
          title: `Captured from ${this.adapter.name}`,
          tags: [this.adapter.platform, 'quick-capture']
        });
        console.log('[Contexus] Quick capture result:', result);
      } catch (error) {
        console.error('[Contexus] Quick capture failed:', error);
      }
      return;
    }

    // Capture specific message
    const messageData = (messageElement as any).__contextusCaptureData;
    if (messageData) {
      try {
        const result = await saveSnippet({
          content: messageData.text,
          sourceUrl: messageData.url,
          title: `${messageData.isUser ? 'User' : 'AI'} message from ${this.adapter.name}`,
          tags: [this.adapter.platform, messageData.isUser ? 'user' : 'assistant'],
          platform: this.adapter.platform
        });
        console.log('[Contexus] Message capture result:', result);
      } catch (error) {
        console.error('[Contexus] Message capture failed:', error);
      }
    }
  }
}

// Initialize content script manager
const contentManager = new ContentScriptManager();

// Make available globally for debugging
(window as any).contextusContent = contentManager;

// Export for potential module usage
export default contentManager;
