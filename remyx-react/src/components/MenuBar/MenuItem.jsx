import React, { useState, useRef, useEffect, useCallback } from 'react'
import { ICON_MAP, ChevronRightIcon } from '../../icons/index.jsx'
import { TOOLTIP_MAP, SHORTCUT_MAP, MODAL_COMMANDS, getShortcutLabel, getCommandActiveState } from '@remyxjs/core'

/**
 * Navigate focus between sibling menu items within a menu/submenu.
 * Skips separators and non-focusable elements.
 */
function focusMenuSibling(container, direction) {
  if (!container) return
  const items = Array.from(container.querySelectorAll(':scope > [role="menuitem"], :scope > .rmx-menubar-submenu-wrapper > [role="menuitem"]'))
  const current = document.activeElement
  const idx = items.indexOf(current)
  if (idx === -1) return
  let next
  if (direction === 'down') {
    next = idx < items.length - 1 ? idx + 1 : 0
  } else if (direction === 'up') {
    next = idx > 0 ? idx - 1 : items.length - 1
  } else if (direction === 'home') {
    next = 0
  } else if (direction === 'end') {
    next = items.length - 1
  }
  items[next]?.focus()
}

function MenuItemInner({ item, engine, selectionState, onOpenModal, onClose }) {
  // Separator
  if (item === '---') {
    return <div className="rmx-menubar-separator" role="separator" />
  }

  // Submenu
  if (typeof item === 'object' && item.label && item.items) {
    return (
      <SubMenuItem
        label={item.label}
        items={item.items}
        engine={engine}
        selectionState={selectionState}
        onOpenModal={onOpenModal}
        onClose={onClose}
      />
    )
  }

  // Regular command item
  const command = typeof item === 'string' ? item : item.command
  const label = TOOLTIP_MAP[command] || command
  const shortcut = getShortcutLabel(command)
  const isActive = getCommandActiveState(command, selectionState, engine)
  const IconComponent = ICON_MAP[command]

  const handleClick = (e) => {
    e.preventDefault()
    const modalName = MODAL_COMMANDS[command]
    if (modalName) {
      if (command === 'link') {
        if (selectionState.link) {
          onOpenModal?.('link', selectionState.link)
        } else {
          onOpenModal?.('link', { text: engine.selection.getSelectedText() })
        }
      } else {
        onOpenModal?.(modalName)
      }
    } else {
      engine.executeCommand(command)
    }
    onClose()
  }

  const handleKeyDown = (e) => {
    const menu = e.currentTarget.closest('.rmx-menubar-menu')
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        focusMenuSibling(menu, 'down')
        break
      case 'ArrowUp':
        e.preventDefault()
        focusMenuSibling(menu, 'up')
        break
      case 'Home':
        e.preventDefault()
        focusMenuSibling(menu, 'home')
        break
      case 'End':
        e.preventDefault()
        focusMenuSibling(menu, 'end')
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        handleClick(e)
        break
    }
  }

  return (
    <button
      className={`rmx-menubar-item ${isActive ? 'rmx-active' : ''}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onMouseDown={(e) => e.preventDefault()}
      type="button"
      role="menuitem"
      tabIndex={-1}
    >
      <span className="rmx-menubar-item-icon">
        {IconComponent && <IconComponent size={16} />}
      </span>
      <span className="rmx-menubar-item-label">{label}</span>
      {shortcut && <span className="rmx-menubar-shortcut">{shortcut}</span>}
    </button>
  )
}

export const MenuItem = React.memo(MenuItemInner)

function SubMenuItem({ label, items, engine, selectionState, onOpenModal, onClose }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const timeoutRef = useRef(null)

  const handleEnter = () => {
    clearTimeout(timeoutRef.current)
    setOpen(true)
  }

  const handleLeave = () => {
    timeoutRef.current = setTimeout(() => setOpen(false), 150)
  }

  const handleKeyDown = useCallback((e) => {
    const menu = e.currentTarget.closest('.rmx-menubar-menu')
    switch (e.key) {
      case 'ArrowRight':
      case 'Enter':
      case ' ':
        e.preventDefault()
        setOpen(true)
        // Focus first item in submenu after it renders
        setTimeout(() => {
          const submenu = ref.current?.querySelector('.rmx-menubar-submenu')
          const firstItem = submenu?.querySelector('[role="menuitem"]')
          firstItem?.focus()
        }, 0)
        break
      case 'ArrowDown':
        e.preventDefault()
        focusMenuSibling(menu, 'down')
        break
      case 'ArrowUp':
        e.preventDefault()
        focusMenuSibling(menu, 'up')
        break
      case 'ArrowLeft':
        e.preventDefault()
        setOpen(false)
        break
      case 'Home':
        e.preventDefault()
        focusMenuSibling(menu, 'home')
        break
      case 'End':
        e.preventDefault()
        focusMenuSibling(menu, 'end')
        break
    }
  }, [])

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current)
  }, [])

  return (
    <div
      className="rmx-menubar-submenu-wrapper"
      ref={ref}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <button
        className="rmx-menubar-item rmx-menubar-submenu-trigger"
        onMouseDown={(e) => e.preventDefault()}
        onKeyDown={handleKeyDown}
        type="button"
        role="menuitem"
        aria-haspopup="true"
        aria-expanded={open}
        tabIndex={-1}
      >
        <span className="rmx-menubar-item-icon" />
        <span className="rmx-menubar-item-label">{label}</span>
        <span className="rmx-menubar-submenu-arrow"><ChevronRightIcon size={14} /></span>
      </button>
      {open && (
        <div className="rmx-menubar-menu rmx-menubar-submenu" role="menu" aria-label={label}>
          {items.map((subItem, i) => (
            <MenuItem
              key={typeof subItem === 'string' ? `${subItem}-${i}` : subItem.label || i}
              item={subItem}
              engine={engine}
              selectionState={selectionState}
              onOpenModal={onOpenModal}
              onClose={onClose}
            />
          ))}
        </div>
      )}
    </div>
  )
}
