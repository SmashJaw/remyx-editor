import React, { useState, useRef, useEffect } from 'react'
import { ICON_MAP, ChevronRightIcon } from '../../icons/index.jsx'
import { TOOLTIP_MAP, SHORTCUT_MAP, MODAL_COMMANDS, getShortcutLabel, getCommandActiveState } from '@remyx/core'

export function MenuItem({ item, engine, selectionState, onOpenModal, onClose }) {
  // Separator
  if (item === '---') {
    return <div className="rmx-menubar-separator" />
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

  return (
    <button
      className={`rmx-menubar-item ${isActive ? 'rmx-active' : ''}`}
      onClick={handleClick}
      onMouseDown={(e) => e.preventDefault()}
      type="button"
    >
      <span className="rmx-menubar-item-icon">
        {IconComponent && <IconComponent size={16} />}
      </span>
      <span className="rmx-menubar-item-label">{label}</span>
      {shortcut && <span className="rmx-menubar-shortcut">{shortcut}</span>}
    </button>
  )
}

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
        type="button"
      >
        <span className="rmx-menubar-item-icon" />
        <span className="rmx-menubar-item-label">{label}</span>
        <span className="rmx-menubar-submenu-arrow"><ChevronRightIcon size={14} /></span>
      </button>
      {open && (
        <div className="rmx-menubar-menu rmx-menubar-submenu">
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
