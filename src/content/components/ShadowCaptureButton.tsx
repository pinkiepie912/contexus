/**
 * Shadow DOM Capture Button Component
 *
 * A React-based capture button for Shadow DOM environments.
 * Provides isolation from host page styles while maintaining consistency.
 */

import * as React from 'react'

import { ShadowButton } from './ShadowButton'

export interface ShadowCaptureButtonProps {
  onCapture: () => Promise<void>
  className?: string
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

export function ShadowCaptureButton({
  onCapture,
  className,
  size = 'icon'
}: ShadowCaptureButtonProps) {
  const [isLoading, setIsLoading] = React.useState(false)
  const [feedback, setFeedback] = React.useState<'success' | 'error' | null>(null)

  const handleCapture = async () => {
    if (isLoading) return

    try {
      setIsLoading(true)
      await onCapture()

      // Show success feedback
      setFeedback('success')
      setTimeout(() => setFeedback(null), 500)
    } catch (error) {
      console.warn('[ShadowCaptureButton] Capture failed:', error)

      // Show error feedback
      setFeedback('error')
      setTimeout(() => setFeedback(null), 1000)
    } finally {
      setIsLoading(false)
    }
  }

  // Create SVG icon as React element
  const CaptureIcon = () => (
    <svg
      viewBox="0 0 48 48"
      width="24"
      height="24"
      style={{
        display: 'block',
        flexShrink: 0
      }}
    >
      <defs>
        <linearGradient id="contexus-gradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4f46e5"/>
          <stop offset="100%" stopColor="#22d3ee"/>
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="40" height="40" rx="10" fill="url(#contexus-gradient)"/>
      <text
        x="24"
        y="30"
        textAnchor="middle"
        fontSize="20"
        fontFamily="system-ui, Segoe UI, Arial"
        fill="white"
        fontWeight="700"
      >
        C
      </text>
    </svg>
  )

  // Dynamic styles based on state
  const buttonStyle: React.CSSProperties = {
    transition: 'all 0.2s ease',
    opacity: isLoading ? 0.7 : 1,
    transform: isLoading ? 'scale(0.95)' : 'scale(1)',
    outline: feedback === 'success'
      ? '2px solid rgba(34, 211, 238, 0.8)'
      : feedback === 'error'
      ? '2px solid rgba(239, 68, 68, 0.8)'
      : 'none',
    outlineOffset: feedback ? '2px' : '0',
    animation: feedback === 'success'
      ? 'contexus-pulse 0.5s ease-out'
      : feedback === 'error'
      ? 'contexus-shake 0.3s ease-out'
      : 'none'
  }

  return (
    <>
      <ShadowButton
        variant="ghost"
        size={size}
        onClick={handleCapture}
        disabled={isLoading}
        className={className}
        style={buttonStyle}
        title="Save with Contexus"
        aria-label="Save with Contexus"
      >
        <CaptureIcon />
      </ShadowButton>
    </>
  )
}
