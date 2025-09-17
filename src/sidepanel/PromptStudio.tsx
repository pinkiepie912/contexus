import React from "react";
import { Separator } from "~/components/ui/separator";
import { Library } from "./components/Library";
import { Builder } from "./components/Builder";
import { useBuilderStore } from "~/stores/builderStore";
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

  const handleElementAdd = (element: Element) => {
    addElement(element);
  };

  const handlePromptInject = (prompt: string) => {
    console.log("Injecting prompt:", prompt);
    onPromptInject?.(prompt);
  };

  const handlePromptCopy = async (prompt: string) => {
    console.log("Copying prompt:", prompt);
    try {
      await navigator.clipboard.writeText(prompt);
      onPromptCopy?.(prompt);
    } catch (error) {
      console.error("Failed to copy prompt to clipboard:", error);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Library Section (Top 60%) */}
      <div className="flex-[3] p-4 pb-2">
        <Library onElementAdd={handleElementAdd} />
      </div>

      {/* Separator */}
      <div className="px-4">
        <Separator />
      </div>

      {/* Builder Section (Bottom 40%) */}
      <div className="flex-[2] p-4 pt-2">
        <Builder
          onInject={handlePromptInject}
          onCopy={handlePromptCopy}
        />
      </div>
    </div>
  );
};