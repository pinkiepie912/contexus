// src/background/index.ts
import "./lifecycle";
import { initRouter } from "./router";

initRouter();

self.addEventListener("beforeunload", () => {
  console.log("[Contexus SW] Service worker suspending");
});
