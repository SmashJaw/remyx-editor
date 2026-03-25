import React, { useState, useRef, useEffect, useCallback } from 'react'
import PropTypes from 'prop-types'
import { ChevronDownIcon } from '../../icons/index.jsx'

export const ToolbarDropdown = React.memo(function ToolbarDropdown({ label, value, options, onChange, tooltip, icon: Icon, width = 120, itemStyle }) {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const ref = useRef(null)
  const menuRef = useRef(null)

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

  // Reset activeIndex when opening
  useEffect(() => {
    if (open) {
      const idx = options.findIndex((o) => o.value === value)
      setActiveIndex(idx >= 0 ? idx : 0)
    }
  }, [open, options, value])

  const currentOption = options.find((o) => o.value === value)
  const displayLabel = currentOption?.label || label

  const handleToggle = useCallback((e) => {
    e.preventDefault()
    setOpen(prev => !prev)
  }, [])

  const handleMouseDown = useCallback((e) => e.preventDefault(), [])

  // #25: Keyboard navigation for dropdown
  const handleKeyDown = useCallback((e) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        setOpen(true)
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setActiveIndex(prev => (prev + 1) % options.length)
        break
      case 'ArrowUp':
        e.preventDefault()
        setActiveIndex(prev => (prev - 1 + options.length) % options.length)
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        if (activeIndex >= 0 && activeIndex < options.length) {
          onChange(options[activeIndex].value)
          setOpen(false)
        }
        break
      case 'Escape':
        e.preventDefault()
        setOpen(false)
        break
      default:
        break
    }
  }, [open, activeIndex, options, onChange])

  // Scroll active item into view
  useEffect(() => {
    if (open && menuRef.current && activeIndex >= 0) {
      const items = menuRef.current.querySelectorAll('[role="option"]')
      if (items[activeIndex]) {
        items[activeIndex].scrollIntoView({ block: 'nearest' })
      }
    }
  }, [open, activeIndex])

  const activeDescendant = open && activeIndex >= 0 ? `rmx-dd-opt-${options[activeIndex]?.value}` : undefined

  return (
    <div className="rmx-toolbar-dropdown" ref={ref} style={{ minWidth: width, ...itemStyle }}>
      <button
        className={`rmx-toolbar-btn rmx-toolbar-dropdown-btn`}
        onClick={handleToggle}
        onMouseDown={handleMouseDown}
        onKeyDown={handleKeyDown}
        title={tooltip}
        aria-label={tooltip}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-activedescendant={activeDescendant}
      >
        {Icon && <Icon size={16} />}
        <span className="rmx-toolbar-dropdown-label">{displayLabel}</span>
        <ChevronDownIcon size={14} />
      </button>
      {open && (
        <div className="rmx-toolbar-dropdown-menu" role="listbox" ref={menuRef}>
          {options.map((option, i) => (
            <button
              key={option.value}
              id={`rmx-dd-opt-${option.value}`}
              className={`rmx-toolbar-dropdown-item ${option.value === value ? 'rmx-active' : ''} ${i === activeIndex ? 'rmx-focused' : ''}`}
              onClick={(e) => {
                e.preventDefault()
                onChange(option.value)
                setOpen(false)
              }}
              onMouseDown={handleMouseDown}
              onMouseEnter={() => setActiveIndex(i)}
              role="option"
              aria-selected={option.value === value}
              type="button"
              style={option.style}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
})

ToolbarDropdown.propTypes = {
  label: PropTypes.string,
  value: PropTypes.string,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      style: PropTypes.object,
    })
  ).isRequired,
  onChange: PropTypes.func.isRequired,
  tooltip: PropTypes.string,
  icon: PropTypes.elementType,
  width: PropTypes.number,
  itemStyle: PropTypes.object,
}
