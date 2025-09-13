const btn = document.getElementById("btn")!;
const status = document.getElementById("status")!;
btn.addEventListener("click", async () => {
  const res = await chrome.runtime.sendMessage({ ping: true });
  status.textContent = `pong: ${new Date(res.at).toLocaleTimeString()}`;
});
