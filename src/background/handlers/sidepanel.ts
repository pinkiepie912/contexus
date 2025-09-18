// src/background/handlers/sidepanel.ts
import type {
  OpenSidePanelForSavePayload,
  PrefillNewElementPayload,
} from "~/types";

export async function openSidePanel(
  _payload: undefined,
  _sender: chrome.runtime.MessageSender,
): Promise<{ success: boolean; error?: string }> {
  try {
    const tabId = _sender.tab?.id;
    const windowId = _sender.tab?.windowId;
    if (!tabId || !windowId) throw new Error("No sender tab ID available");

    chrome.sidePanel.open({ tabId });

    console.log("[Contexus SW] Side panel opened successfully");
    return { success: true };
  } catch (error) {
    console.error("[Contexus SW] Error opening side panel:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to open side panel",
    };
  }
}

export async function _closeSidePanel() {

}

export async function openSidePanelForSave(
  payload: OpenSidePanelForSavePayload,
  _sender: chrome.runtime.MessageSender,
): Promise<{ success: boolean; error?: string }> {
  try {
    const [activeTab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (activeTab?.id) {
      await chrome.sidePanel.setOptions({
        tabId: activeTab.id,
        path: "src/sidepanel/index.html",
        enabled: true,
      });
      await chrome.sidePanel.open({ tabId: activeTab.id });
    } else {
      throw new Error("No active window found");
    }

    const prefill: PrefillNewElementPayload = {
      type: payload.type,
      content: payload.content,
    };
    chrome.runtime.sendMessage({
      type: "PREFILL_NEW_ELEMENT",
      payload: prefill,
    });

    console.log("[Contexus SW] Side panel opened and prefill message sent");
    return { success: true };
  } catch (error) {
    console.error("[Contexus SW] Error opening side panel for save:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to open side panel",
    };
  }
}
