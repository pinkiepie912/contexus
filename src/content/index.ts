(() => {
  (window as any).__EXT_MARK__ = "ok";
  document.documentElement.setAttribute("data-ext-mark", "ok");
  console.log("[CONTENT] injected");
})();
