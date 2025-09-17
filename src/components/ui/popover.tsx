"use client";

import * as React from "react";

import { cn } from "~/lib/utils";

type PopoverContextValue = {
  open: boolean;
  setOpen: (next: boolean) => void;
};

const PopoverContext = React.createContext<PopoverContextValue | null>(null);

export function Popover({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  return <PopoverContext.Provider value={{ open, setOpen }}>{children}</PopoverContext.Provider>;
}

type PopoverTriggerChild = React.ReactElement<{ onClick?: React.MouseEventHandler }>;

export function PopoverTrigger({ children }: { children: PopoverTriggerChild }) {
  const context = React.useContext(PopoverContext);
  if (!context) {
    throw new Error("PopoverTrigger must be used within a Popover");
  }
  const handleClick: React.MouseEventHandler = (event) => {
    children.props.onClick?.(event);
    context.setOpen(!context.open);
  };
  return React.cloneElement(children, {
    onClick: handleClick,
  });
}

export function PopoverContent({
  className,
  align = "center",
  sideOffset = 4,
  style,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { align?: "center" | "start" | "end"; sideOffset?: number }) {
  const context = React.useContext(PopoverContext);
  if (!context?.open) return null;

  return (
    <div
      className={cn(
        "z-50 w-64 rounded-md border bg-popover p-4 text-popover-foreground shadow-md",
        className,
      )}
      style={{ marginTop: sideOffset, ...style }}
      data-align={align}
      {...props}
    />
  );
}

export const PopoverAnchor = ({ children }: { children: React.ReactNode }) => <>{children}</>;
