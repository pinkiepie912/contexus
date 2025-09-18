/**
 * Shadow DOM compatible Floating Action Button for content script injection
 */

import * as React from 'react'

interface ShadowFloatingActionButtonProps {
  /** Whether the FAB is active (clipboard content detected) */
  active?: boolean | undefined
  /** Callback when FAB is clicked */
  onClick?: (() => void) | undefined
  /** Initial position from localStorage */
  initialPosition?: { x: number; y: number } | undefined
  /** Callback when position changes */
  onPositionChange?: ((position: { x: number; y: number }) => void) | undefined
}

const ShadowFloatingActionButton: React.FC<ShadowFloatingActionButtonProps> = ({
  active = false,
  onClick,
  initialPosition,
  onPositionChange
}) => {
  const [position, setPosition] = React.useState(() => {
    if (initialPosition) {
      return { x: initialPosition.x, y: initialPosition.y }
    }
    // Default position: bottom: 24px, right: 24px
    return {
      x: window.innerWidth - 55 - 48, // 55px FAB width + 24px margin
      y: window.innerHeight - 55 - 48  // 55px FAB height + 24px margin
    }
  })

  const [isDragging, setIsDragging] = React.useState(false)
  const [dragOffset, setDragOffset] = React.useState({ x: 0, y: 0 })

  const handleMouseDown = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)

    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    })
  }, [position])

  const handleMouseMove = React.useCallback((e: MouseEvent) => {
    if (!isDragging) return

    e.preventDefault()

    const newX = e.clientX - dragOffset.x
    const newY = e.clientY - dragOffset.y

    // Keep within viewport bounds
    const maxX = window.innerWidth - 55
    const maxY = window.innerHeight - 55

    const clampedPosition = {
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY))
    }

    setPosition(clampedPosition)
    onPositionChange?.(clampedPosition)
  }, [isDragging, dragOffset, onPositionChange])

  const handleMouseUp = React.useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleClick = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // Only trigger click if we weren't dragging
    if (!isDragging) {
      onClick?.()
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

  // Adjust on viewport resize to keep within bounds
  React.useEffect(() => {
    const handleResize = () => {
      const maxX = window.innerWidth - 55
      const maxY = window.innerHeight - 55
      const clamped = {
        x: Math.max(0, Math.min(position.x, maxX)),
        y: Math.max(0, Math.min(position.y, maxY))
      }
      if (clamped.x !== position.x || clamped.y !== position.y) {
        setPosition(clamped)
        onPositionChange?.(clamped)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [position, onPositionChange])

  return (
    <button
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 99999,
        width: '55px',
        height: '55px',
        borderRadius: '50%',
        backgroundColor: '#3b82f6', // Tailwind blue-500
        color: '#ffffff', // white logo/text
        border: 'none',
        boxShadow: active
          ? '0 8px 25px -8px rgba(0, 0, 0, 0.25), 0 0 0 2px rgba(59, 130, 246, 0.2), 0 0 0 4px rgba(59, 130, 246, 0.1)'
          : '0 4px 12px -4px rgba(0, 0, 0, 0.25)',
        cursor: isDragging ? 'grabbing' : 'grab',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'auto',
        transition: isDragging
          ? 'box-shadow 0.2s ease'
          : 'all 0.3s ease, box-shadow 0.2s ease',
        transform: isDragging ? 'scale(1.05)' : 'scale(1)',
        animation: active ? 'contexus-pulse 2s infinite' : 'none',
        outline: 'none',
        WebkitTapHighlightColor: 'transparent'
      }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      aria-label="Open Contexus"
      title="Open Contexus"
    >
      <span
        style={{
          fontWeight: 800,
          fontSize: 18,
          letterSpacing: 0.2,
          userSelect: 'none',
        }}
      >
        Cx
      </span>

      {/* Inject keyframes animation */}
      <style>
        {`
          @keyframes contexus-pulse {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.7;
            }
          }
        `}
      </style>
    </button>
  )
}

export { ShadowFloatingActionButton }
