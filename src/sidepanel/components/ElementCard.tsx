import React, { useState } from "react";
import { Plus, GripVertical } from "lucide-react";

import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import type { Element } from "~/types";

interface ElementCardProps {
  element: Element;
  onQuickAdd: (element: Element) => void;
  draggable?: boolean;
  compact?: boolean;
}

const getVariantByType = (type: Element['type']): "default" | "secondary" | "outline" | "destructive" => {
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

export const ElementCard: React.FC<ElementCardProps> = ({
  element,
  onQuickAdd,
  draggable = true,
  compact = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    if (!draggable) return;

    // Set the data being dragged
    e.dataTransfer.setData("application/json", JSON.stringify(element));
    e.dataTransfer.effectAllowed = "copy";

    // Set dragging state for enhanced visual feedback
    setIsDragging(true);

    // Add global dragging class
    document.body.classList.add('dragging-element');
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    // Reset dragging state
    setIsDragging(false);

    // Remove global dragging class
    document.body.classList.remove('dragging-element');
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    onQuickAdd(element);
  };

  const getCardClassName = () => {
    const baseClasses = "element-card group transition-all duration-200";
    const draggableClasses = draggable ? "draggable-element cursor-grab" : "";
    const draggingClasses = isDragging ? "dragging opacity-60" : "";
    const compactClasses = compact ? "text-xs" : "";

    return `${baseClasses} ${draggableClasses} ${draggingClasses} ${compactClasses}`.trim();
  };

  const getCompactLayout = () => {
    if (compact) {
      return {
        header: "pb-1",
        content: "space-y-1",
        title: "font-medium text-xs leading-tight",
        description: "text-xs text-muted-foreground line-clamp-2",
        badge: "text-xs px-1 py-0",
        button: "h-5 w-5",
        icon: "h-3 w-3",
        stats: "text-xs text-muted-foreground"
      };
    }

    return {
      header: "pb-2",
      content: "space-y-2",
      title: "font-medium text-sm leading-tight",
      description: "text-xs text-muted-foreground line-clamp-3",
      badge: "text-xs",
      button: "h-6 w-6",
      icon: "h-4 w-4",
      stats: "text-xs text-muted-foreground"
    };
  };

  const layout = getCompactLayout();

  return (
    <Card
      className={getCardClassName()}
      draggable={draggable}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <CardHeader className={layout.header}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {draggable && (
              <GripVertical className={layout.icon + " text-muted-foreground"} />
            )}
            <Badge variant={getVariantByType(element.type)} className={layout.badge}>
              {element.type.toUpperCase()}
            </Badge>
            {!compact && (
              <Badge variant="outline" className={layout.badge}>
                {element.trigger}
              </Badge>
            )}
          </div>
          <Button
            size="icon"
            variant="ghost"
            className={`opacity-0 group-hover:opacity-100 ${layout.button}`}
            onClick={handleQuickAdd}
            title="Quick add to builder"
          >
            <Plus className={layout.icon} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className={layout.content}>
          {compact && (
            <Badge variant="outline" className={layout.badge}>
              {element.trigger}
            </Badge>
          )}
          <h3 className={layout.title}>
            {element.title}
          </h3>
          <p className={layout.description}>
            {element.content}
          </p>
          {!compact && element.description && (
            <p className="text-xs text-muted-foreground/80">
              {element.description}
            </p>
          )}
          {!compact && element.tags && element.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {element.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs px-1 py-0">
                  {tag}
                </Badge>
              ))}
              {element.tags.length > 3 && (
                <Badge variant="outline" className="text-xs px-1 py-0">
                  +{element.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
          <div className={`flex items-center justify-between ${layout.stats}`}>
            <span>Used {element.usageCount} times</span>
            {element.isFavorite && <span>⭐</span>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};