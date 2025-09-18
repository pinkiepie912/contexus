// src/background/handlers/templates.ts
import { dbUtils } from "~/lib/db";
import type {
  SaveBuilderTemplatePayload,
  UpdateBuilderTemplatePayload,
  DeleteBuilderTemplatePayload,
} from "~/types";
import type { BuilderTemplate } from "~/types";

export async function saveBuilderTemplate(
  payload: SaveBuilderTemplatePayload,
  _sender: chrome.runtime.MessageSender,
): Promise<BuilderTemplate | { error: string }> {
  try {
    return await dbUtils.saveBuilderTemplate(payload);
  } catch (error) {
    console.error("[Contexus SW] Error saving builder template:", error);
    return {
      error: error instanceof Error ? error.message : "Failed to save template",
    };
  }
}

export async function updateBuilderTemplate(
  payload: UpdateBuilderTemplatePayload,
  _sender: chrome.runtime.MessageSender,
): Promise<BuilderTemplate | undefined | { error: string }> {
  try {
    return await dbUtils.updateBuilderTemplate(payload);
  } catch (error) {
    console.error("[Contexus SW] Error updating builder template:", error);
    return {
      error:
        error instanceof Error ? error.message : "Failed to update template",
    };
  }
}

export async function deleteBuilderTemplate(
  payload: DeleteBuilderTemplatePayload,
  _sender: chrome.runtime.MessageSender,
): Promise<{ success: boolean; error?: string }> {
  try {
    await dbUtils.deleteBuilderTemplate(payload);
    return { success: true };
  } catch (error) {
    console.error("[Contexus SW] Error deleting builder template:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete template",
    };
  }
}

export async function listBuilderTemplates(
  _payload: undefined,
  _sender: chrome.runtime.MessageSender,
): Promise<BuilderTemplate[]> {
  try {
    return await dbUtils.listBuilderTemplates();
  } catch (error) {
    console.error("[Contexus SW] Error listing builder templates:", error);
    return [];
  }
}
