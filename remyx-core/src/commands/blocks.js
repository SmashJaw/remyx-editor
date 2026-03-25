/** Block-level tags considered top-level blocks */
const BLOCK_TAGS = new Set([
  'P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
  'BLOCKQUOTE', 'PRE', 'UL', 'OL', 'TABLE', 'HR', 'DIV', 'DETAILS',
])

/**
 * Get the focused top-level block element (direct child of editor root).
 * @param {object} eng - Editor engine
 * @returns {HTMLElement|null}
 */
function getTopLevelBlock(eng) {
  const block = eng.selection.getParentBlock()
  if (!block) return null
  let el = block
  while (el && el.parentElement !== eng.element) {
    el = el.parentElement
  }
  return (el && BLOCK_TAGS.has(el.tagName)) ? el : null
}

/**
 * Ensure the editor always has at least one empty paragraph.
 * @param {object} eng - Editor engine
 */
function ensureMinimumContent(eng) {
  if (eng.element.children.length === 0) {
    const p = document.createElement('p')
    p.innerHTML = '<br>'
    eng.element.appendChild(p)
    const range = document.createRange()
    range.selectNodeContents(p)
    range.collapse(true)
    eng.selection.setRange(range)
  }
}

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

  // ── Block Operations ────────────────────────────────────────────────

  engine.commands.register('moveBlockUp', {
    execute(eng) {
      const block = getTopLevelBlock(eng)
      if (!block || !block.previousElementSibling) return
      eng.history.snapshot()
      block.parentNode.insertBefore(block, block.previousElementSibling)
      eng.eventBus.emit('content:change')
    },
    meta: { tooltip: 'Move Block Up' },
  })

  engine.commands.register('moveBlockDown', {
    execute(eng) {
      const block = getTopLevelBlock(eng)
      if (!block || !block.nextElementSibling) return
      eng.history.snapshot()
      block.parentNode.insertBefore(block, block.nextElementSibling.nextSibling)
      eng.eventBus.emit('content:change')
    },
    meta: { tooltip: 'Move Block Down' },
  })

  engine.commands.register('duplicateBlock', {
    execute(eng) {
      const block = getTopLevelBlock(eng)
      if (!block) return
      eng.history.snapshot()
      const clone = block.cloneNode(true)
      block.parentNode.insertBefore(clone, block.nextSibling)
      // Place cursor in the cloned block
      const range = document.createRange()
      range.selectNodeContents(clone)
      range.collapse(false)
      eng.selection.setRange(range)
      eng.eventBus.emit('content:change')
    },
    meta: { tooltip: 'Duplicate Block' },
  })

  engine.commands.register('deleteBlock', {
    execute(eng) {
      const block = getTopLevelBlock(eng)
      if (!block) return
      eng.history.snapshot()
      // Determine where to place cursor after deletion
      const next = block.nextElementSibling
      const prev = block.previousElementSibling
      block.parentNode.removeChild(block)
      ensureMinimumContent(eng)
      // Move cursor to adjacent block if available
      const target = next || prev || eng.element.firstElementChild
      if (target) {
        const range = document.createRange()
        range.selectNodeContents(target)
        range.collapse(true)
        eng.selection.setRange(range)
      }
      eng.eventBus.emit('content:change')
    },
    meta: { tooltip: 'Delete Block' },
  })

  engine.commands.register('selectBlocks', {
    execute(eng, { blocks } = {}) {
      if (!blocks || !Array.isArray(blocks)) return
      blocks.forEach((el) => {
        if (el && el.classList) {
          el.classList.add('rmx-block-selected')
        }
      })
    },
    meta: { tooltip: 'Select Blocks' },
  })

  engine.commands.register('clearBlockSelection', {
    execute(eng) {
      const selected = eng.element.querySelectorAll('.rmx-block-selected')
      selected.forEach((el) => el.classList.remove('rmx-block-selected'))
    },
    meta: { tooltip: 'Clear Block Selection' },
  })

  // ── Nested Blocks: Collapsible Sections ─────────────────────────────

  engine.commands.register('toggleCollapse', {
    execute(eng) {
      const block = getTopLevelBlock(eng)
      if (!block) return
      eng.history.snapshot()

      if (block.tagName === 'DETAILS') {
        // Unwrap: move children out of details, remove the summary
        const parent = block.parentNode
        const summary = block.querySelector('summary')
        // Move all children except summary before the details element
        const children = Array.from(block.childNodes).filter((n) => n !== summary)
        children.forEach((child) => parent.insertBefore(child, block))
        parent.removeChild(block)
      } else {
        // Wrap in <details><summary>
        const details = document.createElement('details')
        details.className = 'rmx-collapsible'
        details.setAttribute('open', '')
        const summary = document.createElement('summary')
        summary.textContent = block.textContent.slice(0, 50) || 'Section'
        block.parentNode.replaceChild(details, block)
        details.appendChild(summary)
        details.appendChild(block)
      }
      eng.eventBus.emit('content:change')
    },
    meta: { tooltip: 'Toggle Collapsible Section' },
  })

  // ── Block Grouping ──────────────────────────────────────────────────

  engine.commands.register('groupBlocks', {
    execute(eng) {
      const selected = Array.from(eng.element.querySelectorAll('.rmx-block-selected'))
      if (selected.length === 0) return
      eng.history.snapshot()

      const group = document.createElement('div')
      group.className = 'rmx-block-group'

      // Insert group before the first selected block
      selected[0].parentNode.insertBefore(group, selected[0])

      // Move all selected blocks into the group
      selected.forEach((el) => {
        el.classList.remove('rmx-block-selected')
        group.appendChild(el)
      })

      eng.eventBus.emit('content:change')
    },
    meta: { tooltip: 'Group Selected Blocks' },
  })

  engine.commands.register('ungroupBlocks', {
    execute(eng) {
      const block = getTopLevelBlock(eng)
      if (!block) return

      // Find the closest group div
      let group = block
      if (!group.classList.contains('rmx-block-group')) {
        group = block.closest('.rmx-block-group')
      }
      if (!group || !group.classList.contains('rmx-block-group')) return

      eng.history.snapshot()
      const parent = group.parentNode
      while (group.firstChild) {
        parent.insertBefore(group.firstChild, group)
      }
      parent.removeChild(group)
      eng.eventBus.emit('content:change')
    },
    meta: { tooltip: 'Ungroup Blocks' },
  })

  engine.commands.register('moveGroup', {
    execute(eng, { direction } = {}) {
      const block = getTopLevelBlock(eng)
      if (!block) return
      let group = block.classList.contains('rmx-block-group')
        ? block
        : block.closest('.rmx-block-group')
      if (!group || !group.classList.contains('rmx-block-group')) return
      // Ensure group is a direct child of editor
      while (group.parentElement !== eng.element) {
        group = group.parentElement
        if (!group) return
      }

      eng.history.snapshot()
      if (direction === 'up' && group.previousElementSibling) {
        group.parentNode.insertBefore(group, group.previousElementSibling)
      } else if (direction === 'down' && group.nextElementSibling) {
        group.parentNode.insertBefore(group, group.nextElementSibling.nextSibling)
      }
      eng.eventBus.emit('content:change')
    },
    meta: { tooltip: 'Move Group' },
  })

  engine.commands.register('duplicateGroup', {
    execute(eng) {
      const block = getTopLevelBlock(eng)
      if (!block) return
      let group = block.classList.contains('rmx-block-group')
        ? block
        : block.closest('.rmx-block-group')
      if (!group || !group.classList.contains('rmx-block-group')) return
      // Ensure group is a direct child of editor
      while (group.parentElement !== eng.element) {
        group = group.parentElement
        if (!group) return
      }

      eng.history.snapshot()
      const clone = group.cloneNode(true)
      group.parentNode.insertBefore(clone, group.nextSibling)
      eng.eventBus.emit('content:change')
    },
    meta: { tooltip: 'Duplicate Group' },
  })
}
