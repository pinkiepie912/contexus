import type { Element, BuilderElement, SlotDefinition } from "~/types";

/**
 * Prompt Engine - Handles template + slot → final prompt conversion
 *
 * Features:
 * - Template variable substitution
 * - Slot content injection
 * - Validation and error handling
 * - Multiple output formats
 */

export interface PromptValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  missingRequiredSlots: string[];
}

export interface PromptBuildOptions {
  includeMetadata?: boolean;
  format?: 'plain' | 'structured' | 'markdown';
  separator?: string;
  validateOnly?: boolean;
}

export interface PromptBuildResult {
  prompt: string;
  validation: PromptValidationResult;
  metadata: {
    templateUsed: boolean;
    elementsCount: number;
    slotsCount: number;
    requiredSlotsFilled: number;
    characterCount: number;
    wordCount: number;
  };
}

/**
 * Main Prompt Engine class
 */
export class PromptEngine {
  private static readonly SLOT_PLACEHOLDER_REGEX = /\{([^}]+)\}/g;
  private static readonly DEFAULT_SEPARATOR = "\n\n";

  /**
   * Build a complete prompt from builder elements
   */
  static buildPrompt(
    elements: BuilderElement[],
    selectedTemplate: Element | null,
    options: PromptBuildOptions = {}
  ): PromptBuildResult {
    const {
      includeMetadata = false,
      format = 'plain',
      separator = this.DEFAULT_SEPARATOR,
      validateOnly = false,
    } = options;

    // Initialize result
    const result: PromptBuildResult = {
      prompt: '',
      validation: {
        isValid: true,
        errors: [],
        warnings: [],
        missingRequiredSlots: [],
      },
      metadata: {
        templateUsed: selectedTemplate !== null,
        elementsCount: elements.length,
        slotsCount: 0,
        requiredSlotsFilled: 0,
        characterCount: 0,
        wordCount: 0,
      },
    };

    // Early return if no elements
    if (elements.length === 0) {
      result.validation.errors.push('No elements provided');
      result.validation.isValid = false;
      return result;
    }

    try {
      let promptParts: string[] = [];

      if (selectedTemplate) {
        // Template-based prompt building
        const templateResult = this.buildTemplatePrompt(
          elements,
          selectedTemplate,
          separator
        );
        result.validation = { ...result.validation, ...templateResult.validation };
        result.metadata.slotsCount = templateResult.metadata.slotsCount;
        result.metadata.requiredSlotsFilled = templateResult.metadata.requiredSlotsFilled;
        promptParts = templateResult.parts;
      } else {
        // Simple element concatenation
        promptParts = elements
          .map(builderElement => this.processElementContent(builderElement.element))
          .filter(Boolean);
      }

      // Build final prompt based on format
      const prompt = this.formatPrompt(promptParts, format, separator, includeMetadata);

      // Update metadata
      result.prompt = validateOnly ? '' : prompt;
      result.metadata.characterCount = prompt.length;
      result.metadata.wordCount = this.countWords(prompt);

      // Final validation
      this.performFinalValidation(result);

    } catch (error) {
      result.validation.errors.push(`Build failed: ${error instanceof Error ? error.message : String(error)}`);
      result.validation.isValid = false;
    }

    return result;
  }

  /**
   * Build prompt using template and slots
   */
  private static buildTemplatePrompt(
    elements: BuilderElement[],
    selectedTemplate: Element,
    separator: string
  ): {
    parts: string[];
    validation: Partial<PromptValidationResult>;
    metadata: { slotsCount: number; requiredSlotsFilled: number };
  } {
    const validation: Partial<PromptValidationResult> = {
      errors: [],
      warnings: [],
      missingRequiredSlots: [],
    };

    const templateElement = elements.find(
      builderElement => builderElement.element.id === selectedTemplate.id
    );

    if (!templateElement) {
      validation.errors!.push('Selected template not found in elements');
      return {
        parts: [],
        validation,
        metadata: { slotsCount: 0, requiredSlotsFilled: 0 },
      };
    }

    const requiredSlots = selectedTemplate.requiredSlots || [];
    const slotAssignments = templateElement.slotAssignments || {};

    // Process template content
    let processedTemplate = this.processElementContent(selectedTemplate);

    // Handle slot substitution if template has placeholders
    if (this.SLOT_PLACEHOLDER_REGEX.test(processedTemplate)) {
      processedTemplate = this.processTemplateVariables(
        processedTemplate,
        requiredSlots,
        slotAssignments,
        validation
      );
    }

    // Collect slot contents for appending
    const slotContents: string[] = [];
    let requiredSlotsFilled = 0;

    for (const slot of requiredSlots) {
      const assignedElement = slotAssignments[slot.id];

      if (assignedElement) {
        const slotContent = this.processElementContent(assignedElement);
        if (slotContent) {
          slotContents.push(`${slot.name}: ${slotContent}`);
        }
        if (slot.required) requiredSlotsFilled++;
      } else if (slot.required) {
        validation.missingRequiredSlots!.push(slot.name);
        if (slot.required) {
          validation.warnings!.push(`Required slot '${slot.name}' is empty`);
        }
      }
    }

    // Build parts array
    const parts: string[] = [processedTemplate, ...slotContents].filter(Boolean);

    return {
      parts,
      validation,
      metadata: {
        slotsCount: requiredSlots.length,
        requiredSlotsFilled,
      },
    };
  }

  /**
   * Process template variables/placeholders
   */
  private static processTemplateVariables(
    template: string,
    slots: SlotDefinition[],
    assignments: Record<string, Element>,
    validation: Partial<PromptValidationResult>
  ): string {
    return template.replace(this.SLOT_PLACEHOLDER_REGEX, (match, slotName) => {
      const slot = slots.find(s => s.name === slotName || s.id === slotName);

      if (!slot) {
        validation.warnings!.push(`Unknown slot placeholder: ${slotName}`);
        return match; // Keep original placeholder
      }

      const assignedElement = assignments[slot.id];
      if (assignedElement) {
        return this.processElementContent(assignedElement);
      }

      if (slot.required) {
        return `[${slot.name}]`; // Placeholder for required but empty slots
      }

      return ''; // Remove optional empty slots
    });
  }

  /**
   * Process individual element content
   */
  private static processElementContent(element: Element): string {
    // Use promptTemplate if available (for role elements), otherwise use content
    const content = element.type === 'role' && element.promptTemplate
      ? element.promptTemplate
      : element.content;

    // Basic processing - could be extended for variable substitution, etc.
    return content.trim();
  }

  /**
   * Format the final prompt based on specified format
   */
  private static formatPrompt(
    parts: string[],
    format: 'plain' | 'structured' | 'markdown',
    separator: string,
    includeMetadata: boolean
  ): string {
    if (parts.length === 0) return '';

    switch (format) {
      case 'structured':
        return parts.map((part, index) => `${index + 1}. ${part}`).join(separator);

      case 'markdown':
        return parts.map((part, index) => {
          const title = index === 0 ? '## Main Prompt' : `### Section ${index}`;
          return `${title}\n\n${part}`;
        }).join(separator);

      case 'plain':
      default:
        return parts.join(separator);
    }
  }

  /**
   * Validate the built prompt
   */
  static validatePrompt(
    elements: BuilderElement[],
    selectedTemplate: Element | null
  ): PromptValidationResult {
    const result = this.buildPrompt(elements, selectedTemplate, { validateOnly: true });
    return result.validation;
  }

  /**
   * Perform final validation checks
   */
  private static performFinalValidation(result: PromptBuildResult): void {
    // Check for minimum content requirements
    if (result.metadata.characterCount < 10) {
      result.validation.warnings.push('Prompt is very short');
    }

    // Check for template consistency
    if (result.metadata.templateUsed && result.metadata.slotsCount > 0) {
      const filledRatio = result.metadata.requiredSlotsFilled / result.metadata.slotsCount;
      if (filledRatio < 0.5) {
        result.validation.warnings.push('Many template slots are unfilled');
      }
    }

    // Set overall validity
    result.validation.isValid = result.validation.errors.length === 0;
  }

  /**
   * Count words in text
   */
  private static countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Utility: Extract variables from template string
   */
  static extractTemplateVariables(template: string): string[] {
    const matches = template.match(this.SLOT_PLACEHOLDER_REGEX);
    return matches ? matches.map(match => match.slice(1, -1)) : [];
  }

  /**
   * Utility: Preview prompt length and stats
   */
  static getPromptStats(
    elements: BuilderElement[],
    selectedTemplate: Element | null
  ): {
    characterCount: number;
    wordCount: number;
    elementsCount: number;
    hasTemplate: boolean;
    isValid: boolean;
  } {
    const result = this.buildPrompt(elements, selectedTemplate, { validateOnly: true });
    return {
      characterCount: result.metadata.characterCount,
      wordCount: result.metadata.wordCount,
      elementsCount: result.metadata.elementsCount,
      hasTemplate: result.metadata.templateUsed,
      isValid: result.validation.isValid,
    };
  }
}