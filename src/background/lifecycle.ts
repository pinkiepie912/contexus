// src/background/lifecycle.ts
import { db } from "~/lib/db";

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

chrome.runtime.onStartup.addListener(async () => {
  try {
    await db.open();
    console.log("[Contexus SW] Database ready on startup");
  } catch (error) {
    console.error("[Contexus SW] Database startup error:", error);
  }
});

// SidePanel
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch(console.error);
