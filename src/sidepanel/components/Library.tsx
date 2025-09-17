import React, { useState, useEffect, useMemo, useRef } from "react";
import { Search } from "lucide-react";

import { ElementCard } from "./ElementCard";
import { FilterTabs } from "./FilterTabs";

import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { ScrollArea } from "~/components/ui/scroll-area";
import { useElements } from "~/hooks/useElements";
import type { Element, ElementType, SearchElementsPayload } from "~/types";

interface LibraryProps {
  onElementAdd: (element: Element) => void;
  compact?: boolean;
}

export const Library: React.FC<LibraryProps> = ({ onElementAdd, compact = false }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<ElementType | "all">("all");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Debounce search query (300ms as per PRD)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Auto-focus search input on mount
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  // Build search filters
  const searchFilters = useMemo((): SearchElementsPayload => {
    const filters: SearchElementsPayload = {
      limit: 50,
      orderBy: "updatedAt",
      sortDirection: "desc",
    };

    if (debouncedQuery.trim()) {
      filters.query = debouncedQuery.trim();
    }

    if (activeFilter !== "all") {
      filters.types = [activeFilter];
    }

    return filters;
  }, [debouncedQuery, activeFilter]);

  // Use elements hook with filters
  const { elements, orderedIds, loading, error, total } = useElements(searchFilters);

  // Calculate counts for filter tabs
  const elementCounts = useMemo(() => {
    const counts: Record<ElementType | "all", number> = {
      all: total,
      template: 0,
      context: 0,
      example: 0,
      role: 0,
    };

    // If we have elements loaded, calculate actual counts from current filter
    Object.values(elements).forEach((element) => {
      counts[element.type]++;
    });

    return counts;
  }, [elements, total]);

  // Get filtered elements in order with proper type guard
  const filteredElements = useMemo(() => {
    return orderedIds
      .map(id => elements[id])
      .filter((element): element is Element => element !== undefined);
  }, [orderedIds, elements]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleFilterChange = (filter: ElementType | "all") => {
    setActiveFilter(filter);
  };

  const handleQuickAdd = (element: Element) => {
    onElementAdd(element);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow keyboard navigation in search
    if (e.key === "Escape") {
      setSearchQuery("");
      setActiveFilter("all");
    }
  };

  const getCompactClasses = () => {
    if (compact) {
      return {
        card: "h-full flex flex-col",
        header: "pb-2",
        title: "text-base font-semibold",
        searchWrapper: "relative",
        searchIcon: "absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground",
        searchInput: "pl-8 h-8 text-sm",
        content: "flex-1 p-0",
        scrollArea: "h-full px-3 pb-3",
        cardGrid: "space-y-2"
      };
    }

    return {
      card: "h-full flex flex-col",
      header: "pb-4",
      title: "text-lg font-semibold",
      searchWrapper: "relative",
      searchIcon: "absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground",
      searchInput: "pl-10",
      content: "flex-1 p-0",
      scrollArea: "h-full px-6 pb-6",
      cardGrid: "space-y-3"
    };
  };

  const classes = getCompactClasses();

  return (
    <Card className={classes.card}>
      <CardHeader className={classes.header}>
        <CardTitle className={classes.title}>라이브러리</CardTitle>

        {/* Search Input */}
        <div className={classes.searchWrapper}>
          <Search className={classes.searchIcon} />
          <Input
            ref={searchInputRef}
            type="text"
            placeholder="엘리먼트 검색..."
            value={searchQuery}
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
            className={classes.searchInput}
          />
        </div>

        {/* Filter Tabs - Hide in compact mode */}
        {!compact && (
          <FilterTabs
            activeFilter={activeFilter}
            onFilterChange={handleFilterChange}
            counts={elementCounts}
          />
        )}
      </CardHeader>

      <CardContent className={classes.content}>
        <ScrollArea className={classes.scrollArea}>
          {error && (
            <div className="text-sm text-destructive p-4 text-center">
              오류: {error}
            </div>
          )}

          {loading && (
            <div className="text-sm text-muted-foreground p-4 text-center">
              로딩 중...
            </div>
          )}

          {!loading && !error && filteredElements.length === 0 && (
            <div className="text-sm text-muted-foreground p-4 text-center">
              {searchQuery || activeFilter !== "all"
                ? "검색 결과가 없습니다."
                : "엘리먼트가 없습니다."}
            </div>
          )}

          {!loading && filteredElements.length > 0 && (
            <div className={classes.cardGrid}>
              {filteredElements.map((element) => (
                <ElementCard
                  key={element.id}
                  element={element}
                  onQuickAdd={handleQuickAdd}
                  draggable
                  compact={compact}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};