import React from "react";
import { Plus, GripVertical } from "lucide-react";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import type { Element } from "~/types";

interface ElementCardProps {
  element: Element;
  onQuickAdd: (element: Element) => void;
  draggable?: boolean;
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
}) => {
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    if (!draggable) return;

    // Set the data being dragged
    e.dataTransfer.setData("application/json", JSON.stringify(element));
    e.dataTransfer.effectAllowed = "copy";

    // Add visual feedback
    e.currentTarget.style.opacity = "0.5";
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    // Reset visual feedback
    e.currentTarget.style.opacity = "1";
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    onQuickAdd(element);
  };

  return (
    <Card
      className="group cursor-move hover:shadow-md transition-shadow"
      draggable={draggable}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {draggable && (
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            )}
            <Badge variant={getVariantByType(element.type)}>
              {element.type.toUpperCase()}
            </Badge>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="opacity-0 group-hover:opacity-100 h-6 w-6"
            onClick={handleQuickAdd}
            title="Quick add to builder"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Badge variant="outline" className="text-xs">
            {element.trigger}
          </Badge>
          <h3 className="font-medium text-sm leading-tight">
            {element.title}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-3">
            {element.content}
          </p>
          {element.description && (
            <p className="text-xs text-muted-foreground/80">
              {element.description}
            </p>
          )}
          {element.tags && element.tags.length > 0 && (
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
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Used {element.usageCount} times</span>
            {element.isFavorite && <span>⭐</span>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};