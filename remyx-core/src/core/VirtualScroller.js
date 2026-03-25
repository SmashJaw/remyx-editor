/**
 * Virtualized rendering for long documents.
 *
 * Uses IntersectionObserver to track which block-level elements are visible.
 * For documents exceeding a configurable threshold of block elements,
 * off-screen blocks are collapsed to lightweight placeholder divs with
 * fixed height, reducing DOM complexity and improving scroll performance.
 *
 * Content is restored when blocks scroll back into view.
 *
 * Opt-in via `engine.options.virtualizeThreshold` (default: 200, set 0 to disable).
 *
 * @example
 * const scroller = new VirtualScroller(editorElement, { threshold: 200 })
 * scroller.init()
 * // ... later
 * scroller.destroy()
 */

/** Block-level tag names that are eligible for virtualization */
const BLOCK_TAGS = new Set([
  'P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
  'BLOCKQUOTE', 'PRE', 'UL', 'OL', 'LI', 'TABLE',
  'FIGURE', 'SECTION', 'ARTICLE', 'ASIDE', 'HR',
  'DL', 'DD', 'DT', 'DETAILS', 'SUMMARY',
])

export class VirtualScroller {
  /**
   * @param {HTMLElement} container - The editor content element
   * @param {Object} [options]
   * @param {number} [options.threshold=200] - Minimum block count to activate virtualization
   * @param {string} [options.rootMargin='500px'] - IntersectionObserver root margin for pre-loading
   */
  constructor(container, options = {}) {
    this._container = container
    this._threshold = options.threshold ?? 200
    this._rootMargin = options.rootMargin || '500px'
    this._observer = null
    this._active = false
    /** @private Map<HTMLElement, { html: string, height: number }> */
    this._collapsed = new Map()
    /** @private Set<HTMLElement> placeholder elements currently in DOM */
    this._placeholders = new Set()
  }

  /**
   * Initialize the virtual scroller. Sets up the IntersectionObserver
   * and performs an initial scan of block elements.
   *
   * @returns {void}
   */
  init() {
    if (this._threshold === 0) return
    if (typeof IntersectionObserver === 'undefined') return

    this._observer = new IntersectionObserver(
      (entries) => this._handleIntersection(entries),
      {
        root: null, // viewport
        rootMargin: this._rootMargin,
        threshold: 0,
      }
    )

    this._scan()
  }

  /**
   * Scan the container for block-level elements and begin observing
   * them if the count exceeds the threshold.
   *
   * @private
   * @returns {void}
   */
  _scan() {
    const blocks = this._getBlockElements()

    if (blocks.length < this._threshold) {
      this._active = false
      return
    }

    this._active = true
    blocks.forEach((block) => {
      this._observer.observe(block)
    })
  }

  /**
   * Returns all direct and nested block-level children of the container.
   *
   * @private
   * @returns {HTMLElement[]}
   */
  _getBlockElements() {
    const blocks = []
    const children = this._container.children
    for (let i = 0; i < children.length; i++) {
      const child = children[i]
      if (child.nodeType === 1 && BLOCK_TAGS.has(child.tagName)) {
        blocks.push(child)
      }
    }
    return blocks
  }

  /**
   * Handle IntersectionObserver callbacks. Collapse blocks that leave
   * the viewport and restore blocks that enter it.
   *
   * @private
   * @param {IntersectionObserverEntry[]} entries
   */
  _handleIntersection(entries) {
    for (const entry of entries) {
      const el = entry.target

      if (entry.isIntersecting) {
        // Restore collapsed block
        this._restore(el)
      } else {
        // Collapse off-screen block
        this._collapse(el)
      }
    }
  }

  /**
   * Collapse a block element to a placeholder div with fixed height.
   * Stores the original HTML and measured height for later restoration.
   *
   * @private
   * @param {HTMLElement} el
   */
  _collapse(el) {
    // Don't collapse elements that are already placeholders
    if (this._placeholders.has(el)) return
    // Don't collapse if already tracked as collapsed
    if (this._collapsed.has(el)) return

    const rect = el.getBoundingClientRect()
    const height = rect.height
    if (height === 0) return // skip zero-height elements

    const html = el.innerHTML
    const tagName = el.tagName

    // Store original content
    this._collapsed.set(el, { html, height, tagName })

    // Replace content with empty placeholder maintaining height
    el.innerHTML = ''
    el.style.minHeight = `${height}px`
    el.setAttribute('data-virtualized', 'true')
    this._placeholders.add(el)
  }

  /**
   * Restore a collapsed block element to its original content.
   *
   * @private
   * @param {HTMLElement} el
   */
  _restore(el) {
    const data = this._collapsed.get(el)
    if (!data) return

    el.innerHTML = data.html
    el.style.minHeight = ''
    el.removeAttribute('data-virtualized')
    this._collapsed.delete(el)
    this._placeholders.delete(el)
  }

  /**
   * Force-restore all collapsed elements. Call before operations that
   * need to read/write the full document content (e.g., getHTML, save).
   *
   * @returns {void}
   */
  restoreAll() {
    this._collapsed.forEach((data, el) => {
      this._restore(el)
    })
  }

  /**
   * Rescan the container for new/removed blocks. Call after major
   * content changes (paste, import, etc.).
   *
   * @returns {void}
   */
  refresh() {
    if (!this._observer) return

    // Unobserve everything
    this._observer.disconnect()

    // Restore all collapsed blocks first
    this.restoreAll()

    // Re-scan
    this._scan()
  }

  /**
   * Whether virtualization is currently active (block count exceeds threshold).
   * @returns {boolean}
   */
  get isActive() {
    return this._active
  }

  /**
   * Number of currently collapsed (off-screen) blocks.
   * @returns {number}
   */
  get collapsedCount() {
    return this._collapsed.size
  }

  /**
   * Destroy the virtual scroller and restore all collapsed content.
   *
   * @returns {void}
   */
  destroy() {
    this.restoreAll()

    if (this._observer) {
      this._observer.disconnect()
      this._observer = null
    }

    this._collapsed.clear()
    this._placeholders.clear()
    this._active = false
  }
}
