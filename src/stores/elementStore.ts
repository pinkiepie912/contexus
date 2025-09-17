import { create } from "zustand";

import { dbUtils } from "~/lib/db";
import type {
  Element,
  ListElementsPayload,
  NewElementInput,
  SearchElementsPayload,
  UpdateElementPayload,
} from "~/types";

interface ElementStoreState {
  elements: Record<string, Element>;
  orderedIds: string[];
  templates: Element[];
  loading: boolean;
  error: string | null;
  total: number;
  hasMore: boolean;
  lastQuery?: SearchElementsPayload;
  initialize: () => Promise<void>;
  search: (filters?: SearchElementsPayload) => Promise<void>;
  list: (filters?: ListElementsPayload) => Promise<Element[]>;
  create: (input: NewElementInput) => Promise<Element>;
  update: (payload: UpdateElementPayload) => Promise<Element | undefined>;
  remove: (id: string) => Promise<void>;
  refreshTemplates: () => Promise<Element[]>;
  getById: (id: string) => Element | undefined;
}

export const useElementStore = create<ElementStoreState>((set, get) => ({
  elements: {},
  orderedIds: [],
  templates: [],
  loading: false,
  error: null,
  total: 0,
  hasMore: false,

  async initialize() {
    await get().search();
    await get().refreshTemplates();
  },

  async search(filters) {
    set({ loading: true, error: null });
    try {
      const searchFilters: SearchElementsPayload = {
        limit: 50,
        sortDirection: "desc",
        orderBy: "updatedAt",
        ...filters,
      };
      const { results, total, hasMore } = await dbUtils.searchElements(searchFilters);
      const map: Record<string, Element> = {};
      for (const element of results) {
        map[element.id] = element;
      }

      set({
        elements: map,
        orderedIds: results.map((element) => element.id),
        loading: false,
        error: null,
        total,
        hasMore,
        lastQuery: searchFilters,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "요소를 불러오는 데 실패했습니다.",
        loading: false,
      });
    }
  },

  async list(filters) {
    return dbUtils.listElements(filters);
  },

  async create(input) {
    const element = await dbUtils.createElement(input);
    set((state) => ({
      elements: { ...state.elements, [element.id]: element },
      orderedIds: [element.id, ...state.orderedIds],
      total: state.total + 1,
    }));
    await get().refreshTemplates();
    return element;
  },

  async update({ id, updates }) {
    const updated = await dbUtils.updateElement({ id, updates });
    if (!updated) {
      return undefined;
    }

    set((state) => ({
      elements: { ...state.elements, [updated.id]: updated },
    }));
    await get().refreshTemplates();
    return updated;
  },

  async remove(id) {
    await dbUtils.deleteElement({ id });
    set((state) => {
      const nextElements = { ...state.elements };
      delete nextElements[id];
      return {
        elements: nextElements,
        orderedIds: state.orderedIds.filter((elementId) => elementId !== id),
        total: Math.max(0, state.total - 1),
      };
    });
    await get().refreshTemplates();
  },

  async refreshTemplates() {
    const templates = await dbUtils.getTemplatesWithSlots();
    set({ templates });
    return templates;
  },

  getById(id) {
    const state = get();
    return state.elements[id];
  },
}));
