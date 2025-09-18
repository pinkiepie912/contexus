// src/background/handlers/elements.ts
import { dbUtils } from "~/lib/db";
import type {
  CreateElementPayload,
  UpdateElementPayload,
  DeleteElementPayload,
  ListElementsPayload,
  SearchElementsPayload,
} from "~/types";
import type { Element, SearchResponse } from "~/types";

export async function createElement(
  payload: CreateElementPayload,
  _sender: chrome.runtime.MessageSender,
): Promise<Element | { error: string }> {
  try {
    return await dbUtils.createElement(payload.element);
  } catch (error) {
    console.error("[Contexus SW] Error creating element:", error);
    return {
      error:
        error instanceof Error ? error.message : "Failed to create element",
    };
  }
}

export async function updateElement(
  payload: UpdateElementPayload,
  _sender: chrome.runtime.MessageSender,
): Promise<Element | undefined | { error: string }> {
  try {
    return await dbUtils.updateElement(payload);
  } catch (error) {
    console.error("[Contexus SW] Error updating element:", error);
    return {
      error:
        error instanceof Error ? error.message : "Failed to update element",
    };
  }
}

export async function deleteElement(
  payload: DeleteElementPayload,
  _sender: chrome.runtime.MessageSender,
): Promise<{ success: boolean; error?: string }> {
  try {
    await dbUtils.deleteElement(payload);
    return { success: true };
  } catch (error) {
    console.error("[Contexus SW] Error deleting element:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete element",
    };
  }
}

export async function getElementById(payload: {
  id: string;
  _sender: chrome.runtime.MessageSender;
}): Promise<Element | undefined> {
  try {
    return await dbUtils.getElementById(payload.id);
  } catch (error) {
    console.error("[Contexus SW] Error fetching element:", error);
    return undefined;
  }
}

export async function searchElements(
  payload: SearchElementsPayload | undefined,
  _sender: chrome.runtime.MessageSender,
): Promise<SearchResponse<Element>> {
  try {
    return await dbUtils.searchElements(payload ?? {});
  } catch (error) {
    console.error("[Contexus SW] Error searching elements:", error);
    return { results: [], total: 0, hasMore: false };
  }
}

export async function listElements(
  payload: ListElementsPayload | undefined,
  _sender: chrome.runtime.MessageSender,
): Promise<Element[]> {
  try {
    return await dbUtils.listElements(payload ?? {});
  } catch (error) {
    console.error("[Contexus SW] Error listing elements:", error);
    return [];
  }
}
