import React from "react";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Badge } from "~/components/ui/badge";
import type { ElementType } from "~/types";

interface FilterTabsProps {
  activeFilter: ElementType | "all";
  onFilterChange: (filter: ElementType | "all") => void;
  counts?: Record<ElementType | "all", number>;
}

const filterLabels: Record<ElementType | "all", string> = {
  all: "전체",
  template: "템플릿",
  context: "컨텍스트",
  example: "예시",
  role: "역할",
};

export const FilterTabs: React.FC<FilterTabsProps> = ({
  activeFilter,
  onFilterChange,
  counts = {},
}) => {
  const filters: (ElementType | "all")[] = ["all", "template", "context", "example", "role"];

  const handleKeyDown = (e: React.KeyboardEvent, filter: ElementType | "all") => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onFilterChange(filter);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      const currentIndex = filters.indexOf(activeFilter);
      const direction = e.key === "ArrowLeft" ? -1 : 1;
      const newIndex = (currentIndex + direction + filters.length) % filters.length;
      const newFilter = filters[newIndex];
      if (newFilter !== undefined) {
        onFilterChange(newFilter);
      }
    }
  };

  const handleValueChange = (value: string) => {
    // Type guard to ensure value is valid
    if (value === "all" || (["template", "context", "example", "role"] as const).includes(value as ElementType)) {
      onFilterChange(value as ElementType | "all");
    }
  };

  return (
    <Tabs value={activeFilter} onValueChange={handleValueChange}>
      <TabsList className="grid w-full grid-cols-5">
        {filters.map((filter) => (
          <TabsTrigger
            key={filter}
            value={filter}
            className="relative text-xs"
            onKeyDown={(e) => handleKeyDown(e, filter)}
          >
            <span className="flex items-center gap-1">
              {filterLabels[filter]}
              {counts[filter] !== undefined && (
                <Badge variant="secondary" className="text-xs h-4 px-1 min-w-[1rem]">
                  {counts[filter]}
                </Badge>
              )}
            </span>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
};