import * as React from "react"

import { cn } from "~/lib/utils"

interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "success" | "error" | "warning"
}

const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ className, variant = "default", ...props }, ref) => {
    const variantStyles = {
      default: "border bg-background text-foreground",
      success: "border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200",
      error: "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200",
      warning: "border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-200"
    }

    return (
      <div
        ref={ref}
        className={cn(
          "fixed bottom-4 right-4 z-50 w-full max-w-sm rounded-lg border p-4 shadow-lg animate-in slide-in-from-bottom-2",
          variantStyles[variant],
          className
        )}
        {...props}
      />
    )
  }
)
Toast.displayName = "Toast"

// Simple toast context and hook
interface ToastContextType {
  showToast: (message: string, variant?: NonNullable<ToastProps["variant"]>) => void
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = React.useState<{ message: string; variant: NonNullable<ToastProps["variant"]> } | null>(null)

  const showToast = React.useCallback((message: string, variant: NonNullable<ToastProps["variant"]> = "default") => {
    setToast({ message, variant })
    setTimeout(() => setToast(null), 3000) // Auto-hide after 3 seconds
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <Toast variant={toast.variant}>
          {toast.message}
        </Toast>
      )}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = React.useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

export { Toast }