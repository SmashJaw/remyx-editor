import React, { useState, useRef, useEffect } from 'react'
import { DEFAULT_COLORS } from '@remyx/core'
import { ICON_MAP } from '../../icons/index.jsx'

export function ToolbarColorPicker({ command, tooltip, currentColor, onColorSelect, itemStyle }) {
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

  return (
    <div className="rmx-toolbar-colorpicker" ref={ref} style={itemStyle || undefined}>
      <button
        className="rmx-toolbar-btn"
        onClick={(e) => {
          e.preventDefault()
          setOpen(!open)
        }}
        onMouseDown={(e) => e.preventDefault()}
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
                onMouseDown={(e) => e.preventDefault()}
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
}
