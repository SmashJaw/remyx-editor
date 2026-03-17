import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import {
  SLASH_COMMAND_ITEMS,
  filterSlashItems,
  TOOLTIP_MAP,
  SHORTCUT_MAP,
  MODAL_COMMANDS,
  getShortcutLabel,
} from '@remyxjs/core'

/**
 * Build command items from engine's registered commands + slash items.
 * Deduplicates by id and adds shortcut labels.
 */
function buildCommandList(engine, customSlashItems) {
  const slashItems = customSlashItems || SLASH_COMMAND_ITEMS
  const seen = new Set(slashItems.map(i => i.id))
  const engineItems = []

  if (engine) {
    const allCommands = engine.commands.getAll()
    for (const name of allCommands) {
      if (seen.has(name)) continue
      // Skip internal/meta commands
      if (name === 'undo' || name === 'redo' || name === 'removeFormat') continue

      const tooltip = TOOLTIP_MAP[name]
      if (!tooltip) continue // Skip commands without a user-facing name

      const shortcut = SHORTCUT_MAP[name]
      const isModal = name in MODAL_COMMANDS

      engineItems.push({
        id: name,
        label: tooltip,
        description: '',
        icon: shortcut ? getShortcutLabel(name).charAt(0) : '\u2022',
        keywords: [name],
        category: 'Commands',
        shortcutLabel: shortcut ? getShortcutLabel(name) : null,
        action: isModal
          ? (_eng, openModal) => openModal?.(MODAL_COMMANDS[name])
          : (eng) => eng.executeCommand(name),
      })
      seen.add(name)
    }
  }

  // Add shortcut labels to slash items
  const enrichedSlash = slashItems.map(item => ({
    ...item,
    shortcutLabel: SHORTCUT_MAP[item.id] ? getShortcutLabel(item.id) : null,
  }))

  return [...enrichedSlash, ...engineItems]
}

function CommandPaletteInner({ open, onClose, engine, onOpenModal, slashCommandItems }) {
  const inputRef = useRef(null)
  const listRef = useRef(null)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)

  const allItems = useMemo(
    () => buildCommandList(engine, slashCommandItems),
    [engine, slashCommandItems]
  )

  const filteredItems = useMemo(
    () => filterSlashItems(allItems, query),
    [allItems, query]
  )

  // Reset on open
  useEffect(() => {
    if (open) {
      setQuery('')
      setSelectedIndex(0)
      // Focus input after render
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  // Reset index on filter change
  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  // Scroll active item into view
  useEffect(() => {
    if (!listRef.current) return
    const active = listRef.current.querySelector('.rmx-command-palette-item.rmx-active')
    if (active) {
      active.scrollIntoView({ block: 'nearest' })
    }
  }, [selectedIndex])

  const executeItem = useCallback((item) => {
    onClose()
    // Defer execution so the palette is closed first and focus returns to editor
    requestAnimationFrame(() => {
      item.action(engine, onOpenModal)
    })
  }, [engine, onClose, onOpenModal])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(i => filteredItems.length === 0 ? 0 : (i + 1) % filteredItems.length)
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(i => filteredItems.length === 0 ? 0 : (i - 1 + filteredItems.length) % filteredItems.length)
      return
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      if (filteredItems.length > 0 && selectedIndex < filteredItems.length) {
        executeItem(filteredItems[selectedIndex])
      }
    }
  }, [filteredItems, selectedIndex, executeItem, onClose])

  // Focus trap — prevent tab from escaping
  const handleOverlayKeyDown = useCallback((e) => {
    if (e.key === 'Tab') {
      e.preventDefault()
    }
  }, [])

  if (!open) return null

  // Group items by category
  const groups = []
  let lastCategory = null
  for (let i = 0; i < filteredItems.length; i++) {
    const item = filteredItems[i]
    if (item.category !== lastCategory) {
      groups.push({ category: item.category, items: [] })
      lastCategory = item.category
    }
    groups[groups.length - 1].items.push({ item, index: i })
  }

  return (
    <div
      className="rmx-command-palette-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          e.preventDefault()
          onClose()
        }
      }}
      onKeyDown={handleOverlayKeyDown}
    >
      <div className="rmx-command-palette" role="dialog" aria-label="Command palette">
        <div className="rmx-command-palette-input-wrap">
          <span className="rmx-command-palette-search-icon" aria-hidden="true">/</span>
          <input
            ref={inputRef}
            className="rmx-command-palette-input"
            type="text"
            placeholder="Type a command..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-activedescendant={
              filteredItems[selectedIndex]
                ? `rmx-cmd-item-${filteredItems[selectedIndex].id}`
                : undefined
            }
            role="combobox"
            aria-expanded="true"
            aria-controls="rmx-command-palette-list"
            aria-autocomplete="list"
          />
        </div>

        <div
          ref={listRef}
          className="rmx-command-palette-list"
          id="rmx-command-palette-list"
          role="listbox"
        >
          {filteredItems.length === 0 ? (
            <div className="rmx-command-palette-empty">No matching commands</div>
          ) : (
            groups.map((group) => (
              <div key={group.category}>
                <div className="rmx-command-palette-category">{group.category}</div>
                {group.items.map(({ item, index }) => (
                  <div
                    key={item.id}
                    id={`rmx-cmd-item-${item.id}`}
                    className={`rmx-command-palette-item${index === selectedIndex ? ' rmx-active' : ''}`}
                    role="option"
                    aria-selected={index === selectedIndex}
                    onMouseEnter={() => setSelectedIndex(index)}
                    onClick={() => executeItem(item)}
                  >
                    <div className="rmx-command-palette-item-icon">{item.icon}</div>
                    <div className="rmx-command-palette-item-text">
                      <div className="rmx-command-palette-item-label">{item.label}</div>
                      {item.description && (
                        <div className="rmx-command-palette-item-desc">{item.description}</div>
                      )}
                    </div>
                    {item.shortcutLabel && (
                      <span className="rmx-command-palette-shortcut">{item.shortcutLabel}</span>
                    )}
                  </div>
                ))}
              </div>
            ))
          )}
        </div>

        <div className="rmx-command-palette-hint">
          <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
          <span><kbd>↵</kbd> select</span>
          <span><kbd>esc</kbd> close</span>
        </div>
      </div>
    </div>
  )
}

export const CommandPalette = React.memo(CommandPaletteInner)
