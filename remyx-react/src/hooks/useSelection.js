import { useState, useEffect, useCallback } from 'react'

const DEFAULT_STATE = {
  bold: false,
  italic: false,
  underline: false,
  strikethrough: false,
  subscript: false,
  superscript: false,
  heading: null,
  alignment: 'left',
  orderedList: false,
  unorderedList: false,
  blockquote: false,
  codeBlock: false,
  link: null,
  fontFamily: null,
  fontSize: null,
  foreColor: null,
  backColor: null,
  hasSelection: false,
  selectionRect: null,
  focusedImage: null,
  focusedTable: null,
}

export function useSelection(engine) {
  const [state, setState] = useState(DEFAULT_STATE)

  const handleSelectionChange = useCallback((formats) => {
    setState((prev) => {
      const sel = window.getSelection()
      const hasSelection = sel && !sel.isCollapsed && sel.toString().length > 0

      let selectionRect = null
      if (hasSelection && sel.rangeCount > 0) {
        selectionRect = sel.getRangeAt(0).getBoundingClientRect()
      }

      // Check for focused image/table
      let focusedImage = null
      let focusedTable = null
      if (sel && sel.focusNode) {
        const node = sel.focusNode.nodeType === Node.TEXT_NODE ? sel.focusNode.parentElement : sel.focusNode
        if (node) {
          const img = node.tagName === 'IMG' ? node : node.querySelector?.(':scope > img')
          if (img) focusedImage = img

          const table = node.closest?.('table')
          if (table) focusedTable = table
        }
      }

      return {
        ...formats,
        hasSelection,
        selectionRect,
        focusedImage,
        focusedTable,
      }
    })
  }, [])

  useEffect(() => {
    if (!engine) return
    const unsub = engine.eventBus.on('selection:change', handleSelectionChange)
    return unsub
  }, [engine, handleSelectionChange])

  return state
}
