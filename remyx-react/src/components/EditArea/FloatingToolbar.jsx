import React, { useRef, useEffect, useState } from 'react'
import { ToolbarButton } from '../Toolbar/ToolbarButton.jsx'

const FLOATING_COMMANDS = ['bold', 'italic', 'underline', 'strikethrough', 'link']

export function FloatingToolbar({ visible, selectionRect, engine, selectionState, editorRect, onOpenModal }) {
  const ref = useRef(null)
  const [position, setPosition] = useState({ top: 0, left: 0 })

  useEffect(() => {
    if (!visible || !selectionRect || !editorRect || !ref.current) return

    const toolbarHeight = ref.current.offsetHeight
    const toolbarWidth = ref.current.offsetWidth

    let top = selectionRect.top - editorRect.top - toolbarHeight - 8
    let left = selectionRect.left - editorRect.left + selectionRect.width / 2 - toolbarWidth / 2

    // Clamp to editor bounds
    if (top < 0) top = selectionRect.bottom - editorRect.top + 8
    if (left < 0) left = 4
    if (left + toolbarWidth > editorRect.width) left = editorRect.width - toolbarWidth - 4

    setPosition({ top, left })
  }, [visible, selectionRect, editorRect])

  if (!visible || !engine) return null

  return (
    <div
      ref={ref}
      className="rmx-floating-toolbar"
      style={{ top: position.top, left: position.left }}
      onMouseDown={(e) => e.preventDefault()}
    >
      {FLOATING_COMMANDS.map((cmd) => {
        if (cmd === 'link') {
          return (
            <ToolbarButton
              key={cmd}
              command={cmd}
              tooltip="Insert Link"
              active={!!selectionState.link}
              onClick={() => onOpenModal?.('link', { text: engine.selection.getSelectedText() })}
            />
          )
        }
        const isActive = selectionState[cmd] || false
        return (
          <ToolbarButton
            key={cmd}
            command={cmd}
            tooltip={cmd.charAt(0).toUpperCase() + cmd.slice(1)}
            active={isActive}
            onClick={() => engine.executeCommand(cmd)}
          />
        )
      })}
    </div>
  )
}
