import React from "react";
import { Plus } from "lucide-react";

import { TemplateSlot } from "./TemplateSlot";
import { ActionButtons } from "./ActionButtons";

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { useBuilderStore } from "~/stores/builderStore";
import { useDragAndDrop } from "~/hooks/useDragAndDrop";
// import { PromptEngine } from "~/lib/promptEngine";
import type { Element } from "~/types";

interface BuilderProps {
  onInject: (prompt: string) => void;
  onCopy: (prompt: string) => void;
  isInjecting?: boolean;
  compact?: boolean;
}

const EmptyState: React.FC<{ onAddElement: () => void, compact?: boolean }> = ({ onAddElement, compact = false }) => {
  if (compact) {
    return (
      <div className="flex flex-col items-center justify-center p-4 text-center">
        <div className="rounded-full bg-muted/50 p-3 mb-2">
          <Plus className="h-4 w-4 text-muted-foreground" />
        </div>
        <h3 className="text-sm font-medium mb-1">빠른 조립</h3>
        <p className="text-xs text-muted-foreground mb-2">
          엘리먼트를 드래그하세요
        </p>
        <Button variant="outline" size="sm" onClick={onAddElement}>
          <Plus className="h-3 w-3 mr-1" />
          추가
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="rounded-full bg-muted/50 p-6 mb-4">
        <Plus className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium mb-2">빌더가 비어있습니다</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-md">
        라이브러리에서 엘리먼트를 드래그하여 프롬프트를 조립하세요.
        템플릿을 선택하면 슬롯 시스템이 활성화됩니다.
      </p>
      <Button variant="outline" onClick={onAddElement}>
        <Plus className="h-4 w-4 mr-2" />
        엘리먼트 추가
      </Button>
    </div>
  );
};

export const Builder: React.FC<BuilderProps> = ({ onInject, onCopy, isInjecting = false, compact = false }) => {
  const {
    elements,
    selectedTemplate,
    addElement,
    removeElement,
    // buildPreview,
  } = useBuilderStore();

  const {
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
    dropZoneState,
  } = useDragAndDrop({
    enableVisualFeedback: true,
  });

  const handleElementDrop = (element: Element) => {
    addElement(element);
  };

  const handleAddElement = () => {
    // This would typically open a search/selection dialog
    // For now, we'll just show a placeholder
    console.log("Add element dialog would open here");
  };

  // const handleInjectClick = () => {
  //   const result = PromptEngine.buildPrompt(elements, selectedTemplate);
  //   onInject(result.prompt);
  // };

  // const handleCopyClick = () => {
  //   const result = PromptEngine.buildPrompt(elements, selectedTemplate);
  //   onCopy(result.prompt);
  // };

  const handleInlineSearch = (slotId?: string) => {
    // This would open an inline search dialog
    console.log("Inline search for slot:", slotId);
  };

  const isEmpty = elements.length === 0;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold">빌더</CardTitle>
      </CardHeader>

      <CardContent className="flex-1 p-0">
        <div
          className={`h-full ${
            dropZoneState.isOver
              ? dropZoneState.canDrop
                ? "bg-primary/5 border-primary/20"
                : "bg-destructive/5 border-destructive/20"
              : ""
          } border-2 border-dashed border-transparent transition-colors rounded-lg mx-6`}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop(handleElementDrop)}
        >
          {isEmpty ? (
            <EmptyState onAddElement={handleAddElement} compact={compact} />
          ) : (
            <div className="p-6 space-y-6">
              {/* Template-based or simple element display */}
              {selectedTemplate ? (
                // Template with slots
                <>
                  {(() => {
                    const templateElement = elements.find(
                      builderElement => builderElement.element.id === selectedTemplate.id
                    );
                    return templateElement ? (
                      <TemplateSlot
                        templateElement={templateElement}
                        onRemoveTemplate={() => removeElement(templateElement.id)}
                        onInlineSearch={handleInlineSearch}
                      />
                    ) : null;
                  })()}
                </>
              ) : (
                // Simple element list
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">
                    추가된 엘리먼트
                  </h4>
                  <div className="space-y-3">
                    {elements.map((builderElement) => (
                      <Card key={builderElement.id} className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <h5 className="font-medium text-sm truncate">
                              {builderElement.element.title}
                            </h5>
                            <p className="text-xs text-muted-foreground truncate">
                              {builderElement.element.trigger} • {builderElement.element.type}
                            </p>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => removeElement(builderElement.id)}
                            className="h-6 w-6 shrink-0"
                          >
                            ×
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* Action Buttons */}
              <ActionButtons onInject={onInject} onCopy={onCopy} isInjecting={isInjecting} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};