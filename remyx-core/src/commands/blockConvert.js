/**
 * Block type conversion commands.
 * Converts block-level elements between types (paragraph, headings, blockquote, code block, lists)
 * while preserving text content.
 */

/** Map of conversion target names to their corresponding tag info */
const BLOCK_TYPE_MAP = {
  paragraph: { tag: 'P' },
  heading1: { tag: 'H1' },
  heading2: { tag: 'H2' },
  heading3: { tag: 'H3' },
  heading4: { tag: 'H4' },
  heading5: { tag: 'H5' },
  heading6: { tag: 'H6' },
  blockquote: { tag: 'BLOCKQUOTE' },
  codeBlock: { tag: 'PRE' },
  unorderedList: { tag: 'UL' },
  orderedList: { tag: 'OL' },
}

/**
 * Get the focused block element in the editor.
 * @param {object} eng - Editor engine
 * @returns {HTMLElement|null}
 */
function getFocusedBlock(eng) {
  const block = eng.selection.getParentBlock()
  if (!block) return null
  // Walk up to find the direct child of the editor element
  let el = block
  while (el && el.parentElement !== eng.element) {
    el = el.parentElement
  }
  return el || null
}

/**
 * Extract the inner text/HTML content from a block, stripping wrappers.
 * For lists, extracts LI contents. For pre>code, extracts text.
 * @param {HTMLElement} block
 * @returns {string} innerHTML suitable for insertion into a new block
 */
function extractBlockContent(block) {
  const tag = block.tagName

  if (tag === 'UL' || tag === 'OL') {
    // Collect text from all list items
    const items = Array.from(block.querySelectorAll('li'))
    if (items.length === 1) {
      return items[0].innerHTML
    }
    // Join multiple items with line breaks
    return items.map((li) => li.innerHTML).join('<br>')
  }

  if (tag === 'PRE') {
    const code = block.querySelector('code')
    return code ? code.textContent : block.textContent
  }

  if (tag === 'BLOCKQUOTE') {
    // If blockquote wraps a single element, use its innerHTML
    if (block.children.length === 1) {
      return block.children[0].innerHTML
    }
    return block.innerHTML
  }

  return block.innerHTML
}

/**
 * Create the new block element for the target type.
 * @param {string} to - Target type name
 * @param {string} content - Inner HTML content
 * @returns {HTMLElement}
 */
function createTargetBlock(to, content) {
  const info = BLOCK_TYPE_MAP[to]
  if (!info) return null

  if (to === 'unorderedList' || to === 'orderedList') {
    const list = document.createElement(info.tag)
    const li = document.createElement('li')
    li.innerHTML = content || '<br>'
    list.appendChild(li)
    return list
  }

  if (to === 'codeBlock') {
    const pre = document.createElement('pre')
    const code = document.createElement('code')
    // For code blocks, use text content only (strip HTML)
    const temp = document.createElement('div')
    temp.innerHTML = content
    code.textContent = temp.textContent || '\n'
    pre.appendChild(code)
    return pre
  }

  if (to === 'blockquote') {
    const bq = document.createElement('blockquote')
    const p = document.createElement('p')
    p.innerHTML = content || '<br>'
    bq.appendChild(p)
    return bq
  }

  // Simple block: p, h1-h6
  const el = document.createElement(info.tag)
  el.innerHTML = content || '<br>'
  return el
}

export function registerBlockConvertCommands(engine) {
  engine.commands.register('convertBlock', {
    execute(eng, { to } = {}) {
      if (!to || !BLOCK_TYPE_MAP[to]) return

      const block = getFocusedBlock(eng)
      if (!block) return

      // Don't convert if already the target type
      const targetTag = BLOCK_TYPE_MAP[to].tag
      if (block.tagName === targetTag) return

      eng.history.snapshot()

      const content = extractBlockContent(block)
      const newBlock = createTargetBlock(to, content)
      if (!newBlock) return

      block.parentNode.replaceChild(newBlock, block)

      // Place cursor in the new block
      const range = document.createRange()
      let cursorTarget = newBlock

      if (to === 'unorderedList' || to === 'orderedList') {
        cursorTarget = newBlock.querySelector('li') || newBlock
      } else if (to === 'codeBlock') {
        cursorTarget = newBlock.querySelector('code') || newBlock
      } else if (to === 'blockquote') {
        cursorTarget = newBlock.querySelector('p') || newBlock
      }

      range.selectNodeContents(cursorTarget)
      range.collapse(false)
      eng.selection.setRange(range)

      eng.eventBus.emit('content:change')
    },
    meta: { tooltip: 'Convert Block Type' },
  })
}
