import { useState, useCallback, useEffect, useRef } from 'react'
import { cleanPastedHTML } from '@remyxjs/core'
// Task 256: Import shared insertPlainText utility
import { insertPlainText } from '@remyxjs/core'

/**
 * Handle paste from the context menu using the full cleaning pipeline.
 * Tries navigator.clipboard.read() for rich text first, falls back to readText().
 */
async function handleContextMenuPaste(engine) {
  if (!engine) return

  engine.history.snapshot()

  try {
    // Try reading rich content (HTML) via the Clipboard API
    if (navigator.clipboard?.read) {
      const items = await navigator.clipboard.read()
      for (const item of items) {
        // Check for HTML content first
        if (item.types.includes('text/html')) {
          const blob = await item.getType('text/html')
          let html = await blob.text()
          html = cleanPastedHTML(html)
          html = engine.sanitizer.sanitize(html)
          engine.selection.insertHTML(html)
          engine.eventBus.emit('content:change')
          return
        }
        // Fall back to plain text
        if (item.types.includes('text/plain')) {
          const blob = await item.getType('text/plain')
          const text = await blob.text()
          insertPlainText(engine, text)
          engine.eventBus.emit('content:change')
          return
        }
      }
    }

    // Fallback: navigator.clipboard.readText()
    if (navigator.clipboard?.readText) {
      const text = await navigator.clipboard.readText()
      if (text) {
        insertPlainText(engine, text)
        engine.eventBus.emit('content:change')
      }
    }
  } catch {
    // Permission denied or API not available — try readText as last resort
    try {
      const text = await navigator.clipboard?.readText?.()
      if (text) {
        insertPlainText(engine, text)
        engine.eventBus.emit('content:change')
      }
    } catch {
      // Clipboard access denied entirely — nothing we can do
    }
  }
}

export function useContextMenu(engine, editorRef) {
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    items: [],
  })

  // Task 268: Extract stable command handler functions
  const cutHandler = useCallback(async () => {
    const sel = window.getSelection()
    if (sel && !sel.isCollapsed) {
      try {
        await navigator.clipboard.writeText(sel.toString())
        sel.getRangeAt(0).deleteContents()
      } catch { /* fallback: no-op in insecure contexts */ }
    }
  }, [])

  const copyHandler = useCallback(async () => {
    const sel = window.getSelection()
    if (sel && !sel.isCollapsed) {
      try { await navigator.clipboard.writeText(sel.toString()) } catch { /* no-op */ }
    }
  }, [])

  const pasteHandler = useCallback(() => handleContextMenuPaste(engine), [engine])

  const selectAllHandler = useCallback(() => {
    if (!engine) return
    const sel = window.getSelection()
    const range = document.createRange()
    range.selectNodeContents(engine.element)
    sel.removeAllRanges()
    sel.addRange(range)
  }, [engine])

  const handleContextMenu = useCallback((e) => {
    if (!engine) return
    e.preventDefault()

    const target = e.target
    const items = []

    // Always show basic items
    items.push(
      { label: 'Cut', command: cutHandler },
      { label: 'Copy', command: copyHandler },
      { label: 'Paste', command: pasteHandler },
      { separator: true },
      { label: 'Select All', command: selectAllHandler },
    )

    // Context-specific items
    const linkEl = target.closest?.('a')
    if (linkEl) {
      items.push(
        { separator: true },
        { label: 'Edit Link', command: 'editLinkModal', data: linkEl },
        { label: 'Remove Link', command: () => engine.executeCommand('removeLink') },
        { label: 'Open Link', command: () => {
          const href = linkEl.href
          if (!/^\s*(javascript|vbscript|data\s*:\s*text\/html)\s*:/i.test(href)) {
            window.open(href, '_blank')
          }
        }},
      )
    }

    const imgEl = target.tagName === 'IMG' ? target : null
    if (imgEl) {
      items.push(
        { separator: true },
        { label: 'Align Left', command: () => engine.executeCommand('alignImage', { element: imgEl, alignment: 'left' }) },
        { label: 'Align Center', command: () => engine.executeCommand('alignImage', { element: imgEl, alignment: 'center' }) },
        { label: 'Align Right', command: () => engine.executeCommand('alignImage', { element: imgEl, alignment: 'right' }) },
        { label: 'Remove Image', command: () => engine.executeCommand('removeImage', { element: imgEl }) },
      )
    }

    const tableEl = target.closest?.('table')
    if (tableEl) {
      items.push(
        { separator: true },
        { label: 'Insert Row Before', command: () => engine.executeCommand('addRowBefore') },
        { label: 'Insert Row After', command: () => engine.executeCommand('addRowAfter') },
        { label: 'Insert Column Before', command: () => engine.executeCommand('addColBefore') },
        { label: 'Insert Column After', command: () => engine.executeCommand('addColAfter') },
        { separator: true },
        { label: 'Toggle Header Row', command: () => engine.executeCommand('toggleHeaderRow') },
        { separator: true },
        { label: 'Format as Number', command: () => engine.executeCommand('formatCell', { format: 'number' }) },
        { label: 'Format as Currency', command: () => engine.executeCommand('formatCell', { format: 'currency' }) },
        { label: 'Format as Percentage', command: () => engine.executeCommand('formatCell', { format: 'percentage' }) },
        { label: 'Format as Date', command: () => engine.executeCommand('formatCell', { format: 'date' }) },
        { separator: true },
        { label: 'Clear Filters', command: () => engine.executeCommand('clearTableFilters') },
        { separator: true },
        { label: 'Delete Row', command: () => engine.executeCommand('deleteRow') },
        { label: 'Delete Column', command: () => engine.executeCommand('deleteCol') },
        { label: 'Delete Table', command: () => engine.executeCommand('deleteTable') },
      )
    }

    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      items,
    })
  }, [engine, cutHandler, copyHandler, pasteHandler, selectAllHandler])

  const hideContextMenu = useCallback(() => {
    setContextMenu((prev) => ({ ...prev, visible: false }))
  }, [])

  // Task 267: Gate the scroll listener behind contextMenu.visible
  const visibleRef = useRef(false)
  visibleRef.current = contextMenu.visible

  useEffect(() => {
    const el = editorRef?.current
    if (!el) return
    el.addEventListener('contextmenu', handleContextMenu)
    document.addEventListener('click', hideContextMenu)

    // Task 267: Only add scroll listener when context menu is visible
    const handleScroll = () => {
      if (visibleRef.current) hideContextMenu()
    }
    document.addEventListener('scroll', handleScroll, true)

    return () => {
      el.removeEventListener('contextmenu', handleContextMenu)
      document.removeEventListener('click', hideContextMenu)
      document.removeEventListener('scroll', handleScroll, true)
    }
  }, [editorRef, handleContextMenu, hideContextMenu])

  return { contextMenu, hideContextMenu }
}
