"use client";

import * as React from "react";

import { cn } from "~/lib/utils";

type DropdownContextValue = {
  open: boolean;
  setOpen: (next: boolean) => void;
};

const DropdownContext = React.createContext<DropdownContextValue | null>(null);

export function DropdownMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  return <DropdownContext.Provider value={{ open, setOpen }}>{children}</DropdownContext.Provider>;
}

type DropdownMenuTriggerChild = React.ReactElement<{ onClick?: React.MouseEventHandler }>;

export function DropdownMenuTrigger({ children }: { children: DropdownMenuTriggerChild }) {
  const context = React.useContext(DropdownContext);
  if (!context) {
    throw new Error("DropdownMenuTrigger must be used within a DropdownMenu");
  }
  const handleClick: React.MouseEventHandler = (event) => {
    children.props.onClick?.(event);
    context.setOpen(!context.open);
  };
  return React.cloneElement(children, {
    onClick: handleClick,
  });
}

export function DropdownMenuContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const context = React.useContext(DropdownContext);
  if (!context?.open) return null;
  return (
    <div
      className={cn(
        "z-50 min-w-[10rem] rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
        className,
      )}
      {...props}
    />
  );
}

export const DropdownMenuPortal = ({ children }: { children: React.ReactNode }) => <>{children}</>;
export const DropdownMenuGroup = ({ children }: { children: React.ReactNode }) => <>{children}</>;
export const DropdownMenuLabel = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement> & { inset?: boolean }) => (
  <div className={cn("px-2 py-1.5 text-sm font-medium", className)} {...props} />
);
export const DropdownMenuSeparator = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("my-1 h-px bg-border", className)} {...props} />
);
export const DropdownMenuShortcut = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
  <span className={cn("ml-auto text-xs tracking-widest text-muted-foreground", className)} {...props} />
);

interface ItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  inset?: boolean;
  variant?: "default" | "destructive";
}

export function DropdownMenuItem({ inset, variant = "default", className, ...props }: ItemProps) {
  return (
    <button
      type="button"
      className={cn(
        "flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
        inset && "pl-8",
        variant === "destructive" && "text-destructive hover:bg-destructive/10",
        className,
      )}
      {...props}
    />
  );
}

export const DropdownMenuCheckboxItem = DropdownMenuItem;
export const DropdownMenuRadioGroup = ({ children }: { children: React.ReactNode }) => <>{children}</>;
export const DropdownMenuRadioItem = DropdownMenuItem;
export const DropdownMenuSub = ({ children }: { children: React.ReactNode }) => <>{children}</>;
export const DropdownMenuSubTrigger = DropdownMenuItem;
export const DropdownMenuSubContent = ({ children }: { children: React.ReactNode }) => <>{children}</>;
