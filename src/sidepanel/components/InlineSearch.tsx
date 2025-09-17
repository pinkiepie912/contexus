import React, { useState, useEffect, useRef } from "react";
import { Search } from "lucide-react";

import type { Element, ElementType } from "~/types";
import { Card } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "~/components/ui/command";
import { useElements } from "~/hooks/useElements";

interface InlineSearchProps {
  /** The slot type to filter search results by */
  slotType?: ElementType | "text" | undefined;
  /** Placeholder text for the search input */
  placeholder?: string;
  /** Whether the search is open */
  open: boolean;
  /** Handler when search state changes */
  onOpenChange: (open: boolean) => void;
  /** Handler when an element is selected */
  onElementSelect: (element: Element) => void;
  /** Trigger element to show the popover */
  children: React.ReactNode;
  /** Auto-focus the search input when opened */
  autoFocus?: boolean;
}

/**
 * InlineSearch - Popup search component for slot assignment
 *
 * Features:
 * - Type-filtered search (auto-applies slot type filter)
 * - Keyboard navigation (arrows, enter, escape)
 * - Trigger-based search (/trigger_name)
 * - Real-time results with debouncing
 * - Quick element preview
 */
export function InlineSearch({
  slotType,
  placeholder = "Search elements...",
  open,
  onOpenChange,
  onElementSelect,
  children,
  autoFocus = true,
}: InlineSearchProps) {
  const [query, setQuery] = useState("");
  const { searchElements, isLoading } = useElements();
  const [results, setResults] = useState<Element[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced search effect
  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      if (query.trim()) {
        try {
          // Apply type filter if slot type is specified and not "text"
          const types = slotType && slotType !== "text" ? [slotType] : undefined;

          const searchPayload: any = {
            query: query.trim(),
            limit: 20,
            orderBy: "usageCount" as const,
            sortDirection: "desc" as const,
          };

          if (types) {
            searchPayload.types = types;
          }

          const response = await searchElements(searchPayload);

          setResults(response.results.filter((element): element is Element => element !== undefined));
        } catch (error) {
          console.error("Search failed:", error);
          setResults([]);
        }
      } else {
        // Show recent/popular elements when no query
        try {
          const types = slotType && slotType !== "text" ? [slotType] : undefined;

          const searchPayload: any = {
            limit: 10,
            orderBy: "usageCount" as const,
            sortDirection: "desc" as const,
          };

          if (types) {
            searchPayload.types = types;
          }

          const response = await searchElements(searchPayload);
          setResults(response.results.filter((element): element is Element => element !== undefined));
        } catch (error) {
          console.error("Failed to load recent elements:", error);
          setResults([]);
        }
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [query, open, slotType, searchElements]);

  // Auto-focus when opened
  useEffect(() => {
    if (open && autoFocus) {
      // Handle focus for the command input
      const commandInput = document.querySelector('[data-inline-search-input]') as HTMLInputElement;
      if (commandInput) {
        setTimeout(() => commandInput.focus(), 0);
      }
    }
  }, [open, autoFocus]);

  const handleElementSelect = (element: Element) => {
    onElementSelect(element);
    onOpenChange(false);
    setQuery("");
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      onOpenChange(false);
    }
  };

  const getTypeVariant = (type: ElementType): "default" | "secondary" | "outline" => {
    switch (type) {
      case "template": return "default";
      case "context": return "secondary";
      case "example": return "outline";
      case "role": return "outline";
      default: return "secondary";
    }
  };

  const formatTrigger = (trigger: string) => {
    return trigger.startsWith("/") ? trigger : `/${trigger}`;
  };

  return (
    <div className="relative">
      <div onClick={() => onOpenChange(true)}>
        {children}
      </div>

      {open && (
        <div className="absolute top-full left-0 z-50 mt-1">
          <Card className="w-80 p-0 shadow-lg border">
            <Command onKeyDown={handleKeyDown}>
              <div className="flex items-center border-b px-3">
                <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                <CommandInput
                  placeholder={placeholder}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 border-0 focus:ring-0"
                  data-inline-search-input
                />
                {slotType && slotType !== "text" && (
                  <Badge variant="outline" className="ml-2 text-xs">
                    {slotType}
                  </Badge>
                )}
              </div>

              <CommandList>
                <ScrollArea className="h-64">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                      Searching...
                    </div>
                  ) : results.length === 0 ? (
                    <CommandEmpty>
                      {query ? "No elements found." : "No recent elements."}
                    </CommandEmpty>
                  ) : (
                    <CommandGroup>
                      {results.map((element) => (
                        <CommandItem
                          key={element.id}
                          value={element.id}
                          onSelect={() => handleElementSelect(element)}
                          className="flex flex-col items-start gap-2 p-3 hover:bg-accent/50"
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-2">
                              <Badge variant={getTypeVariant(element.type)} className="text-xs">
                                {element.type.toUpperCase()}
                              </Badge>
                              <Badge variant="outline" className="text-xs font-mono">
                                {formatTrigger(element.trigger)}
                              </Badge>
                            </div>
                            {element.isFavorite && (
                              <span className="text-yellow-500 text-xs">★</span>
                            )}
                          </div>

                          <div className="w-full">
                            <div className="font-medium text-sm truncate">
                              {element.title}
                            </div>
                            {element.description && (
                              <div className="text-xs text-muted-foreground truncate mt-1">
                                {element.description}
                              </div>
                            )}
                            <div className="text-xs text-muted-foreground line-clamp-2 mt-1">
                              {element.content}
                            </div>
                          </div>

                          {element.tags && element.tags.length > 0 && (
                            <div className="flex gap-1 flex-wrap">
                              {element.tags.slice(0, 3).map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {element.tags.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{element.tags.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                </ScrollArea>
              </CommandList>
            </Command>
          </Card>
        </div>
      )}
    </div>
  );
}