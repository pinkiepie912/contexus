import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";

import type { BuilderElement, BuilderState, BuilderTemplate, Element } from "~/types";

interface BuilderStoreState extends BuilderState {
  draggingElementId: string | null;
  addElement: (element: Element) => string;
  removeElement: (builderElementId: string) => void;
  assignSlot: (templateId: string, slotId: string, element: Element) => void;
  unassignSlot: (templateId: string, slotId: string) => void;
  setSelectedTemplate: (element: Element | undefined) => void;
  setDraggingElement: (elementId?: string) => void;
  reset: () => void;
  hydrateFromTemplate: (
    template: BuilderTemplate,
    resolver: (elementId: string) => Element | undefined,
  ) => void;
  buildPreview: () => string;
}

const initialState: BuilderState = {
  elements: [],
  selectedTemplate: null,
  isDirty: false,
};

export const useBuilderStore = create<BuilderStoreState>((set, get) => ({
  ...initialState,
  draggingElementId: null,

  addElement(element) {
    const builderElement: BuilderElement = {
      id: uuidv4(),
      element,
    };

    set((state) => {
      // If adding a template element, automatically set it as selected template
      const newState: Partial<BuilderStoreState> = {
        elements: [...state.elements, builderElement],
        isDirty: true,
      };

      if (element.type === 'template') {
        newState.selectedTemplate = element;
      }

      return newState;
    });

    return builderElement.id;
  },

  removeElement(builderElementId) {
    set((state) => ({
      elements: state.elements.filter((entry) => entry.id !== builderElementId),
      isDirty: true,
    }));
  },

  assignSlot(templateId, slotId, element) {
    set((state) => ({
      elements: state.elements.map((entry) => {
        if (entry.id !== templateId) {
          return entry;
        }

        return {
          ...entry,
          slotAssignments: {
            ...(entry.slotAssignments ?? {}),
            [slotId]: element,
          },
        };
      }),
      isDirty: true,
    }));
  },

  unassignSlot(templateId, slotId) {
    set((state) => ({
      elements: state.elements.map((entry) => {
        if (entry.id !== templateId || !entry.slotAssignments) {
          return entry;
        }

        const { [slotId]: _removed, ...rest } = entry.slotAssignments;
        return {
          ...entry,
          slotAssignments: rest,
        };
      }),
      isDirty: true,
    }));
  },

  setSelectedTemplate(element) {
    if (!element) {
      set(() => ({ selectedTemplate: null, isDirty: true }));
      return;
    }

    // Ensure template is present as the first builder element for easier lookup.
    set((state) => {
      const existingTemplateEntry = state.elements.find((entry) => entry.element.id === element.id);
      let elements = state.elements;

      if (!existingTemplateEntry) {
        const templateEntry: BuilderElement = {
          id: uuidv4(),
          element,
        };
        elements = [templateEntry, ...state.elements];
      }

      return {
        selectedTemplate: element,
        elements,
        isDirty: true,
      };
    });
  },

  setDraggingElement(elementId) {
    set({ draggingElementId: elementId ?? null });
  },

  reset() {
    set({ ...initialState, draggingElementId: null });
  },

  hydrateFromTemplate(template, resolver) {
    const elementIds = template.elementIds ?? [];
    const elements: BuilderElement[] = [];

    for (const elementId of elementIds) {
      if (template.selectedTemplateId && elementId === template.selectedTemplateId) {
        continue;
      }
      const resolved = resolver(elementId);
      if (!resolved) {
        continue;
      }

      const builderElement: BuilderElement = {
        id: uuidv4(),
        element: resolved,
        slotAssignments: {},
      };

      elements.push(builderElement);
    }

    const selectedTemplate = template.selectedTemplateId
      ? resolver(template.selectedTemplateId)
      : undefined;

    if (selectedTemplate) {
      const templateEntry: BuilderElement = {
        id: uuidv4(),
        element: selectedTemplate,
        slotAssignments: { ...mapSlotAssignments(template.slotAssignments, resolver) },
      };

      elements.unshift(templateEntry);
    }

    set({
      elements,
      selectedTemplate: selectedTemplate ?? null,
      isDirty: false,
    });
  },

  buildPreview() {
    const state = get();
    // Use the new prompt engine for better processing
    return state.elements.map((entry) => entry.element.content).join("\n\n");
  },
}));

function mapSlotAssignments(
  assignments: Record<string, string>,
  resolver: (elementId: string) => Element | undefined,
): Record<string, Element> {
  return Object.entries(assignments).reduce<Record<string, Element>>((acc, [slotId, elementId]) => {
    const element = resolver(elementId);
    if (element) {
      acc[slotId] = element;
    }
    return acc;
  }, {});
}
