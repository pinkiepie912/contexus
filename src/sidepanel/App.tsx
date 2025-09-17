import React from "react";

import { PromptStudio } from "./PromptStudio";

function App() {
  const handlePromptInject = (prompt: string) => {
    console.log("Injecting prompt to active tab:", prompt);
    // TODO: Send message to content script to inject prompt
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: 'INJECT_PROMPT',
          payload: { prompt }
        });
      }
    });
  };

  const handlePromptCopy = (prompt: string) => {
    console.log("Prompt copied to clipboard:", prompt);
    // Additional logging or analytics could go here
  };

  return (
    <PromptStudio
      onPromptInject={handlePromptInject}
      onPromptCopy={handlePromptCopy}
    />
  );
}

export default App;
