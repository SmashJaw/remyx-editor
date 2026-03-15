import React, { useState, useRef, useEffect, useCallback } from 'react'
import { MenuItem } from './MenuItem.jsx'

export function MenuBar({ config, engine, selectionState, onOpenModal }) {
  const [openMenu, setOpenMenu] = useState(null)
  const [hoverMode, setHoverMode] = useState(false)
  const barRef = useRef(null)

  // Close on click outside or Escape
  useEffect(() => {
    if (openMenu === null) return

    const handleClickOutside = (e) => {
      if (barRef.current && !barRef.current.contains(e.target)) {
        setOpenMenu(null)
        setHoverMode(false)
      }
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setOpenMenu(null)
        setHoverMode(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [openMenu])

  const handleTriggerClick = useCallback((index) => {
    if (openMenu === index) {
      setOpenMenu(null)
      setHoverMode(false)
    } else {
      setOpenMenu(index)
      setHoverMode(true)
    }
  }, [openMenu])

  const handleTriggerEnter = useCallback((index) => {
    if (hoverMode && openMenu !== null) {
      setOpenMenu(index)
    }
  }, [hoverMode, openMenu])

  const handleCloseMenu = useCallback(() => {
    setOpenMenu(null)
    setHoverMode(false)
  }, [])

  if (!engine || !config) return null

  return (
    <div className="rmx-menubar" ref={barRef} role="menubar">
      {config.map((menu, index) => (
        <div key={menu.label} className="rmx-menubar-dropdown">
          <button
            className={`rmx-menubar-trigger ${openMenu === index ? 'rmx-open' : ''}`}
            onClick={(e) => {
              e.preventDefault()
              handleTriggerClick(index)
            }}
            onMouseEnter={() => handleTriggerEnter(index)}
            onMouseDown={(e) => e.preventDefault()}
            type="button"
            role="menuitem"
            aria-haspopup="true"
            aria-expanded={openMenu === index}
          >
            {menu.label}
          </button>
          {openMenu === index && (
            <div className="rmx-menubar-menu" role="menu">
              {menu.items.map((item, i) => (
                <MenuItem
                  key={typeof item === 'string' ? `${item}-${i}` : item.label || item.command || i}
                  item={item}
                  engine={engine}
                  selectionState={selectionState}
                  onOpenModal={onOpenModal}
                  onClose={handleCloseMenu}
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

/**
 * Collect all command names from a menu bar config (recursively through submenus).
 */
export function collectMenuBarCommands(menuBarConfig) {
  const commands = new Set()
  const walk = (items) => {
    for (const item of items) {
      if (typeof item === 'string' && item !== '---') {
        commands.add(item)
      } else if (typeof item === 'object' && item.items) {
        walk(item.items)
      }
    }
  }
  for (const menu of menuBarConfig) {
    walk(menu.items)
  }
  return commands
}
