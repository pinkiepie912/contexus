/**
 * Messaging utilities for communicating with the background service worker.
 * Updated for the Element-centric data model introduced in Phase 1.
 */

import type {
  ChromeMessage,
  CreateElementPayload,
  DeleteBuilderTemplatePayload,
  DeleteElementPayload,
  IncrementElementUsagePayload,
  ListElementsPayload,
  NewBuilderTemplateInput,
  NewElementInput,
  SaveBuilderTemplatePayload,
  SearchElementsPayload,
  UpdateBuilderTemplatePayload,
  UpdateElementPayload,
} from "~/types";
import type { BuilderTemplate, Element, SearchResponse } from "~/types";

interface SendMessageOptions {
  timeoutMs?: number;
  retries?: number;
  retryDelayMs?: number;
}

async function sendMessage<TResponse, TPayload = undefined>(
  type: ChromeMessage<TPayload>["type"],
  payload?: TPayload,
  options?: SendMessageOptions,
): Promise<TResponse> {
  const timeoutMs = options?.timeoutMs ?? 10_000;
  const retries = options?.retries ?? 1;
  const retryDelayMs = options?.retryDelayMs ?? 200;

  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await new Promise<TResponse>((resolve, reject) => {
        let settled = false;
        const timer = setTimeout(() => {
          if (settled) return;
          settled = true;
          reject(new Error("Messaging timeout"));
        }, timeoutMs);

        const message = (payload === undefined
          ? { type }
          : { type, payload }) as ChromeMessage<TPayload>;

        chrome.runtime.sendMessage(message, (result) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);

          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }

          if ((result as any)?.error) {
            reject(new Error((result as any).error));
            return;
          }

          resolve(result as TResponse);
        });
      });

      return response;
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
        continue;
      }

      throw lastError instanceof Error ? lastError : new Error("Unknown messaging error");
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Unknown messaging error");
}

/* -------------------------------------------------------------------------- */
/* Element CRUD                                                               */
/* -------------------------------------------------------------------------- */

export async function createElement(input: NewElementInput): Promise<Element> {
  const payload: CreateElementPayload = { element: input };
  return sendMessage<Element, CreateElementPayload>("CREATE_ELEMENT", payload);
}

export async function updateElement(payload: UpdateElementPayload): Promise<Element | undefined> {
  return sendMessage<Element | undefined, UpdateElementPayload>("UPDATE_ELEMENT", payload);
}

export async function deleteElement(payload: DeleteElementPayload): Promise<{ success: boolean }> {
  return sendMessage<{ success: boolean }, DeleteElementPayload>("DELETE_ELEMENT", payload);
}

export async function getElementById(id: string): Promise<Element | undefined> {
  return sendMessage<Element | undefined, { id: string }>("GET_ELEMENT_BY_ID", { id });
}

export async function listElements(filters?: ListElementsPayload): Promise<Element[]> {
  return sendMessage<Element[], ListElementsPayload | undefined>("LIST_ELEMENTS", filters);
}

export async function searchElements(
  filters?: SearchElementsPayload,
): Promise<SearchResponse<Element>> {
  return sendMessage<SearchResponse<Element>, SearchElementsPayload | undefined>(
    "SEARCH_ELEMENTS",
    filters,
  );
}

export async function incrementElementUsage(
  payload: IncrementElementUsagePayload,
): Promise<void> {
  await sendMessage<void, IncrementElementUsagePayload>("INCREMENT_ELEMENT_USAGE", payload);
}

/* -------------------------------------------------------------------------- */
/* Builder templates                                                          */
/* -------------------------------------------------------------------------- */

export async function saveBuilderTemplate(
  template: NewBuilderTemplateInput,
): Promise<BuilderTemplate> {
  const payload: SaveBuilderTemplatePayload = { template };
  return sendMessage<BuilderTemplate, SaveBuilderTemplatePayload>(
    "SAVE_BUILDER_TEMPLATE",
    payload,
  );
}

export async function updateBuilderTemplate(
  payload: UpdateBuilderTemplatePayload,
): Promise<BuilderTemplate | undefined> {
  return sendMessage<BuilderTemplate | undefined, UpdateBuilderTemplatePayload>(
    "UPDATE_BUILDER_TEMPLATE",
    payload,
  );
}

export async function deleteBuilderTemplate(
  payload: DeleteBuilderTemplatePayload,
): Promise<{ success: boolean }>
{
  return sendMessage<{ success: boolean }, DeleteBuilderTemplatePayload>(
    "DELETE_BUILDER_TEMPLATE",
    payload,
  );
}

export async function listBuilderTemplates(): Promise<BuilderTemplate[]> {
  return sendMessage<BuilderTemplate[], undefined>("LIST_BUILDER_TEMPLATES");
}

/* -------------------------------------------------------------------------- */
/* Utilities                                                                  */
/* -------------------------------------------------------------------------- */

type SupportedPlatform = "openai" | "gemini" | "claude" | "other";

export function getPageContext(): {
  url: string;
  title: string;
  platform: SupportedPlatform;
} {
  const url = window.location.href;
  let platform: SupportedPlatform = "other";

  if (url.includes("chat.openai.com") || url.includes("chatgpt.com")) platform = "openai";
  else if (url.includes("gemini.google.com")) platform = "gemini";
  else if (url.includes("claude.ai")) platform = "claude";

  return { url, title: document.title, platform };
}

export async function capture(params: {
  text?: string;
  source?: "selection" | "auto";
  fallbackText?: string;
  title?: string;
  tags?: string[];
  meta?: {
    trigger?: string;
    platform?: SupportedPlatform;
    url?: string;
    isUser?: boolean;
  };
}): Promise<{ success: boolean; elementId?: string; error?: string }> {
  try {
    const ctx = getPageContext();

    let contentText = params.text?.trim();
    if (!contentText) {
      if (params.source === "selection" || params.source === "auto") {
        const selection = window.getSelection();
        const selectedText = selection?.toString().trim();
        if (selectedText) {
          contentText = selectedText;
        } else if (params.source === "auto") {
          contentText = params.fallbackText?.trim();
        }
      }
    }

    if (!contentText) {
      return { success: false, error: "No content to capture" };
    }

    const element = await createElement({
      type: "context",
      trigger: params.meta?.trigger ?? "/captured",
      title: params.title || ctx.title || "Captured snippet",
      content: contentText,
      description: params.meta?.url ?? ctx.url,
      tags: params.tags,
      createdAt: new Date(),
      usageCount: 0,
    });

    return { success: true, elementId: element.id };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Capture failed",
    };
  }
}

export async function pingBackground(): Promise<{ pong: boolean; at: number }> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ ping: true }, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(response as { pong: boolean; at: number });
    });
  });
}

export const content = {
  capture,
  getPageContext,
};
