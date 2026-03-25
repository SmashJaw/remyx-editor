import { escapeHTML } from '@remyxjs/core'

/**
 * TocPlugin — Auto-generated table of contents and document outline.
 *
 * - Builds heading hierarchy from H1-H6 elements
 * - Click-to-scroll navigation
 * - Collapsible sections based on heading levels
 * - Numbering options (1.1, 1.2, etc.)
 * - onOutlineChange callback for syncing with external navigation
 * - insertToc command to insert a rendered TOC into the document
 *
 * @param {object} [options]
 * @param {Function} [options.onOutlineChange] — (outline) => void
 * @param {boolean}  [options.numbering=true] — show section numbers
 * @param {boolean}  [options.collapsible=true] — allow collapsing sections in the sidebar
 */

import { createPlugin } from '@remyxjs/core'

// ---------------------------------------------------------------------------
// Outline builder
// ---------------------------------------------------------------------------

/**
 * @typedef {object} OutlineItem
 * @property {string} id — auto-generated or existing element ID
 * @property {string} text — heading text content
 * @property {number} level — 1-6
 * @property {string} [number] — section number (e.g., "1.2.3")
 * @property {HTMLElement} element — the heading DOM element
 * @property {OutlineItem[]} children — nested items
 */

let _idCounter = 0

/**
 * Build a hierarchical outline from headings in the editor.
 * @param {HTMLElement} editorEl
 * @param {{ numbering?: boolean }} [options]
 * @returns {OutlineItem[]}
 */
export function buildOutline(editorEl, options = {}) {
  const { numbering = true } = options
  const headings = editorEl.querySelectorAll('h1, h2, h3, h4, h5, h6')
  const flat = []

  for (const el of headings) {
    // Ensure each heading has an ID for linking
    if (!el.id) {
      const slug = el.textContent.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-') || `heading-${++_idCounter}`
      el.id = slug
    }
    flat.push({
      id: el.id,
      text: el.textContent,
      level: parseInt(el.tagName.charAt(1), 10),
      element: el,
      children: [],
      number: '',
    })
  }

  // Build tree
  const root = []
  const stack = [] // { item, level }

  for (const item of flat) {
    while (stack.length > 0 && stack[stack.length - 1].level >= item.level) {
      stack.pop()
    }
    if (stack.length === 0) {
      root.push(item)
    } else {
      stack[stack.length - 1].item.children.push(item)
    }
    stack.push({ item, level: item.level })
  }

  // Assign numbers
  if (numbering) {
    assignNumbers(root, '')
  }

  return root
}

function assignNumbers(items, prefix) {
  items.forEach((item, i) => {
    item.number = prefix ? `${prefix}.${i + 1}` : String(i + 1)
    assignNumbers(item.children, item.number)
  })
}

/**
 * Flatten a hierarchical outline into a flat list.
 * @param {OutlineItem[]} outline
 * @returns {OutlineItem[]}
 */
export function flattenOutline(outline) {
  const result = []
  function walk(items) {
    for (const item of items) {
      result.push(item)
      walk(item.children)
    }
  }
  walk(outline)
  return result
}

/**
 * Generate HTML for a table of contents.
 * @param {OutlineItem[]} outline
 * @param {{ numbering?: boolean, linkPrefix?: string }} [options]
 * @returns {string}
 */
export function renderTocHTML(outline, options = {}) {
  const { numbering = true, linkPrefix = '#' } = options

  function renderItems(items) {
    if (items.length === 0) return ''
    const lis = items.map(item => {
      const num = numbering && item.number ? `<span class="rmx-toc-number">${item.number}</span> ` : ''
      const children = item.children.length > 0 ? `<ul>${renderItems(item.children)}</ul>` : ''
      return `<li><a href="${linkPrefix}${item.id}" class="rmx-toc-link">${num}${escapeHTML(item.text)}</a>${children}</li>`
    }).join('')
    return lis
  }

  return `<nav class="rmx-toc" role="navigation" aria-label="Table of Contents"><ul>${renderItems(outline)}</ul></nav>`
}


/**
 * Validate heading hierarchy — check for skipped levels.
 * @param {OutlineItem[]} flatItems
 * @returns {Array<{ message: string, element: HTMLElement }>}
 */
export function validateHeadingHierarchy(flatItems) {
  const warnings = []
  for (let i = 1; i < flatItems.length; i++) {
    const prev = flatItems[i - 1].level
    const curr = flatItems[i].level
    if (curr > prev + 1) {
      warnings.push({
        message: `Heading level skipped: H${prev} → H${curr} (expected H${prev + 1})`,
        element: flatItems[i].element,
      })
    }
  }
  return warnings
}

// ---------------------------------------------------------------------------
// Plugin
// ---------------------------------------------------------------------------

export function TocPlugin(options = {}) {
  const {
    onOutlineChange,
    numbering = true,
    collapsible = true,
  } = options

  let engine = null
  let unsubContentChange = null
  let currentOutline = []
  let debounceTimer = null

  function updateOutline() {
    if (!engine) return
    currentOutline = buildOutline(engine.element, { numbering })
    engine.eventBus.emit('toc:change', { outline: currentOutline })
    onOutlineChange?.(currentOutline)
  }

  return createPlugin({
    name: 'toc',
    requiresFullAccess: true,
    version: '1.0.0',
    description: 'Auto-generated table of contents, document outline, heading validation',

    commands: [
      {
        name: 'getOutline',
        execute(eng) {
          return buildOutline(eng.element, { numbering })
        },
        meta: { tooltip: 'Get Document Outline' },
      },
      {
        name: 'insertToc',
        execute(eng) {
          eng.history.snapshot()
          const outline = buildOutline(eng.element, { numbering })
          const html = renderTocHTML(outline, { numbering })
          const sel = window.getSelection()
          if (sel && sel.rangeCount > 0) {
            const range = sel.getRangeAt(0)
            const temp = document.createElement('div')
            temp.innerHTML = html
            const fragment = document.createDocumentFragment()
            while (temp.firstChild) fragment.appendChild(temp.firstChild)
            range.deleteContents()
            range.insertNode(fragment)
          }
          eng.eventBus.emit('content:change')
        },
        meta: { icon: 'toc', tooltip: 'Insert Table of Contents' },
      },
      {
        name: 'scrollToHeading',
        execute(eng, headingId) {
          const el = eng.element.querySelector(`#${CSS.escape(headingId)}`)
          if (el) {
            el.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
            const sel = window.getSelection()
            const range = document.createRange()
            range.selectNodeContents(el)
            range.collapse(true)
            sel.removeAllRanges()
            sel.addRange(range)
          }
        },
        meta: { icon: 'scroll', tooltip: 'Scroll to Heading' },
      },
      {
        name: 'validateHeadings',
        execute(eng) {
          const outline = buildOutline(eng.element, { numbering: false })
          const flat = flattenOutline(outline)
          return validateHeadingHierarchy(flat)
        },
        meta: { tooltip: 'Validate Heading Hierarchy' },
      },
    ],

    init(eng) {
      engine = eng

      engine._toc = {
        buildOutline: () => buildOutline(engine.element, { numbering }),
        flattenOutline,
        renderTocHTML,
        validateHeadingHierarchy,
        getOutline: () => currentOutline,
      }

      // Update outline on content changes (debounced)
      unsubContentChange = engine.eventBus.on('content:change', () => {
        clearTimeout(debounceTimer)
        debounceTimer = setTimeout(updateOutline, 200)
      })

      // Handle TOC link clicks (smooth scroll)
      engine.element.addEventListener('click', (e) => {
        const link = e.target.closest('.rmx-toc-link')
        if (link) {
          e.preventDefault()
          const id = link.getAttribute('href')?.replace('#', '')
          if (id) {
            const heading = engine.element.querySelector(`#${CSS.escape(id)}`)
            heading?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
          }
        }
      })

      // Initial outline
      updateOutline()
    },

    destroy() {
      clearTimeout(debounceTimer)
      unsubContentChange?.()
      engine = null
    },
  })
}
