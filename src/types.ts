/**
 * Shared type definitions for the Contexus Chrome Extension.
 *
 * Phase 1 introduces a unified Element-centric data model that replaces the
 * legacy Snippet/Role separation. The types in this module are referenced
 * across the background service worker, IndexedDB layer, side panel UI, and
 * messaging utilities.
 */

/** Element categories supported by the prompt builder. */
export type ElementType = "template" | "context" | "example" | "role";

/**
 * Definition of a reusable prompt element.
 * All element types share a consistent core set of fields with optional
 * extensions for template/role specific metadata.
 */
export interface Element {
  id: string;
  type: ElementType;
  trigger: string;
  title: string;
  content: string;
  description?: string | undefined;
  tags?: string[] | undefined;
  createdAt: Date;
  updatedAt?: Date | undefined;
  isFavorite?: boolean | undefined;
  usageCount: number;
  requiredSlots?: SlotDefinition[] | undefined;
  category?: string | undefined;
  promptTemplate?: string | undefined;
}

/** Template slot definition used by builder templates. */
export interface SlotDefinition {
  id: string;
  name: string;
  type: ElementType | "text";
  required: boolean;
  placeholder?: string;
}

/** Builder element used when composing prompts. */
export interface BuilderElement {
  id: string;
  element: Element;
  slotAssignments?: Record<string, Element> | undefined;
}

/** Zustand builder store state shape. */
export interface BuilderState {
  elements: BuilderElement[];
  selectedTemplate: Element | null;
  isDirty: boolean;
}

/** Persisted builder template snapshot stored in IndexedDB. */
export interface BuilderTemplate {
  id: string;
  name: string;
  description?: string | undefined;
  selectedTemplateId?: string | undefined;
  elementIds: string[];
  slotAssignments: Record<string, string>;
  createdAt: Date;
  updatedAt?: Date | undefined;
  usageCount: number;
}

/** Generic paginated response type used by many list/search APIs. */
export interface SearchResponse<T> {
  results: T[];
  total: number;
  hasMore: boolean;
}

/** Payload used when creating a new element. */
export interface CreateElementPayload {
  element: NewElementInput;
}

/** Payload used when updating an existing element. */
export interface UpdateElementPayload {
  id: string;
  updates: Partial<Omit<Element, "id" | "createdAt" | "usageCount">> & {
    updatedAt?: Date;
    usageCount?: number;
  };
}

/** Payload used when deleting an element. */
export interface DeleteElementPayload {
  id: string;
}

/** Payload for retrieving a single element by id. */
export interface GetElementByIdPayload {
  id: string;
}

/** Payload for searching elements with filters. */
export interface SearchElementsPayload {
  query?: string;
  types?: ElementType[];
  tags?: string[];
  limit?: number;
  offset?: number;
  favoritesOnly?: boolean;
  orderBy?: "createdAt" | "updatedAt" | "usageCount";
  sortDirection?: "asc" | "desc";
}

/** Payload used for listing elements by type or trigger. */
export interface ListElementsPayload {
  type?: ElementType;
  trigger?: string;
  limit?: number;
  offset?: number;
}

/** Payload for saving a builder template snapshot. */
export interface SaveBuilderTemplatePayload {
  template: NewBuilderTemplateInput;
}

/** Payload for updating an existing builder template. */
export interface UpdateBuilderTemplatePayload {
  id: string;
  updates: Partial<Omit<BuilderTemplate, "id" | "createdAt" | "usageCount">> & {
    updatedAt?: Date;
    usageCount?: number;
  };
}

/** Payload for deleting a builder template. */
export interface DeleteBuilderTemplatePayload {
  id: string;
}

/** Payload for incrementing element usage counts. */
export interface IncrementElementUsagePayload {
  id: string;
  delta?: number;
}

/** Enumerates chrome.runtime message types supported after the refactor. */
export type MessageType =
  | "CREATE_ELEMENT"
  | "UPDATE_ELEMENT"
  | "DELETE_ELEMENT"
  | "GET_ELEMENT_BY_ID"
  | "SEARCH_ELEMENTS"
  | "LIST_ELEMENTS"
  | "SAVE_BUILDER_TEMPLATE"
  | "UPDATE_BUILDER_TEMPLATE"
  | "DELETE_BUILDER_TEMPLATE"
  | "LIST_BUILDER_TEMPLATES"
  | "INCREMENT_ELEMENT_USAGE";

/** Base chrome.runtime message interface. */
export interface ChromeMessage<TPayload = unknown> {
  type: MessageType;
  payload?: TPayload | undefined;
}

/** Convenience type for creating new elements. */
export type NewElementInput = Omit<Element, "id" | "createdAt" | "updatedAt" | "usageCount"> & {
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
  usageCount?: number;
};

/** Convenience type for creating new builder templates. */
export type NewBuilderTemplateInput = Omit<
  BuilderTemplate,
  "id" | "createdAt" | "updatedAt" | "usageCount"
> & {
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
  usageCount?: number;
};
