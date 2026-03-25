import React, { useState, useEffect, useRef, useCallback } from 'react'
import PropTypes from 'prop-types'

/** Block-level selectors that trigger the toolbar */
const BLOCK_SELECTOR = 'p, h1, h2, h3, h4, h5, h6, blockquote, pre, ul, ol, table, div[data-embed-url], hr'

/** Map tag names to human-readable short labels */
const TAG_LABELS = {
  P: 'P',
  H1: 'H1',
  H2: 'H2',
  H3: 'H3',
  H4: 'H4',
  H5: 'H5',
  H6: 'H6',
  BLOCKQUOTE: 'Quote',
  PRE: 'Code',
  UL: 'UL',
  OL: 'OL',
  TABLE: 'Table',
  DIV: 'Div',
  HR: 'HR',
}

/** Conversion options for the block type dropdown */
const CONVERT_OPTIONS = [
  { label: 'Paragraph', value: 'paragraph' },
  { label: 'Heading 1', value: 'heading1' },
  { label: 'Heading 2', value: 'heading2' },
  { label: 'Heading 3', value: 'heading3' },
  { label: 'Heading 4', value: 'heading4' },
  { label: 'Heading 5', value: 'heading5' },
  { label: 'Heading 6', value: 'heading6' },
  { label: 'Blockquote', value: 'blockquote' },
  { label: 'Code Block', value: 'codeBlock' },
  { label: 'Bullet List', value: 'unorderedList' },
  { label: 'Numbered List', value: 'orderedList' },
]

/**
 * BlockToolbar - Appears on hover/focus of block-level elements.
 * Shows a drag grip, block type badge, and an actions menu.
 * Positioned at the left edge of the block, vertically centered.
 */
export function BlockToolbar({ engine, editAreaRef }) {
  const [hoveredBlock, setHoveredBlock] = useState(null)
  const [toolbarPos, setToolbarPos] = useState(null)
  const [showTypeMenu, setShowTypeMenu] = useState(false)
  const [showActionsMenu, setShowActionsMenu] = useState(false)
  const toolbarRef = useRef(null)
  const rafRef = useRef(null)

  const findBlock = useCallback((target) => {
    if (!engine || !editAreaRef.current) return null
    const editorEl = engine.element
    let el = target
    while (el && el !== editorEl) {
      if (el.parentElement === editorEl && el.matches && el.matches(BLOCK_SELECTOR)) {
        return el
      }
      // Also match direct children that are block tags
      if (el.parentElement === editorEl) {
        return el
      }
      el = el.parentElement
    }
    return null
  }, [engine, editAreaRef])

  const updatePosition = useCallback((block) => {
    if (!block || !engine) return
    const editorEl = engine.element
    const editorRect = editorEl.getBoundingClientRect()
    const blockRect = block.getBoundingClientRect()

    setToolbarPos({
      top: blockRect.top - editorRect.top + editorEl.scrollTop + (blockRect.height / 2) - 14,
      left: -72,
    })
  }, [engine])

  const onMouseMove = useCallback((e) => {
    if (!engine || engine.dragDrop.isDragging()) {
      setHoveredBlock(null)
      return
    }
    const block = findBlock(e.target)
    if (block && block !== hoveredBlock) {
      setHoveredBlock(block)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(() => updatePosition(block))
    } else if (!block) {
      setHoveredBlock(null)
      setShowTypeMenu(false)
      setShowActionsMenu(false)
    }
  }, [engine, findBlock, hoveredBlock, updatePosition])

  useEffect(() => {
    if (!engine) return
    const editorEl = engine.element

    const handleMove = (e) => onMouseMove(e)
    const handleLeave = () => {
      // Small delay so menus remain clickable
      setTimeout(() => {
        if (!toolbarRef.current?.matches(':hover')) {
          setHoveredBlock(null)
          setShowTypeMenu(false)
          setShowActionsMenu(false)
        }
      }, 200)
    }

    editorEl.addEventListener('mousemove', handleMove)
    editorEl.addEventListener('mouseleave', handleLeave)

    return () => {
      editorEl.removeEventListener('mousemove', handleMove)
      editorEl.removeEventListener('mouseleave', handleLeave)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [engine, onMouseMove])

  // Close menus on outside click
  useEffect(() => {
    if (!showTypeMenu && !showActionsMenu) return
    const handleClick = (e) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target)) {
        setShowTypeMenu(false)
        setShowActionsMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showTypeMenu, showActionsMenu])

  const handleConvert = useCallback((to) => {
    if (!engine || !hoveredBlock) return
    // Place cursor in the block first so the command can find it
    const range = document.createRange()
    range.selectNodeContents(hoveredBlock)
    range.collapse(true)
    engine.selection.setRange(range)
    engine.commands.execute('convertBlock', { to })
    setShowTypeMenu(false)
    setHoveredBlock(null)
  }, [engine, hoveredBlock])

  const handleAction = useCallback((action) => {
    if (!engine || !hoveredBlock) return
    // Ensure cursor is in the block
    const range = document.createRange()
    range.selectNodeContents(hoveredBlock)
    range.collapse(true)
    engine.selection.setRange(range)

    switch (action) {
      case 'moveUp':
        engine.commands.execute('moveBlockUp')
        break
      case 'moveDown':
        engine.commands.execute('moveBlockDown')
        break
      case 'duplicate':
        engine.commands.execute('duplicateBlock')
        break
      case 'delete':
        engine.commands.execute('deleteBlock')
        break
      default:
        break
    }

    setShowActionsMenu(false)
    setHoveredBlock(null)
  }, [engine, hoveredBlock])

  if (!hoveredBlock || !toolbarPos) return null

  const blockTag = hoveredBlock.tagName
  const typeLabel = TAG_LABELS[blockTag] || blockTag

  return (
    <div
      ref={toolbarRef}
      className="rmx-block-toolbar"
      style={{
        position: 'absolute',
        top: toolbarPos.top,
        left: toolbarPos.left,
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        gap: '2px',
        background: 'var(--rmx-toolbar-bg, #fff)',
        border: '1px solid var(--rmx-border, #e2e8f0)',
        borderRadius: '4px',
        padding: '2px',
        boxShadow: 'var(--rmx-shadow-sm)',
        fontSize: '11px',
        lineHeight: 1,
        userSelect: 'none',
      }}
      onMouseLeave={() => {
        setTimeout(() => {
          if (!toolbarRef.current?.matches(':hover')) {
            setShowTypeMenu(false)
            setShowActionsMenu(false)
          }
        }, 300)
      }}
    >
      {/* Drag grip icon */}
      <div
        className="rmx-block-toolbar-grip"
        style={{ cursor: 'grab', padding: '2px', color: 'var(--rmx-toolbar-icon, #64748b)' }}
        title="Drag to reorder"
        aria-label="Drag to reorder block"
      >
        <svg width="12" height="12" viewBox="0 0 14 14" fill="currentColor">
          <circle cx="4" cy="3" r="1.2" />
          <circle cx="10" cy="3" r="1.2" />
          <circle cx="4" cy="7" r="1.2" />
          <circle cx="10" cy="7" r="1.2" />
          <circle cx="4" cy="11" r="1.2" />
          <circle cx="10" cy="11" r="1.2" />
        </svg>
      </div>

      {/* Block type indicator / dropdown */}
      <div style={{ position: 'relative' }}>
        <button
          className="rmx-block-toolbar-type"
          style={{
            background: 'var(--rmx-primary-light, #e0e7ff)',
            color: 'var(--rmx-primary, #6366f1)',
            border: 'none',
            borderRadius: '3px',
            padding: '1px 4px',
            fontSize: '10px',
            fontWeight: 600,
            cursor: 'pointer',
            lineHeight: '16px',
          }}
          onClick={() => {
            setShowTypeMenu(!showTypeMenu)
            setShowActionsMenu(false)
          }}
          title="Change block type"
          aria-label={`Block type: ${typeLabel}. Click to change.`}
        >
          {typeLabel}
        </button>

        {showTypeMenu && (
          <div
            className="rmx-block-toolbar-dropdown"
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              marginTop: '4px',
              background: 'var(--rmx-modal-bg, #fff)',
              border: '1px solid var(--rmx-border, #e2e8f0)',
              borderRadius: '6px',
              boxShadow: 'var(--rmx-shadow-md)',
              padding: '4px',
              minWidth: '140px',
              zIndex: 20,
            }}
          >
            {CONVERT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  background: 'none',
                  border: 'none',
                  padding: '4px 8px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  borderRadius: '3px',
                  color: 'var(--rmx-text, #1e293b)',
                }}
                onMouseEnter={(e) => { e.target.style.background = 'var(--rmx-toolbar-button-hover, #f1f5f9)' }}
                onMouseLeave={(e) => { e.target.style.background = 'none' }}
                onClick={() => handleConvert(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Actions menu */}
      <div style={{ position: 'relative' }}>
        <button
          className="rmx-block-toolbar-actions"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '2px 3px',
            fontSize: '14px',
            lineHeight: 1,
            color: 'var(--rmx-toolbar-icon, #64748b)',
          }}
          onClick={() => {
            setShowActionsMenu(!showActionsMenu)
            setShowTypeMenu(false)
          }}
          title="Block actions"
          aria-label="Block actions menu"
        >
          &#8942;
        </button>

        {showActionsMenu && (
          <div
            className="rmx-block-toolbar-dropdown"
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '4px',
              background: 'var(--rmx-modal-bg, #fff)',
              border: '1px solid var(--rmx-border, #e2e8f0)',
              borderRadius: '6px',
              boxShadow: 'var(--rmx-shadow-md)',
              padding: '4px',
              minWidth: '120px',
              zIndex: 20,
            }}
          >
            {[
              { label: 'Move Up', action: 'moveUp' },
              { label: 'Move Down', action: 'moveDown' },
              { label: 'Duplicate', action: 'duplicate' },
              { label: 'Delete', action: 'delete' },
            ].map((item) => (
              <button
                key={item.action}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  background: 'none',
                  border: 'none',
                  padding: '4px 8px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  borderRadius: '3px',
                  color: item.action === 'delete' ? 'var(--rmx-danger, #ef4444)' : 'var(--rmx-text, #1e293b)',
                }}
                onMouseEnter={(e) => { e.target.style.background = 'var(--rmx-toolbar-button-hover, #f1f5f9)' }}
                onMouseLeave={(e) => { e.target.style.background = 'none' }}
                onClick={() => handleAction(item.action)}
              >
                {item.label}
              </button>
            ))}
            <hr style={{ margin: '4px 0', border: 'none', borderTop: '1px solid var(--rmx-border, #e2e8f0)' }} />
            <button
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                background: 'none',
                border: 'none',
                padding: '4px 8px',
                fontSize: '12px',
                cursor: 'pointer',
                borderRadius: '3px',
                color: 'var(--rmx-text, #1e293b)',
              }}
              onMouseEnter={(e) => { e.target.style.background = 'var(--rmx-toolbar-button-hover, #f1f5f9)' }}
              onMouseLeave={(e) => { e.target.style.background = 'none' }}
              onClick={() => {
                setShowActionsMenu(false)
                setShowTypeMenu(true)
              }}
            >
              Convert To...
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

BlockToolbar.propTypes = {
  engine: PropTypes.object,
  editAreaRef: PropTypes.shape({
    current: PropTypes.instanceOf(typeof Element !== 'undefined' ? Element : Object),
  }),
}
