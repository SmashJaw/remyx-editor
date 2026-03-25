import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import PropTypes from 'prop-types'

function ContextMenuInner({ contextMenu, onHide, onOpenModal }) {
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const menuRef = useRef(null)
  const itemRefs = useRef([])

  // Compute actionable (non-separator) item indices
  const actionableIndices = useMemo(() => {
    if (!contextMenu.visible || !contextMenu.items) return []
    return contextMenu.items
      .map((item, i) => (item.separator ? null : i))
      .filter((i) => i !== null)
  }, [contextMenu.visible, contextMenu.items])

  // Focus the menu container when it appears
  useEffect(() => {
    if (contextMenu.visible && menuRef.current) {
      menuRef.current.focus()
      setFocusedIndex(-1)
    }
  }, [contextMenu.visible])

  // Keep focused item in sync with DOM focus
  useEffect(() => {
    if (focusedIndex >= 0 && itemRefs.current[focusedIndex]) {
      itemRefs.current[focusedIndex].focus()
    }
  }, [focusedIndex])

  const executeItem = useCallback((item) => {
    if (typeof item.command === 'function') {
      try {
        item.command()
      } catch (err) {
        console.error('[Remyx] Context menu command failed:', err)
      }
    } else if (item.command === 'editLinkModal') {
      onOpenModal?.('link', {
        href: item.data?.href,
        text: item.data?.textContent,
        target: item.data?.target,
      })
    }
    onHide()
  }, [onHide, onOpenModal])

  const handleKeyDown = useCallback((e) => {
    if (!actionableIndices.length) return

    const currentPos = actionableIndices.indexOf(focusedIndex)

    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault()
        const next = currentPos < actionableIndices.length - 1 ? currentPos + 1 : 0
        setFocusedIndex(actionableIndices[next])
        break
      }
      case 'ArrowUp': {
        e.preventDefault()
        const prev = currentPos > 0 ? currentPos - 1 : actionableIndices.length - 1
        setFocusedIndex(actionableIndices[prev])
        break
      }
      case 'Home': {
        e.preventDefault()
        setFocusedIndex(actionableIndices[0])
        break
      }
      case 'End': {
        e.preventDefault()
        setFocusedIndex(actionableIndices[actionableIndices.length - 1])
        break
      }
      case 'Enter': {
        e.preventDefault()
        if (focusedIndex >= 0 && contextMenu.items[focusedIndex]) {
          executeItem(contextMenu.items[focusedIndex])
        }
        break
      }
      case 'Escape': {
        e.preventDefault()
        onHide()
        break
      }
      case 'Tab': {
        e.preventDefault()
        onHide()
        break
      }
      default:
        break
    }
  }, [actionableIndices, focusedIndex, contextMenu.items, executeItem, onHide])

  if (!contextMenu.visible) return null

  return (
    <div
      ref={menuRef}
      className="rmx-context-menu"
      style={{ top: contextMenu.y, left: contextMenu.x }}
      role="menu"
      tabIndex={-1}
      onKeyDown={handleKeyDown}
    >
      {contextMenu.items.map((item, i) => {
        if (item.separator) {
          return <div key={i} className="rmx-context-menu-separator" role="separator" />
        }
        return (
          <button
            key={i}
            ref={(el) => { itemRefs.current[i] = el }}
            className={`rmx-context-menu-item${focusedIndex === i ? ' rmx-focused' : ''}`}
            onClick={() => executeItem(item)}
            onMouseEnter={() => setFocusedIndex(i)}
            type="button"
            role="menuitem"
            tabIndex={-1}
          >
            {item.label}
          </button>
        )
      })}
    </div>
  )
}

export const ContextMenu = React.memo(ContextMenuInner)

ContextMenu.propTypes = {
  contextMenu: PropTypes.shape({
    visible: PropTypes.bool,
    x: PropTypes.number,
    y: PropTypes.number,
    items: PropTypes.array,
  }).isRequired,
  onHide: PropTypes.func.isRequired,
  onOpenModal: PropTypes.func,
}
