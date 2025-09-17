import React, { useState, useEffect } from "react";

import { Library } from "./components/Library";
import { Builder } from "./components/Builder";

import { Separator } from "~/components/ui/separator";
import { ThemeToggle } from "~/components/ThemeToggle";
import { useBuilderStore } from "~/stores/builderStore";
import { useToast } from "~/hooks/useToast";
import type { Element } from "~/types";

interface PromptStudioProps {
  onPromptInject?: (prompt: string) => void;
  onPromptCopy?: (prompt: string) => void;
}

export const PromptStudio: React.FC<PromptStudioProps> = ({
  onPromptInject,
  onPromptCopy,
}) => {
  const { addElement } = useBuilderStore();
  const { toast } = useToast();
  const [isInjecting, setIsInjecting] = useState(false);
  const [isCompact, setIsCompact] = useState(false);

  // Responsive viewport detection
  useEffect(() => {
    const handleResize = () => {
      const height = window.innerHeight;
      setIsCompact(height < 600); // Switch to compact mode under 600px height
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleElementAdd = (element: Element) => {
    addElement(element);
  };

  const handlePromptInject = async (prompt: string) => {
    if (!prompt.trim()) {
      toast("Cannot inject empty prompt", { type: "warning" });
      return;
    }

    setIsInjecting(true);

    try {
      // Send message to content script to inject prompt
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab?.id) {
        throw new Error("No active tab found");
      }

      await chrome.tabs.sendMessage(tab.id, {
        type: "INJECT_PROMPT",
        payload: { prompt }
      });

      toast("Prompt injected successfully!", { type: "success" });
      onPromptInject?.(prompt);

    } catch (error) {
      console.error("Failed to inject prompt:", error);
      toast("Failed to inject prompt", {
        type: "error",
        description: error instanceof Error ? error.message : "Unknown error"
      });
    } finally {
      setIsInjecting(false);
    }
  };

  const handlePromptCopy = async (prompt: string) => {
    if (!prompt.trim()) {
      toast("Cannot copy empty prompt", { type: "warning" });
      return;
    }

    try {
      await navigator.clipboard.writeText(prompt);
      toast("Prompt copied to clipboard!", { type: "success" });
      onPromptCopy?.(prompt);
    } catch (error) {
      console.error("Failed to copy prompt to clipboard:", error);
      toast("Failed to copy prompt", { type: "error" });
    }
  };

  const getLayoutClasses = () => {
    if (isCompact) {
      return {
        container: "h-screen flex flex-col bg-background overflow-hidden",
        library: "min-h-[160px] flex-[1] p-2 pb-1",
        separator: "px-2",
        builder: "min-h-[140px] flex-[1] p-2 pt-1"
      };
    }

    return {
      container: "h-screen flex flex-col bg-background",
      library: "flex-[3] p-4 pb-2",
      separator: "px-4",
      builder: "flex-[2] p-4 pt-2"
    };
  };

  const layoutClasses = getLayoutClasses();

  return (
    <div className={layoutClasses.container}>
      {/* Header with Theme Toggle */}
      <div className="flex items-center justify-between p-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <h1 className="text-lg font-semibold">Contexus</h1>
        <ThemeToggle />
      </div>

      {/* Library Section */}
      <div className={layoutClasses.library}>
        <Library
          onElementAdd={handleElementAdd}
          compact={isCompact}
        />
      </div>

      {/* Separator */}
      <div className={layoutClasses.separator}>
        <Separator />
      </div>

      {/* Builder Section */}
      <div className={layoutClasses.builder}>
        <Builder
          onInject={handlePromptInject}
          onCopy={handlePromptCopy}
          isInjecting={isInjecting}
          compact={isCompact}
        />
      </div>
    </div>
  );
};