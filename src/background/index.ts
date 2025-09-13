chrome.runtime.onInstalled.addListener(() => {
  console.log("[SW] installed");
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.ping) {
    sendResponse({ pong: true, at: Date.now() });
    return true;
  }
});
