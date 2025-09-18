// src/background/router.ts
import type { ChromeMessage } from "~/types";
import { handlers } from "./handlers/_registry";

function wrapAsyncHandler<T>(
  fn: (payload: any, _sender: chrome.runtime.MessageSender) => Promise<T>
): (
  payload: any,
  _sender: chrome.runtime.MessageSender,
  sendResponse: (res: T) => void,
) => boolean {
  return (payload, _sender, sendResponse) => {
    fn(payload, _sender)
      .then(sendResponse)
      .catch((err) => {
        console.error("[Contexus SW] Handler error:", err);
        sendResponse({
          error: err instanceof Error ? err.message : String(err),
        } as any);
      });
    return true;
  };
}

export function initRouter() {
  chrome.runtime.onMessage.addListener(
    (
      message: ChromeMessage & { type?: string; ping?: boolean },
      _sender: chrome.runtime.MessageSender,
      sendResponse,
    ) => {
      if ((message as any)?.ping) {
        sendResponse({ pong: true, at: Date.now() });
        return true;
      }

      const type = message?.type;
      console.log("[Contexus SW] Received message:", type);

      const handler = handlers[type as keyof typeof handlers];
      if (!handler) {
        console.warn("[Contexus SW] Unknown message type:", type);
        sendResponse({ error: "Unknown message type" });
        return false;
      }

      // (payload) => Promise<T>
      const wrapped = wrapAsyncHandler(handler as any);
      return wrapped((message as any).payload, _sender, sendResponse);
    },
  );
}
