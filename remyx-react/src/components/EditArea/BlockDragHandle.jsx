import React, { useState, useEffect, useRef, useCallback } from 'react'

/**
 * A drag handle that appears on the left side of block elements when hovered or touched.
 * Uses pointer events for cross-device support (mouse + touch + pen).
 * Supports touch-based drag via setPointerCapture with ghost preview.
 */
export function BlockDragHandle({ engine, editorRect, editAreaRef }) {
  const [hoveredBlock, setHoveredBlock] = useState(null)
  const [handlePos, setHandlePos] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [ghostPos, setGhostPos] = useState(null)
  const handleRef = useRef(null)
  const rafRef = useRef(null)
  const draggedBlockRef = useRef(null)
  const ghostRef = useRef(null)

  const updateHoveredBlock = useCallback((e) => {
    if (!engine || !editAreaRef.current) return

    // Don't show handle during active drags
    if (engine.dragDrop.isDragging()) {
      setHoveredBlock(null)
      return
    }

    const target = e.target
    const block = engine.dragDrop.getDraggableBlock(target)

    if (block && block !== hoveredBlock) {
      setHoveredBlock(block)

      const blockRect = block.getBoundingClientRect()
      const editorEl = engine.element
      const editorElRect = editorEl.getBoundingClientRect()

      setHandlePos({
        top: blockRect.top - editorElRect.top + editorEl.scrollTop + 2,
        left: -24,
      })
    } else if (!block) {
      setHoveredBlock(null)
    }
  }, [engine, editAreaRef, hoveredBlock])

  // Use pointer events for cross-device support
  useEffect(() => {
    if (!engine) return
    const editorEl = engine.element

    const onPointerMove = (e) => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(() => updateHoveredBlock(e))
    }

    const onPointerLeave = () => {
      setHoveredBlock(null)
    }

    editorEl.addEventListener('pointermove', onPointerMove)
    editorEl.addEventListener('pointerleave', onPointerLeave)

    return () => {
      editorEl.removeEventListener('pointermove', onPointerMove)
      editorEl.removeEventListener('pointerleave', onPointerLeave)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [engine, updateHoveredBlock])

  // When hoveredBlock changes, make it draggable
  useEffect(() => {
    if (!engine || !hoveredBlock) return
    engine.dragDrop.makeBlockDraggable(hoveredBlock)
    return () => {
      engine.dragDrop.unmakeBlockDraggable(hoveredBlock)
    }
  }, [engine, hoveredBlock])

  // Touch-based drag via pointer capture
  const handlePointerDown = useCallback((e) => {
    if (!hoveredBlock || !engine) return

    // For touch devices, use pointer capture for drag
    const isTouch = e.pointerType === 'touch' || e.pointerType === 'pen'
    if (!isTouch) {
      // For mouse, let native drag handle it
      return
    }

    e.preventDefault()
    const handle = handleRef.current
    if (!handle) return

    handle.setPointerCapture(e.pointerId)
    setIsDragging(true)
    draggedBlockRef.current = hoveredBlock

    // Create ghost preview
    const blockRect = hoveredBlock.getBoundingClientRect()
    setGhostPos({
      x: e.clientX,
      y: e.clientY,
      width: blockRect.width,
      text: hoveredBlock.textContent?.slice(0, 50) || 'Block',
    })

    // Add dragging visual
    hoveredBlock.style.opacity = '0.4'

    const onPointerMove = (moveEvent) => {
      setGhostPos(prev => prev ? {
        ...prev,
        x: moveEvent.clientX,
        y: moveEvent.clientY,
      } : null)

      // Find drop target
      const editorEl = engine.element
      const elements = editorEl.querySelectorAll('[data-block-id], p, h1, h2, h3, h4, h5, h6, ul, ol, blockquote, pre, table, hr')
      let closestBlock = null
      let closestDist = Infinity

      for (const el of elements) {
        if (el === draggedBlockRef.current) continue
        const rect = el.getBoundingClientRect()
        const centerY = rect.top + rect.height / 2
        const dist = Math.abs(moveEvent.clientY - centerY)
        if (dist < closestDist) {
          closestDist = dist
          closestBlock = el
        }
      }

      // Show drop indicator
      editorEl.querySelectorAll('.rmx-touch-drop-indicator').forEach(el => el.remove())
      if (closestBlock) {
        const indicator = document.createElement('div')
        indicator.className = 'rmx-touch-drop-indicator'
        const rect = closestBlock.getBoundingClientRect()
        const insertBefore = moveEvent.clientY < rect.top + rect.height / 2
        if (insertBefore) {
          closestBlock.parentNode.insertBefore(indicator, closestBlock)
        } else {
          closestBlock.parentNode.insertBefore(indicator, closestBlock.nextSibling)
        }
      }
    }

    const onPointerUp = (upEvent) => {
      handle.removeEventListener('pointermove', onPointerMove)
      handle.removeEventListener('pointerup', onPointerUp)

      // Clean up ghost and indicators
      setIsDragging(false)
      setGhostPos(null)

      if (draggedBlockRef.current) {
        draggedBlockRef.current.style.opacity = ''
      }

      // Remove drop indicators
      engine.element.querySelectorAll('.rmx-touch-drop-indicator').forEach(el => {
        // Move block to the indicator position
        if (draggedBlockRef.current && el.parentNode) {
          el.parentNode.insertBefore(draggedBlockRef.current, el)
          el.remove()
        }
      })

      draggedBlockRef.current = null
    }

    handle.addEventListener('pointermove', onPointerMove)
    handle.addEventListener('pointerup', onPointerUp)
  }, [hoveredBlock, engine])

  if (!hoveredBlock || !handlePos) return null

  return (
    <>
      <div
        ref={handleRef}
        className="rmx-block-drag-handle rmx-block-drag-handle-touch rmx-visible"
        style={{
          top: handlePos.top,
          left: handlePos.left,
          touchAction: 'none',
        }}
        title="Drag to reorder"
        aria-label="Drag to reorder block"
        role="button"
        onPointerDown={handlePointerDown}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="currentColor"
        >
          <circle cx="4" cy="3" r="1.2" />
          <circle cx="10" cy="3" r="1.2" />
          <circle cx="4" cy="7" r="1.2" />
          <circle cx="10" cy="7" r="1.2" />
          <circle cx="4" cy="11" r="1.2" />
          <circle cx="10" cy="11" r="1.2" />
        </svg>
      </div>
      {/* Ghost preview during touch drag */}
      {isDragging && ghostPos && (
        <div
          ref={ghostRef}
          className="rmx-drag-ghost"
          style={{
            position: 'fixed',
            left: ghostPos.x - 20,
            top: ghostPos.y - 20,
            width: Math.min(ghostPos.width, 300),
            pointerEvents: 'none',
            zIndex: 10000,
          }}
        >
          {ghostPos.text}
        </div>
      )}
    </>
  )
}
