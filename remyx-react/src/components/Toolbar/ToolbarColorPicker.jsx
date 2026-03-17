import React, { useState, useRef, useEffect, useCallback } from 'react'
import { DEFAULT_COLORS } from '@remyxjs/core'
import { ICON_MAP } from '../../icons/index.jsx'

export const ToolbarColorPicker = React.memo(function ToolbarColorPicker({ command, tooltip, currentColor, onColorSelect, itemStyle }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const IconComponent = ICON_MAP[command]

  const handleToggle = useCallback((e) => {
    e.preventDefault()
    setOpen(prev => !prev)
  }, [])

  const handleMouseDown = useCallback((e) => e.preventDefault(), [])

  return (
    <div className="rmx-toolbar-colorpicker" ref={ref} style={itemStyle || undefined}>
      <button
        className="rmx-toolbar-btn"
        onClick={handleToggle}
        onMouseDown={handleMouseDown}
        title={tooltip}
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
      >
        {IconComponent && <IconComponent size={18} color={currentColor || (command === 'foreColor' ? '#000000' : '#ffff00')} />}
      </button>
      {open && (
        <div className="rmx-color-palette">
          <div className="rmx-color-grid">
            {DEFAULT_COLORS.map((color) => (
              <button
                key={color}
                className={`rmx-color-swatch ${color === currentColor ? 'rmx-active' : ''}`}
                style={{ backgroundColor: color }}
                onClick={(e) => {
                  e.preventDefault()
                  onColorSelect(color)
                  setOpen(false)
                }}
                onMouseDown={handleMouseDown}
                title={color}
                type="button"
                aria-label={`Color ${color}`}
              />
            ))}
          </div>
          <div className="rmx-color-custom">
            <label>
              Custom:
              <input
                type="color"
                value={currentColor || '#000000'}
                onChange={(e) => {
                  onColorSelect(e.target.value)
                  setOpen(false)
                }}
                onMouseDown={(e) => e.stopPropagation()}
              />
            </label>
          </div>
        </div>
      )}
    </div>
  )
})
