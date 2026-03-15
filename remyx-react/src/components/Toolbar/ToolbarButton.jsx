import React from 'react'
import { ICON_MAP } from '../../icons/index.jsx'

export function ToolbarButton({ command, icon, tooltip, active, disabled, onClick, shortcutLabel, children, itemStyle }) {
  const IconComponent = children ? null : ICON_MAP[icon || command]

  return (
    <button
      className={`rmx-toolbar-btn ${active ? 'rmx-active' : ''} ${disabled ? 'rmx-disabled' : ''}`}
      style={itemStyle || undefined}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        if (!disabled) onClick?.()
      }}
      onMouseDown={(e) => e.preventDefault()}
      title={shortcutLabel ? `${tooltip} (${shortcutLabel})` : tooltip}
      disabled={disabled}
      type="button"
      aria-pressed={active}
      aria-label={tooltip}
    >
      {children || (IconComponent ? <IconComponent size={18} /> : command)}
    </button>
  )
}
