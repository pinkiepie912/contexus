"use client";

import * as React from "react";

import { cn } from "~/lib/utils";

type DialogContextValue = {
  open: boolean;
  setOpen: (next: boolean) => void;
};

const DialogContext = React.createContext<DialogContextValue | null>(null);

interface DialogProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (next: boolean) => void;
  children: React.ReactNode;
}

export function Dialog({ open: controlledOpen, defaultOpen, onOpenChange, children }: DialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen ?? false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  const setOpen = React.useCallback(
    (next: boolean) => {
      if (!isControlled) {
        setUncontrolledOpen(next);
      }
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange],
  );

  return (
    <DialogContext.Provider value={{ open, setOpen }}>{children}</DialogContext.Provider>
  );
}

type DialogTriggerChild = React.ReactElement<{ onClick?: React.MouseEventHandler }>;

export function DialogTrigger({ children }: { children: DialogTriggerChild }) {
  const context = React.useContext(DialogContext);
  if (!context) {
    throw new Error("DialogTrigger must be used within a Dialog");
  }
  const handleClick: React.MouseEventHandler = (event) => {
    children.props.onClick?.(event);
    context.setOpen(true);
  };
  return React.cloneElement(children, {
    onClick: handleClick,
  });
}

export function DialogPortal({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function DialogOverlay({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const context = React.useContext(DialogContext);
  if (!context?.open) return null;
  return <div className={cn("fixed inset-0 bg-black/40", className)} {...props} />;
}

export function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { showCloseButton?: boolean }) {
  const context = React.useContext(DialogContext);
  if (!context?.open) return null;

  return (
    <DialogPortal>
      <DialogOverlay />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "fixed left-1/2 top-1/2 z-50 w-[min(90vw,480px)] -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-background p-6 shadow-lg",
          className,
        )}
        {...props}
      >
        {children}
        {showCloseButton ? <DialogClose /> : null}
      </div>
    </DialogPortal>
  );
}

export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-2 text-left", className)} {...props} />;
}

export function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-2 sm:flex-row sm:justify-end", className)} {...props} />;
}

export function DialogTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("text-lg font-semibold", className)} {...props} />;
}

export function DialogDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

export function DialogClose({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const context = React.useContext(DialogContext);
  if (!context) return null;
  return (
    <button
      type="button"
      className={cn("absolute right-4 top-4 text-sm text-muted-foreground", className)}
      onClick={() => context.setOpen(false)}
      {...props}
    >
      ×
      <span className="sr-only">Close</span>
    </button>
  );
}
