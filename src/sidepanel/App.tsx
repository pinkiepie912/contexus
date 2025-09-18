import React, { useEffect, useState } from "react";

import { PromptStudio } from "./PromptStudio";
import type { PrefillNewElementPayload, ElementType } from "~/types";
import { useToast } from "~/hooks/useToast";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { createElement } from "~/lib/messaging";

function App() {
  const { toast } = useToast();
  const [prefill, setPrefill] = useState<{ type: ElementType; content: string } | null>(null);
  const [trigger, setTrigger] = useState<string>("");

  useEffect(() => {
    const handler = (message: { type: string; payload?: PrefillNewElementPayload }) => {
      if (message?.type === 'PREFILL_NEW_ELEMENT' && message.payload) {
        setPrefill({ type: message.payload.type, content: message.payload.content });
        setTrigger("");
        // Scroll to top for visibility
        window.scrollTo({ top: 0, behavior: 'smooth' });
        // Focus trigger shortly after render
        setTimeout(() => {
          const el = document.querySelector('[data-quick-save-trigger]') as HTMLInputElement | null;
          el?.focus();
        }, 50);
      }
    };
    chrome.runtime.onMessage.addListener(handler as any);
    return () => chrome.runtime.onMessage.removeListener(handler as any);
  }, []);

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

  const handleQuickSave = async () => {
    if (!prefill) return;
    const trimmed = trigger.trim();
    if (!trimmed) {
      toast("Enter a unique trigger (e.g., /v4_config)", { type: "warning" });
      return;
    }
    try {
      const now = new Date();
      await createElement({
        type: prefill.type,
        trigger: trimmed.startsWith('/') ? trimmed : `/${trimmed}`,
        title: `Quick ${prefill.type}`,
        content: prefill.content,
        createdAt: now,
        usageCount: 0,
      });
      toast("Saved to library", { type: "success" });
      setPrefill(null);
      setTrigger("");
    } catch (error) {
      console.error('Quick save failed', error);
      toast("Failed to save element", { type: "error" });
    }
  };

  return (
    <div className="h-screen flex flex-col">
      {prefill && (
        <div className="p-2 bg-background/95 border-b">
          <Card className="p-3 bg-blue-50/60 border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium">Quick save new {prefill.type}</div>
              <Button variant="ghost" size="sm" onClick={() => setPrefill(null)}>Cancel</Button>
            </div>
            <div className="grid gap-2">
              <Input
                placeholder="Trigger tag (e.g., /v4_config)"
                value={trigger}
                onChange={(e) => setTrigger(e.target.value)}
                data-quick-save-trigger
              />
              <Textarea value={prefill.content} readOnly className="min-h-[80px]" />
              <div className="flex justify-end">
                <Button size="sm" onClick={handleQuickSave}>Save</Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      <PromptStudio
        onPromptInject={handlePromptInject}
        onPromptCopy={handlePromptCopy}
      />
    </div>
  );
}

export default App;
