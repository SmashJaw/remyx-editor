import React, { useMemo } from 'react'
import { ToolbarButton } from './ToolbarButton.jsx'
import { ToolbarDropdown } from './ToolbarDropdown.jsx'
import { ToolbarColorPicker } from './ToolbarColorPicker.jsx'
import { ToolbarSeparator } from './ToolbarSeparator.jsx'
import { DEFAULT_TOOLBAR, DEFAULT_FONTS, DEFAULT_FONT_SIZES, HEADING_OPTIONS, BUTTON_COMMANDS, TOOLTIP_MAP, getShortcutLabel, getCommandActiveState } from '@remyx/core'

export function Toolbar({ config, engine, selectionState, onOpenModal, fonts = DEFAULT_FONTS, wordCountButton, toolbarItemTheme }) {
  const toolbarConfig = config || DEFAULT_TOOLBAR

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

  if (!engine) return null

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
          options={HEADING_OPTIONS.map(o => ({
            ...o,
            style: o.tag !== 'p' ? { fontSize: `${22 - (parseInt(o.tag?.[1]) || 0) * 2}px`, fontWeight: 'bold' } : {},
          }))}
          onChange={(value) => engine.executeCommand('heading', value === 'p' ? 'p' : value.replace('h', ''))}
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
          options={fonts.map((f) => ({ label: f, value: f, style: { fontFamily: f } }))}
          onChange={(value) => engine.executeCommand('fontFamily', value)}
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
          onChange={(value) => engine.executeCommand('fontSize', value)}
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
          onColorSelect={(color) => engine.executeCommand('foreColor', color)}
          itemStyle={itemStyle}
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
          onColorSelect={(color) => engine.executeCommand('backColor', color)}
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
          onClick={() => onOpenModal?.('image')} itemStyle={itemStyle} />
      )
    }

    if (command === 'attachment') {
      return (
        <ToolbarButton key={command} command={command} tooltip={TOOLTIP_MAP[command]}
          onClick={() => onOpenModal?.('attachment')} itemStyle={itemStyle} />
      )
    }

    if (command === 'importDocument') {
      return (
        <ToolbarButton key={command} command={command} tooltip={TOOLTIP_MAP[command]}
          onClick={() => onOpenModal?.('importDocument')} itemStyle={itemStyle} />
      )
    }

    if (command === 'table') {
      return (
        <ToolbarButton key={command} command={command} tooltip={TOOLTIP_MAP[command]}
          onClick={() => onOpenModal?.('table')} itemStyle={itemStyle} />
      )
    }

    if (command === 'embedMedia') {
      return (
        <ToolbarButton key={command} command={command} tooltip={TOOLTIP_MAP[command]}
          onClick={() => onOpenModal?.('embed')} itemStyle={itemStyle} />
      )
    }

    if (command === 'findReplace') {
      return (
        <ToolbarButton key={command} command={command} tooltip={TOOLTIP_MAP[command]}
          onClick={() => onOpenModal?.('findReplace')}
          shortcutLabel={getShortcutLabel(command)} itemStyle={itemStyle} />
      )
    }

    if (command === 'export') {
      return (
        <ToolbarButton key={command} command={command} tooltip={TOOLTIP_MAP[command]}
          onClick={() => onOpenModal?.('export')} itemStyle={itemStyle} />
      )
    }

    // Regular button commands
    if (BUTTON_COMMANDS.has(command)) {
      const isActive = getCommandActiveState(command, selectionState, engine)

      return (
        <ToolbarButton
          key={command}
          command={command}
          tooltip={TOOLTIP_MAP[command] || command}
          active={isActive}
          onClick={() => engine.executeCommand(command)}
          shortcutLabel={getShortcutLabel(command)}
          itemStyle={itemStyle}
        />
      )
    }

    // Fallback
    return (
      <ToolbarButton
        key={command}
        command={command}
        tooltip={TOOLTIP_MAP[command] || command}
        onClick={() => engine.executeCommand(command)}
        itemStyle={itemStyle}
      />
    )
  }

  return (
    <div className="rmx-toolbar" role="toolbar" aria-label="Editor toolbar">
      <div className="rmx-toolbar-inner">
        {items.map(renderItem)}
        {wordCountButton && (
          <>
            <ToolbarSeparator />
            {wordCountButton}
          </>
        )}
      </div>
    </div>
  )
}
