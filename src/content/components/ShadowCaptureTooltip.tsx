/**
 * Shadow DOM compatible Contextual Tooltip rendered near the FAB
 */

import * as React from 'react'

interface ShadowCaptureTooltipProps {
  visible?: boolean | undefined
  anchorPosition?: { x: number; y: number } | undefined
  onClose?: (() => void) | undefined
  onSelectType?: ((type: 'context' | 'template' | 'example' | 'role') => void) | undefined
}

export const ShadowCaptureTooltip: React.FC<ShadowCaptureTooltipProps> = ({
  visible = false,
  anchorPosition,
  onClose,
  onSelectType,
}) => {
  if (!visible || !anchorPosition) return null

  const tooltipX = Math.max(8, anchorPosition.x - 220) // show to the left of the FAB
  const tooltipY = Math.max(8, Math.min(anchorPosition.y - 8, window.innerHeight - 120))

  return (
    <div
      style={{
        position: 'fixed',
        left: `${tooltipX}px`,
        top: `${tooltipY}px`,
        zIndex: 100000,
        minWidth: '200px',
        maxWidth: '260px',
        backgroundColor: 'white',
        color: '#111827',
        borderRadius: 8,
        boxShadow: '0 10px 25px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.06)',
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        animation: 'contexus-fade-in 160ms ease-out',
        pointerEvents: 'auto',
      }}
      role="dialog"
      aria-label="Copy to Contexus"
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#2563eb' }}>Copy to Contexus</span>
        <button
          onClick={() => onClose?.()}
          aria-label="Close"
          title="Close"
          style={{
            border: 'none',
            background: 'transparent',
            color: '#6b7280',
            cursor: 'pointer',
            lineHeight: 1,
            fontSize: 14,
          }}
        >
          ×
        </button>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {(['context', 'template', 'example', 'role'] as const).map((type) => (
          <button
            key={type}
            onClick={() => onSelectType?.(type)}
            style={{
              fontSize: 11,
              padding: '6px 8px',
              borderRadius: 6,
              border: '1px solid rgba(0,0,0,0.08)',
              backgroundColor: '#f9fafb',
              color: '#111827',
              cursor: 'pointer',
            }}
          >
            {`# ${type.charAt(0).toUpperCase()}${type.slice(1)}`}
          </button>
        ))}
      </div>

      <style>{`
        @keyframes contexus-fade-in {
          from { opacity: 0; transform: translateY(2px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

export default ShadowCaptureTooltip
