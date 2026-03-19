import { cleanPastedHTML, looksLikeMarkdown } from '../utils/pasteClean.js'
import { markdownToHtml } from '../utils/markdownConverter.js'
import { isImportableFile, convertDocument } from '../utils/documentConverter/index.js'
import { DEFAULT_MAX_FILE_SIZE } from '../constants/defaults.js'

/** Custom MIME type for inter-editor content transfer */
const REMYX_MIME = 'application/x-remyx-content'

/** Block-level tags that can be dragged/reordered */
const DRAGGABLE_BLOCKS = new Set([
  'P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
  'BLOCKQUOTE', 'PRE', 'UL', 'OL', 'TABLE', 'HR', 'DIV',
])

/** Tags whose direct children can be reordered via drag */
const REORDERABLE_CHILDREN = new Set(['UL', 'OL', 'TBODY', 'TABLE'])

/**
 * Global registry of active DragDrop instances for inter-editor dragging.
 * Each entry maps an editor element to its DragDrop instance.
 * @type {Map<HTMLElement, DragDrop>}
 */
const _editorRegistry = new Map()

export class DragDrop {
  constructor(engine) {
    this.engine = engine

    // Drag state
    this._dragSource = null       // The block element being dragged
    this._dragSourceEditor = null  // The DragDrop instance that owns the drag source
    this._dropTarget = null       // The element we'd drop before/after
    this._dropPosition = null     // 'before' | 'after'
    this._ghostEl = null          // Ghost preview element
    this._dropIndicator = null    // Drop indicator line element
    this._isExternalDrag = false  // True when dragging from outside the editor
    this._enterCount = 0          // Counter to handle nested dragenter/dragleave

    this._handleDragOver = this._handleDragOver.bind(this)
    this._handleDrop = this._handleDrop.bind(this)
    this._handleDragEnter = this._handleDragEnter.bind(this)
    this._handleDragLeave = this._handleDragLeave.bind(this)
    this._handleDragStart = this._handleDragStart.bind(this)
    this._handleDragEnd = this._handleDragEnd.bind(this)
  }

  init() {
    const el = this.engine.element
    el.addEventListener('dragover', this._handleDragOver)
    el.addEventListener('drop', this._handleDrop)
    el.addEventListener('dragenter', this._handleDragEnter)
    el.addEventListener('dragleave', this._handleDragLeave)
    el.addEventListener('dragstart', this._handleDragStart)
    el.addEventListener('dragend', this._handleDragEnd)
    _editorRegistry.set(el, this)
  }

  destroy() {
    const el = this.engine.element
    el.removeEventListener('dragover', this._handleDragOver)
    el.removeEventListener('drop', this._handleDrop)
    el.removeEventListener('dragenter', this._handleDragEnter)
    el.removeEventListener('dragleave', this._handleDragLeave)
    el.removeEventListener('dragstart', this._handleDragStart)
    el.removeEventListener('dragend', this._handleDragEnd)
    _editorRegistry.delete(el)
    this._cleanupDrag()
  }

  // ── Public API for React layer ──────────────────────────────────────

  /**
   * Returns the closest draggable block element for a given DOM node.
   * Used by the React BlockDragHandle to identify what to drag.
   * @param {Node} node
   * @returns {HTMLElement|null}
   */
  getDraggableBlock(node) {
    return this._closestDraggableBlock(node)
  }

  /**
   * Make a block element draggable. Called by the React layer when
   * a drag handle is attached to a block.
   * @param {HTMLElement} block
   */
  makeBlockDraggable(block) {
    if (block && !block.hasAttribute('draggable')) {
      block.setAttribute('draggable', 'true')
    }
  }

  /**
   * Remove draggable attribute from a block element.
   * @param {HTMLElement} block
   */
  unmakeBlockDraggable(block) {
    if (block) {
      block.removeAttribute('draggable')
    }
  }

  /**
   * Returns true if a block drag is currently in progress.
   * @returns {boolean}
   */
  isDragging() {
    return !!this._dragSource
  }

  /**
   * Get the current drag state for the React layer to render overlays.
   * @returns {{ isDragging: boolean, isExternalDrag: boolean, dropTarget: HTMLElement|null, dropPosition: string|null }}
   */
  getDragState() {
    return {
      isDragging: !!this._dragSource || this._isExternalDrag,
      isExternalDrag: this._isExternalDrag,
      dropTarget: this._dropTarget,
      dropPosition: this._dropPosition,
    }
  }

  // ── Drag Start (internal block drags) ───────────────────────────────

  _handleDragStart(e) {
    // Check for reorderable sub-block items (LI, TR) first
    const reorderItem = this._getReorderableItem(e.target)
    const block = reorderItem || this._closestDraggableBlock(e.target)
    if (!block) return

    this._dragSource = block
    this._dragSourceEditor = this

    // Capture content before adding visual classes
    const html = block.outerHTML
    const text = block.textContent

    // Set data for inter-editor transfer
    e.dataTransfer.setData(REMYX_MIME, html)
    e.dataTransfer.setData('text/html', html)
    e.dataTransfer.setData('text/plain', text)
    e.dataTransfer.effectAllowed = 'move'

    // Create ghost preview
    this._createGhostPreview(block, e)

    // Add dragging class to source (after capturing content)
    block.classList.add('rmx-block-dragging')

    // Notify all editors about the drag source
    for (const instance of _editorRegistry.values()) {
      instance._dragSourceEditor = this
      instance._dragSource = block
    }

    this.engine.eventBus.emit('drag:start', { block })
  }

  _handleDragEnd(e) {
    // Remove dragging class
    if (this._dragSource) {
      this._dragSource.classList.remove('rmx-block-dragging')
    }

    // Notify all editors to clean up
    for (const instance of _editorRegistry.values()) {
      instance._cleanupDrag()
    }

    this.engine.eventBus.emit('drag:end')
  }

  // ── Drag Over ───────────────────────────────────────────────────────

  _handleDragOver(e) {
    e.preventDefault()

    // Determine drop effect
    if (this._dragSource) {
      e.dataTransfer.dropEffect = 'move'
    } else {
      e.dataTransfer.dropEffect = 'copy'
    }

    // Calculate drop position for block reordering / insertion
    if (this._dragSource || this._isExternalDrag) {
      this._updateDropTarget(e)
    }
  }

  // ── Drag Enter / Leave ──────────────────────────────────────────────

  _handleDragEnter(e) {
    e.preventDefault()
    this._enterCount++

    if (this._enterCount === 1) {
      // Determine if this is an external drag (files from desktop, etc.)
      if (!this._dragSource) {
        this._isExternalDrag = true
      }
      this.engine.element.classList.add('rmx-drag-over')
      this.engine.eventBus.emit('drag:enter', {
        isExternal: this._isExternalDrag,
        types: Array.from(e.dataTransfer.types || []),
      })
    }
  }

  _handleDragLeave(e) {
    this._enterCount--

    if (this._enterCount <= 0) {
      this._enterCount = 0
      this.engine.element.classList.remove('rmx-drag-over')
      this._removeDropIndicator()
      this._dropTarget = null
      this._dropPosition = null

      if (this._isExternalDrag && !this._dragSource) {
        this._isExternalDrag = false
      }

      this.engine.eventBus.emit('drag:leave')
    }
  }

  // ── Drop ────────────────────────────────────────────────────────────

  _handleDrop(e) {
    e.preventDefault()
    this._enterCount = 0
    this.engine.element.classList.remove('rmx-drag-over')
    this._removeDropIndicator()

    // ── Internal block reorder / inter-editor move ──
    if (this._dragSource && this._dropTarget) {
      this._handleBlockDrop(e)
      this._cleanupDrag()
      return
    }

    // ── File drops ──
    const files = Array.from(e.dataTransfer.files)
    const imageFiles = files.filter((f) => f.type.startsWith('image/'))

    if (imageFiles.length > 0) {
      this._handleImageDrop(e, imageFiles)
      this._cleanupDrag()
      return
    }

    const importableFiles = files.filter((f) => !f.type.startsWith('image/') && isImportableFile(f))
    if (importableFiles.length > 0) {
      this._handleDocumentDrop(e, importableFiles)
      this._cleanupDrag()
      return
    }

    const nonImageFiles = files.filter((f) => !f.type.startsWith('image/'))
    if (nonImageFiles.length > 0 && this.engine.options.uploadHandler) {
      this._handleFileDrop(e, nonImageFiles)
      this._cleanupDrag()
      return
    }

    // ── Inter-editor content (no drag source in this editor) ──
    const remyxContent = e.dataTransfer.getData(REMYX_MIME)
    if (remyxContent && !this._dragSource) {
      this._handleInterEditorDrop(e, remyxContent)
      this._cleanupDrag()
      return
    }

    // ── HTML / text content drops ──
    this._setCursorAtDropPoint(e)
    this.engine.history.snapshot()

    const html = e.dataTransfer.getData('text/html')
    if (html) {
      let cleaned = cleanPastedHTML(html)
      cleaned = this.engine.sanitizer.sanitize(cleaned)
      this.engine.selection.insertHTML(cleaned)
      this.engine.eventBus.emit('content:change')
    } else {
      const text = e.dataTransfer.getData('text/plain')
      if (text) {
        this._handleTextDrop(text)
        this.engine.eventBus.emit('content:change')
      }
    }

    this.engine.eventBus.emit('drop', { files, html })
    this._cleanupDrag()
  }

  // ── Block drop (reorder / inter-editor move) ───────────────────────

  _handleBlockDrop(e) {
    const source = this._dragSource
    const target = this._dropTarget
    const position = this._dropPosition
    const sourceEditor = this._dragSourceEditor

    if (!source || !target || !position) return
    if (source === target) return

    // Take snapshots in both editors
    this.engine.history.snapshot()
    if (sourceEditor && sourceEditor !== this) {
      sourceEditor.engine.history.snapshot()
    }

    // Handle list item reordering
    const sourceReorderable = this._getReorderableItem(source)
    const targetReorderable = this._getReorderableItem(target)

    if (sourceReorderable && targetReorderable &&
        sourceReorderable.parentElement === targetReorderable.parentElement) {
      // Reordering within the same list/table
      if (position === 'before') {
        targetReorderable.parentElement.insertBefore(sourceReorderable, targetReorderable)
      } else {
        targetReorderable.parentElement.insertBefore(sourceReorderable, targetReorderable.nextSibling)
      }
    } else {
      // Block-level move
      const insertionParent = target.parentElement
      if (!insertionParent) return

      if (position === 'before') {
        insertionParent.insertBefore(source, target)
      } else {
        insertionParent.insertBefore(source, target.nextSibling)
      }
    }

    // If source was from a different editor, notify that editor
    if (sourceEditor && sourceEditor !== this) {
      sourceEditor.engine.eventBus.emit('content:change')
    }

    this.engine.eventBus.emit('content:change')
    this.engine.eventBus.emit('drag:reorder', { source, target, position })
  }

  /**
   * Handle content dropped from another Remyx editor instance.
   */
  _handleInterEditorDrop(e, html) {
    this._setCursorAtDropPoint(e)
    this.engine.history.snapshot()

    const sanitized = this.engine.sanitizer.sanitize(html)
    this.engine.selection.insertHTML(sanitized)
    this.engine.eventBus.emit('content:change')
    this.engine.eventBus.emit('drag:inter-editor', { html: sanitized })
  }

  // ── Drop target calculation ─────────────────────────────────────────

  /**
   * Calculate and update the drop target based on cursor position.
   * Emits drag:indicator event for the React layer to position the indicator.
   */
  _updateDropTarget(e) {
    const editorEl = this.engine.element

    // If dragging a reorderable item (LI/TR), iterate siblings instead of top-level blocks
    const sourceReorderable = this._dragSource ? this._getReorderableItem(this._dragSource) : null
    const blocks = sourceReorderable && sourceReorderable.parentElement
      ? Array.from(sourceReorderable.parentElement.children).filter(
          c => c.tagName === sourceReorderable.tagName
        )
      : this._getTopLevelBlocks()

    if (blocks.length === 0) {
      this._dropTarget = null
      this._dropPosition = null
      this._removeDropIndicator()
      return
    }

    const mouseY = e.clientY
    let closestBlock = null
    let closestPosition = null
    let closestDistance = Infinity

    for (const block of blocks) {
      // Skip the block being dragged
      if (block === this._dragSource) continue

      const rect = block.getBoundingClientRect()
      const midY = rect.top + rect.height / 2

      const distTop = Math.abs(mouseY - rect.top)
      const distBottom = Math.abs(mouseY - rect.bottom)

      if (distTop < closestDistance) {
        closestDistance = distTop
        closestBlock = block
        closestPosition = 'before'
      }
      if (distBottom < closestDistance) {
        closestDistance = distBottom
        closestBlock = block
        closestPosition = 'after'
      }

      // Also check if mouse is within block — pick top or bottom half
      if (mouseY >= rect.top && mouseY <= rect.bottom) {
        closestBlock = block
        closestPosition = mouseY < midY ? 'before' : 'after'
        closestDistance = 0
        break
      }
    }

    if (closestBlock !== this._dropTarget || closestPosition !== this._dropPosition) {
      this._dropTarget = closestBlock
      this._dropPosition = closestPosition

      if (closestBlock) {
        this._showDropIndicator(closestBlock, closestPosition)
      } else {
        this._removeDropIndicator()
      }
    }
  }

  /**
   * Get all top-level block elements in the editor.
   * @returns {HTMLElement[]}
   */
  _getTopLevelBlocks() {
    const blocks = []
    const el = this.engine.element
    for (let i = 0; i < el.children.length; i++) {
      const child = el.children[i]
      if (child.nodeType === Node.ELEMENT_NODE &&
          !child.classList.contains('rmx-drop-indicator') &&
          !child.classList.contains('rmx-drag-ghost')) {
        blocks.push(child)
      }
    }
    return blocks
  }

  // ── Drop indicator ──────────────────────────────────────────────────

  _showDropIndicator(targetBlock, position) {
    if (!this._dropIndicator) {
      this._dropIndicator = document.createElement('div')
      this._dropIndicator.className = 'rmx-drop-indicator'
      this._dropIndicator.setAttribute('aria-hidden', 'true')
    }

    const editorEl = this.engine.element
    const editorRect = editorEl.getBoundingClientRect()
    const blockRect = targetBlock.getBoundingClientRect()

    // Position the indicator as a horizontal line
    const top = position === 'before'
      ? blockRect.top - editorRect.top + editorEl.scrollTop
      : blockRect.bottom - editorRect.top + editorEl.scrollTop

    this._dropIndicator.style.top = `${top}px`

    if (!this._dropIndicator.parentElement) {
      editorEl.appendChild(this._dropIndicator)
    }

    this.engine.eventBus.emit('drag:indicator', {
      target: targetBlock,
      position,
      top,
    })
  }

  _removeDropIndicator() {
    if (this._dropIndicator && this._dropIndicator.parentElement) {
      this._dropIndicator.parentElement.removeChild(this._dropIndicator)
    }
    this._dropIndicator = null
  }

  // ── Ghost preview ───────────────────────────────────────────────────

  _createGhostPreview(block, e) {
    const ghost = block.cloneNode(true)
    ghost.className = 'rmx-drag-ghost'
    ghost.style.position = 'absolute'
    ghost.style.top = '-9999px'
    ghost.style.left = '-9999px'
    ghost.style.width = `${block.offsetWidth}px`
    ghost.style.pointerEvents = 'none'

    document.body.appendChild(ghost)
    this._ghostEl = ghost

    // Use the ghost as the drag image
    const rect = block.getBoundingClientRect()
    const offsetX = e.clientX - rect.left
    const offsetY = e.clientY - rect.top
    e.dataTransfer.setDragImage(ghost, offsetX, offsetY)

    // Clean up ghost after a frame (browser captures it synchronously)
    requestAnimationFrame(() => {
      // Keep ghost for visual feedback, remove on drag end
    })
  }

  _removeGhostPreview() {
    if (this._ghostEl && this._ghostEl.parentElement) {
      this._ghostEl.parentElement.removeChild(this._ghostEl)
    }
    this._ghostEl = null
  }

  // ── Helpers ─────────────────────────────────────────────────────────

  /**
   * Find the closest draggable block from a given node.
   * @param {Node} node
   * @returns {HTMLElement|null}
   */
  _closestDraggableBlock(node) {
    let el = node.nodeType === Node.TEXT_NODE ? node.parentElement : node
    const editorEl = this.engine.element
    while (el && el !== editorEl) {
      if (el.parentElement === editorEl && DRAGGABLE_BLOCKS.has(el.tagName)) {
        return el
      }
      el = el.parentElement
    }
    return null
  }

  /**
   * For reordering, get the reorderable item (LI or TR) from a node.
   * @param {Node} node
   * @returns {HTMLElement|null}
   */
  _getReorderableItem(node) {
    let el = node.nodeType === Node.TEXT_NODE ? node.parentElement : node
    const editorEl = this.engine.element
    while (el && el !== editorEl) {
      if (el.tagName === 'LI' || el.tagName === 'TR') {
        // Verify parent is a reorderable container
        if (el.parentElement && REORDERABLE_CHILDREN.has(el.parentElement.tagName)) {
          return el
        }
      }
      el = el.parentElement
    }
    return null
  }

  /**
   * Clean up all drag state.
   */
  _cleanupDrag() {
    if (this._dragSource) {
      this._dragSource.classList.remove('rmx-block-dragging')
    }
    this._dragSource = null
    this._dragSourceEditor = null
    this._dropTarget = null
    this._dropPosition = null
    this._isExternalDrag = false
    this._enterCount = 0
    this._removeDropIndicator()
    this._removeGhostPreview()
    this.engine.element.classList.remove('rmx-drag-over')
  }

  /**
   * Check if a file exceeds the configured maximum size.
   * @param {File} file
   * @returns {boolean} true if the file is too large
   */
  _exceedsMaxFileSize(file) {
    const maxSize = this.engine.options.maxFileSize ?? DEFAULT_MAX_FILE_SIZE
    if (maxSize > 0 && file.size > maxSize) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1)
      const limitMB = (maxSize / (1024 * 1024)).toFixed(0)
      console.warn(`[Remyx] File "${file.name}" (${sizeMB} MB) exceeds the ${limitMB} MB limit.`)
      this.engine.eventBus.emit('file:too-large', { file, maxSize })
      return true
    }
    return false
  }

  _handleImageDrop(e, imageFiles) {
    this._setCursorAtDropPoint(e)
    this.engine.history.snapshot()

    const validFiles = imageFiles.filter((f) => !this._exceedsMaxFileSize(f))
    // Serialize uploads to prevent race conditions with concurrent insertImage calls
    let chain = Promise.resolve()
    for (const file of validFiles) {
      chain = chain.then(() => {
        if (this.engine.options.uploadHandler) {
          return this.engine.options.uploadHandler(file).then((url) => {
            this.engine.commands.execute('insertImage', { src: url, alt: file.name })
          }).catch((err) => {
            console.error(`Image upload failed for "${file.name}":`, err)
            this.engine.eventBus.emit('upload:error', { file, error: err })
          })
        } else {
          return new Promise((resolve) => {
            const reader = new FileReader()
            reader.onprogress = (ev) => {
              if (ev.lengthComputable) {
                this.engine.eventBus.emit('upload:progress', {
                  loaded: ev.loaded,
                  total: ev.total,
                  percent: Math.round((ev.loaded / ev.total) * 100),
                })
              }
            }
            reader.onload = (ev) => {
              this.engine.commands.execute('insertImage', { src: ev.target.result, alt: file.name })
              resolve()
            }
            reader.onerror = () => resolve()
            reader.readAsDataURL(file)
          })
        }
      })
    }
  }

  _handleDocumentDrop(e, files) {
    this._setCursorAtDropPoint(e)
    this.engine.history.snapshot()

    files.filter((f) => !this._exceedsMaxFileSize(f)).forEach((file) => {
      convertDocument(file)
        .then((html) => {
          const sanitized = this.engine.sanitizer.sanitize(html)
          this.engine.selection.insertHTML(sanitized)
          this.engine.eventBus.emit('content:change')
        })
        .catch((err) => {
          console.warn('Document import failed on drop:', err.message)
        })
    })
  }

  _handleFileDrop(e, files) {
    this._setCursorAtDropPoint(e)
    this.engine.history.snapshot()

    // Serialize uploads to prevent race conditions with concurrent insertAttachment calls
    let chain = Promise.resolve()
    for (const file of files) {
      chain = chain.then(() =>
        this.engine.options.uploadHandler(file).then((url) => {
          this.engine.commands.execute('insertAttachment', {
            url,
            filename: file.name,
            filesize: file.size,
          })
        }).catch((err) => {
          console.error(`File upload failed for "${file.name}":`, err)
          this.engine.eventBus.emit('upload:error', { file, error: err })
        })
      )
    }
  }

  _setCursorAtDropPoint(e) {
    const range = document.caretRangeFromPoint
      ? document.caretRangeFromPoint(e.clientX, e.clientY)
      : null

    if (range) {
      const sel = window.getSelection()
      sel.removeAllRanges()
      sel.addRange(range)
    }
  }

  /**
   * Handle dropped plain text with smart format detection.
   * Auto-detects markdown and converts to HTML for display.
   */
  _handleTextDrop(text) {
    if (this.engine.outputFormat === 'markdown' || looksLikeMarkdown(text)) {
      let parsedHtml = markdownToHtml(text)
      parsedHtml = this.engine.sanitizer.sanitize(parsedHtml)
      this.engine.selection.insertHTML(parsedHtml)
    } else {
      const escaped = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
      const formatted = escaped
        .split(/\n\n+/)
        .map((para) => `<p>${para.replace(/\n/g, '<br>')}</p>`)
        .join('')
      this.engine.selection.insertHTML(formatted || '<p><br></p>')
    }
  }
}

/**
 * Expose the editor registry for testing purposes.
 * @returns {Map<HTMLElement, DragDrop>}
 */
DragDrop._getRegistry = () => _editorRegistry
