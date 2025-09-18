/**
 * Shadow DOM Renderer for React Components
 *
 * Provides isolated rendering of React components within Shadow DOM
 * to prevent style conflicts with host page.
 */

import * as React from 'react'
import { createRoot } from 'react-dom/client'

import { ShadowCaptureButton } from '../components/ShadowCaptureButton'
import { ShadowFloatingActionButton } from '../components/ShadowFloatingActionButton'
import { ShadowCaptureTooltip } from '../components/ShadowCaptureTooltip'
import shadowBaseCss from '../styles/shadow-base.css?raw'

export interface ShadowDOMRendererOptions {
  hostElement: Element
  onCapture: () => Promise<void>
  buttonSize?: 'default' | 'sm' | 'lg' | 'icon'
}

export interface ShadowFABRendererOptions {
  hostElement: Element
  active?: boolean | undefined
  onClick?: (() => void) | undefined
  initialPosition?: { x: number; y: number } | undefined
  onPositionChange?: ((position: { x: number; y: number }) => void) | undefined
}

export interface ShadowTooltipRendererOptions {
  hostElement: Element
  visible?: boolean | undefined
  anchorPosition?: { x: number; y: number } | undefined
  onClose?: (() => void) | undefined
  onSelectType?: ((type: 'context' | 'template' | 'example' | 'role') => void) | undefined
}

export class ShadowDOMRenderer {
  private static instances = new Map<Element, { cleanup: () => void }>()
  private static sharedStyleSheet: CSSStyleSheet | null = null

  /**
   * Get base styles for Shadow DOM isolation
   */
  private static getBaseShadowStyles(): string {
    return shadowBaseCss
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
    } catch (error) {
      // Fallback to <style> element below
      console.debug('Failed to adopt style sheets:', error)
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
   * Static method to render capture button in Shadow DOM
   */
  static renderCaptureButton(options: ShadowDOMRendererOptions): { cleanup: () => void } {
    // If a controller already exists for this host, cleanup before re-render
    const existing = this.instances.get(options.hostElement)
    if (existing) existing.cleanup()

    const element = (
      <ShadowCaptureButton onCapture={options.onCapture} size={options.buttonSize || 'icon'} />
    )
    const controller = this.renderComponent({ hostElement: options.hostElement, element })
    this.instances.set(options.hostElement, controller)
    return controller
  }

  /**
   * Static method to render floating action button in Shadow DOM
   */
  static renderFloatingActionButton(options: ShadowFABRendererOptions): { cleanup: () => void } {
    // If a controller already exists for this host, cleanup before re-render
    const existing = this.instances.get(options.hostElement)
    if (existing) existing.cleanup()

    const element = (
      <ShadowFloatingActionButton
        active={options.active}
        onClick={options.onClick}
        initialPosition={options.initialPosition}
        onPositionChange={options.onPositionChange}
      />
    )
    const controller = this.renderComponent({ hostElement: options.hostElement, element })
    this.instances.set(options.hostElement, controller)
    return controller
  }

  /**
   * Static method to render contextual capture tooltip in Shadow DOM
   */
  static renderCaptureTooltip(options: ShadowTooltipRendererOptions): { cleanup: () => void } {
    // If a controller already exists for this host, cleanup before re-render
    const existing = this.instances.get(options.hostElement)
    if (existing) existing.cleanup()

    const element = (
      <ShadowCaptureTooltip
        visible={options.visible}
        anchorPosition={options.anchorPosition}
        onClose={options.onClose}
        onSelectType={options.onSelectType}
      />
    )
    const controller = this.renderComponent({ hostElement: options.hostElement, element })
    this.instances.set(options.hostElement, controller)
    return controller
  }

  /**
   * Render an arbitrary React element inside a ShadowRoot container.
   * Returns a lightweight controller with a cleanup method.
   */
  static renderComponent(options: { hostElement: Element; element: React.ReactNode }): { cleanup: () => void } {
    // Create shadow root if it doesn't exist
    const shadowRoot = options.hostElement.shadowRoot ?? options.hostElement.attachShadow({ mode: 'closed' })

    // Ensure base styles are attached
    this.attachBaseStyles(shadowRoot)

    // Create container and mount
    const container = document.createElement('div')
    container.style.cssText = `
      display: contents;
    `
    shadowRoot.appendChild(container)

    const root = createRoot(container)
    root.render(<React.StrictMode>{options.element}</React.StrictMode>)

    return {
      cleanup: () => {
        try {
          root.unmount()
        } catch (error) {
          console.debug('Failed to unmount React root:', error)
        }
      }
    }
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
  static getAllInstances(): { cleanup: () => void }[] {
    return Array.from(this.instances.values())
  }

  /**
   * Cleanup all renderer instances
   */
  static cleanupAll(): void {
    const controllers = Array.from(this.instances.values())
    controllers.forEach(ctrl => ctrl.cleanup())
    this.instances.clear()
  }
}
