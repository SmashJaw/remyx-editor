import React, { useState, useEffect, useCallback } from 'react'

/**
 * BreadcrumbBar — shows the DOM path from editor root to current selection.
 * e.g., "Blockquote > Paragraph" or "Table > Row 2 > Cell 3"
 * Updates on selection:change. Renders between toolbar and edit area.
 * #49: Items are clickable — clicking selects the corresponding element.
 */

const TAG_LABELS = {
  P: 'Paragraph',
  H1: 'Heading 1', H2: 'Heading 2', H3: 'Heading 3',
  H4: 'Heading 4', H5: 'Heading 5', H6: 'Heading 6',
  BLOCKQUOTE: 'Blockquote',
  PRE: 'Code Block',
  UL: 'Bulleted List', OL: 'Numbered List',
  LI: 'List Item',
  TABLE: 'Table', THEAD: 'Header', TBODY: 'Body',
  TR: 'Row', TH: 'Header Cell', TD: 'Cell',
  A: 'Link', STRONG: 'Bold', EM: 'Italic',
  U: 'Underline', S: 'Strikethrough',
  DIV: 'Block', SPAN: 'Inline',
  DETAILS: 'Collapsible', SUMMARY: 'Summary',
  FIGURE: 'Figure', FIGCAPTION: 'Caption',
  IMG: 'Image',
}

function getLabel(el) {
  const tag = el.tagName
  let label = TAG_LABELS[tag] || tag.toLowerCase()

  // Provide context for table rows/cells
  if (tag === 'TR' && el.parentElement) {
    const rows = Array.from(el.parentElement.children)
    const index = rows.indexOf(el) + 1
    label = `Row ${index}`
  }
  if ((tag === 'TD' || tag === 'TH') && el.parentElement) {
    const cells = Array.from(el.parentElement.children)
    const index = cells.indexOf(el) + 1
    label = `Cell ${index}`
  }
  if (tag === 'LI' && el.parentElement) {
    const items = Array.from(el.parentElement.children)
    const index = items.indexOf(el) + 1
    label = `Item ${index}`
  }

  return label
}

function buildPath(node, editorEl) {
  const path = []
  let current = node

  // Walk up from the selection node to the editor element
  while (current && current !== editorEl && current !== document.body) {
    if (current.nodeType === Node.ELEMENT_NODE) {
      // Skip the edit area wrapper
      if (current.classList?.contains('rmx-edit-area') || current.classList?.contains('rmx-content')) {
        current = current.parentElement
        continue
      }
      path.unshift({ label: getLabel(current), element: current })
    }
    current = current.parentElement
  }

  return path.length > 0 ? path : [{ label: 'Paragraph', element: null }]
}

export const BreadcrumbBar = React.memo(function BreadcrumbBar({ engine }) {
  const [path, setPath] = useState([{ label: 'Paragraph', element: null }])

  const updatePath = useCallback(() => {
    if (!engine?.element) return
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) return

    let node = sel.anchorNode
    if (!node) return
    if (node.nodeType === Node.TEXT_NODE) node = node.parentElement
    if (!node || !engine.element.contains(node)) return

    setPath(buildPath(node, engine.element))
  }, [engine])

  useEffect(() => {
    if (!engine) return
    const unsub = engine.eventBus.on('selection:change', updatePath)
    updatePath()
    return unsub
  }, [engine, updatePath])

  // #49: Click handler to select corresponding element
  const handleClick = useCallback((element) => {
    if (!element || !engine) return
    try {
      const range = document.createRange()
      range.selectNodeContents(element)
      const sel = window.getSelection()
      sel.removeAllRanges()
      sel.addRange(range)
      engine.eventBus.emit('selection:change')
    } catch {
      // Ignore errors if element is no longer in DOM
    }
  }, [engine])

  return (
    <div className="rmx-breadcrumb-bar" role="navigation" aria-label="Document path">
      {path.map((segment, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span className="rmx-breadcrumb-separator" aria-hidden="true">&rsaquo;</span>}
          <button
            type="button"
            className="rmx-breadcrumb-item"
            onClick={() => handleClick(segment.element)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px', font: 'inherit', color: 'inherit' }}
          >
            {segment.label}
          </button>
        </React.Fragment>
      ))}
    </div>
  )
})
