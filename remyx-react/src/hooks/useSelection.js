import { useState, useEffect, useCallback, useRef } from 'react'

const DEFAULT_FORMAT = {
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
}

const DEFAULT_UI = {
  hasSelection: false,
  selectionRect: null,
  focusedImage: null,
  focusedTable: null,
  focusedCodeBlock: null,
}

const FORMAT_KEYS = Object.keys(DEFAULT_FORMAT)

/**
 * Shallow compare two objects by a set of keys.
 * Returns true if all values are identical (===).
 */
function shallowEqual(a, b, keys) {
  for (const key of keys) {
    if (a[key] !== b[key]) return false
  }
  return true
}

/**
 * WeakMap cache for DOM lookups keyed by range startContainer.
 * Avoids redundant closest/querySelector calls for the same focused element.
 * Cleared when content changes.
 */
const _domLookupCache = new WeakMap()

export function useSelection(engine) {
  const [formatState, setFormatState] = useState(DEFAULT_FORMAT)
  const [uiState, setUiState] = useState(DEFAULT_UI)

  // Cache focused image/table DOM references to avoid unnecessary state updates
  const cachedFocusRef = useRef({ image: null, table: null })

  const handleSelectionChange = useCallback((formats) => {
    // Update format state — bail out if nothing changed
    setFormatState(prev => {
      const next = {}
      for (const key of FORMAT_KEYS) {
        next[key] = key in formats ? formats[key] : DEFAULT_FORMAT[key]
      }
      return shallowEqual(prev, next, FORMAT_KEYS) ? prev : next
    })

    // Compute UI state
    const sel = window.getSelection()
    const hasSelection = sel && !sel.isCollapsed && sel.toString().length > 0

    let selectionRect = null
    if (hasSelection && sel.rangeCount > 0) {
      try {
        selectionRect = sel.getRangeAt(0).getBoundingClientRect()
      } catch {
        // DOM mutations between rangeCount check and getRangeAt can clear the selection
        selectionRect = null
      }
    }

    // DOM queries for focused image/table/codeblock (with WeakMap cache)
    let focusedImage = null
    let focusedTable = null
    let focusedCodeBlock = null
    if (sel && sel.focusNode) {
      const node = sel.focusNode.nodeType === Node.TEXT_NODE ? sel.focusNode.parentElement : sel.focusNode
      if (node) {
        // Check WeakMap cache keyed by the focus node
        const cacheKey = sel.focusNode
        let cached = _domLookupCache.get(cacheKey)
        if (cached) {
          focusedImage = cached.image
          focusedTable = cached.table
          focusedCodeBlock = cached.codeBlock
        } else {
          const img = node.tagName === 'IMG' ? node : node.querySelector?.(':scope > img')
          if (img) focusedImage = img

          const table = node.closest?.('table')
          if (table) focusedTable = table

          const pre = node.closest?.('pre')
          if (pre) focusedCodeBlock = pre

          _domLookupCache.set(cacheKey, { image: focusedImage, table: focusedTable, codeBlock: focusedCodeBlock })
        }
      }
    }

    // Use cached references if the actual DOM element hasn't changed
    if (focusedImage === cachedFocusRef.current.image &&
        focusedTable === cachedFocusRef.current.table &&
        focusedCodeBlock === cachedFocusRef.current.codeBlock) {
      focusedImage = cachedFocusRef.current.image
      focusedTable = cachedFocusRef.current.table
      focusedCodeBlock = cachedFocusRef.current.codeBlock
    } else {
      cachedFocusRef.current = { image: focusedImage, table: focusedTable, codeBlock: focusedCodeBlock }
    }

    // Update UI state — bail out if nothing changed
    setUiState(prev => {
      if (prev.hasSelection === hasSelection &&
          prev.focusedImage === focusedImage &&
          prev.focusedTable === focusedTable &&
          prev.focusedCodeBlock === focusedCodeBlock &&
          !hasSelection) {
        return prev
      }
      return { hasSelection, selectionRect, focusedImage, focusedTable, focusedCodeBlock }
    })
  }, [])

  // Subscribe to selection changes
  useEffect(() => {
    if (!engine) return
    const unsub = engine.eventBus.on('selection:change', handleSelectionChange)
    return unsub
  }, [engine, handleSelectionChange])

  // Clear cached DOM references when content changes (DOM may have mutated)
  useEffect(() => {
    if (!engine) return
    const clearCache = () => {
      cachedFocusRef.current = { image: null, table: null, codeBlock: null }
      // Note: WeakMap entries for detached DOM nodes are automatically GC'd
    }
    const unsub = engine.eventBus.on('content:change', clearCache)
    return unsub
  }, [engine])

  // Return split object with formatState and uiState as separate sub-objects
  return { formatState, uiState }
}
