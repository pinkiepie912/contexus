import React from "react";
import { X } from "lucide-react";

import { SlotComponent } from "./SlotComponent";

import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { useBuilderStore } from "~/stores/builderStore";
import type { Element, BuilderElement } from "~/types";

interface TemplateSlotProps {
  templateElement: BuilderElement;
  onRemoveTemplate: () => void;
  onInlineSearch: (slotId: string) => void;
}

const getElementTypeVariant = (type: Element['type']): "default" | "secondary" | "outline" | "destructive" => {
  switch (type) {
    case "template":
      return "default";
    case "context":
      return "secondary";
    case "example":
      return "outline";
    case "role":
      return "destructive";
    default:
      return "default";
  }
};

export const TemplateSlot: React.FC<TemplateSlotProps> = ({
  templateElement,
  onRemoveTemplate,
  onInlineSearch,
}) => {
  const { assignSlot, unassignSlot } = useBuilderStore();
  const template = templateElement.element;
  const requiredSlots = template.requiredSlots || [];

  const handleSlotDrop = (slotId: string) => (element: Element) => {
    assignSlot(templateElement.id, slotId, element);
  };

  const handleSlotRemove = (slotId: string) => () => {
    unassignSlot(templateElement.id, slotId);
  };

  const handleSlotInlineSearch = (slotId: string) => () => {
    onInlineSearch(slotId);
  };

  const getAssignedElement = (slotId: string): Element | undefined => {
    return templateElement.slotAssignments?.[slotId];
  };

  return (
    <div className="space-y-4">
      {/* Template Header */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Badge variant={getElementTypeVariant(template.type)} className="text-xs">
                TEMPLATE
              </Badge>
              <Badge variant="outline" className="text-xs">
                {template.trigger}
              </Badge>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm truncate">
                  {template.title}
                </h3>
                <p className="text-xs text-muted-foreground truncate">
                  {template.description || template.content}
                </p>
              </div>
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={onRemoveTemplate}
              className="h-6 w-6 shrink-0"
              title="템플릿 제거"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Template Content Preview */}
      <Card>
        <CardContent className="pt-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-medium text-muted-foreground">
                템플릿 내용
              </h4>
              {template.category && (
                <Badge variant="outline" className="text-xs">
                  {template.category}
                </Badge>
              )}
            </div>
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-sm font-mono whitespace-pre-wrap">
                {template.content}
              </p>
            </div>
            {template.promptTemplate && template.promptTemplate !== template.content && (
              <div className="bg-muted/30 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">프롬프트 템플릿:</p>
                <p className="text-sm font-mono whitespace-pre-wrap">
                  {template.promptTemplate}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dynamic Slots */}
      {requiredSlots.length > 0 && (
        <>
          <Separator />
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-muted-foreground">
                슬롯 ({requiredSlots.length}개)
              </h4>
              <div className="text-xs text-muted-foreground">
                필수: {requiredSlots.filter(slot => slot.required).length}개 /
                선택: {requiredSlots.filter(slot => !slot.required).length}개
              </div>
            </div>

            {requiredSlots.map((slot, index) => (
              <div
                key={slot.id}
                className={`${index > 0 ? 'border-t pt-4' : ''} border-muted/30`}
              >
                <SlotComponent
                  slot={slot}
                  assignedElement={getAssignedElement(slot.id)}
                  onDrop={handleSlotDrop(slot.id)}
                  onRemove={handleSlotRemove(slot.id)}
                  onInlineSearch={handleSlotInlineSearch(slot.id)}
                />
              </div>
            ))}
          </div>
        </>
      )}

      {/* Validation Status */}
      {requiredSlots.length > 0 && (
        <div className="bg-muted/20 rounded-lg p-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">상태:</span>
            {(() => {
              const requiredSlotsCount = requiredSlots.filter(slot => slot.required).length;
              const filledRequiredSlots = requiredSlots.filter(slot =>
                slot.required && getAssignedElement(slot.id)
              ).length;
              const allRequiredFilled = filledRequiredSlots === requiredSlotsCount;

              return (
                <div className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${
                    allRequiredFilled ? 'bg-green-500' : 'bg-yellow-500'
                  }`} />
                  <span className={allRequiredFilled ? 'text-green-600' : 'text-yellow-600'}>
                    {allRequiredFilled
                      ? '모든 필수 슬롯이 채워졌습니다'
                      : `${requiredSlotsCount - filledRequiredSlots}개의 필수 슬롯이 비어있습니다`
                    }
                  </span>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};