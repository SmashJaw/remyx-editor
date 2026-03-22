import React, { useMemo, useCallback, useRef, useState, useEffect, useLayoutEffect } from 'react'
import { ToolbarButton } from './ToolbarButton.jsx'
import { ToolbarDropdown } from './ToolbarDropdown.jsx'
import { ToolbarColorPicker } from './ToolbarColorPicker.jsx'
import { ToolbarSeparator } from './ToolbarSeparator.jsx'
import { TypographyDropdown } from '../TypographyDropdown/TypographyDropdown.jsx'
import { DEFAULT_TOOLBAR, DEFAULT_FONTS, DEFAULT_FONT_SIZES, HEADING_OPTIONS, BUTTON_COMMANDS, TOOLTIP_MAP, getShortcutLabel, getCommandActiveState } from '@remyxjs/core'
import { useSelectionContext } from '../../config/SelectionContext.js'

// Heading dropdown font size formula: base size minus level * step
const HEADING_BASE_FONT_SIZE = 22
const HEADING_FONT_SIZE_STEP = 2

// Pre-compute heading options with styles (static — never changes)
const HEADING_OPTIONS_WITH_STYLES = HEADING_OPTIONS.map(o => ({
  ...o,
  style: o.tag !== 'p' ? { fontSize: `${HEADING_BASE_FONT_SIZE - (parseInt(o.tag?.[1]) || 0) * HEADING_FONT_SIZE_STEP}px`, fontWeight: 'bold' } : {},
}))

export const Toolbar = React.memo(function Toolbar({ config, engine, onOpenModal, fonts = DEFAULT_FONTS, wordCountButton, toolbarItemTheme, customizableToolbar, onToolbarChange, wrap = true }) {
  const selectionState = useSelectionContext()
  const toolbarConfig = config || DEFAULT_TOOLBAR
  const toolbarRef = useRef(null)
  const innerRef = useRef(null)
  const [overflowIndex, setOverflowIndex] = useState(-1)
  const [overflowOpen, setOverflowOpen] = useState(false)
  const overflowMenuRef = useRef(null)
  const [dragItem, setDragItem] = useState(null)
  const [dragOverItem, setDragOverItem] = useState(null)
  const [customOrder, setCustomOrder] = useState(() => {
    if (!customizableToolbar) return null
    try {
      const saved = localStorage.getItem('rmx-toolbar-order')
      return saved ? JSON.parse(saved) : null
    } catch { return null }
  })

  // Memoize font family options — only recompute when fonts array changes
  const fontOptions = useMemo(() =>
    fonts.map((f) => ({ label: f, value: f, style: { fontFamily: f } })),
    [fonts]
  )

  // Memoize command handlers to avoid creating new functions each render
  const handleHeadingChange = useCallback((value) => {
    engine?.executeCommand('heading', value === 'p' ? 'p' : value.replace('h', ''))
  }, [engine])

  const handleFontFamilyChange = useCallback((value) => {
    engine?.executeCommand('fontFamily', value)
  }, [engine])

  const handleFontSizeChange = useCallback((value) => {
    engine?.executeCommand('fontSize', value)
  }, [engine])

  const handleForeColorSelect = useCallback((color) => {
    engine?.executeCommand('foreColor', color)
  }, [engine])

  const handleBackColorSelect = useCallback((color) => {
    engine?.executeCommand('backColor', color)
  }, [engine])

  // Task 269: Pre-memoize modal onClick handlers with useCallback
  const handleOpenImage = useCallback(() => onOpenModal?.('image'), [onOpenModal])
  const handleOpenAttachment = useCallback(() => onOpenModal?.('attachment'), [onOpenModal])
  const handleOpenImportDocument = useCallback(() => onOpenModal?.('importDocument'), [onOpenModal])
  const handleOpenTable = useCallback(() => onOpenModal?.('table'), [onOpenModal])
  const handleOpenEmbed = useCallback(() => onOpenModal?.('embed'), [onOpenModal])
  const handleOpenFindReplace = useCallback(() => onOpenModal?.('findReplace'), [onOpenModal])
  const handleOpenExport = useCallback(() => onOpenModal?.('export'), [onOpenModal])
  const handleOpenCommandPalette = useCallback(() => onOpenModal?.('commandPalette'), [onOpenModal])

  const items = useMemo(() => {
    const result = []
    toolbarConfig.forEach((group, gi) => {
      if (gi > 0) result.push({ type: 'separator', key: `sep-${gi}` })

      const groupItems = Array.isArray(group) ? group : [group]
      groupItems.forEach((item) => {
        if (item === '|') {
          result.push({ type: 'separator', key: `sep-${gi}-inline` })
        } else if (typeof item === 'string') {
          result.push({ type: 'item', command: item, key: item })
        } else {
          result.push({ type: 'custom', ...item, key: item.command || item.name })
        }
      })
    })
    return result
  }, [toolbarConfig])

  // Width-based overflow detection using a callback ref pattern.
  // All items are always rendered in the inner div; overflow:hidden clips them.
  // We measure after mount and on resize to find the cut point.
  const overflowObserverRef = useRef(null)
  const overflowCutRef = useRef(-1)

  const toolbarCallbackRef = useCallback((node) => {
    // Cleanup previous observer
    if (overflowObserverRef.current) {
      overflowObserverRef.current.disconnect()
      overflowObserverRef.current = null
    }
    toolbarRef.current = node
    if (!node) return

    const measure = () => {
      const inner = node.querySelector('.rmx-toolbar-inner')
      if (!inner) return
      const containerWidth = node.clientWidth
      const children = Array.from(inner.children)
      const reservedWidth = 44
      let cutIndex = -1
      for (let i = 0; i < children.length; i++) {
        const right = children[i].offsetLeft + children[i].offsetWidth
        if (right > containerWidth - reservedWidth) {
          cutIndex = i
          break
        }
      }
      if (cutIndex !== overflowCutRef.current) {
        overflowCutRef.current = cutIndex
        setOverflowIndex(cutIndex)
      }
    }

    // Measure after initial layout
    requestAnimationFrame(measure)

    const observer = new ResizeObserver(measure)
    observer.observe(node)
    overflowObserverRef.current = observer
  }, [])

  // Re-measure when items change (config switch)
  useEffect(() => {
    if (wrap) {
      overflowCutRef.current = -1
      setOverflowIndex(-1)
      return
    }
    if (toolbarRef.current) {
      overflowCutRef.current = -1 // reset so next measure always updates
      requestAnimationFrame(() => {
        const node = toolbarRef.current
        if (!node) return
        const inner = node.querySelector('.rmx-toolbar-inner')
        if (!inner) return
        const containerWidth = node.clientWidth
        const children = Array.from(inner.children)
        let cutIndex = -1
        for (let i = 0; i < children.length; i++) {
          const right = children[i].offsetLeft + children[i].offsetWidth
          if (right > containerWidth - 44) { cutIndex = i; break }
        }
        if (cutIndex !== overflowCutRef.current) {
          overflowCutRef.current = cutIndex
          setOverflowIndex(cutIndex)
        }
      })
    }
  }, [items, wrap])

  // Close overflow menu on outside click
  useEffect(() => {
    if (!overflowOpen) return
    const handleClick = (e) => {
      if (overflowMenuRef.current && !overflowMenuRef.current.contains(e.target)) {
        setOverflowOpen(false)
      }
    }
    document.addEventListener('pointerdown', handleClick)
    return () => document.removeEventListener('pointerdown', handleClick)
  }, [overflowOpen])

  // #35: Focus first item on overflow menu open + keyboard navigation
  useEffect(() => {
    if (!overflowOpen || !overflowMenuRef.current) return
    const firstBtn = overflowMenuRef.current.querySelector('button:not([disabled])')
    if (firstBtn) firstBtn.focus()
  }, [overflowOpen])

  const handleOverflowKeyDown = useCallback((e) => {
    if (!overflowMenuRef.current) return
    const items = Array.from(overflowMenuRef.current.querySelectorAll('button:not([disabled])'))
    const currentIndex = items.indexOf(document.activeElement)

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        if (currentIndex < items.length - 1) items[currentIndex + 1].focus()
        else items[0].focus()
        break
      case 'ArrowUp':
        e.preventDefault()
        if (currentIndex > 0) items[currentIndex - 1].focus()
        else items[items.length - 1].focus()
        break
      case 'Escape':
        e.preventDefault()
        setOverflowOpen(false)
        break
      default:
        break
    }
  }, [])

  // Apply custom ordering if customizableToolbar is enabled
  const orderedItems = useMemo(() => {
    if (!customizableToolbar || !customOrder) return items
    const orderMap = new Map(customOrder.map((key, i) => [key, i]))
    const sorted = [...items].sort((a, b) => {
      const ai = orderMap.get(a.key)
      const bi = orderMap.get(b.key)
      if (ai === undefined && bi === undefined) return 0
      if (ai === undefined) return 1
      if (bi === undefined) return -1
      return ai - bi
    })
    return sorted
  }, [items, customOrder, customizableToolbar])

  // Drag handlers for customizable toolbar
  const handleDragStart = useCallback((e, item) => {
    if (!customizableToolbar) return
    setDragItem(item.key)
    e.dataTransfer.effectAllowed = 'move'
  }, [customizableToolbar])

  const handleDragOver = useCallback((e, item) => {
    if (!customizableToolbar || !dragItem) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverItem(item.key)
  }, [customizableToolbar, dragItem])

  const handleDrop = useCallback((e, targetItem) => {
    if (!customizableToolbar || !dragItem) return
    e.preventDefault()
    const currentOrder = orderedItems.map(i => i.key)
    const fromIdx = currentOrder.indexOf(dragItem)
    const toIdx = currentOrder.indexOf(targetItem.key)
    if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) return

    const newOrder = [...currentOrder]
    const [moved] = newOrder.splice(fromIdx, 1)
    newOrder.splice(toIdx, 0, moved)

    setCustomOrder(newOrder)
    try { localStorage.setItem('rmx-toolbar-order', JSON.stringify(newOrder)) } catch {}
    onToolbarChange?.(newOrder)
    setDragItem(null)
    setDragOverItem(null)
  }, [customizableToolbar, dragItem, orderedItems, onToolbarChange])

  const handleDragEnd = useCallback(() => {
    setDragItem(null)
    setDragOverItem(null)
  }, [])

  // #46: Render placeholder when engine is not ready
  if (!engine) {
    return (
      <div className="rmx-toolbar" role="toolbar" aria-label="Editor toolbar" style={{ minHeight: 44 }}>
        <div className="rmx-toolbar-inner" />
      </div>
    )
  }

  const renderItem = (item) => {
    if (item.type === 'separator') {
      return <ToolbarSeparator key={item.key} separatorStyle={toolbarItemTheme?._separator} />
    }

    const { command } = item
    const itemStyle = toolbarItemTheme?.[command] || null

    // Dropdown items
    if (command === 'headings') {
      const current = selectionState.heading || 'p'
      return (
        <ToolbarDropdown
          key={command}
          label="Normal"
          value={current}
          options={HEADING_OPTIONS_WITH_STYLES}
          onChange={handleHeadingChange}
          tooltip="Block Type"
          width={130}
          itemStyle={itemStyle}
        />
      )
    }

    if (command === 'fontFamily') {
      const current = selectionState.fontFamily?.replace(/['"]/g, '') || ''
      return (
        <ToolbarDropdown
          key={command}
          label="Font"
          value={current}
          options={fontOptions}
          onChange={handleFontFamilyChange}
          tooltip="Font Family"
          width={140}
          itemStyle={itemStyle}
        />
      )
    }

    if (command === 'fontSize') {
      return (
        <ToolbarDropdown
          key={command}
          label="Size"
          value={selectionState.fontSize || ''}
          options={DEFAULT_FONT_SIZES}
          onChange={handleFontSizeChange}
          tooltip="Font Size"
          width={80}
          itemStyle={itemStyle}
        />
      )
    }

    // Color pickers
    if (command === 'foreColor') {
      return (
        <ToolbarColorPicker
          key={command}
          command="foreColor"
          tooltip="Text Color"
          currentColor={selectionState.foreColor}
          onColorSelect={handleForeColorSelect}
          itemStyle={itemStyle}
          engine={engine}
        />
      )
    }

    if (command === 'backColor') {
      return (
        <ToolbarColorPicker
          key={command}
          command="backColor"
          tooltip="Background Color"
          currentColor={selectionState.backColor}
          onColorSelect={handleBackColorSelect}
          itemStyle={itemStyle}
          engine={engine}
        />
      )
    }

    if (command === 'typography') {
      return (
        <TypographyDropdown
          key={command}
          engine={engine}
          itemStyle={itemStyle}
        />
      )
    }

    // Modal triggers
    if (command === 'link') {
      return (
        <ToolbarButton
          key={command}
          command={command}
          tooltip={TOOLTIP_MAP[command]}
          active={!!selectionState.link}
          onClick={() => {
            if (selectionState.link) {
              onOpenModal?.('link', selectionState.link)
            } else {
              onOpenModal?.('link', { text: engine.selection.getSelectedText() })
            }
          }}
          shortcutLabel={getShortcutLabel('insertLink')}
          itemStyle={itemStyle}
        />
      )
    }

    if (command === 'image') {
      return (
        <ToolbarButton key={command} command={command} tooltip={TOOLTIP_MAP[command]}
          onClick={handleOpenImage} itemStyle={itemStyle} />
      )
    }

    if (command === 'attachment') {
      return (
        <ToolbarButton key={command} command={command} tooltip={TOOLTIP_MAP[command]}
          onClick={handleOpenAttachment} itemStyle={itemStyle} />
      )
    }

    if (command === 'importDocument') {
      return (
        <ToolbarButton key={command} command={command} tooltip={TOOLTIP_MAP[command]}
          onClick={handleOpenImportDocument} itemStyle={itemStyle} />
      )
    }

    if (command === 'table') {
      return (
        <ToolbarButton key={command} command={command} tooltip={TOOLTIP_MAP[command]}
          onClick={handleOpenTable} itemStyle={itemStyle} />
      )
    }

    if (command === 'embedMedia') {
      return (
        <ToolbarButton key={command} command={command} tooltip={TOOLTIP_MAP[command]}
          onClick={handleOpenEmbed} itemStyle={itemStyle} />
      )
    }

    if (command === 'findReplace') {
      return (
        <ToolbarButton key={command} command={command} tooltip={TOOLTIP_MAP[command]}
          onClick={handleOpenFindReplace}
          shortcutLabel={getShortcutLabel(command)} itemStyle={itemStyle} />
      )
    }

    if (command === 'export') {
      return (
        <ToolbarButton key={command} command={command} tooltip={TOOLTIP_MAP[command]}
          onClick={handleOpenExport} itemStyle={itemStyle} />
      )
    }

    if (command === 'commandPalette') {
      return (
        <ToolbarButton key={command} command={command} tooltip={TOOLTIP_MAP[command]}
          onClick={handleOpenCommandPalette}
          shortcutLabel={getShortcutLabel(command)} itemStyle={itemStyle} />
      )
    }

    // Regular button commands
    if (BUTTON_COMMANDS.has(command)) {
      const isActive = getCommandActiveState(command, selectionState, engine)

      // Guard: only render if command is registered (plugin may not be loaded)
      const isRegistered = engine.commands?.has?.(command) ?? true

      return (
        <ToolbarButton
          key={command}
          command={command}
          tooltip={TOOLTIP_MAP[command] || command}
          active={isActive}
          disabled={!isRegistered}
          onClick={() => {
            if (isRegistered) engine.executeCommand(command)
          }}
          shortcutLabel={getShortcutLabel(command)}
          itemStyle={itemStyle}
        />
      )
    }

    // Fallback — guard unregistered commands
    const isRegistered = engine.commands?.has?.(command) ?? true
    return (
      <ToolbarButton
        key={command}
        command={command}
        tooltip={TOOLTIP_MAP[command] || command}
        disabled={!isRegistered}
        onClick={() => {
          if (isRegistered) engine.executeCommand(command)
        }}
        itemStyle={itemStyle}
      />
    )
  }

  // Split items into visible and overflow groups
  const finalItems = customizableToolbar ? orderedItems : items
  const overflowItems = overflowIndex > 0 ? finalItems.slice(overflowIndex) : []

  const renderDraggableItem = (item) => {
    const rendered = renderItem(item)
    if (!customizableToolbar || item.type === 'separator') return rendered
    return (
      <span
        key={`drag-${item.key}`}
        draggable
        onDragStart={(e) => handleDragStart(e, item)}
        onDragOver={(e) => handleDragOver(e, item)}
        onDrop={(e) => handleDrop(e, item)}
        onDragEnd={handleDragEnd}
        className={`${dragItem === item.key ? 'rmx-dragging' : ''} ${dragOverItem === item.key ? 'rmx-toolbar-drag-over' : ''}`}
        role="listitem"
        aria-roledescription="draggable toolbar item"
      >
        {rendered}
      </span>
    )
  }

  return (
    <div className={`rmx-toolbar${customizableToolbar ? ' rmx-toolbar-customizable' : ''}`} role="toolbar" aria-label="Editor toolbar" ref={wrap ? toolbarRef : toolbarCallbackRef}>
      <div className="rmx-toolbar-inner" ref={innerRef} style={wrap ? undefined : { flexWrap: 'nowrap', overflow: 'hidden' }}>
        {finalItems.map(customizableToolbar ? renderDraggableItem : renderItem)}
        {wordCountButton && (
          <>
            <ToolbarSeparator />
            {wordCountButton}
          </>
        )}
      </div>
      {overflowItems.length > 0 && (
        <div className="rmx-toolbar-overflow-container">
          <button
            className="rmx-toolbar-btn rmx-toolbar-overflow-btn"
            onClick={() => setOverflowOpen(prev => !prev)}
            aria-label="More toolbar options"
            aria-expanded={overflowOpen}
            type="button"
          >
            &#x22EF;
          </button>
          {overflowOpen && (
            <div
              ref={overflowMenuRef}
              className="rmx-toolbar-overflow-menu"
              role="menu"
              onKeyDown={handleOverflowKeyDown}
            >
              {overflowItems.map(renderItem)}
            </div>
          )}
        </div>
      )}
    </div>
  )
})
