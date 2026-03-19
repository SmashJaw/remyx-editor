import React, { useRef, useEffect, useState } from 'react'
import { ToolbarButton } from '../Toolbar/ToolbarButton.jsx'
import { useSelectionContext } from '../../config/SelectionContext.js'

const FLOATING_COMMANDS = ['bold', 'italic', 'underline', 'strikethrough', 'link']

// Positioning constants
const TOOLBAR_FALLBACK_HEIGHT = 40
const TOOLBAR_FALLBACK_WIDTH = 200
const TOOLBAR_GAP = 8
const TOOLBAR_EDGE_PADDING = 4

function FloatingToolbarInner({ visible, selectionRect, engine, editorRect, onOpenModal }) {
  const selectionState = useSelectionContext()
  const ref = useRef(null)
  const sizeRef = useRef({ width: 0, height: 0 })
  const [position, setPosition] = useState({ top: 0, left: 0 })

  // Cache toolbar dimensions via ResizeObserver to avoid forced reflows
  useEffect(() => {
    if (!ref.current) return
    const observer = new ResizeObserver(([entry]) => {
      sizeRef.current = {
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      }
    })
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!visible || !selectionRect || !editorRect) return

    const toolbarHeight = sizeRef.current.height || ref.current?.offsetHeight || TOOLBAR_FALLBACK_HEIGHT
    const toolbarWidth = sizeRef.current.width || ref.current?.offsetWidth || TOOLBAR_FALLBACK_WIDTH

    let top = selectionRect.top - editorRect.top - toolbarHeight - TOOLBAR_GAP
    let left = selectionRect.left - editorRect.left + selectionRect.width / 2 - toolbarWidth / 2

    // Clamp to editor bounds
    if (top < 0) top = selectionRect.bottom - editorRect.top + TOOLBAR_GAP
    if (left < 0) left = TOOLBAR_EDGE_PADDING
    if (left + toolbarWidth > editorRect.width) left = editorRect.width - toolbarWidth - TOOLBAR_EDGE_PADDING

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

export const FloatingToolbar = React.memo(FloatingToolbarInner)
