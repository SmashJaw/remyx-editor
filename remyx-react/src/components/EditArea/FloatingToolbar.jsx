import React, { useRef, useEffect, useState, useCallback } from 'react'
import PropTypes from 'prop-types'
import { ToolbarButton } from '../Toolbar/ToolbarButton.jsx'
import { useSelectionContext } from '../../config/SelectionContext.js'

const FLOATING_COMMANDS = ['bold', 'italic', 'underline', 'strikethrough', 'link']

// Positioning constants
const TOOLBAR_FALLBACK_HEIGHT = 40
const TOOLBAR_FALLBACK_WIDTH = 200
const TOOLBAR_GAP = 8
const TOOLBAR_EDGE_PADDING = 4

// Touch selection delay to let browser settle
const TOUCH_SELECTION_DELAY = 300

function FloatingToolbarInner({ visible, selectionRect, engine, editorRect, onOpenModal, onDismiss }) {
  const selectionState = useSelectionContext()
  const ref = useRef(null)
  const sizeRef = useRef({ width: 0, height: 0 })
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const [hasFocus, setHasFocus] = useState(false)
  const [placedBelow, setPlacedBelow] = useState(false)

  // Touch-based drag repositioning state
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const dragStartRef = useRef(null)
  const isDraggingRef = useRef(false)

  // Touch selection support: listen for touchend + selectionchange with delay
  const [touchVisible, setTouchVisible] = useState(false)
  const touchTimerRef = useRef(null)

  useEffect(() => {
    if (!engine?.element) return

    const el = engine.element

    const onTouchEnd = () => {
      // Clear any pending timer
      if (touchTimerRef.current) clearTimeout(touchTimerRef.current)
      // Wait for browser to settle the selection
      touchTimerRef.current = setTimeout(() => {
        const sel = window.getSelection()
        if (sel && !sel.isCollapsed && sel.rangeCount > 0) {
          setTouchVisible(true)
        } else {
          setTouchVisible(false)
        }
      }, TOUCH_SELECTION_DELAY)
    }

    const onSelectionChange = () => {
      const sel = window.getSelection()
      if (!sel || sel.isCollapsed) {
        setTouchVisible(false)
      }
    }

    el.addEventListener('touchend', onTouchEnd, { passive: true })
    document.addEventListener('selectionchange', onSelectionChange)

    return () => {
      el.removeEventListener('touchend', onTouchEnd)
      document.removeEventListener('selectionchange', onSelectionChange)
      if (touchTimerRef.current) clearTimeout(touchTimerRef.current)
    }
  }, [engine])

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
    if ((!visible && !touchVisible) || !selectionRect || !editorRect) return

    const toolbarHeight = sizeRef.current.height || ref.current?.offsetHeight || TOOLBAR_FALLBACK_HEIGHT
    const toolbarWidth = sizeRef.current.width || ref.current?.offsetWidth || TOOLBAR_FALLBACK_WIDTH

    // Default: position ABOVE the selection
    let top = selectionRect.top - editorRect.top - toolbarHeight - TOOLBAR_GAP
    let left = selectionRect.left - editorRect.left + selectionRect.width / 2 - toolbarWidth / 2
    let below = false

    // If no space above, place BELOW the selection (avoid overlapping highlight)
    if (top < 0) {
      top = selectionRect.bottom - editorRect.top + TOOLBAR_GAP
      below = true
    }

    // Clamp to editor bounds horizontally
    if (left < 0) left = TOOLBAR_EDGE_PADDING
    if (left + toolbarWidth > editorRect.width) left = editorRect.width - toolbarWidth - TOOLBAR_EDGE_PADDING

    setPosition({ top, left })
    setPlacedBelow(below)
    setDragOffset({ x: 0, y: 0 })
  }, [visible, touchVisible, selectionRect, editorRect])

  // Arrow-key navigation between toolbar buttons
  const handleKeyDown = useCallback((e) => {
    const toolbar = ref.current
    if (!toolbar) return

    const buttons = Array.from(toolbar.querySelectorAll('button:not([disabled])'))
    const currentIndex = buttons.indexOf(document.activeElement)

    let nextIndex = -1
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault()
      nextIndex = currentIndex < buttons.length - 1 ? currentIndex + 1 : 0
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault()
      nextIndex = currentIndex > 0 ? currentIndex - 1 : buttons.length - 1
    } else if (e.key === 'Home') {
      e.preventDefault()
      nextIndex = 0
    } else if (e.key === 'End') {
      e.preventDefault()
      nextIndex = buttons.length - 1
    }

    if (nextIndex >= 0 && buttons[nextIndex]) {
      buttons[nextIndex].focus()
    }
  }, [])

  // Keep toolbar visible while any button inside has focus
  const handleFocusIn = useCallback(() => setHasFocus(true), [])
  const handleFocusOut = useCallback(() => setHasFocus(false), [])

  // Prevent editor from losing focus/selection on mousedown (task 222)
  const handlePointerDown = useCallback((e) => e.preventDefault(), [])

  // Drag handle for repositioning toolbar on touch
  const handleGripPointerDown = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    isDraggingRef.current = true
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      offsetX: dragOffset.x,
      offsetY: dragOffset.y,
    }

    const target = e.currentTarget
    target.setPointerCapture(e.pointerId)

    const onMove = (moveEvent) => {
      if (!isDraggingRef.current || !dragStartRef.current) return
      const dx = moveEvent.clientX - dragStartRef.current.x
      const dy = moveEvent.clientY - dragStartRef.current.y
      setDragOffset({
        x: dragStartRef.current.offsetX + dx,
        y: dragStartRef.current.offsetY + dy,
      })
    }

    const onUp = () => {
      isDraggingRef.current = false
      dragStartRef.current = null
      target.removeEventListener('pointermove', onMove)
      target.removeEventListener('pointerup', onUp)
    }

    target.addEventListener('pointermove', onMove)
    target.addEventListener('pointerup', onUp)
  }, [dragOffset])

  const isVisible = visible || touchVisible
  if ((!isVisible && !hasFocus) || !engine) return null

  return (
    <div
      ref={ref}
      className={`rmx-floating-toolbar rmx-floating-toolbar-touch ${placedBelow ? 'rmx-floating-below' : ''}`}
      style={{
        top: position.top + dragOffset.y,
        left: position.left + dragOffset.x,
      }}
      role="toolbar"
      aria-label="Formatting toolbar"
      onPointerDown={handlePointerDown}
      onKeyDown={handleKeyDown}
      onFocus={handleFocusIn}
      onBlur={handleFocusOut}
    >
      {FLOATING_COMMANDS.map((cmd, i) => {
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
      {/* Draggable grip handle for touch repositioning */}
      <div
        className="rmx-floating-toolbar-grip"
        onPointerDown={handleGripPointerDown}
        aria-label="Drag to reposition toolbar"
        role="separator"
      >
        <svg width="20" height="6" viewBox="0 0 20 6" fill="currentColor" aria-hidden="true">
          <rect x="2" y="0" width="16" height="2" rx="1" opacity="0.4" />
          <rect x="2" y="4" width="16" height="2" rx="1" opacity="0.4" />
        </svg>
      </div>
    </div>
  )
}

export const FloatingToolbar = React.memo(FloatingToolbarInner)

FloatingToolbar.propTypes = {
  visible: PropTypes.bool.isRequired,
  selectionRect: PropTypes.object,
  engine: PropTypes.object,
  editorRect: PropTypes.object,
  onOpenModal: PropTypes.func,
  onDismiss: PropTypes.func,
}
