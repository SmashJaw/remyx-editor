import React, { useCallback } from 'react'
import PropTypes from 'prop-types'
import { ICON_MAP } from '../../icons/index.jsx'
import { Tooltip } from '../Tooltip/Tooltip.jsx'

export const ToolbarButton = React.memo(function ToolbarButton({ command, icon, tooltip, active, disabled, onClick, shortcutLabel, children, itemStyle }) {
  const IconComponent = children ? null : ICON_MAP[icon || command]

  const handleClick = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) onClick?.()
  }, [disabled, onClick])

  const handleMouseDown = useCallback((e) => e.preventDefault(), [])

  return (
    <Tooltip text={tooltip} shortcut={shortcutLabel}>
      <button
        className={`rmx-toolbar-btn ${active ? 'rmx-active' : ''} ${disabled ? 'rmx-disabled' : ''}`}
        style={itemStyle || undefined}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        disabled={disabled}
        type="button"
        aria-pressed={active}
        aria-label={tooltip}
      >
        {children || (IconComponent ? <IconComponent size={18} /> : command)}
      </button>
    </Tooltip>
  )
})

ToolbarButton.propTypes = {
  command: PropTypes.string,
  icon: PropTypes.string,
  tooltip: PropTypes.string,
  active: PropTypes.bool,
  disabled: PropTypes.bool,
  onClick: PropTypes.func,
  shortcutLabel: PropTypes.string,
  children: PropTypes.node,
  itemStyle: PropTypes.object,
}
