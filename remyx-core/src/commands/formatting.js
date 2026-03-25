/**
 * CSP-compatible inline formatting commands.
 *
 * All commands use Selection/Range-based DOM manipulation instead of the
 * deprecated `document.execCommand()` API. This eliminates CSP violations
 * from `unsafe-inline` requirements and ensures forward compatibility.
 */

/**
 * Toggle an inline tag (e.g., <strong>, <em>) on the current selection.
 * If the selection is already wrapped in the tag, remove it. Otherwise wrap it.
 */
function toggleInlineTag(engine, tagName) {
  const sel = engine.selection.getSelection()
  if (!sel || sel.rangeCount === 0) return

  const range = sel.getRangeAt(0)
  if (range.collapsed) return

  // Check if already wrapped in this tag
  const parent = engine.selection.getParentElement()
  if (parent && parent.tagName === tagName.toUpperCase()) {
    // Unwrap: move children out and remove the tag
    const docFrag = document.createDocumentFragment()
    while (parent.firstChild) {
      docFrag.appendChild(parent.firstChild)
    }
    parent.parentNode.replaceChild(docFrag, parent)
    return
  }

  // Also check if selection is inside a nested instance
  let ancestor = parent
  while (ancestor && ancestor !== engine.element) {
    if (ancestor.tagName === tagName.toUpperCase()) {
      const docFrag = document.createDocumentFragment()
      while (ancestor.firstChild) {
        docFrag.appendChild(ancestor.firstChild)
      }
      ancestor.parentNode.replaceChild(docFrag, ancestor)
      return
    }
    ancestor = ancestor.parentNode
  }

  // Wrap selection in the tag
  const wrapper = document.createElement(tagName)
  try {
    range.surroundContents(wrapper)
  } catch {
    const fragment = range.extractContents()
    wrapper.appendChild(fragment)
    range.insertNode(wrapper)
  }
}

/**
 * Check if the selection is currently inside a given tag.
 */
function isInsideTag(engine, tagName) {
  const parent = engine.selection.getParentElement()
  if (!parent) return false
  let el = parent
  while (el && el !== engine.element) {
    if (el.tagName === tagName.toUpperCase()) return true
    el = el.parentNode
  }
  return false
}

export function registerFormattingCommands(engine) {
  engine.commands.register('bold', {
    execute(eng) { toggleInlineTag(eng, 'strong') },
    isActive(eng) { return isInsideTag(eng, 'STRONG') || isInsideTag(eng, 'B') },
    shortcut: 'mod+b',
    meta: { icon: 'bold', tooltip: 'Bold' },
  })

  engine.commands.register('italic', {
    execute(eng) { toggleInlineTag(eng, 'em') },
    isActive(eng) { return isInsideTag(eng, 'EM') || isInsideTag(eng, 'I') },
    shortcut: 'mod+i',
    meta: { icon: 'italic', tooltip: 'Italic' },
  })

  engine.commands.register('underline', {
    execute(eng) { toggleInlineTag(eng, 'u') },
    isActive(eng) { return isInsideTag(eng, 'U') },
    shortcut: 'mod+u',
    meta: { icon: 'underline', tooltip: 'Underline' },
  })

  engine.commands.register('strikethrough', {
    execute(eng) { toggleInlineTag(eng, 's') },
    isActive(eng) { return isInsideTag(eng, 'S') || isInsideTag(eng, 'DEL') },
    shortcut: 'mod+shift+x',
    meta: { icon: 'strikethrough', tooltip: 'Strikethrough' },
  })

  engine.commands.register('subscript', {
    execute(eng) { toggleInlineTag(eng, 'sub') },
    isActive(eng) { return isInsideTag(eng, 'SUB') },
    shortcut: 'mod+,',
    alternateShortcuts: ['mod+shift+,'],
    meta: { icon: 'subscript', tooltip: 'Subscript' },
  })

  engine.commands.register('superscript', {
    execute(eng) { toggleInlineTag(eng, 'sup') },
    isActive(eng) { return isInsideTag(eng, 'SUP') },
    shortcut: 'mod+.',
    alternateShortcuts: ['mod+shift+.'],
    meta: { icon: 'superscript', tooltip: 'Superscript' },
  })

  engine.commands.register('highlight', {
    execute(eng, { color = 'yellow' } = {}) {
      const sel = eng.selection.getSelection()
      if (!sel || sel.rangeCount === 0) return
      const range = sel.getRangeAt(0)
      if (range.collapsed) return

      // Check if already inside a <mark> — toggle off
      const parent = eng.selection.getParentElement()
      let ancestor = parent
      while (ancestor && ancestor !== eng.element) {
        if (ancestor.tagName === 'MARK') {
          const docFrag = document.createDocumentFragment()
          while (ancestor.firstChild) {
            docFrag.appendChild(ancestor.firstChild)
          }
          ancestor.parentNode.replaceChild(docFrag, ancestor)
          return
        }
        ancestor = ancestor.parentNode
      }

      // Wrap in <mark> with the specified background color
      const colorMap = {
        yellow: 'rgba(255, 235, 59, 0.4)',
        green: 'rgba(76, 175, 80, 0.3)',
        blue: 'rgba(33, 150, 243, 0.3)',
        pink: 'rgba(233, 30, 99, 0.3)',
        orange: 'rgba(255, 152, 0, 0.3)',
        purple: 'rgba(156, 39, 176, 0.3)',
      }
      const bg = colorMap[color] || colorMap.yellow
      const mark = document.createElement('mark')
      mark.style.backgroundColor = bg
      mark.setAttribute('data-highlight-color', color)
      try {
        range.surroundContents(mark)
      } catch {
        const fragment = range.extractContents()
        mark.appendChild(fragment)
        range.insertNode(mark)
      }
    },
    isActive(eng) { return isInsideTag(eng, 'MARK') },
    meta: { icon: 'highlight', tooltip: 'Highlight' },
  })

  engine.commands.register('removeFormat', {
    execute(eng) {
      const sel = eng.selection.getSelection()
      if (!sel || sel.rangeCount === 0) return
      const range = sel.getRangeAt(0)
      if (range.collapsed) return

      // Walk the selection and remove all inline formatting tags
      const inlineTags = new Set(['STRONG', 'B', 'EM', 'I', 'U', 'S', 'DEL', 'SUB', 'SUP', 'MARK', 'SPAN'])
      const container = range.commonAncestorContainer
      const root = container.nodeType === Node.TEXT_NODE ? container.parentElement : container

      const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT)
      const toUnwrap = []
      let node
      while ((node = walker.nextNode())) {
        if (inlineTags.has(node.tagName) && range.intersectsNode(node)) {
          toUnwrap.push(node)
        }
      }

      // Unwrap in reverse order to avoid DOM mutation issues
      for (let i = toUnwrap.length - 1; i >= 0; i--) {
        const el = toUnwrap[i]
        const parent = el.parentNode
        while (el.firstChild) {
          parent.insertBefore(el.firstChild, el)
        }
        parent.removeChild(el)
      }
    },
    shortcut: 'mod+\\',
    meta: { icon: 'removeFormat', tooltip: 'Remove Formatting' },
  })
}
