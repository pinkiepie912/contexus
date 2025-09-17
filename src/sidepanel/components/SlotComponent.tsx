import React, { useState } from "react";
import { X, Search } from "lucide-react";
import { Card } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { useDragAndDrop } from "~/hooks/useDragAndDrop";
import type { Element, SlotDefinition, ElementType } from "~/types";

interface SlotComponentProps {
  slot: SlotDefinition;
  assignedElement?: Element | undefined;
  onDrop: (element: Element) => void;
  onRemove: () => void;
  onInlineSearch: () => void;
}

const getSlotTypeColor = (type: SlotDefinition['type']): string => {
  switch (type) {
    case 'context':
      return 'bg-blue-50 border-blue-200';
    case 'example':
      return 'bg-green-50 border-green-200';
    case 'role':
      return 'bg-purple-50 border-purple-200';
    case 'text':
      return 'bg-gray-50 border-gray-200';
    default:
      return 'bg-gray-50 border-gray-200';
  }
};

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

export const SlotComponent: React.FC<SlotComponentProps> = ({
  slot,
  assignedElement,
  onDrop,
  onRemove,
  onInlineSearch,
}) => {
  const [textValue, setTextValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  // Only accept elements that match the slot type (unless it's 'text' type)
  const acceptedTypes: ElementType[] = slot.type === 'text'
    ? ['template', 'context', 'example', 'role']
    : slot.type === 'context' || slot.type === 'example' || slot.type === 'role'
    ? [slot.type]
    : [];

  const {
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
    dropZoneState,
  } = useDragAndDrop({
    acceptedTypes,
    enableVisualFeedback: true,
  });

  const handleElementDrop = (element: Element) => {
    onDrop(element);
  };

  const handleInputFocus = () => {
    setIsFocused(true);
    // Trigger inline search when user focuses on empty slot
    if (!assignedElement) {
      onInlineSearch();
    }
  };

  const handleInputBlur = () => {
    setIsFocused(false);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    // Trigger inline search when user types '/'
    if (e.key === '/' && !assignedElement) {
      e.preventDefault();
      onInlineSearch();
    }
  };

  const isDropZoneActive = dropZoneState.isOver;
  const canAcceptDrop = dropZoneState.canDrop;

  return (
    <div className="space-y-2">
      {/* Slot Label */}
      <div className="flex items-center gap-2">
        <Label className="text-sm font-medium">
          {slot.name}
          {slot.required && <span className="text-destructive ml-1">*</span>}
        </Label>
        <Badge variant="outline" className="text-xs px-1 py-0">
          {slot.type}
        </Badge>
      </div>

      {/* Slot Content */}
      {assignedElement ? (
        // Assigned Element Display
        <Card
          className={`p-3 ${getSlotTypeColor(slot.type)} transition-colors`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Badge variant={getElementTypeVariant(assignedElement.type)} className="text-xs">
                {assignedElement.type.toUpperCase()}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {assignedElement.trigger}
              </Badge>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {assignedElement.title}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {assignedElement.content}
                </p>
              </div>
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={onRemove}
              className="h-6 w-6 shrink-0"
              title="슬롯에서 제거"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      ) : (
        // Empty Slot - Drop Zone
        <div
          className={`relative border-2 border-dashed rounded-lg p-3 transition-all ${
            isDropZoneActive
              ? canAcceptDrop
                ? "border-primary bg-primary/5"
                : "border-destructive bg-destructive/5"
              : "border-muted-foreground/30 hover:border-muted-foreground/50"
          } ${isFocused ? "ring-2 ring-primary/20" : ""}`}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop(handleElementDrop)}
        >
          {slot.type === 'text' ? (
            // Text Input for manual text entry
            <Input
              value={textValue}
              onChange={(e) => setTextValue(e.target.value)}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              onKeyDown={handleInputKeyDown}
              placeholder={slot.placeholder || `${slot.name} 입력...`}
              className="border-0 bg-transparent shadow-none focus-visible:ring-0 p-0"
            />
          ) : (
            // Drop zone for elements
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Search className="h-4 w-4" />
              <span>
                {slot.placeholder || `${slot.name}을(를) 드래그하거나 '/' 키를 눌러 검색하세요`}
              </span>
            </div>
          )}

          {/* Drop zone visual feedback */}
          {isDropZoneActive && (
            <div className="absolute inset-0 rounded-lg flex items-center justify-center bg-background/80">
              <div className={`text-sm font-medium ${
                canAcceptDrop ? "text-primary" : "text-destructive"
              }`}>
                {canAcceptDrop ? "여기에 놓으세요" : "이 타입은 허용되지 않습니다"}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Slot Description */}
      {slot.placeholder && !assignedElement && (
        <p className="text-xs text-muted-foreground">
          {slot.placeholder}
        </p>
      )}
    </div>
  );
};