/**
 * KeyboardPlugin — Keyboard-first editing enhancements.
 *
 * - Vim-style keybinding mode (normal, insert, visual)
 * - Emacs keybinding preset
 * - Custom keybinding map
 * - Multi-cursor editing (Cmd+D, Alt+Click)
 * - Smart bracket/quote auto-pairing
 * - Jump-to-heading navigation
 *
 * @param {object} [options]
 * @param {'default'|'vim'|'emacs'} [options.mode='default']
 * @param {Object} [options.keyBindings] — custom keybinding overrides
 * @param {boolean} [options.autoPair=true] — auto-pair brackets/quotes
 * @param {boolean} [options.jumpToHeading=true] — enable Cmd+Shift+G heading nav
 */

import { createPlugin } from '@remyxjs/core'

// ---------------------------------------------------------------------------
// Auto-pairing rules
// ---------------------------------------------------------------------------

const PAIR_MAP = {
  '(': ')',
  '[': ']',
  '{': '}',
}

const CLOSE_CHARS = new Set(Object.values(PAIR_MAP))

// ---------------------------------------------------------------------------
// Vim mode state
// ---------------------------------------------------------------------------

const VIM_MODES = { NORMAL: 'normal', INSERT: 'insert', VISUAL: 'visual' }

function createVimState() {
  return {
    mode: VIM_MODES.NORMAL,
    pending: '', // partial command buffer (e.g., 'd' waiting for motion)
  }
}

// ---------------------------------------------------------------------------
// Emacs keybinding map
// ---------------------------------------------------------------------------

const EMACS_BINDINGS = {
  'ctrl+a': 'moveToLineStart',
  'ctrl+e': 'moveToLineEnd',
  'ctrl+k': 'killToLineEnd',
  'ctrl+y': 'yank',
  'ctrl+w': 'killWord',
  'ctrl+f': 'moveForward',
  'ctrl+b': 'moveBackward',
  'ctrl+n': 'moveDown',
  'ctrl+p': 'moveUp',
  'ctrl+d': 'deleteForward',
  'ctrl+h': 'deleteBackward',
  'ctrl+space': 'setMark',
}

// ---------------------------------------------------------------------------
// Heading navigation
// ---------------------------------------------------------------------------

/**
 * Get all headings in the editor.
 * @param {HTMLElement} editorEl
 * @returns {Array<{ level: number, text: string, element: HTMLElement }>}
 */
export function getHeadings(editorEl) {
  const headings = editorEl.querySelectorAll('h1, h2, h3, h4, h5, h6')
  return Array.from(headings).map(el => ({
    level: parseInt(el.tagName.charAt(1), 10),
    text: el.textContent,
    element: el,
  }))
}

/**
 * Jump to a heading by index.
 * @param {HTMLElement} editorEl
 * @param {number} index
 */
function jumpToHeading(editorEl, index) {
  const headings = getHeadings(editorEl)
  if (index < 0 || index >= headings.length) return
  const heading = headings[index]
  heading.element.scrollIntoView?.({ behavior: 'smooth', block: 'center' })
  const sel = window.getSelection()
  const range = document.createRange()
  range.selectNodeContents(heading.element)
  range.collapse(true)
  sel.removeAllRanges()
  sel.addRange(range)
}

// ---------------------------------------------------------------------------
// Multi-cursor (simplified — tracks selections)
// ---------------------------------------------------------------------------

/**
 * Find the next occurrence of the selected text and add it to the selection.
 * Uses window.find() or manual search.
 * @param {HTMLElement} editorEl
 * @returns {number} number of current selections
 */
export function selectNextOccurrence(editorEl) {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return 0
  const text = sel.toString()
  if (!text) return 0

  // Find next occurrence after current selection
  const range = sel.getRangeAt(sel.rangeCount - 1)
  const searchFrom = range.endOffset
  const content = editorEl.textContent
  const after = content.indexOf(text, content.indexOf(text, searchFrom) === -1 ? 0 : searchFrom + 1)

  if (after === -1) return sel.rangeCount

  // Walk the DOM to find the text node at the target offset
  const walker = document.createTreeWalker(editorEl, NodeFilter.SHOW_TEXT)
  let offset = 0
  while (walker.nextNode()) {
    const node = walker.currentNode
    const nodeLen = node.textContent.length
    if (offset + nodeLen > after) {
      const localOffset = after - offset
      const newRange = document.createRange()
      newRange.setStart(node, localOffset)
      newRange.setEnd(node, Math.min(localOffset + text.length, nodeLen))
      sel.addRange(newRange)
      break
    }
    offset += nodeLen
  }

  return sel.rangeCount
}

// ---------------------------------------------------------------------------
// Plugin
// ---------------------------------------------------------------------------

export function KeyboardPlugin(options = {}) {
  const {
    mode = 'default',
    keyBindings = {},
    autoPair = true,
    jumpToHeading: enableJumpToHeading = true,
  } = options

  let engine = null
  let vimState = null
  let killRing = '' // Emacs kill ring (most recent kill)

  function handleKeyDown(e) {
    if (!engine) return

    // Vim mode handling
    if (mode === 'vim' && vimState) {
      handleVimKey(e)
      return
    }

    // Emacs mode handling
    if (mode === 'emacs') {
      handleEmacsKey(e)
      // Don't return — fall through for auto-pair
    }

    // Custom keybindings
    const combo = buildCombo(e)
    if (keyBindings[combo]) {
      e.preventDefault()
      const action = keyBindings[combo]
      if (typeof action === 'function') {
        action(engine)
      } else if (typeof action === 'string') {
        engine.executeCommand(action)
      }
      return
    }

    // Auto-pair brackets/quotes
    if (autoPair && mode !== 'vim') {
      handleAutoPair(e)
    }

    // Jump-to-heading: Cmd/Ctrl+Shift+G
    if (enableJumpToHeading) {
      const mod = e.metaKey || e.ctrlKey
      if (mod && e.shiftKey && e.key === 'g') {
        e.preventDefault()
        engine.eventBus.emit('keyboard:jumpToHeading')
        return
      }
    }

    // Multi-cursor: Cmd+D / Ctrl+D
    if ((e.metaKey || e.ctrlKey) && e.key === 'd' && !e.shiftKey) {
      e.preventDefault()
      selectNextOccurrence(engine.element)
      return
    }
  }

  function handleAutoPair(e) {
    if (e.key.length !== 1 || e.metaKey || e.ctrlKey || e.altKey) return

    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) return
    const range = sel.getRangeAt(0)

    // Opening bracket/quote
    if (PAIR_MAP[e.key]) {
      const closer = PAIR_MAP[e.key]

      // If text is selected, wrap it
      if (!range.collapsed) {
        e.preventDefault()
        const selected = range.toString()
        range.deleteContents()
        range.insertNode(document.createTextNode(e.key + selected + closer))
        return
      }

      // Otherwise insert pair and place caret between
      e.preventDefault()
      const text = document.createTextNode(e.key + closer)
      range.insertNode(text)
      range.setStart(text, 1)
      range.setEnd(text, 1)
      sel.removeAllRanges()
      sel.addRange(range)
      engine.eventBus.emit('content:change')
      return
    }

    // Skip over closing bracket if it's already the next char
    if (CLOSE_CHARS.has(e.key) && range.collapsed) {
      const node = range.startContainer
      if (node.nodeType === 3 && node.textContent.charAt(range.startOffset) === e.key) {
        e.preventDefault()
        range.setStart(node, range.startOffset + 1)
        range.collapse(true)
        sel.removeAllRanges()
        sel.addRange(range)
        return
      }
    }
  }

  function handleVimKey(e) {
    if (vimState.mode === VIM_MODES.INSERT) {
      // Escape returns to normal mode
      if (e.key === 'Escape') {
        e.preventDefault()
        vimState.mode = VIM_MODES.NORMAL
        engine.element.classList.remove('rmx-vim-insert')
        engine.element.classList.add('rmx-vim-normal')
        engine.eventBus.emit('vim:modeChange', { mode: VIM_MODES.NORMAL })
        return
      }
      // In insert mode, allow normal typing + auto-pair
      if (autoPair) handleAutoPair(e)
      return
    }

    // Normal mode
    e.preventDefault()
    const sel = window.getSelection()

    switch (e.key) {
      case 'i': // enter insert mode
        vimState.mode = VIM_MODES.INSERT
        engine.element.classList.remove('rmx-vim-normal')
        engine.element.classList.add('rmx-vim-insert')
        engine.eventBus.emit('vim:modeChange', { mode: VIM_MODES.INSERT })
        break
      case 'a': // append (insert after cursor)
        vimState.mode = VIM_MODES.INSERT
        if (sel && sel.rangeCount > 0) {
          const r = sel.getRangeAt(0)
          r.collapse(false)
        }
        engine.element.classList.remove('rmx-vim-normal')
        engine.element.classList.add('rmx-vim-insert')
        engine.eventBus.emit('vim:modeChange', { mode: VIM_MODES.INSERT })
        break
      case 'v': // visual mode
        vimState.mode = VIM_MODES.VISUAL
        engine.element.classList.add('rmx-vim-visual')
        engine.eventBus.emit('vim:modeChange', { mode: VIM_MODES.VISUAL })
        break
      case 'Escape':
        if (vimState.mode === VIM_MODES.VISUAL) {
          vimState.mode = VIM_MODES.NORMAL
          engine.element.classList.remove('rmx-vim-visual')
          sel?.collapseToStart()
          engine.eventBus.emit('vim:modeChange', { mode: VIM_MODES.NORMAL })
        }
        break
      case 'h': engine.selection.moveVisual('left', false, 'character'); break
      case 'l': engine.selection.moveVisual('right', false, 'character'); break
      case 'j': sel?.modify('move', 'forward', 'line'); break
      case 'k': sel?.modify('move', 'backward', 'line'); break
      case 'w': engine.selection.moveVisual('right', false, 'word'); break
      case 'b': engine.selection.moveVisual('left', false, 'word'); break
      case '0': engine.selection.moveVisual('left', false, 'lineboundary'); break
      case '$': engine.selection.moveVisual('right', false, 'lineboundary'); break
      case 'G': // go to end
        if (sel && engine.element.lastChild) {
          const r = document.createRange()
          r.selectNodeContents(engine.element.lastChild)
          r.collapse(false)
          sel.removeAllRanges()
          sel.addRange(r)
        }
        break
      case 'u': // undo
        engine.executeCommand('undo')
        break
      case 'x': // delete character
        engine.history.snapshot()
        document.execCommand('delete')
        break
      case 'd':
        if (vimState.pending === 'd') { // dd = delete line
          vimState.pending = ''
          engine.history.snapshot()
          const block = engine.selection?.getParentBlock?.()
          if (block) block.remove()
          engine.eventBus.emit('content:change')
        } else {
          vimState.pending = 'd'
        }
        break
      case 'o': // open line below
        engine.history.snapshot()
        {
          const block = engine.selection?.getParentBlock?.() || engine.element.lastChild
          const p = document.createElement('p')
          p.innerHTML = '<br>'
          block?.after(p)
          const r = document.createRange()
          r.selectNodeContents(p)
          r.collapse(true)
          sel?.removeAllRanges()
          sel?.addRange(r)
        }
        vimState.mode = VIM_MODES.INSERT
        engine.element.classList.remove('rmx-vim-normal')
        engine.element.classList.add('rmx-vim-insert')
        engine.eventBus.emit('vim:modeChange', { mode: VIM_MODES.INSERT })
        engine.eventBus.emit('content:change')
        break
      default:
        vimState.pending = ''
        break
    }
  }

  function handleEmacsKey(e) {
    if (!e.ctrlKey) return
    const combo = `ctrl+${e.key}`
    const action = EMACS_BINDINGS[combo]
    if (!action) return

    e.preventDefault()
    const sel = window.getSelection()
    const range = sel?.rangeCount > 0 ? sel.getRangeAt(0) : null

    switch (action) {
      case 'moveToLineStart': engine.selection.moveVisual('left', false, 'lineboundary'); break
      case 'moveToLineEnd': engine.selection.moveVisual('right', false, 'lineboundary'); break
      case 'moveForward': engine.selection.moveVisual('right', false, 'character'); break
      case 'moveBackward': engine.selection.moveVisual('left', false, 'character'); break
      case 'moveDown': sel?.modify('move', 'forward', 'line'); break
      case 'moveUp': sel?.modify('move', 'backward', 'line'); break
      case 'deleteForward': document.execCommand('forwardDelete'); break
      case 'deleteBackward': document.execCommand('delete'); break
      case 'killToLineEnd':
        if (range) {
          engine.history.snapshot()
          // Use BiDi-aware moveVisual to extend to line end in the
          // correct visual direction for both LTR and RTL blocks
          engine.selection.moveVisual('right', true, 'lineboundary')
          killRing = sel.toString()
          range.deleteContents()
          engine.eventBus.emit('content:change')
        }
        break
      case 'yank':
        if (killRing && range) {
          engine.history.snapshot()
          range.insertNode(document.createTextNode(killRing))
          range.collapse(false)
          engine.eventBus.emit('content:change')
        }
        break
      case 'killWord':
        if (range) {
          engine.history.snapshot()
          // Use BiDi-aware moveVisual for backward word selection
          engine.selection.moveVisual('left', true, 'word')
          killRing = sel.toString()
          range.deleteContents()
          engine.eventBus.emit('content:change')
        }
        break
      case 'setMark':
        // Mark is the current position — in browser, start of selection
        break
    }
  }

  function buildCombo(e) {
    const parts = []
    if (e.ctrlKey) parts.push('ctrl')
    if (e.metaKey) parts.push('cmd')
    if (e.altKey) parts.push('alt')
    if (e.shiftKey) parts.push('shift')
    if (e.key.length === 1) parts.push(e.key.toLowerCase())
    else parts.push(e.key)
    return parts.join('+')
  }

  return createPlugin({
    name: 'keyboard',
    requiresFullAccess: true,
    version: '1.0.0',
    description: 'Vim/Emacs modes, auto-pairing, multi-cursor, jump-to-heading',

    commands: [
      {
        name: 'setKeyboardMode',
        execute(eng, newMode) {
          if (newMode === 'vim') {
            vimState = createVimState()
            eng.element.classList.add('rmx-vim-normal')
            eng.eventBus.emit('vim:modeChange', { mode: VIM_MODES.NORMAL })
          } else {
            vimState = null
            eng.element.classList.remove('rmx-vim-normal', 'rmx-vim-insert', 'rmx-vim-visual')
          }
          eng.eventBus.emit('keyboard:modeChange', { mode: newMode })
        },
        meta: { tooltip: 'Set Keyboard Mode' },
      },
      {
        name: 'getVimMode',
        execute() { return vimState?.mode || null },
        meta: { tooltip: 'Get Vim Mode' },
      },
      {
        name: 'jumpToHeading',
        execute(eng, index) { jumpToHeading(eng.element, index) },
        meta: { icon: 'heading', tooltip: 'Jump to Heading' },
      },
      {
        name: 'getHeadings',
        execute(eng) { return getHeadings(eng.element) },
        meta: { tooltip: 'Get Headings' },
      },
      {
        name: 'selectNextOccurrence',
        execute(eng) { return selectNextOccurrence(eng.element) },
        shortcut: 'mod+d',
        meta: { tooltip: 'Select Next Occurrence' },
      },
    ],

    init(eng) {
      engine = eng

      if (mode === 'vim') {
        vimState = createVimState()
        engine.element.classList.add('rmx-vim-normal')
      }

      engine.element.addEventListener('keydown', handleKeyDown, true)

      engine._keyboard = {
        getHeadings: () => getHeadings(engine.element),
        getVimMode: () => vimState?.mode || null,
        selectNextOccurrence: () => selectNextOccurrence(engine.element),
      }
    },

    destroy() {
      engine?.element?.removeEventListener('keydown', handleKeyDown, true)
      engine?.element?.classList.remove('rmx-vim-normal', 'rmx-vim-insert', 'rmx-vim-visual')
      vimState = null
      engine = null
    },
  })
}
