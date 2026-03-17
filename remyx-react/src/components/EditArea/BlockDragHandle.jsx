import React, { useState, useEffect, useRef, useCallback } from 'react'

/**
 * A drag handle that appears on the left side of block elements when hovered.
 * Allows users to drag blocks to reorder them or move them between editors.
 *
 * Listens for mousemove events on the editor to detect which block is hovered,
 * then positions a grip icon at the left edge of that block.
 */
export function BlockDragHandle({ engine, editorRect, editAreaRef }) {
  const [hoveredBlock, setHoveredBlock] = useState(null)
  const [handlePos, setHandlePos] = useState(null)
  const handleRef = useRef(null)
  const rafRef = useRef(null)

  const updateHoveredBlock = useCallback((e) => {
    if (!engine || !editAreaRef.current) return

    // Don't show handle during active drags
    if (engine.dragDrop._dragSource) {
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

  useEffect(() => {
    if (!engine) return
    const editorEl = engine.element

    const onMouseMove = (e) => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(() => updateHoveredBlock(e))
    }

    const onMouseLeave = () => {
      setHoveredBlock(null)
    }

    editorEl.addEventListener('mousemove', onMouseMove)
    editorEl.addEventListener('mouseleave', onMouseLeave)

    return () => {
      editorEl.removeEventListener('mousemove', onMouseMove)
      editorEl.removeEventListener('mouseleave', onMouseLeave)
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

  if (!hoveredBlock || !handlePos) return null

  return (
    <div
      ref={handleRef}
      className="rmx-block-drag-handle rmx-visible"
      style={{
        top: handlePos.top,
        left: handlePos.left,
      }}
      title="Drag to reorder"
      aria-label="Drag to reorder block"
      role="button"
      onMouseDown={(e) => {
        // The actual drag is handled by the native dragstart on the block
        // This just provides the visual handle
      }}
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
  )
}
