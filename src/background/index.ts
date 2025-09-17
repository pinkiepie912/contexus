/**
 * Background service worker for the Contexus Chrome Extension.
 * Updated to support the Element-centric data model introduced in Phase 1.
 */

import { db, dbUtils } from "~/lib/db";
import type {
  ChromeMessage,
  CreateElementPayload,
  DeleteBuilderTemplatePayload,
  DeleteElementPayload,
  IncrementElementUsagePayload,
  ListElementsPayload,
  SaveBuilderTemplatePayload,
  SearchElementsPayload,
  UpdateBuilderTemplatePayload,
  UpdateElementPayload,
} from "~/types";
import type { BuilderTemplate, Element, SearchResponse } from "~/types";

chrome.runtime.onInstalled.addListener(async (details) => {
  console.log("[Contexus SW] Extension installed/updated:", details.reason);

  try {
    await db.open();
    const stats = await db.getStats();
    console.log("[Contexus SW] Database ready:", stats);

    if (details.reason === "install") {
      chrome.notifications?.create({
        type: "basic",
        iconUrl: "/icons/icon48.png",
        title: "Contexus Extension Installed",
        message: "Prompt Studio is ready to use.",
      });
    }
  } catch (error) {
    console.error("[Contexus SW] Database initialization failed:", error);
  }
});

chrome.runtime.onMessage.addListener((
  message: ChromeMessage,
  _sender: chrome.runtime.MessageSender,
  sendResponse: (response?: unknown) => void,
) => {
  console.log("[Contexus SW] Received message:", message.type);

  switch (message.type) {
    case "CREATE_ELEMENT":
      handleCreateElement(message.payload as CreateElementPayload, sendResponse);
      return true;
    case "UPDATE_ELEMENT":
      handleUpdateElement(message.payload as UpdateElementPayload, sendResponse);
      return true;
    case "DELETE_ELEMENT":
      handleDeleteElement(message.payload as DeleteElementPayload, sendResponse);
      return true;
    case "GET_ELEMENT_BY_ID":
      handleGetElementById(message.payload as { id: string }, sendResponse);
      return true;
    case "SEARCH_ELEMENTS":
      handleSearchElements(message.payload as SearchElementsPayload | undefined, sendResponse);
      return true;
    case "LIST_ELEMENTS":
      handleListElements(message.payload as ListElementsPayload | undefined, sendResponse);
      return true;
    case "SAVE_BUILDER_TEMPLATE":
      handleSaveBuilderTemplate(message.payload as SaveBuilderTemplatePayload, sendResponse);
      return true;
    case "UPDATE_BUILDER_TEMPLATE":
      handleUpdateBuilderTemplate(message.payload as UpdateBuilderTemplatePayload, sendResponse);
      return true;
    case "DELETE_BUILDER_TEMPLATE":
      handleDeleteBuilderTemplate(message.payload as DeleteBuilderTemplatePayload, sendResponse);
      return true;
    case "LIST_BUILDER_TEMPLATES":
      handleListBuilderTemplates(sendResponse);
      return true;
    case "INCREMENT_ELEMENT_USAGE":
      handleIncrementElementUsage(message.payload as IncrementElementUsagePayload, sendResponse);
      return true;
    default:
      if ((message as any)?.ping) {
        sendResponse({ pong: true, at: Date.now() });
        return true;
      }

      console.warn("[Contexus SW] Unknown message type:", message.type);
      sendResponse({ error: "Unknown message type" });
      return false;
  }
});

async function handleCreateElement(
  payload: CreateElementPayload,
  sendResponse: (response: Element | { error: string }) => void,
): Promise<void> {
  try {
    const element = await dbUtils.createElement(payload.element);
    sendResponse(element);
  } catch (error) {
    console.error("[Contexus SW] Error creating element:", error);
    sendResponse({ error: error instanceof Error ? error.message : "Failed to create element" });
  }
}

async function handleUpdateElement(
  payload: UpdateElementPayload,
  sendResponse: (response: Element | undefined | { error: string }) => void,
): Promise<void> {
  try {
    const element = await dbUtils.updateElement(payload);
    sendResponse(element);
  } catch (error) {
    console.error("[Contexus SW] Error updating element:", error);
    sendResponse({ error: error instanceof Error ? error.message : "Failed to update element" });
  }
}

async function handleDeleteElement(
  payload: DeleteElementPayload,
  sendResponse: (response: { success: boolean; error?: string }) => void,
): Promise<void> {
  try {
    await dbUtils.deleteElement(payload);
    sendResponse({ success: true });
  } catch (error) {
    console.error("[Contexus SW] Error deleting element:", error);
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete element",
    });
  }
}

async function handleGetElementById(
  payload: { id: string },
  sendResponse: (response: Element | undefined) => void,
): Promise<void> {
  try {
    const element = await dbUtils.getElementById(payload.id);
    sendResponse(element);
  } catch (error) {
    console.error("[Contexus SW] Error fetching element:", error);
    sendResponse(undefined);
  }
}

async function handleSearchElements(
  payload: SearchElementsPayload | undefined,
  sendResponse: (response: SearchResponse<Element>) => void,
): Promise<void> {
  try {
    const result = await dbUtils.searchElements(payload ?? {});
    sendResponse(result);
  } catch (error) {
    console.error("[Contexus SW] Error searching elements:", error);
    sendResponse({ results: [], total: 0, hasMore: false });
  }
}

async function handleListElements(
  payload: ListElementsPayload | undefined,
  sendResponse: (response: Element[]) => void,
): Promise<void> {
  try {
    const elements = await dbUtils.listElements(payload ?? {});
    sendResponse(elements);
  } catch (error) {
    console.error("[Contexus SW] Error listing elements:", error);
    sendResponse([]);
  }
}

async function handleSaveBuilderTemplate(
  payload: SaveBuilderTemplatePayload,
  sendResponse: (response: BuilderTemplate | { error: string }) => void,
): Promise<void> {
  try {
    const template = await dbUtils.saveBuilderTemplate(payload);
    sendResponse(template);
  } catch (error) {
    console.error("[Contexus SW] Error saving builder template:", error);
    sendResponse({ error: error instanceof Error ? error.message : "Failed to save template" });
  }
}

async function handleUpdateBuilderTemplate(
  payload: UpdateBuilderTemplatePayload,
  sendResponse: (response: BuilderTemplate | undefined | { error: string }) => void,
): Promise<void> {
  try {
    const template = await dbUtils.updateBuilderTemplate(payload);
    sendResponse(template);
  } catch (error) {
    console.error("[Contexus SW] Error updating builder template:", error);
    sendResponse({ error: error instanceof Error ? error.message : "Failed to update template" });
  }
}

async function handleDeleteBuilderTemplate(
  payload: DeleteBuilderTemplatePayload,
  sendResponse: (response: { success: boolean; error?: string }) => void,
): Promise<void> {
  try {
    await dbUtils.deleteBuilderTemplate(payload);
    sendResponse({ success: true });
  } catch (error) {
    console.error("[Contexus SW] Error deleting builder template:", error);
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete template",
    });
  }
}

async function handleListBuilderTemplates(
  sendResponse: (response: BuilderTemplate[]) => void,
): Promise<void> {
  try {
    const templates = await dbUtils.listBuilderTemplates();
    sendResponse(templates);
  } catch (error) {
    console.error("[Contexus SW] Error listing builder templates:", error);
    sendResponse([]);
  }
}

async function handleIncrementElementUsage(
  payload: IncrementElementUsagePayload,
  sendResponse: (response: { success: boolean; error?: string }) => void,
): Promise<void> {
  try {
    await dbUtils.incrementElementUsage(payload);
    sendResponse({ success: true });
  } catch (error) {
    console.error("[Contexus SW] Error incrementing usage:", error);
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : "Failed to increment usage",
    });
  }
}

chrome.runtime.onStartup.addListener(async () => {
  try {
    await db.open();
    console.log("[Contexus SW] Database ready on startup");
  } catch (error) {
    console.error("[Contexus SW] Database startup error:", error);
  }
});

self.addEventListener("beforeunload", () => {
  console.log("[Contexus SW] Service worker suspending");
});
