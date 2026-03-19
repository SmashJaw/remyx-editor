/**
 * CSP-compatible block-level commands using Range-based DOM manipulation.
 */
export function registerBlockCommands(engine) {
  engine.commands.register('blockquote', {
    execute(eng) {
      const existing = eng.selection.getClosestElement('blockquote')
      if (existing) {
        // Toggle off: unwrap blockquote
        const parent = existing.parentNode
        while (existing.firstChild) {
          parent.insertBefore(existing.firstChild, existing)
        }
        parent.removeChild(existing)
      } else {
        // Wrap current block in <blockquote>
        const block = eng.selection.getParentBlock()
        if (!block) return
        const bq = document.createElement('blockquote')
        block.parentNode.replaceChild(bq, block)
        bq.appendChild(block)
      }
    },
    isActive(eng) {
      return !!eng.selection.getClosestElement('blockquote')
    },
    shortcut: 'mod+shift+9',
    meta: { icon: 'blockquote', tooltip: 'Blockquote' },
  })

  engine.commands.register('codeBlock', {
    execute(eng, { language } = {}) {
      const existing = eng.selection.getClosestElement('pre')
      if (existing) {
        // Toggle off: unwrap pre/code
        const text = existing.textContent
        const p = document.createElement('p')
        p.textContent = text
        existing.parentNode.replaceChild(p, existing)
        // Move cursor into the new paragraph
        const range = document.createRange()
        range.selectNodeContents(p)
        range.collapse(false)
        eng.selection.setRange(range)
      } else {
        const range = eng.selection.getRange()
        if (!range) return
        const text = range.collapsed ? '\n' : range.toString()
        const pre = document.createElement('pre')
        const code = document.createElement('code')
        code.textContent = text
        if (language) {
          code.setAttribute('data-language', language)
          pre.setAttribute('data-language', language)
        }
        pre.appendChild(code)

        if (!range.collapsed) {
          range.deleteContents()
        }
        range.insertNode(pre)

        // Add paragraph after if needed
        if (!pre.nextSibling) {
          const p = document.createElement('p')
          p.innerHTML = '<br>'
          pre.parentNode.insertBefore(p, pre.nextSibling)
        }

        const newRange = document.createRange()
        newRange.selectNodeContents(code)
        newRange.collapse(false)
        eng.selection.setRange(newRange)

        // Emit event so the syntax highlight plugin can pick it up
        eng.eventBus.emit('codeblock:created', { element: pre, language })
      }
    },
    isActive(eng) {
      return !!eng.selection.getClosestElement('pre')
    },
    shortcut: 'mod+shift+c',
    meta: { icon: 'codeBlock', tooltip: 'Code Block' },
  })

  engine.commands.register('horizontalRule', {
    execute(eng) {
      const range = eng.selection.getRange()
      if (!range) return

      const hr = document.createElement('hr')
      range.deleteContents()
      range.insertNode(hr)

      // Add a paragraph after the hr for continued editing
      if (!hr.nextSibling || hr.nextSibling.tagName !== 'P') {
        const p = document.createElement('p')
        p.innerHTML = '<br>'
        hr.parentNode.insertBefore(p, hr.nextSibling)
      }

      // Move cursor after the hr
      const newRange = document.createRange()
      newRange.setStartAfter(hr)
      newRange.collapse(true)
      eng.selection.setRange(newRange)
    },
    meta: { icon: 'horizontalRule', tooltip: 'Horizontal Rule' },
  })
}
