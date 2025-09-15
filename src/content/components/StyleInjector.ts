/**
 * Style Injector
 *
 * Manages CSS injection into the host page for capture button styles.
 * Ensures styles are loaded once and properly scoped.
 */

export class StyleInjector {
  private static injectedStyles = new Set<string>();
  private static readonly STYLE_ID_PREFIX = 'contexus-styles-';

  /**
   * Inject CSS styles into the document head
   */
  static injectStyles(styleId: string, cssContent: string): void {
    // Avoid duplicate injection
    if (this.injectedStyles.has(styleId)) {
      return;
    }

    const fullStyleId = this.STYLE_ID_PREFIX + styleId;

    // Check if already injected by ID
    if (document.getElementById(fullStyleId)) {
      this.injectedStyles.add(styleId);
      return;
    }

    // Create and inject style element
    const styleElement = document.createElement('style');
    styleElement.id = fullStyleId;
    styleElement.type = 'text/css';
    styleElement.textContent = cssContent;

    // Add to document head
    document.head.appendChild(styleElement);
    this.injectedStyles.add(styleId);

    console.log(`[StyleInjector] Injected styles: ${styleId}`);
  }

  /**
   * Remove injected styles
   */
  static removeStyles(styleId: string): void {
    const fullStyleId = this.STYLE_ID_PREFIX + styleId;
    const styleElement = document.getElementById(fullStyleId);

    if (styleElement) {
      styleElement.remove();
      this.injectedStyles.delete(styleId);
      console.log(`[StyleInjector] Removed styles: ${styleId}`);
    }
  }

  /**
   * Check if styles are already injected
   */
  static areStylesInjected(styleId: string): boolean {
    return this.injectedStyles.has(styleId);
  }

  /**
   * Inject capture button styles (Phase 2: Complete CSS system)
   */
  static injectCaptureButtonStyles(): void {
    // Main capture button styles
    const mainCSS = this.getMainCaptureButtonCSS();
    this.injectStyles('capture-button-main', mainCSS);

    // Platform-specific adjustments
    const platformCSS = this.getPlatformSpecificCSS();
    if (platformCSS) {
      this.injectStyles('capture-button-platform', platformCSS);
    }
  }

  /**
   * Get main capture button CSS styles
   */
  private static getMainCaptureButtonCSS(): string {
    return `
      /* Main capture button styling */
      .contexus-capture-btn {
        background: transparent !important;
        border: none !important;
        padding: 0 !important;
        margin: 0 !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        cursor: pointer !important;
        transition: opacity 0.2s ease !important;
        outline: none !important;
        box-shadow: none !important;
        vertical-align: middle !important;
      }

      .contexus-capture-btn:hover {
        background: transparent !important;
        transform: scale(1.05) !important;
        transition: transform 0.15s ease !important;
      }

      .contexus-capture-btn:active {
        transform: scale(0.95) !important;
        transition: transform 0.1s ease !important;
      }

      .contexus-capture-btn:focus-visible {
        outline: 2px solid rgba(79, 70, 229, 0.6) !important;
        outline-offset: 2px !important;
        border-radius: 4px !important;
      }

      /* Icon styling */
      .contexus-capture-icon {
        display: block !important;
        object-fit: contain !important;
        border-radius: 4px !important;
        flex-shrink: 0 !important;
        pointer-events: none !important;
      }

      /* Success feedback animation */
      .contexus-capture-feedback {
        outline: 2px solid rgba(34, 211, 238, 0.8) !important;
        outline-offset: 2px !important;
        border-radius: 4px !important;
        animation: contexus-pulse 0.5s ease-out !important;
      }

      /* Loading state */
      .contexus-capture-btn[data-loading="true"] {
        opacity: 0.7 !important;
        pointer-events: none !important;
        cursor: default !important;
      }

      /* Error state */
      .contexus-capture-btn[data-error="true"] {
        outline: 2px solid rgba(239, 68, 68, 0.8) !important;
        outline-offset: 2px !important;
        border-radius: 4px !important;
        animation: contexus-shake 0.3s ease-out !important;
      }

      /* Animations */
      @keyframes contexus-pulse {
        0% {
          outline-color: rgba(34, 211, 238, 0.8);
          transform: scale(1);
        }
        50% {
          outline-color: rgba(34, 211, 238, 0.4);
          transform: scale(1.02);
        }
        100% {
          outline-color: rgba(34, 211, 238, 0.8);
          transform: scale(1);
        }
      }

      @keyframes contexus-shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-2px); }
        75% { transform: translateX(2px); }
      }

      /* Responsive adjustments for different viewport sizes */
      @media (max-width: 768px) {
        .contexus-capture-btn {
          min-width: 32px !important;
          min-height: 32px !important;
        }

        .contexus-capture-icon {
          min-width: 20px !important;
          min-height: 20px !important;
        }
      }

      /* High contrast mode support */
      @media (prefers-contrast: high) {
        .contexus-capture-btn:focus-visible {
          outline: 3px solid currentColor !important;
          outline-offset: 3px !important;
        }

        .contexus-capture-feedback {
          outline: 3px solid #00bcd4 !important;
          outline-offset: 3px !important;
        }

        .contexus-capture-btn[data-error="true"] {
          outline: 3px solid #f44336 !important;
          outline-offset: 3px !important;
        }
      }

      /* Reduced motion support */
      @media (prefers-reduced-motion: reduce) {
        .contexus-capture-btn,
        .contexus-capture-btn:hover,
        .contexus-capture-btn:active {
          transition: none !important;
          transform: none !important;
        }

        .contexus-capture-feedback,
        .contexus-capture-btn[data-error="true"] {
          animation: none !important;
        }
      }

      /* Dark mode adjustments */
      @media (prefers-color-scheme: dark) {
        .contexus-capture-btn:focus-visible {
          outline-color: rgba(129, 140, 248, 0.8) !important;
        }

        .contexus-capture-feedback {
          outline-color: rgba(34, 211, 238, 0.9) !important;
        }

        .contexus-capture-btn[data-error="true"] {
          outline-color: rgba(248, 113, 113, 0.9) !important;
        }
      }
    `;
  }

  /**
   * Get platform-specific CSS adjustments
   */
  private static getPlatformSpecificCSS(): string {
    const platform = document.documentElement.getAttribute('data-contexus-platform');

    switch (platform) {
      case 'openai':
        return `
          .contexus-capture-btn {
            margin-left: 4px !important;
          }
        `;
      case 'gemini':
        return `
          .contexus-capture-btn {
            align-self: center !important;
          }
        `;
      case 'claude':
        return `
          .contexus-capture-btn {
            margin-left: 2px !important;
          }
        `;
      default:
        return '';
    }
  }

  /**
   * Get all injected style IDs
   */
  static getInjectedStyles(): string[] {
    return Array.from(this.injectedStyles);
  }

  /**
   * Clean up all injected styles
   */
  static cleanup(): void {
    const styleIds = Array.from(this.injectedStyles);
    styleIds.forEach(styleId => this.removeStyles(styleId));
    this.injectedStyles.clear();
  }
}