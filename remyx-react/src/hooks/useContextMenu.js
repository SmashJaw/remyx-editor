import { useState, useCallback, useEffect } from 'react'
import { cleanPastedHTML, looksLikeMarkdown, markdownToHtml } from '@remyxjs/core'

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

/**
 * Insert plain text with smart markdown detection.
 */
function insertPlainText(engine, text) {
  if (engine.outputFormat === 'markdown' || looksLikeMarkdown(text)) {
    let parsedHtml = markdownToHtml(text)
    parsedHtml = engine.sanitizer.sanitize(parsedHtml)
    engine.selection.insertHTML(parsedHtml)
  } else {
    const escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
    const formatted = escaped
      .split(/\n\n+/)
      .map((para) => `<p>${para.replace(/\n/g, '<br>')}</p>`)
      .join('')
    engine.selection.insertHTML(formatted || '<p><br></p>')
  }
}

export function useContextMenu(engine, editorRef) {
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    items: [],
  })

  const handleContextMenu = useCallback((e) => {
    if (!engine) return
    e.preventDefault()

    const target = e.target
    const items = []

    // Always show basic items
    items.push(
      { label: 'Cut', command: () => document.execCommand('cut') },
      { label: 'Copy', command: () => document.execCommand('copy') },
      { label: 'Paste', command: () => handleContextMenuPaste(engine) },
      { separator: true },
      { label: 'Select All', command: () => document.execCommand('selectAll') },
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
  }, [engine])

  const hideContextMenu = useCallback(() => {
    setContextMenu((prev) => ({ ...prev, visible: false }))
  }, [])

  useEffect(() => {
    const el = editorRef?.current
    if (!el) return
    el.addEventListener('contextmenu', handleContextMenu)
    document.addEventListener('click', hideContextMenu)
    document.addEventListener('scroll', hideContextMenu, true)

    return () => {
      el.removeEventListener('contextmenu', handleContextMenu)
      document.removeEventListener('click', hideContextMenu)
      document.removeEventListener('scroll', hideContextMenu, true)
    }
  }, [editorRef, handleContextMenu, hideContextMenu])

  return { contextMenu, hideContextMenu }
}
