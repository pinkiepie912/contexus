/**
 * Capture Button Renderer Component
 *
 * Optimized button creation and rendering for message capture functionality.
 * Separates UI concerns from business logic and provides caching for performance.
 */

import type { PlatformAdapter } from '../../adapters/types';

export type CaptureHandler = (event: Event) => Promise<void>;

export interface CaptureButtonOptions {
  messageElement: Element;
  actionBar: Element;
  onCapture: CaptureHandler;
  adapter: PlatformAdapter;
}

export interface IconSizeCache {
  width: number;
  height: number;
}

/**
 * CaptureButtonRenderer - Handles all capture button creation and styling
 */
export class CaptureButtonRenderer {
  private static readonly DEFAULT_ICON_SIZE = { width: 24, height: 24 };
  private static readonly CSS_CLASSES = {
    BUTTON: 'contexus-capture-btn',
    ICON: 'contexus-capture-icon',
    FEEDBACK: 'contexus-capture-feedback'
  } as const;

  // Cache for icon sizes to avoid repeated DOM measurements
  private static iconSizeCache = new WeakMap<Element, IconSizeCache>();

  // Cache for generated SVG icons
  private static svgIconCache = new Map<string, string>();

  /**
   * Main entry point for rendering a capture button
   */
  static render(options: CaptureButtonOptions): HTMLButtonElement {
    const { actionBar, onCapture } = options;

    // Check for existing button to avoid duplicates
    if (actionBar.querySelector(`.${this.CSS_CLASSES.BUTTON}`)) {
      throw new Error('[CaptureButtonRenderer] Button already exists in action bar');
    }

    const button = this.createButton(onCapture);
    const icon = this.createIcon(actionBar);

    button.appendChild(icon);

    return button;
  }

  /**
   * Create the main button element with optimized styling
   */
  private static createButton(onCapture: CaptureHandler): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = this.CSS_CLASSES.BUTTON;
    btn.title = 'Save with Contexus';
    btn.setAttribute('aria-label', 'Save with Contexus');

    // Apply base styles (will be moved to CSS in Phase 2)
    this.applyButtonStyles(btn);

    // Add click handler with proper error handling
    btn.addEventListener('click', this.createClickHandler(onCapture), {
      capture: true,
      passive: false
    });

    return btn;
  }

  /**
   * Create icon element with size optimization and caching
   */
  private static createIcon(actionBar: Element): HTMLImageElement {
    const img = document.createElement('img');
    img.className = this.CSS_CLASSES.ICON;
    img.alt = 'Contexus';
    img.decoding = 'async';

    // Apply base icon styles
    this.applyIconStyles(img);

    // Get optimized size from cache or compute
    const { width, height } = this.getOptimizedIconSize(actionBar);
    img.style.width = `${width}px`;
    img.style.height = `${height}px`;

    // Set SVG source with caching
    const sizeKey = `${width}x${height}`;
    img.src = this.getCachedSVG(sizeKey, width, height);

    return img;
  }

  /**
   * Get optimized icon size with caching
   */
  private static getOptimizedIconSize(actionBar: Element): IconSizeCache {
    // Check cache first
    if (this.iconSizeCache.has(actionBar)) {
      return this.iconSizeCache.get(actionBar)!;
    }

    // Compute size from sibling elements
    const computedSize = this.computeSiblingIconSize(actionBar);

    // Cache the result
    this.iconSizeCache.set(actionBar, computedSize);

    return computedSize;
  }

  /**
   * Compute icon size based on sibling elements
   */
  private static computeSiblingIconSize(actionBar: Element): IconSizeCache {
    // Try to find an existing icon to match size
    const siblingIcon = actionBar.querySelector('svg, img, span[class*="icon"], i') as HTMLElement;
    if (siblingIcon) {
      const computedStyle = getComputedStyle(siblingIcon);
      const width = parseFloat(computedStyle.width);
      const height = parseFloat(computedStyle.height);

      if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0) {
        return { width, height };
      }
    }

    // Fallback: infer from button size
    const siblingButton = actionBar.querySelector('button, a[role="button"]') as HTMLElement;
    if (siblingButton) {
      const computedStyle = getComputedStyle(siblingButton);
      const buttonHeight = parseFloat(computedStyle.height);

      if (Number.isFinite(buttonHeight) && buttonHeight > 0) {
        const size = Math.min(buttonHeight - 4, 32); // Leave some padding, max 32px
        return { width: size, height: size };
      }
    }

    // Final fallback
    return this.DEFAULT_ICON_SIZE;
  }

  /**
   * Get cached SVG icon or generate new one
   */
  private static getCachedSVG(sizeKey: string, width: number, height: number): string {
    if (this.svgIconCache.has(sizeKey)) {
      return this.svgIconCache.get(sizeKey)!;
    }

    const svg = this.generateSVGIcon(width, height);
    this.svgIconCache.set(sizeKey, svg);

    return svg;
  }

  /**
   * Generate SVG icon data URL
   */
  private static generateSVGIcon(width: number, height: number): string {
    const svg = encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="${width}" height="${height}">
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#4f46e5"/>
            <stop offset="100%" stop-color="#22d3ee"/>
          </linearGradient>
        </defs>
        <rect x="4" y="4" width="40" height="40" rx="10" fill="url(#g)"/>
        <text x="24" y="30" text-anchor="middle" font-size="20" font-family="system-ui,Segoe UI,Arial" fill="white" font-weight="700">C</text>
      </svg>
    `);

    return `data:image/svg+xml;charset=utf-8,${svg}`;
  }

  /**
   * Create click handler with proper error handling and feedback
   */
  private static createClickHandler(onCapture: CaptureHandler): (event: Event) => Promise<void> {
    return async (event: Event) => {
      event.preventDefault();
      event.stopPropagation();

      const button = (event.target as HTMLElement).closest('button');
      if (!button) return;

      try {
        // Add loading state
        button.style.opacity = '0.7';
        button.style.pointerEvents = 'none';

        // Execute capture
        await onCapture(event);

        // Show success feedback
        this.showSuccessFeedback(button);

      } catch (error) {
        console.warn('[CaptureButtonRenderer] Capture failed:', error);
        this.showErrorFeedback(button);
      } finally {
        // Reset button state
        button.style.opacity = '';
        button.style.pointerEvents = '';
      }
    };
  }

  /**
   * Show success feedback animation
   */
  private static showSuccessFeedback(button: HTMLElement): void {
    button.classList.add(this.CSS_CLASSES.FEEDBACK);

    setTimeout(() => {
      button.classList.remove(this.CSS_CLASSES.FEEDBACK);
    }, 500);
  }

  /**
   * Show error feedback animation
   */
  private static showErrorFeedback(button: HTMLElement): void {
    button.style.outline = '2px solid rgba(239, 68, 68, 0.8)';
    button.style.outlineOffset = '2px';

    setTimeout(() => {
      button.style.outline = '';
      button.style.outlineOffset = '';
    }, 1000);
  }

  /**
   * Apply CSS classes only (Phase 2: No more inline styles)
   */
  private static applyButtonStyles(_button: HTMLButtonElement): void {
    // All styles now handled by CSS classes
    // No inline styles needed
  }

  /**
   * Apply CSS classes only (Phase 2: No more inline styles)
   */
  private static applyIconStyles(_icon: HTMLImageElement): void {
    // All styles now handled by CSS classes
    // No inline styles needed
  }

  /**
   * Clear all caches (for cleanup)
   */
  static clearCaches(): void {
    this.iconSizeCache = new WeakMap();
    this.svgIconCache.clear();
  }

  /**
   * Get cache statistics for debugging
   */
  static getCacheStats(): { svgCacheSize: number } {
    return {
      svgCacheSize: this.svgIconCache.size
    };
  }
}