/**
 * Shadow DOM Renderer for React Components
 *
 * Provides isolated rendering of React components within Shadow DOM
 * to prevent style conflicts with host page.
 */

import * as React from 'react'
import { createRoot, type Root } from 'react-dom/client'

import { ShadowCaptureButton } from './ShadowCaptureButton'

export interface ShadowDOMRendererOptions {
  hostElement: Element
  onCapture: () => Promise<void>
  buttonSize?: 'default' | 'sm' | 'lg' | 'icon'
}

export class ShadowDOMRenderer {
  private static instances = new Map<Element, ShadowDOMRenderer>()
  private static sharedStyleSheet: CSSStyleSheet | null = null
  private shadowRoot: ShadowRoot | null = null
  private reactRoot: Root | null = null
  private hostElement: Element
  private onCapture: () => Promise<void>
  private buttonSize: 'default' | 'sm' | 'lg' | 'icon'

  constructor(options: ShadowDOMRendererOptions) {
    this.hostElement = options.hostElement
    this.onCapture = options.onCapture
    this.buttonSize = options.buttonSize || 'icon'

    // Store instance for cleanup
    ShadowDOMRenderer.instances.set(this.hostElement, this)
  }

  /**
   * Render the capture button in Shadow DOM
   */
  render(): boolean {
    try {
      // Create shadow root if it doesn't exist
      if (!this.shadowRoot) {
        this.shadowRoot = this.hostElement.attachShadow({ mode: 'closed' })
      }

      // Create container for React app
      const container = document.createElement('div')
      container.style.cssText = `
        display: inline-flex;
        align-items: center;
        justify-content: center;
        margin: 0;
        padding: 0;
        border: none;
        background: none;
      `

      // Inject base styles for Shadow DOM (shared per ShadowRoot)
      ShadowDOMRenderer.attachBaseStyles(this.shadowRoot)
      this.shadowRoot.appendChild(container)

      // Create React root and render
      this.reactRoot = createRoot(container)
      this.reactRoot.render(
        <React.StrictMode>
          <ShadowCaptureButton
            onCapture={this.onCapture}
            size={this.buttonSize}
          />
        </React.StrictMode>
      )

      return true
    } catch (error) {
      console.warn('[ShadowDOMRenderer] Failed to render:', error)
      return false
    }
  }

  /**
   * Get base styles for Shadow DOM isolation
   */
  private static getBaseShadowStyles(): string {
    return `
      /* Reset + shardcn tokens (adapted for Shadow DOM) */
      :host {
        all: initial;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        /* shardcn token defaults (approximate to new-york theme) */
        --background: 255 255 255;
        --foreground: 15 15 15;
        --primary: 79 70 229; /* indigo-600 */
        --primary-foreground: 255 255 255;
        --border: 229 231 235; /* slate-200 */
      }

      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }

      /* Base button styles — keep current visual exactly */
      button {
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        font-size: 14px;
        font-weight: 500;
        line-height: 1.5;
        cursor: pointer;
        border: none;
        border-radius: 6px;
        background: transparent;
        color: rgb(var(--foreground));
        transition: all 0.2s ease;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
      }

      button:disabled {
        pointer-events: none;
        opacity: 0.5;
      }

      button:focus-visible {
        outline: 2px solid rgba(79, 70, 229, 0.6);
        outline-offset: 2px;
      }

      /* Hover/active — match existing behavior */
      button:hover:not(:disabled) {
        background: rgba(0, 0, 0, 0.05);
        transform: scale(1.05);
      }

      button:active:not(:disabled) {
        transform: scale(0.95);
      }

      /* Dark mode support */
      @media (prefers-color-scheme: dark) {
        :host { --foreground: 245 245 245; }
        button:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.1);
        }
        button:focus-visible {
          outline-color: rgba(129, 140, 248, 0.8);
        }
      }

      /* High contrast */
      @media (prefers-contrast: high) {
        button:focus-visible {
          outline: 3px solid currentColor;
          outline-offset: 3px;
        }
      }

      /* Reduced motion */
      @media (prefers-reduced-motion: reduce) {
        button { transition: none; }
        button:hover:not(:disabled), button:active:not(:disabled) { transform: none; }
      }

      /* Keyframes used by ShadowCaptureButton feedback states */
      @keyframes contexus-pulse {
        0% { outline-color: rgba(34, 211, 238, 0.8); transform: scale(1); }
        50% { outline-color: rgba(34, 211, 238, 0.4); transform: scale(1.02); }
        100% { outline-color: rgba(34, 211, 238, 0.8); transform: scale(1); }
      }

      @keyframes contexus-shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-2px); }
        75% { transform: translateX(2px); }
      }

      @media (prefers-reduced-motion: reduce) {
        * { animation: none !important; transition: none !important; }
      }
    `
  }

  /**
   * Attach base styles to a ShadowRoot using shared CSSStyleSheet if available,
   * otherwise inject a single <style data-contexus-shadow-base> once.
   */
  private static attachBaseStyles(root: ShadowRoot): void {
    try {
      const anyRoot = root as any
      if ('adoptedStyleSheets' in anyRoot && typeof CSSStyleSheet !== 'undefined') {
        if (!this.sharedStyleSheet) {
          const sheet = new CSSStyleSheet()
          sheet.replaceSync(this.getBaseShadowStyles())
          this.sharedStyleSheet = sheet
        }
        const current = anyRoot.adoptedStyleSheets || []
        if (!current.includes(this.sharedStyleSheet)) {
          anyRoot.adoptedStyleSheets = [...current, this.sharedStyleSheet]
        }
        return
      }
    } catch (_) {
      // Fallback to <style> element below
    }

    // Fallback: ensure only one base style element exists per shadow root
    const marker = 'data-contexus-shadow-base'
    if (!root.querySelector(`style[${marker}]`)) {
      const style = document.createElement('style')
      style.setAttribute(marker, 'true')
      style.textContent = this.getBaseShadowStyles()
      root.appendChild(style)
    }
  }

  /**
   * Cleanup Shadow DOM and React root
   */
  cleanup(): void {
    try {
      if (this.reactRoot) {
        this.reactRoot.unmount()
        this.reactRoot = null
      }

      if (this.shadowRoot) {
        // Remove shadow root by removing host element's shadow
        // Note: There's no direct way to remove shadow root
        this.shadowRoot = null
      }

      // Remove from instances map
      ShadowDOMRenderer.instances.delete(this.hostElement)
    } catch (error) {
      console.warn('[ShadowDOMRenderer] Cleanup error:', error)
    }
  }

  /**
   * Static method to render capture button in Shadow DOM
   */
  static renderCaptureButton(options: ShadowDOMRendererOptions): ShadowDOMRenderer {
    // Check if instance already exists for this element
    const existing = this.instances.get(options.hostElement)
    if (existing) {
      existing.cleanup()
    }

    // Create new renderer and render
    const renderer = new ShadowDOMRenderer(options)
    renderer.render()

    return renderer
  }

  /**
   * Check if Shadow DOM is supported
   */
  static isSupported(): boolean {
    return 'attachShadow' in Element.prototype
  }

  /**
   * Get all active renderer instances
   */
  static getAllInstances(): ShadowDOMRenderer[] {
    return Array.from(this.instances.values())
  }

  /**
   * Cleanup all renderer instances
   */
  static cleanupAll(): void {
    const instances = Array.from(this.instances.values())
    instances.forEach(instance => instance.cleanup())
    this.instances.clear()
  }
}
