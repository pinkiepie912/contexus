// src/background/handlers/usage.ts
import { dbUtils } from "~/lib/db";
import type { IncrementElementUsagePayload } from "~/types";

export async function incrementElementUsage(
  payload: IncrementElementUsagePayload,
  _sender: chrome.runtime.MessageSender,
): Promise<{ success: boolean; error?: string }> {
  try {
    await dbUtils.incrementElementUsage(payload);
    return { success: true };
  } catch (error) {
    console.error("[Contexus SW] Error incrementing usage:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to increment usage",
    };
  }
}
