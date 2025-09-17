"use client";

import * as React from "react";

import { cn } from "~/lib/utils";

interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical";
}

export function Separator({ orientation = "horizontal", className, ...props }: SeparatorProps) {
  const isVertical = orientation === "vertical";
  return (
    <div
      role="separator"
      aria-orientation={orientation}
      className={cn(
        "bg-border",
        isVertical ? "w-px h-full" : "h-px w-full",
        className,
      )}
      {...props}
    />
  );
}
