import React from 'react'

/**
 * EmptyState — renders when the editor has no content.
 * Configurable via the `emptyState` prop on RemyxEditor:
 * - `true` → shows the default illustration + "Start typing..." message
 * - React node → renders the provided custom content
 * - `false` / omitted → not rendered
 */
export function EmptyState({ custom, onClick }) {
  if (custom && custom !== true) {
    return (
      <div className="rmx-empty-state" onClick={onClick} role="button" tabIndex={0}>
        {custom}
      </div>
    )
  }

  return (
    <div className="rmx-empty-state" onClick={onClick} role="button" tabIndex={0}>
      <div className="rmx-empty-state-icon">
        <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <rect x="8" y="8" width="48" height="48" rx="6" fill="none" stroke="currentColor" strokeWidth="2" />
          <line x1="16" y1="20" x2="48" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1="16" y1="28" x2="40" y2="28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
          <line x1="16" y1="36" x2="44" y2="36" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
          <line x1="16" y1="44" x2="32" y2="44" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.2" />
        </svg>
      </div>
      <div className="rmx-empty-state-text">Start typing...</div>
      <div className="rmx-empty-state-hint">or paste content, drag a file, or use the toolbar above</div>
    </div>
  )
}
