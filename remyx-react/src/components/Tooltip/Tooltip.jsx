import React, { useState, useRef, useCallback } from 'react'

/**
 * Styled tooltip component that replaces native `title` attributes.
 * Shows on hover/focus with a small delay, displaying command name
 * and optional keyboard shortcut hint.
 *
 * @param {{ text: string, shortcut?: string, children: React.ReactNode }} props
 */
function TooltipInner({ text, shortcut, children }) {
  const [visible, setVisible] = useState(false)
  const timerRef = useRef(null)

  const show = useCallback(() => {
    timerRef.current = setTimeout(() => setVisible(true), 200)
  }, [])

  const hide = useCallback(() => {
    clearTimeout(timerRef.current)
    setVisible(false)
  }, [])

  if (!text) return children

  const label = shortcut ? `${text} \u2014 ${shortcut}` : text

  return (
    <span
      className="rmx-tooltip-wrap"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {visible && (
        <span className="rmx-tooltip" role="tooltip" aria-hidden="true">
          <span className="rmx-tooltip-text">{label}</span>
          <span className="rmx-tooltip-arrow" />
        </span>
      )}
    </span>
  )
}

export const Tooltip = React.memo(TooltipInner)
