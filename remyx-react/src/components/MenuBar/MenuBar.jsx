import { useState, useRef, useEffect, useCallback } from 'react'
import { MenuItem } from './MenuItem.jsx'

export function MenuBar({ config, engine, selectionState, onOpenModal }) {
  const [openMenu, setOpenMenu] = useState(null)
  const [hoverMode, setHoverMode] = useState(false)
  const barRef = useRef(null)
  const triggerRefs = useRef([])

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
        // Return focus to the trigger that opened this menu
        if (openMenu !== null) {
          triggerRefs.current[openMenu]?.focus()
        }
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

  const handleBarKeyDown = useCallback((e) => {
    const triggers = triggerRefs.current.filter(Boolean)
    const currentIndex = triggers.indexOf(document.activeElement)

    switch (e.key) {
      case 'ArrowRight': {
        e.preventDefault()
        const next = currentIndex < triggers.length - 1 ? currentIndex + 1 : 0
        triggers[next]?.focus()
        if (openMenu !== null) setOpenMenu(next)
        break
      }
      case 'ArrowLeft': {
        e.preventDefault()
        const prev = currentIndex > 0 ? currentIndex - 1 : triggers.length - 1
        triggers[prev]?.focus()
        if (openMenu !== null) setOpenMenu(prev)
        break
      }
      case 'ArrowDown': {
        e.preventDefault()
        if (openMenu === null && currentIndex >= 0) {
          setOpenMenu(currentIndex)
          setHoverMode(true)
        }
        // Focus first item in the open dropdown
        const menuEl = barRef.current?.querySelectorAll('.rmx-menubar-menu')?.[0]
        if (menuEl) {
          const firstItem = menuEl.querySelector('[role="menuitem"]')
          firstItem?.focus()
        }
        break
      }
      case 'Home': {
        e.preventDefault()
        triggers[0]?.focus()
        if (openMenu !== null) setOpenMenu(0)
        break
      }
      case 'End': {
        e.preventDefault()
        triggers[triggers.length - 1]?.focus()
        if (openMenu !== null) setOpenMenu(triggers.length - 1)
        break
      }
    }
  }, [openMenu])

  if (!engine || !config) return null

  return (
    <div
      className="rmx-menubar"
      ref={barRef}
      role="menubar"
      aria-label="Editor menu"
      onKeyDown={handleBarKeyDown}
    >
      {config.map((menu, index) => (
        <div key={menu.label} className="rmx-menubar-dropdown">
          <button
            ref={(el) => { triggerRefs.current[index] = el }}
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
            tabIndex={index === 0 ? 0 : -1}
          >
            {menu.label}
          </button>
          {openMenu === index && (
            <div className="rmx-menubar-menu" role="menu" aria-label={menu.label}>
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
