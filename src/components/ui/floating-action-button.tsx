import * as React from "react"
import { Brain } from "lucide-react"

import { Button } from "./button"

import { cn } from "~/lib/utils"

interface FloatingActionButtonProps extends React.ComponentProps<"button"> {
  /** Whether the FAB is active (e.g., when clipboard content is detected) */
  active?: boolean
  /** Position of the FAB. Defaults to bottom-right */
  position?: {
    bottom?: string
    right?: string
    top?: string
    left?: string
  }
  /** Custom icon component. Defaults to Brain icon */
  icon?: React.ReactNode
  /** Draggable functionality */
  draggable?: boolean
  /** Callback when position changes due to dragging */
  onPositionChange?: (position: { x: number; y: number }) => void
}

const FloatingActionButton = React.forwardRef<
  HTMLButtonElement,
  FloatingActionButtonProps
>(({
  className,
  active = false,
  position = { bottom: "24px", right: "24px" },
  icon,
  draggable = true,
  onPositionChange,
  onClick,
  style,
  ...props
}, ref) => {
  const [isDragging, setIsDragging] = React.useState(false)
  const [dragOffset, setDragOffset] = React.useState({ x: 0, y: 0 })
  const fabRef = React.useRef<HTMLButtonElement>(null)

  // Use ref from props or internal ref
  const buttonRef = ref || fabRef

  const handleMouseDown = React.useCallback((e: React.MouseEvent) => {
    if (!draggable) return

    e.preventDefault()
    setIsDragging(true)

    const button = (buttonRef as React.RefObject<HTMLButtonElement>)?.current
    if (button) {
      const rect = button.getBoundingClientRect()
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      })
    }
  }, [draggable, buttonRef])

  const handleMouseMove = React.useCallback((e: MouseEvent) => {
    if (!isDragging || !draggable) return

    e.preventDefault()

    const newX = e.clientX - dragOffset.x
    const newY = e.clientY - dragOffset.y

    // Keep within viewport bounds
    const maxX = window.innerWidth - 55 // FAB width
    const maxY = window.innerHeight - 55 // FAB height

    const clampedX = Math.max(0, Math.min(newX, maxX))
    const clampedY = Math.max(0, Math.min(newY, maxY))

    const button = (buttonRef as React.RefObject<HTMLButtonElement>)?.current
    if (button) {
      button.style.left = `${clampedX}px`
      button.style.top = `${clampedY}px`
      button.style.right = 'auto'
      button.style.bottom = 'auto'
    }

    onPositionChange?.({ x: clampedX, y: clampedY })
  }, [isDragging, dragOffset, draggable, onPositionChange, buttonRef])

  const handleMouseUp = React.useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleClick = React.useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    // Only trigger click if we weren't dragging
    if (!isDragging) {
      onClick?.(e)
    }
  }, [isDragging, onClick])

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)

      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  const inlineStyles: React.CSSProperties = {
    position: 'fixed',
    zIndex: 99999,
    width: '55px',
    height: '55px',
    cursor: draggable ? (isDragging ? 'grabbing' : 'grab') : 'pointer',
    ...position,
    ...style
  }

  return (
    <Button
      ref={buttonRef}
      className={cn(
        // Base FAB styles
        "rounded-full shadow-lg transition-all duration-300 ease-in-out",
        "hover:shadow-xl focus:shadow-xl",
        "flex items-center justify-center p-0",

        // Active state animation (breathing effect)
        active && [
          "animate-pulse",
          "ring-2 ring-primary/20 ring-offset-2",
          "shadow-primary/20"
        ],

        // Dragging state
        isDragging && "shadow-2xl scale-105",

        className
      )}
      style={inlineStyles}
      variant="default"
      size="icon"
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      {...props}
    >
      {icon || <Brain className="h-6 w-6" />}
    </Button>
  )
})

FloatingActionButton.displayName = "FloatingActionButton"

export { FloatingActionButton }
export type { FloatingActionButtonProps }