// src/background/handlers/_registry.ts
import {
  createElement,
  updateElement,
  deleteElement,
  getElementById,
  listElements,
  searchElements,
} from "./elements";
import {
  saveBuilderTemplate,
  updateBuilderTemplate,
  deleteBuilderTemplate,
  listBuilderTemplates,
} from "./templates";
import { incrementElementUsage } from "./usage";
import { openSidePanel, openSidePanelForSave } from "./sidepanel";

export const handlers = {
  // Elements
  CREATE_ELEMENT: createElement,
  UPDATE_ELEMENT: updateElement,
  DELETE_ELEMENT: deleteElement,
  GET_ELEMENT_BY_ID: getElementById,
  LIST_ELEMENTS: listElements,
  SEARCH_ELEMENTS: searchElements,

  // Templates
  SAVE_BUILDER_TEMPLATE: saveBuilderTemplate,
  UPDATE_BUILDER_TEMPLATE: updateBuilderTemplate,
  DELETE_BUILDER_TEMPLATE: deleteBuilderTemplate,
  LIST_BUILDER_TEMPLATES: listBuilderTemplates,

  // Usage
  INCREMENT_ELEMENT_USAGE: incrementElementUsage,

  // Sidepanel
  OPEN_SIDEPANEL: openSidePanel,
  OPEN_SIDEPANEL_FOR_SAVE: openSidePanelForSave,
} as const;
