/**
 * Shadow DOM Button Component
 *
 * A React Button component optimized for Shadow DOM usage in content scripts.
 * Based on the existing Button component but adapted for Shadow DOM isolation.
 */

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

const shadowButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 shrink-0",
  {
    variants: {
      variant: {
        default: "bg-slate-900 text-white shadow hover:bg-slate-800 focus-visible:ring-slate-900",
        destructive: "bg-red-500 text-white shadow hover:bg-red-600 focus-visible:ring-red-500",
        outline: "border border-slate-200 bg-white shadow-sm hover:bg-slate-50 hover:text-slate-900 focus-visible:ring-slate-900",
        secondary: "bg-slate-100 text-slate-900 shadow-sm hover:bg-slate-200 focus-visible:ring-slate-900",
        ghost: "hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-slate-900",
        link: "text-slate-900 underline-offset-4 hover:underline focus-visible:ring-slate-900",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function ShadowButton({
  className,
  variant,
  size,
  children,
  onClick,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof shadowButtonVariants> & {
    children?: React.ReactNode
    onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void
  }) {

  // Combine class names manually (no cn utility in Shadow DOM)
  const combinedClassName = [
    shadowButtonVariants({ variant, size }),
    className
  ].filter(Boolean).join(' ')

  return (
    <button
      className={combinedClassName}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  )
}

export { ShadowButton, shadowButtonVariants }
export type { VariantProps }