/**
 * Content Script Manager for Contexus Chrome Extension
 *
 * This script runs on LLM platform pages (ChatGPT, Gemini, Claude) and:
 * - Detects conversation elements using platform-specific adapters
 * - Monitors for new messages using MutationObserver
 * - Renders capture UI buttons inline with messages
 * - Handles text selection and snippet capture
 * - Injects prompts from PromptStudio into input fields
 */

import { content as messagingContent } from '../lib/messaging';
import type { PlatformAdapter } from '../adapters/index';
import {
  getCurrentAdapter,
  getAllMessages,
  getConversationContainer,
  extractMessageText,
  isMessageComplete,
  testSelectors,
  waitForContentLoad
} from '../adapters/index';

import { CaptureButtonRenderer, type CaptureHandler } from './components/CaptureButtonRenderer';
import { StyleInjector } from './components/StyleInjector';
import { ShadowDOMRenderer } from './renderers/ShadowDOMRenderer';

export interface MessageData {
  text: string;
  timestamp: number;
  platform: string;
  url: string;
  title: string;
  isUser: boolean;
  isAssistant: boolean;
}

/**
 * Content Script Manager Class
 * Handles all content script functionality including conversation detection,
 * message monitoring, and capture UI rendering in a streamlined approach
 */
export class ContentManager {
  private observer: MutationObserver | null = null;
  private isInitialized = false;
  private adapter: PlatformAdapter;
  private processedMessages = new Set<Element>();
  private useShadowDOM = false; // Feature flag for Shadow DOM rendering
  private currentInputField: HTMLElement | null = null; // Track current input field for prompt injection

  constructor() {
    this.adapter = getCurrentAdapter();

    // Check Shadow DOM support and enable if available
    this.useShadowDOM = ShadowDOMRenderer.isSupported();

    this.init();
  }

  /**
   * Initialize the content script
   */
  private async init(): Promise<void> {
    // Wait for initial page resources to minimize interference with preload
    await this.waitForPageStability();

    // Mark extension as injected
    (window as any).__CONTEXUS_INJECTED__ = true;
    document.documentElement.setAttribute('data-contexus-extension', 'active');
    document.documentElement.setAttribute('data-contexus-platform', this.adapter.platform);

    // Inject capture button styles
    StyleInjector.injectCaptureButtonStyles();

    // Wait for page to load
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupObserver());
    } else {
      this.setupObserver();
    }

    // Handle SPA navigation
    this.setupNavigationListener();

    // Setup message listening for prompt injection from side panel
    this.setupPromptInjectionListener();
  }

  /**
   * Wait for page stability to avoid interfering with preload resources
   */
  private async waitForPageStability(): Promise<void> {
    // If page is still loading, wait for load event
    if (document.readyState === 'loading') {
      await new Promise<void>(resolve => {
        document.addEventListener('DOMContentLoaded', () => resolve(), { once: true });
      });
    }

    // Additional delay for preload resources to be used
    // This prevents interference with OpenAI's preload optimization
    await new Promise<void>(resolve => setTimeout(resolve, 100));
  }

  /**
   * Set up MutationObserver to detect conversation changes
   */
  private async setupObserver(): Promise<void> {
    if (this.isInitialized) return;

    // Wait for content to load based on platform configuration
    await waitForContentLoad(this.adapter);

    // Test selectors to ensure they work on this page
    const selectorTest = testSelectors(this.adapter);
    console.log('[Contexus] Selector test results:', selectorTest);

    // Find conversation container
    const conversationContainer = getConversationContainer(this.adapter);

    if (!conversationContainer) {
      console.warn('[Contexus] No conversation container found, retrying in 2s...');
      setTimeout(() => this.setupObserver(), 2000);
      return;
    }

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
    const existingMessages = getAllMessages(this.adapter);

    existingMessages.forEach(messageEl => {
      this.processNewMessage(messageEl);
    });
  }

  /**
   * Process a new message element
   */
  private processNewMessage(messageElement: Element): void {
    // Use integrated message processing
    const processed = this.processMessage(messageElement);

    if (processed) {
      // Try to render capture button if message is ready
      const isCaptureReady = messageElement.getAttribute('data-contexus-capture-ready') === 'true';
      if (isCaptureReady) {
        this.renderCaptureButton(messageElement);
      }
    }
  }

  /**
   * Handle streaming content updates
   */
  private handleStreamingUpdate(messageElement: Element): void {
    const wasComplete = messageElement.getAttribute('data-contexus-complete') === 'true';
    const isComplete = isMessageComplete(messageElement, this.adapter);
    messageElement.setAttribute('data-contexus-complete', isComplete.toString());

    // If message just transitioned to complete, prepare for capture
    if (isComplete && !wasComplete) {
      const messageText = extractMessageText(messageElement, this.adapter);
      if (messageText.length > 20) {
        this.prepareMessageForCapture(messageElement, messageText);
        this.renderCaptureButton(messageElement);
      }
    }
  }

  /**
   * Handle message updates (attribute changes, etc.)
   */
  private handleMessageUpdate(messageElement: Element): void {
    const isComplete = isMessageComplete(messageElement, this.adapter);
    const wasComplete = messageElement.getAttribute('data-contexus-complete') === 'true';

    messageElement.setAttribute('data-contexus-complete', isComplete.toString());

    // If message just completed, update capture readiness
    if (isComplete && !wasComplete) {
      const messageText = extractMessageText(messageElement, this.adapter);
      if (messageText.length > 20) {
        this.prepareMessageForCapture(messageElement, messageText);
        this.renderCaptureButton(messageElement);
      }
    }
  }

  /**
   * Process a message element - integrated from MessageService
   */
  private processMessage(messageElement: Element): boolean {
    try {
      // Avoid duplicate processing
      if (this.isMessageAlreadyProcessed(messageElement)) {
        return true;
      }

      const messageText = extractMessageText(messageElement, this.adapter);
      const isComplete = isMessageComplete(messageElement, this.adapter);

      // Mark element with contexus attributes
      messageElement.setAttribute('data-contexus-message', 'true');
      messageElement.setAttribute('data-contexus-complete', isComplete.toString());

      // Add message type classification
      if (this.isUserMessage(messageElement)) {
        messageElement.setAttribute('data-contexus-type', 'user');
      } else if (this.isAssistantMessage(messageElement)) {
        messageElement.setAttribute('data-contexus-type', 'assistant');
      }

      // Mark as processed
      this.markMessageAsProcessed(messageElement);

      // If message is complete and substantial, prepare for capture
      if (isComplete && messageText.length > 20) {
        this.prepareMessageForCapture(messageElement, messageText);
      }

      return true;
    } catch (error) {
      console.warn('[Contexus] Error processing message:', error);
      return false;
    }
  }

  /**
   * Render capture button for a message element
   */
  private renderCaptureButton(messageElement: Element): boolean {
    try {
      // Avoid duplicates - check for both Shadow DOM and regular buttons
      if (messageElement.querySelector('.contexus-capture-btn') ||
          messageElement.querySelector('[data-contexus-shadow-button]')) {
        return true;
      }

      const messageType = this.isUserMessage(messageElement) ? 'user' :
                         this.isAssistantMessage(messageElement) ? 'assistant' :
                         undefined;

      const actionBar = this.getActionBar(messageElement, messageType);
      if (!actionBar) {
        console.warn('[Contexus] No action bar found for message');
        return false;
      }

      // Create capture handler for this message
      const captureHandler = this.createCaptureHandler(messageElement);

      // Choose rendering method based on Shadow DOM support
      if (this.useShadowDOM) {
        return this.renderShadowDOMButton(actionBar, captureHandler);
      } else {
        return this.renderRegularButton(messageElement, actionBar, captureHandler);
      }
    } catch (error) {
      console.warn('[Contexus] Error inserting capture button:', error);
      return false;
    }
  }

  /**
   * Render capture button using Shadow DOM
   */
  private renderShadowDOMButton(actionBar: Element, captureHandler: CaptureHandler): boolean {
    try {
      // Create a host element for Shadow DOM
      const hostElement = document.createElement('div');
      hostElement.setAttribute('data-contexus-shadow-button', 'true');
      hostElement.style.display = 'inline-flex';
      hostElement.style.alignItems = 'center';

      // Render Shadow DOM button
      ShadowDOMRenderer.renderCaptureButton({
        hostElement,
        onCapture: async () => {
          await captureHandler({ preventDefault: () => {}, stopPropagation: () => {} } as Event);
        },
        buttonSize: 'icon'
      });

      // Insert into action bar
      actionBar.appendChild(hostElement);

      console.log('[Contexus] Shadow DOM capture button inserted successfully');
      return true;
    } catch (error) {
      console.warn('[Contexus] Shadow DOM button rendering failed:', error);
      return false;
    }
  }

  /**
   * Render capture button using regular DOM (fallback)
   */
  private renderRegularButton(messageElement: Element, actionBar: Element, captureHandler: CaptureHandler): boolean {
    try {
      // Use existing CaptureButtonRenderer
      const btn = CaptureButtonRenderer.render({
        messageElement,
        actionBar,
        onCapture: captureHandler,
        adapter: this.adapter
      });

      actionBar.appendChild(btn);

      console.log('[Contexus] Regular DOM capture button inserted successfully');
      return true;
    } catch (error) {
      console.warn('[Contexus] Regular button rendering failed:', error);
      return false;
    }
  }

  /**
   * Create capture handler for a specific message element
   */
  private createCaptureHandler(messageElement: Element): CaptureHandler {
    return async (_event: Event) => {
      const captureData = (messageElement as any).__contextusCaptureData;
      try {
        await messagingContent.capture({
          source: 'auto',
          fallbackText: captureData?.text,
          title: `${captureData?.isUser ? 'User' : 'AI'} message from ${document.title}`,
          tags: captureData
            ? [captureData.platform, captureData.isUser ? 'user' : 'assistant', 'captured']
            : ['captured'],
          meta: captureData
            ? { isUser: captureData.isUser, platform: captureData.platform, url: window.location.href }
            : { url: window.location.href },
        });
      } catch (err) {
        console.warn('[Contexus] Capture failed:', err);
        throw err; // Re-throw for CaptureButtonRenderer to handle
      }
    };
  }




  // === Adapter Methods (integrated from AdapterService) ===

  /**
   * Get current platform adapter
   */
  getCurrentAdapter(): PlatformAdapter {
    return this.adapter;
  }

  /**
   * Get message container for an element
   */
  getMessageContainer(messageElement: Element): Element | null {
    // Check if the element itself is a message container
    if (messageElement.matches(this.adapter.selectors.messageContainer)) {
      return messageElement;
    }

    // Find parent message container
    return messageElement.closest(this.adapter.selectors.messageContainer);
  }

  /**
   * Get action bar for a message element
   */
  getActionBar(messageElement: Element, messageType?: 'user' | 'assistant'): Element | null {
    const container = this.getMessageContainer(messageElement);
    if (!container) return null;

    // Try specific message type selector first
    if (messageType === 'user' && this.adapter.selectors.userMessage.actionBar) {
      const userActionBar = container.querySelector(this.adapter.selectors.userMessage.actionBar);
      if (userActionBar) return userActionBar;
    }

    if (messageType === 'assistant' && this.adapter.selectors.assistantMessage.actionBar) {
      const assistantActionBar = container.querySelector(this.adapter.selectors.assistantMessage.actionBar);
      if (assistantActionBar) return assistantActionBar;
    }

    // Auto-detect message type and try appropriate selector
    if (!messageType) {
      if (this.isUserMessage(container) && this.adapter.selectors.userMessage.actionBar) {
        const userActionBar = container.querySelector(this.adapter.selectors.userMessage.actionBar);
        if (userActionBar) return userActionBar;
      }

      if (this.isAssistantMessage(container) && this.adapter.selectors.assistantMessage.actionBar) {
        const assistantActionBar = container.querySelector(this.adapter.selectors.assistantMessage.actionBar);
        if (assistantActionBar) return assistantActionBar;
      }
    }

    // Fallback to generic action bar selector
    if (this.adapter.selectors.actionBar) {
      return container.querySelector(this.adapter.selectors.actionBar);
    }

    return null;
  }


  /**
   * Check if element is a user message
   */
  isUserMessage(messageElement: Element): boolean {
    return messageElement.matches(this.adapter.selectors.userMessage.container);
  }

  /**
   * Check if element is an assistant message
   */
  isAssistantMessage(messageElement: Element): boolean {
    return messageElement.matches(this.adapter.selectors.assistantMessage.container);
  }


  // === Message Processing Helper Methods ===

  /**
   * Check if message is already processed
   */
  private isMessageAlreadyProcessed(messageElement: Element): boolean {
    return this.processedMessages.has(messageElement);
  }

  /**
   * Mark message as processed
   */
  private markMessageAsProcessed(messageElement: Element): void {
    this.processedMessages.add(messageElement);
  }

  /**
   * Create message data object
   */
  private createMessageData(messageElement: Element): MessageData {
    const messageText = extractMessageText(messageElement, this.adapter);

    return {
      text: messageText,
      timestamp: Date.now(),
      platform: this.adapter.platform,
      url: window.location.href,
      title: document.title,
      isUser: this.isUserMessage(messageElement),
      isAssistant: this.isAssistantMessage(messageElement)
    };
  }

  /**
   * Prepare message for capture
   */
  private prepareMessageForCapture(messageElement: Element, _messageText: string): void {
    // Mark as capture-ready
    messageElement.setAttribute('data-contexus-capture-ready', 'true');

    // Create and store message data
    const messageData = this.createMessageData(messageElement);

    // Store in element for later retrieval
    (messageElement as any).__contextusCaptureData = messageData;
  }

  // === Utility Methods ===

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
    const processedMessages = this.getProcessedMessages();
    const event = new CustomEvent('contextus:conversation-update', {
      detail: {
        platform: this.adapter.platform,
        messageCount: processedMessages.length,
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
    // Clean up existing observer
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    // Clean up Shadow DOM instances
    ShadowDOMRenderer.cleanupAll();

    // Reset state
    this.isInitialized = false;
    this.clearProcessedMessages();

    // Reinitialize with delay
    setTimeout(() => {
      this.setupObserver();
    }, 500);
  }

  // === Public Interface Methods ===

  /**
   * Get processed messages
   */
  getProcessedMessages(): Element[] {
    return Array.from(this.processedMessages);
  }

  /**
   * Get capture-ready messages
   */
  getCaptureReadyMessages(): Element[] {
    return this.getProcessedMessages().filter(el =>
      el.getAttribute('data-contexus-capture-ready') === 'true'
    );
  }

  /**
   * Clear processed messages
   */
  clearProcessedMessages(): void {
    this.processedMessages.clear();
  }

  /**
   * Quick capture method for testing
   */
  async quickCapture(messageElement?: Element): Promise<void> {
    if (!messageElement) {
      // Try to capture selected text
      try {
        await messagingContent.capture({
          source: 'selection',
          title: `Captured from ${this.adapter.name}`,
          tags: [this.adapter.platform, 'quick-capture']
        });
      } catch {
        // Silent failure for quick capture
      }
      return;
    }

    // Capture specific message
    const messageData = (messageElement as any).__contextusCaptureData;
    if (messageData) {
      try {
        await messagingContent.capture({
          text: messageData.text,
          title: `${messageData.isUser ? 'User' : 'AI'} message from ${this.adapter.name}`,
          tags: [this.adapter.platform, messageData.isUser ? 'user' : 'assistant'],
          meta: { platform: this.adapter.platform, url: messageData.url, isUser: messageData.isUser },
        });
      } catch {
        // Silent failure for quick capture
      }
    }
  }

  // === Prompt Injection Methods (Phase 4) ===

  /**
   * Setup message listener for prompt injection from side panel
   */
  private setupPromptInjectionListener(): void {
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message.type === 'INJECT_PROMPT') {
        this.injectPrompt(message.payload.prompt)
          .then(() => sendResponse({ success: true }))
          .catch((error) => sendResponse({ success: false, error: error.message }));
        return true; // Keep message channel open for async response
      }
    });
  }

  /**
   * Inject prompt into the current input field
   */
  async injectPrompt(prompt: string): Promise<void> {
    const inputField = this.detectInputField();
    if (!inputField) {
      throw new Error('No input field detected on this page');
    }

    try {
      await this.setInputFieldValue(inputField, prompt);
      console.log('[Contexus] Prompt injected successfully');
    } catch (error) {
      console.error('[Contexus] Prompt injection failed:', error);
      throw new Error(`Failed to inject prompt: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Detect the current input field based on platform
   */
  detectInputField(): HTMLElement | null {
    // Try to get input field from adapter config
    if (this.adapter.selectors.inputField) {
      const inputField = document.querySelector(this.adapter.selectors.inputField) as HTMLElement;
      if (inputField) {
        this.currentInputField = inputField;
        return inputField;
      }
    }

    // Fallback: Common input field selectors across platforms
    const commonSelectors = [
      // ChatGPT
      'textarea[data-id="root"]',
      '#prompt-textarea',
      'textarea[placeholder*="Message"]',

      // Claude
      'div[contenteditable="true"][data-testid="message-input"]',
      'div[contenteditable="true"]',

      // Gemini
      'div.ql-editor[contenteditable="true"]',
      'textarea[jsname*="focus"]',

      // Generic fallbacks
      'textarea:not([disabled]):not([readonly])',
      'div[contenteditable="true"]:not([readonly])',
      'input[type="text"]:not([disabled]):not([readonly])'
    ];

    for (const selector of commonSelectors) {
      const element = document.querySelector(selector) as HTMLElement;
      if (element && this.isInputFieldVisible(element)) {
        this.currentInputField = element;
        return element;
      }
    }

    console.warn('[Contexus] No suitable input field found');
    return null;
  }

  /**
   * Check if input field is visible and usable
   */
  private isInputFieldVisible(element: HTMLElement): boolean {
    if (!element) return false;

    const style = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();

    return (
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      style.opacity !== '0' &&
      rect.width > 0 &&
      rect.height > 0 &&
      !(element as HTMLInputElement | HTMLTextAreaElement).disabled &&
      !element.hasAttribute('readonly')
    );
  }

  /**
   * Set value in input field (handles both textarea and contenteditable)
   */
  private async setInputFieldValue(inputField: HTMLElement, value: string): Promise<void> {
    if (!inputField) throw new Error('Input field is null');

    // Focus the input field first
    inputField.focus();

    // Handle different input field types
    if (inputField.tagName === 'TEXTAREA' || inputField.tagName === 'INPUT') {
      const textInput = inputField as HTMLInputElement | HTMLTextAreaElement;

      // Clear existing content
      textInput.value = '';

      // Set new value
      textInput.value = value;

      // Trigger input events to ensure the platform detects the change
      this.triggerInputEvents(textInput);

    } else if (inputField.contentEditable === 'true') {
      // Handle contenteditable divs (Claude, some Gemini interfaces)

      // Clear existing content
      inputField.innerText = '';

      // Set new content
      inputField.innerText = value;

      // Trigger input events
      this.triggerContentEditableEvents(inputField);

    } else {
      throw new Error('Unsupported input field type');
    }

    // Additional platform-specific adjustments
    await this.platformSpecificInputAdjustments(inputField, value);
  }

  /**
   * Trigger input events for textarea/input elements
   */
  private triggerInputEvents(element: HTMLInputElement | HTMLTextAreaElement): void {
    const events = [
      new Event('input', { bubbles: true }),
      new Event('change', { bubbles: true }),
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
      new KeyboardEvent('keyup', { key: 'Enter', bubbles: true })
    ];

    events.forEach(event => element.dispatchEvent(event));
  }

  /**
   * Trigger input events for contenteditable elements
   */
  private triggerContentEditableEvents(element: HTMLElement): void {
    const events = [
      new Event('input', { bubbles: true }),
      new Event('change', { bubbles: true }),
      new InputEvent('input', {
        inputType: 'insertText',
        data: element.innerText,
        bubbles: true
      }),
      new Event('focus', { bubbles: true }),
      new Event('blur', { bubbles: true })
    ];

    events.forEach(event => element.dispatchEvent(event));
  }

  /**
   * Apply platform-specific adjustments after setting input value
   */
  private async platformSpecificInputAdjustments(inputField: HTMLElement, _value: string): Promise<void> {
    const platform = this.adapter.platform;

    switch (platform) {
      case 'openai':
        // ChatGPT may need additional React state updates
        await this.triggerReactStateUpdate(inputField);
        break;

      case 'claude':
        // Claude may need selection range adjustments
        this.adjustSelectionRange(inputField);
        break;

      case 'gemini':
        // Gemini may need Quill editor updates
        await this.triggerQuillUpdate(inputField);
        break;

      default:
        // Generic adjustments
        break;
    }
  }

  /**
   * Trigger React state update for ChatGPT
   */
  private async triggerReactStateUpdate(inputField: HTMLElement): Promise<void> {
    try {
      // Try to trigger React's internal state update
      const reactKey = Object.keys(inputField).find(key => key.startsWith('__reactInternalInstance'));
      if (reactKey) {
        const reactInstance = (inputField as any)[reactKey];
        if (reactInstance && reactInstance.memoizedProps && reactInstance.memoizedProps.onChange) {
          reactInstance.memoizedProps.onChange({
            target: inputField,
            currentTarget: inputField
          });
        }
      }
    } catch (error) {
      console.warn('[Contexus] React state update failed:', error);
    }
  }

  /**
   * Adjust selection range for Claude contenteditable
   */
  private adjustSelectionRange(inputField: HTMLElement): void {
    try {
      if (inputField.contentEditable === 'true') {
        const range = document.createRange();
        const selection = window.getSelection();

        range.selectNodeContents(inputField);
        range.collapse(false); // Collapse to end

        selection?.removeAllRanges();
        selection?.addRange(range);
      }
    } catch (error) {
      console.warn('[Contexus] Selection range adjustment failed:', error);
    }
  }

  /**
   * Trigger Quill editor update for Gemini
   */
  private async triggerQuillUpdate(inputField: HTMLElement): Promise<void> {
    try {
      // Try to trigger Quill's update mechanism
      const quillEditor = (inputField as any).__quill;
      if (quillEditor && typeof quillEditor.setText === 'function') {
        quillEditor.setText(inputField.innerText);
      }
    } catch (error) {
      console.warn('[Contexus] Quill update failed:', error);
    }
  }

  /**
   * Get current input field (for external access)
   */
  getCurrentInputField(): HTMLElement | null {
    return this.currentInputField || this.detectInputField();
  }

  /**
   * Cleanup method for extension unload
   */
  cleanup(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    ShadowDOMRenderer.cleanupAll();
    StyleInjector.cleanup();
    CaptureButtonRenderer.clearCaches();
    ShadowDOMRenderer.cleanupAll();
    this.clearProcessedMessages();
  }
}

// Export singleton instance
export const contentManager = new ContentManager();

// Make available globally for debugging
(window as any).contextusContent = contentManager;

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  contentManager.cleanup();
});
