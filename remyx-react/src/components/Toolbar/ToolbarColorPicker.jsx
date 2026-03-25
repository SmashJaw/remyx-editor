import React, { useState, useRef, useEffect, useCallback } from 'react'
import PropTypes from 'prop-types'
import { DEFAULT_COLORS, loadColorPresets, saveColorPreset } from '@remyxjs/core'
import { ICON_MAP } from '../../icons/index.jsx'

// #44: Human-readable color names for common hex values
const COLOR_NAMES = {
  '#000000': 'Black', '#ffffff': 'White', '#ff0000': 'Red', '#00ff00': 'Lime',
  '#0000ff': 'Blue', '#ffff00': 'Yellow', '#ff00ff': 'Magenta', '#00ffff': 'Cyan',
  '#808080': 'Gray', '#800000': 'Maroon', '#808000': 'Olive', '#008000': 'Green',
  '#800080': 'Purple', '#008080': 'Teal', '#000080': 'Navy', '#c0c0c0': 'Silver',
  '#ffa500': 'Orange', '#ffc0cb': 'Pink', '#a52a2a': 'Brown', '#f5f5dc': 'Beige',
  '#ff6347': 'Tomato', '#4682b4': 'Steel Blue', '#2e8b57': 'Sea Green',
  '#daa520': 'Goldenrod', '#cd5c5c': 'Indian Red', '#4b0082': 'Indigo',
  '#ee82ee': 'Violet', '#f0e68c': 'Khaki', '#e6e6fa': 'Lavender',
  '#fa8072': 'Salmon', '#40e0d0': 'Turquoise', '#ff69b4': 'Hot Pink',
}

// Number of columns in the color grid (matching CSS grid-template-columns)
const GRID_COLS = 10

export const ToolbarColorPicker = React.memo(function ToolbarColorPicker({ command, tooltip, currentColor, onColorSelect, itemStyle, engine }) {
  const [open, setOpen] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const ref = useRef(null)
  const swatchRefs = useRef([])
  const savedSelectionRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); setOpen(false) }
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  // Reset focused index when palette opens
  useEffect(() => {
    if (open) {
      const idx = DEFAULT_COLORS.findIndex(c => c === currentColor)
      setFocusedIndex(idx >= 0 ? idx : 0)
    }
  }, [open, currentColor])

  // #26: Focus swatch when focusedIndex changes (roving tabindex)
  // Only focus on keyboard navigation, not on initial open (to preserve editor selection)
  const hasInteracted = useRef(false)
  useEffect(() => {
    if (open && hasInteracted.current && focusedIndex >= 0 && swatchRefs.current[focusedIndex]) {
      swatchRefs.current[focusedIndex].focus()
    }
  }, [open, focusedIndex])

  // Reset interaction flag when opening/closing
  useEffect(() => {
    if (!open) hasInteracted.current = false
  }, [open])

  // Wrap onColorSelect to restore selection first
  const handleColorApply = useCallback((color) => {
    if (savedSelectionRef.current && engine?.selection) {
      engine.selection.restore(savedSelectionRef.current)
      savedSelectionRef.current = null
    }
    onColorSelect(color)
  }, [onColorSelect, engine])

  const IconComponent = ICON_MAP[command]

  const handleToggle = useCallback((e) => {
    e.preventDefault()
    setOpen(prev => {
      if (!prev && engine?.selection) {
        // Save selection when opening the picker
        savedSelectionRef.current = engine.selection.save()
      }
      return !prev
    })
  }, [engine])

  const handleMouseDown = useCallback((e) => e.preventDefault(), [])

  // #26: Keyboard navigation for color swatches
  const handleSwatchKeyDown = useCallback((e, index) => {
    hasInteracted.current = true
    const totalColors = DEFAULT_COLORS.length
    let newIndex = index

    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault()
        newIndex = (index + 1) % totalColors
        break
      case 'ArrowLeft':
        e.preventDefault()
        newIndex = (index - 1 + totalColors) % totalColors
        break
      case 'ArrowDown':
        e.preventDefault()
        newIndex = index + GRID_COLS < totalColors ? index + GRID_COLS : index
        break
      case 'ArrowUp':
        e.preventDefault()
        newIndex = index - GRID_COLS >= 0 ? index - GRID_COLS : index
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        handleColorApply(DEFAULT_COLORS[index])
        setOpen(false)
        return
      case 'Escape':
        e.preventDefault()
        setOpen(false)
        return
      default:
        return
    }

    setFocusedIndex(newIndex)
  }, [handleColorApply])

  // #30: Default button handler
  const handleDefault = useCallback((e) => {
    e.preventDefault()
    handleColorApply('')
    setOpen(false)
  }, [handleColorApply])

  return (
    <div className="rmx-toolbar-colorpicker" ref={ref} style={itemStyle || undefined}>
      <button
        className="rmx-toolbar-btn"
        onClick={handleToggle}
        onMouseDown={handleMouseDown}
        title={tooltip}
        aria-label={tooltip}
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
      >
        {IconComponent && <IconComponent size={18} color={currentColor || (command === 'foreColor' ? '#000000' : '#ffff00')} />}
      </button>
      {open && (
        <div className="rmx-color-palette">
          {/* #30: Default button to remove color */}
          <button
            type="button"
            className="rmx-color-default-btn"
            onClick={handleDefault}
            onMouseDown={handleMouseDown}
          >
            Default
          </button>
          <div className="rmx-color-grid" role="grid">
            {DEFAULT_COLORS.map((color, i) => (
              <button
                key={color}
                ref={(el) => { swatchRefs.current[i] = el }}
                className={`rmx-color-swatch ${color === currentColor ? 'rmx-active' : ''}`}
                style={{ backgroundColor: color }}
                onClick={(e) => {
                  e.preventDefault()
                  handleColorApply(color)
                  setOpen(false)
                }}
                onMouseDown={handleMouseDown}
                onKeyDown={(e) => handleSwatchKeyDown(e, i)}
                title={COLOR_NAMES[color.toLowerCase()] || color}
                type="button"
                tabIndex={i === focusedIndex ? 0 : -1}
                aria-label={`Color ${COLOR_NAMES[color.toLowerCase()] || color}`}
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
                  handleColorApply(e.target.value)
                  setOpen(false)
                }}
                onMouseDown={(e) => e.stopPropagation()}
              />
            </label>
          </div>
          <ColorPresetSection engine={engine} onColorSelect={onColorSelect} />
        </div>
      )}
    </div>
  )
})

/**
 * Color preset section — save/load named color palettes from localStorage.
 * #56: Uses CSS classes instead of inline styles.
 */
function ColorPresetSection({ engine, onColorSelect }) {
  const [presets, setPresets] = useState(() => loadColorPresets())
  const [showSave, setShowSave] = useState(false)
  const [presetName, setPresetName] = useState('')

  useEffect(() => {
    if (!engine) return
    const unsub = engine.eventBus?.on('colorPresets:change', ({ presets: p }) => setPresets(p))
    return () => { if (typeof unsub === 'function') unsub() }
  }, [engine])

  const handleSave = () => {
    if (!presetName.trim()) return
    saveColorPreset(presetName.trim(), [...DEFAULT_COLORS])
    setPresets(loadColorPresets())
    setPresetName('')
    setShowSave(false)
  }

  if (presets.length === 0 && !showSave) {
    return (
      <div className="rmx-color-presets">
        <button
          type="button"
          onClick={() => setShowSave(true)}
          className="rmx-color-preset-save-btn"
        >
          + Save Preset
        </button>
      </div>
    )
  }

  return (
    <div className="rmx-color-presets">
      {presets.map((preset) => (
        <div key={preset.name} className="rmx-color-preset-row">
          <span className="rmx-color-preset-name">{preset.name}</span>
          <div className="rmx-color-preset-swatches">
            {preset.colors.slice(0, 6).map((c, i) => (
              <button
                key={i}
                type="button"
                className="rmx-color-preset-swatch"
                style={{ backgroundColor: c }}
                onClick={() => onColorSelect(c)}
                title={COLOR_NAMES[c.toLowerCase()] || c}
              />
            ))}
          </div>
        </div>
      ))}
      {showSave ? (
        <div className="rmx-color-preset-save-form">
          <input
            type="text"
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            placeholder="Preset name..."
            className="rmx-color-preset-save-input"
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            onMouseDown={(e) => e.stopPropagation()}
          />
          <button type="button" onClick={handleSave} className="rmx-color-preset-save-confirm">Save</button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowSave(true)}
          className="rmx-color-preset-save-btn"
          style={{ marginTop: 2 }}
        >
          + Save Preset
        </button>
      )}
    </div>
  )
}

ToolbarColorPicker.propTypes = {
  command: PropTypes.string.isRequired,
  tooltip: PropTypes.string,
  currentColor: PropTypes.string,
  onColorSelect: PropTypes.func.isRequired,
  itemStyle: PropTypes.object,
  engine: PropTypes.object,
}
