// Pre-compiled regex patterns (avoid recompilation on every selection change)
const HEADING_REGEX = /^h[1-6]$/
const BLOCK_TAGS = new Set(['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'DIV', 'BLOCKQUOTE', 'PRE', 'LI', 'TD', 'TH'])

/**
 * @typedef {Object} SelectionBookmark
 * @property {number} startOffset - Character offset of the selection start within the editor
 * @property {number} endOffset - Character offset of the selection end within the editor
 * @property {boolean} collapsed - Whether the selection is collapsed (cursor with no range)
 */

/**
 * @typedef {Object} LinkInfo
 * @property {string} href - The link URL
 * @property {string} text - The link text content
 * @property {string} target - The link target attribute
 */

/**
 * @typedef {Object} ActiveFormats
 * @property {boolean} bold - Whether bold formatting is active
 * @property {boolean} italic - Whether italic formatting is active
 * @property {boolean} underline - Whether underline formatting is active
 * @property {boolean} strikethrough - Whether strikethrough formatting is active
 * @property {boolean} subscript - Whether subscript formatting is active
 * @property {boolean} superscript - Whether superscript formatting is active
 * @property {string|null} heading - The heading level tag (e.g., 'h1', 'h2') or null
 * @property {string} alignment - Text alignment ('left', 'center', 'right', 'justify')
 * @property {boolean} orderedList - Whether inside an ordered list
 * @property {boolean} unorderedList - Whether inside an unordered list
 * @property {boolean} blockquote - Whether inside a blockquote
 * @property {boolean} codeBlock - Whether inside a code block (pre)
 * @property {LinkInfo|null} link - Link info if inside a link, or null
 * @property {string|null} fontFamily - Current font family or null
 * @property {string|null} fontSize - Current font size or null
 * @property {string|null} foreColor - Current text color or null
 * @property {string|null} backColor - Current background color or null
 */

export class Selection {
  /**
   * Creates a new Selection manager.
   * @param {HTMLElement} editorElement - The editor DOM element to manage selections within
   */
  constructor(editorElement) {
    this.editor = editorElement
  }

  /**
   * Returns the current window Selection object.
   * @returns {globalThis.Selection} The browser's Selection object
   */
  getSelection() {
    return window.getSelection()
  }

  /**
   * Returns the current Range if it is within the editor, or null.
   * @returns {Range|null} The current selection range within the editor, or null
   */
  getRange() {
    const sel = this.getSelection()
    if (!sel || sel.rangeCount === 0) return null
    const range = sel.getRangeAt(0)
    if (!this.isWithinEditor(range.commonAncestorContainer)) return null
    return range
  }

  /**
   * Sets the current selection to the given range.
   * Silently ignores errors from detached nodes or invalid offsets.
   * @param {Range} range - The Range object to apply as the current selection
   * @returns {void}
   */
  setRange(range) {
    try {
      const sel = this.getSelection()
      sel.removeAllRanges()
      sel.addRange(range)
    } catch {
      // Range may reference detached nodes or invalid offsets — silently ignore
    }
  }

  /**
   * Checks whether a given node is within the editor element.
   * @param {Node|null} node - The DOM node to check
   * @returns {boolean} True if the node is contained within the editor
   */
  isWithinEditor(node) {
    if (!node) return false
    const el = node.nodeType === Node.TEXT_NODE ? node.parentElement : node
    return this.editor.contains(el)
  }

  /**
   * Checks whether the current selection is collapsed (a caret with no range).
   * @returns {boolean} True if the selection is collapsed or no selection exists
   */
  isCollapsed() {
    const sel = this.getSelection()
    return sel ? sel.isCollapsed : true
  }

  /**
   * Returns the selected text content as a string.
   * @returns {string} The selected text, or an empty string if nothing is selected
   */
  getSelectedText() {
    const sel = this.getSelection()
    return sel ? sel.toString() : ''
  }

  /**
   * Returns the selected content as an HTML string.
   * @returns {string} The selected HTML, or an empty string if nothing is selected
   */
  getSelectedHTML() {
    const range = this.getRange()
    if (!range) return ''
    const fragment = range.cloneContents()
    const div = document.createElement('div')
    div.appendChild(fragment)
    return div.innerHTML
  }

  /**
   * Saves the current selection as a character-offset bookmark that can
   * survive DOM mutations. Returns null if no range is active.
   * @returns {SelectionBookmark|null} The bookmark object, or null
   */
  save() {
    const range = this.getRange()
    if (!range) return null

    const preRange = document.createRange()
    preRange.selectNodeContents(this.editor)
    preRange.setEnd(range.startContainer, range.startOffset)
    const startOffset = preRange.toString().length

    return {
      startOffset,
      endOffset: startOffset + range.toString().length,
      collapsed: range.collapsed,
    }
  }

  /**
   * Restores the selection from a previously saved bookmark.
   * Falls back to the end of the editor if the exact position cannot be restored.
   * @param {SelectionBookmark|null} bookmark - The bookmark to restore, or null to do nothing
   * @returns {void}
   */
  restore(bookmark) {
    if (!bookmark) return
    const textWalker = document.createTreeWalker(
      this.editor,
      NodeFilter.SHOW_TEXT,
      null
    )

    let charCount = 0
    let startNode = null
    let startNodeOffset = 0
    let endNode = null
    let endNodeOffset = 0

    while (textWalker.nextNode()) {
      const node = textWalker.currentNode
      const nodeLength = node.textContent.length
      const nextCount = charCount + nodeLength

      if (!startNode && nextCount >= bookmark.startOffset) {
        startNode = node
        startNodeOffset = bookmark.startOffset - charCount
      }
      if (!endNode && nextCount >= bookmark.endOffset) {
        endNode = node
        endNodeOffset = bookmark.endOffset - charCount
        break
      }
      charCount = nextCount
    }

    // Note: offset may be imprecise if DOM changed significantly between save() and restore(),
    // but the try/catch fallback below handles this by moving cursor to end of editor.
    if (startNode) {
      try {
        const range = document.createRange()
        range.setStart(startNode, Math.min(startNodeOffset, startNode.textContent.length))
        if (endNode) {
          range.setEnd(endNode, Math.min(endNodeOffset, endNode.textContent.length))
        } else {
          range.collapse(true)
        }
        this.setRange(range)
      } catch {
        // DOM structure changed between save and restore — fall back to end of editor
        try {
          const fallbackRange = document.createRange()
          fallbackRange.selectNodeContents(this.editor)
          fallbackRange.collapse(false)
          this.setRange(fallbackRange)
        } catch {
          // Editor element may not be in the DOM — nothing we can do
        }
      }
    }
  }

  /**
   * Collapses the current selection to the start or end.
   * @param {boolean} [toEnd=false] - If true, collapse to the end; otherwise collapse to the start
   * @returns {void}
   */
  collapse(toEnd = false) {
    const sel = this.getSelection()
    if (sel && sel.rangeCount > 0) {
      if (toEnd) {
        sel.collapseToEnd()
      } else {
        sel.collapseToStart()
      }
    }
  }

  /**
   * Returns the nearest element containing the current selection.
   * If the selection is in a text node, returns its parent element.
   * @returns {HTMLElement|null} The parent element, or null if no range exists
   */
  getParentElement() {
    const range = this.getRange()
    if (!range) return null
    const container = range.commonAncestorContainer
    return container.nodeType === Node.TEXT_NODE ? container.parentElement : container
  }

  /**
   * Returns the nearest block-level ancestor element of the current selection.
   * @returns {HTMLElement|null} The parent block element (p, h1-h6, div, blockquote, pre, li, td, th), or null
   */
  getParentBlock() {
    let el = this.getParentElement()
    while (el && el !== this.editor) {
      if (BLOCK_TAGS.has(el.tagName)) return el
      el = el.parentElement
    }
    return null
  }

  /**
   * Finds the closest ancestor element with the given tag name.
   * @param {string} tagName - The HTML tag name to search for (case-insensitive)
   * @returns {HTMLElement|null} The matching ancestor element, or null if not found
   */
  getClosestElement(tagName) {
    let el = this.getParentElement()
    const tag = tagName.toUpperCase()
    while (el && el !== this.editor) {
      if (el.tagName === tag) return el
      el = el.parentElement
    }
    return null
  }

  /**
   * Inserts HTML at the current selection using document.execCommand.
   * Automatically sanitizes input through the editor's Sanitizer if available
   * to prevent XSS. Falls back to unsanitized insertion only if no sanitizer
   * is configured (e.g. in unit tests with standalone Selection instances).
   * @param {string} html - The HTML string to insert
   * @returns {void}
   */
  insertHTML(html) {
    const safeHtml = this._sanitizer ? this._sanitizer.sanitize(html) : html
    document.execCommand('insertHTML', false, safeHtml)
  }

  /**
   * Attaches a Sanitizer instance for automatic HTML sanitization in insertHTML().
   * Called by EditorEngine during initialization.
   * @param {import('./Sanitizer.js').Sanitizer} sanitizer
   * @returns {void}
   */
  setSanitizer(sanitizer) {
    this._sanitizer = sanitizer
  }

  /**
   * Inserts a DOM node at the current selection, replacing any selected content.
   * Moves the cursor to after the inserted node.
   * @param {Node} node - The DOM node to insert
   * @returns {void}
   */
  insertNode(node) {
    const range = this.getRange()
    if (!range) return
    range.deleteContents()
    range.insertNode(node)
    range.setStartAfter(node)
    range.collapse(true)
    this.setRange(range)
  }

  /**
   * Wraps the current selection with a new element of the given tag name.
   * Does nothing if the selection is collapsed.
   * @param {string} tagName - The HTML tag name for the wrapper element
   * @param {Object} [attrs={}] - Key-value pairs of attributes to set on the wrapper
   * @returns {HTMLElement|null} The created wrapper element, or null if the selection was collapsed
   */
  wrapWith(tagName, attrs = {}) {
    const range = this.getRange()
    if (!range || range.collapsed) return null
    const el = document.createElement(tagName)
    Object.entries(attrs).forEach(([key, value]) => {
      el.setAttribute(key, value)
    })
    try {
      range.surroundContents(el)
    } catch {
      const fragment = range.extractContents()
      el.appendChild(fragment)
      range.insertNode(el)
    }
    this.setRange(range)
    return el
  }

  /**
   * Unwraps the closest ancestor matching the given tag name, preserving its children.
   * @param {string} tagName - The HTML tag name of the element to unwrap (case-insensitive)
   * @returns {void}
   */
  unwrap(tagName) {
    const el = this.getClosestElement(tagName)
    if (!el) return
    const parent = el.parentNode
    while (el.firstChild) {
      parent.insertBefore(el.firstChild, el)
    }
    parent.removeChild(el)
  }

  /**
   * Detects and returns all active formatting states at the current selection.
   * @returns {ActiveFormats} An object describing all active formats
   */
  getActiveFormats() {
    const formats = {
      bold: false,
      italic: false,
      underline: false,
      strikethrough: false,
      subscript: false,
      superscript: false,
      heading: null,
      alignment: 'left',
      orderedList: false,
      unorderedList: false,
      blockquote: false,
      codeBlock: false,
      link: null,
      fontFamily: null,
      fontSize: null,
      foreColor: null,
      backColor: null,
    }

    try {
      formats.bold = document.queryCommandState('bold')
      formats.italic = document.queryCommandState('italic')
      formats.underline = document.queryCommandState('underline')
      formats.strikethrough = document.queryCommandState('strikeThrough')
      formats.subscript = document.queryCommandState('subscript')
      formats.superscript = document.queryCommandState('superscript')
    } catch {
      // queryCommandState can throw in some edge cases
    }

    const block = this.getParentBlock()
    if (block) {
      const tag = block.tagName.toLowerCase()
      if (HEADING_REGEX.test(tag)) {
        formats.heading = tag
      }
      const align = block.style.textAlign || window.getComputedStyle(block).textAlign
      if (align) {
        formats.alignment = align === 'start' ? 'left' : align === 'end' ? 'right' : align
      }
    }

    let el = this.getParentElement()
    while (el && el !== this.editor) {
      const tag = el.tagName
      if (tag === 'OL') formats.orderedList = true
      if (tag === 'UL') formats.unorderedList = true
      if (tag === 'BLOCKQUOTE') formats.blockquote = true
      if (tag === 'PRE') formats.codeBlock = true
      if (tag === 'A') formats.link = { href: el.href, text: el.textContent, target: el.target }
      el = el.parentElement
    }

    try {
      formats.fontFamily = document.queryCommandValue('fontName') || null
      formats.fontSize = document.queryCommandValue('fontSize') || null
      formats.foreColor = document.queryCommandValue('foreColor') || null
      formats.backColor = document.queryCommandValue('backColor') || null
    } catch {
      // ignore
    }

    return formats
  }

  /**
   * Returns the bounding rectangle of the current selection range.
   * @returns {DOMRect|null} The bounding client rect, or null if no range exists
   */
  getBoundingRect() {
    const range = this.getRange()
    if (!range) return null
    return range.getBoundingClientRect()
  }
}
