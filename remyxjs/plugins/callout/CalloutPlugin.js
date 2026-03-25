/**
 * CalloutPlugin — styled callout/alert/admonition blocks.
 *
 * Provides 7 built-in callout types (info, warning, error, success, tip, note, question)
 * with custom type registration, collapsible toggle, nested content support,
 * and GitHub-flavored alert syntax (`> [!NOTE]`, `> [!WARNING]`).
 *
 * DOM structure:
 *   <div class="rmx-callout rmx-callout-{type}" data-callout="{type}" [data-callout-collapsible]>
 *     <div class="rmx-callout-header">
 *       <span class="rmx-callout-icon">{icon}</span>
 *       <span class="rmx-callout-title">{Title}</span>
 *       [<button class="rmx-callout-toggle">▶/▼</button>]
 *     </div>
 *     <div class="rmx-callout-body">{nested content}</div>
 *   </div>
 */

import { createPlugin } from '@remyxjs/core'

// ---------------------------------------------------------------------------
// Built-in callout types
// ---------------------------------------------------------------------------

/** @typedef {{ type: string, label: string, icon: string, color: string }} CalloutType */

/** @type {Map<string, CalloutType>} */
const _calloutTypes = new Map()

// Default 7 types
const BUILTIN_TYPES = [
  { type: 'info',     label: 'Info',     icon: 'ℹ️',  color: '#3b82f6' },
  { type: 'warning',  label: 'Warning',  icon: '⚠️',  color: '#f59e0b' },
  { type: 'error',    label: 'Error',    icon: '❌',  color: '#ef4444' },
  { type: 'success',  label: 'Success',  icon: '✅',  color: '#22c55e' },
  { type: 'tip',      label: 'Tip',      icon: '💡',  color: '#8b5cf6' },
  { type: 'note',     label: 'Note',     icon: '📝',  color: '#6366f1' },
  { type: 'question', label: 'Question', icon: '❓',  color: '#ec4899' },
]

// Initialize defaults
for (const t of BUILTIN_TYPES) _calloutTypes.set(t.type, t)

/**
 * Register a custom callout type (or override a built-in).
 * @param {CalloutType} typeDef
 */
export function registerCalloutType(typeDef) {
  if (!typeDef || !typeDef.type) return
  _calloutTypes.set(typeDef.type, typeDef)
}

/**
 * Unregister a callout type.
 * @param {string} type
 * @returns {boolean}
 */
export function unregisterCalloutType(type) {
  return _calloutTypes.delete(type)
}

/**
 * Get all registered callout types.
 * @returns {CalloutType[]}
 */
export function getCalloutTypes() {
  return Array.from(_calloutTypes.values())
}

/**
 * Get a callout type definition by name.
 * @param {string} type
 * @returns {CalloutType|undefined}
 */
export function getCalloutType(type) {
  return _calloutTypes.get(type)
}

// ---------------------------------------------------------------------------
// GitHub-flavored alert mapping
// ---------------------------------------------------------------------------

/** Map GFM alert keywords to callout types */
const GFM_ALERT_MAP = {
  NOTE: 'note',
  TIP: 'tip',
  IMPORTANT: 'info',
  WARNING: 'warning',
  CAUTION: 'error',
}

/**
 * Detect GitHub-flavored alert syntax in a blockquote.
 * Pattern: `> [!NOTE]` or `> [!WARNING]` as the first line.
 * @param {string} text — the text content of a blockquote
 * @returns {{ type: string, body: string }|null}
 */
export function parseGFMAlert(text) {
  if (!text) return null
  const match = text.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*\n?([\s\S]*)/)
  if (!match) return null
  const keyword = match[1]
  const type = GFM_ALERT_MAP[keyword] || keyword.toLowerCase()
  return { type, body: match[2].trim() }
}

// ---------------------------------------------------------------------------
// DOM helpers
// ---------------------------------------------------------------------------

/**
 * Create a callout DOM element.
 * @param {string} type
 * @param {string} [content='']
 * @param {object} [options]
 * @param {boolean} [options.collapsible=false]
 * @param {boolean} [options.collapsed=false]
 * @param {string} [options.title]
 * @returns {HTMLDivElement}
 */
function createCalloutElement(type, content = '', options = {}) {
  const { collapsible = false, collapsed = false, title } = options
  const typeDef = _calloutTypes.get(type) || { type, label: type, icon: '📌', color: '#64748b' }

  const wrapper = document.createElement('div')
  wrapper.className = `rmx-callout rmx-callout-${type}`
  wrapper.setAttribute('data-callout', type)
  if (collapsible) {
    wrapper.setAttribute('data-callout-collapsible', '')
    if (collapsed) wrapper.setAttribute('data-callout-collapsed', '')
  }

  // Header
  const header = document.createElement('div')
  header.className = 'rmx-callout-header'
  header.contentEditable = 'false'

  const icon = document.createElement('span')
  icon.className = 'rmx-callout-icon'
  icon.textContent = typeDef.icon
  header.appendChild(icon)

  const titleEl = document.createElement('span')
  titleEl.className = 'rmx-callout-title'
  titleEl.textContent = title || typeDef.label
  header.appendChild(titleEl)

  if (collapsible) {
    const toggle = document.createElement('button')
    toggle.className = 'rmx-callout-toggle'
    toggle.type = 'button'
    toggle.setAttribute('aria-label', collapsed ? 'Expand' : 'Collapse')
    toggle.textContent = collapsed ? '▶' : '▼'
    header.appendChild(toggle)
  }

  wrapper.appendChild(header)

  // Body
  const body = document.createElement('div')
  body.className = 'rmx-callout-body'
  if (content) {
    body.innerHTML = content
  } else {
    const p = document.createElement('p')
    p.innerHTML = '<br>'
    body.appendChild(p)
  }
  if (collapsible && collapsed) {
    body.style.display = 'none'
  }
  wrapper.appendChild(body)

  return wrapper
}

// ---------------------------------------------------------------------------
// Plugin
// ---------------------------------------------------------------------------

export function CalloutPlugin() {
  let engine = null
  let observer = null
  let unsubContentChange = null

  function handleClick(e) {
    const toggle = e.target.closest?.('.rmx-callout-toggle')
    if (!toggle) return

    const callout = toggle.closest('.rmx-callout')
    if (!callout) return

    e.preventDefault()
    e.stopPropagation()

    const body = callout.querySelector('.rmx-callout-body')
    if (!body) return

    const isCollapsed = callout.hasAttribute('data-callout-collapsed')
    if (isCollapsed) {
      callout.removeAttribute('data-callout-collapsed')
      body.style.display = ''
      toggle.textContent = '▼'
      toggle.setAttribute('aria-label', 'Collapse')
    } else {
      callout.setAttribute('data-callout-collapsed', '')
      body.style.display = 'none'
      toggle.textContent = '▶'
      toggle.setAttribute('aria-label', 'Expand')
    }
  }

  /**
   * Auto-convert blockquotes with GFM alert syntax to callouts.
   */
  function scanForGFMAlerts() {
    if (!engine) return
    const blockquotes = engine.element.querySelectorAll('blockquote')
    for (const bq of blockquotes) {
      const text = bq.textContent
      const alert = parseGFMAlert(text)
      if (alert) {
        engine.history.snapshot()
        const callout = createCalloutElement(alert.type, `<p>${alert.body || '<br>'}</p>`)
        bq.parentNode.replaceChild(callout, bq)
        engine.eventBus.emit('content:change')
      }
    }
  }

  return createPlugin({
    name: 'callouts',
    requiresFullAccess: true,
    version: '1.0.0',
    description: 'Styled callout blocks with 7 built-in types, custom types, collapsible toggle, and GFM alert syntax',

    commands: [
      {
        name: 'insertCallout',
        execute(eng, params = {}) {
          const { type = 'info', content = '', collapsible = false, collapsed = false, title } = params
          eng.history.snapshot()

          const callout = createCalloutElement(type, content, { collapsible, collapsed, title })

          // Insert at current selection or append to editor
          const sel = window.getSelection()
          if (sel && sel.rangeCount > 0 && eng.element.contains(sel.anchorNode)) {
            const range = sel.getRangeAt(0)
            // Find the top-level block to insert after
            let block = range.startContainer
            while (block && block.parentNode !== eng.element) {
              block = block.parentNode
            }
            if (block) {
              block.parentNode.insertBefore(callout, block.nextSibling)
            } else {
              eng.element.appendChild(callout)
            }
          } else {
            eng.element.appendChild(callout)
          }

          // Place caret in the body
          const body = callout.querySelector('.rmx-callout-body p')
          if (body) {
            const r = document.createRange()
            r.selectNodeContents(body)
            r.collapse(true)
            sel?.removeAllRanges()
            sel?.addRange(r)
          }

          eng.eventBus.emit('content:change')
          return callout
        },
        meta: { icon: 'callout', tooltip: 'Insert Callout' },
      },
      {
        name: 'removeCallout',
        execute(eng) {
          const callout = eng.selection.getClosestElement?.('.rmx-callout')
            || findAncestor(eng, 'rmx-callout')
          if (!callout) return
          eng.history.snapshot()

          // Extract body content and replace the callout with it
          const body = callout.querySelector('.rmx-callout-body')
          const parent = callout.parentNode
          if (body) {
            while (body.firstChild) {
              parent.insertBefore(body.firstChild, callout)
            }
          }
          parent.removeChild(callout)
          parent.normalize()
          eng.eventBus.emit('content:change')
        },
        meta: { icon: 'remove', tooltip: 'Remove Callout' },
      },
      {
        name: 'changeCalloutType',
        execute(eng, newType) {
          const callout = findAncestor(eng, 'rmx-callout')
          if (!callout || !newType) return
          const typeDef = _calloutTypes.get(newType)
          if (!typeDef) return

          eng.history.snapshot()
          // Update class and data attribute
          const oldType = callout.getAttribute('data-callout')
          callout.classList.remove(`rmx-callout-${oldType}`)
          callout.classList.add(`rmx-callout-${newType}`)
          callout.setAttribute('data-callout', newType)

          // Update icon and title
          const icon = callout.querySelector('.rmx-callout-icon')
          const title = callout.querySelector('.rmx-callout-title')
          if (icon) icon.textContent = typeDef.icon
          if (title) title.textContent = typeDef.label

          eng.eventBus.emit('content:change')
        },
        meta: { icon: 'swap', tooltip: 'Change Callout Type' },
      },
      {
        name: 'toggleCalloutCollapse',
        execute(eng) {
          const callout = findAncestor(eng, 'rmx-callout')
          if (!callout) return

          const body = callout.querySelector('.rmx-callout-body')
          const toggle = callout.querySelector('.rmx-callout-toggle')
          if (!body) return

          if (!callout.hasAttribute('data-callout-collapsible')) {
            // Make it collapsible
            callout.setAttribute('data-callout-collapsible', '')
            if (!toggle) {
              const btn = document.createElement('button')
              btn.className = 'rmx-callout-toggle'
              btn.type = 'button'
              btn.textContent = '▼'
              btn.setAttribute('aria-label', 'Collapse')
              callout.querySelector('.rmx-callout-header')?.appendChild(btn)
            }
          } else {
            // Toggle collapsed state
            const isCollapsed = callout.hasAttribute('data-callout-collapsed')
            if (isCollapsed) {
              callout.removeAttribute('data-callout-collapsed')
              body.style.display = ''
              if (toggle) { toggle.textContent = '▼'; toggle.setAttribute('aria-label', 'Collapse') }
            } else {
              callout.setAttribute('data-callout-collapsed', '')
              body.style.display = 'none'
              if (toggle) { toggle.textContent = '▶'; toggle.setAttribute('aria-label', 'Expand') }
            }
          }

          eng.eventBus.emit('content:change')
        },
        meta: { icon: 'collapse', tooltip: 'Toggle Callout Collapse' },
      },
    ],

    contextMenuItems: [
      {
        label: 'Insert Callout',
        command: 'insertCallout',
      },
      {
        label: 'Remove Callout',
        command: 'removeCallout',
        when: (eng) => !!findAncestor(eng, 'rmx-callout'),
      },
    ],

    init(eng) {
      engine = eng

      // Expose API on engine
      engine._callouts = {
        getCalloutTypes,
        getCalloutType,
        registerCalloutType,
        unregisterCalloutType,
        parseGFMAlert,
      }

      // Click handler for collapse toggles
      engine.element.addEventListener('click', handleClick)

      // Scan for GFM alerts on content change (debounced)
      let debounceTimer = null
      unsubContentChange = engine.eventBus.on('content:change', () => {
        clearTimeout(debounceTimer)
        debounceTimer = setTimeout(scanForGFMAlerts, 300)
      })

      // Initial scan
      scanForGFMAlerts()

      // Watch for pasted/inserted callout content
      observer = new MutationObserver(() => {
        // Ensure callout bodies remain editable
        const bodies = engine.element.querySelectorAll('.rmx-callout-body')
        for (const body of bodies) {
          if (!body.hasAttribute('contenteditable')) {
            // Body should be editable (inherits from editor)
          }
        }
      })
      observer.observe(engine.element, { childList: true, subtree: true })
    },

    destroy() {
      observer?.disconnect()
      observer = null
      unsubContentChange?.()
      engine?.element?.removeEventListener('click', handleClick)
      engine = null
    },
  })
}

/**
 * Find the closest ancestor with a given class from the current selection.
 * @param {object} eng
 * @param {string} className
 * @returns {HTMLElement|null}
 */
function findAncestor(eng, className) {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return null
  let node = sel.anchorNode
  if (node.nodeType === 3) node = node.parentNode
  while (node && node !== eng.element) {
    if (node.classList?.contains(className)) return node
    node = node.parentNode
  }
  return null
}
