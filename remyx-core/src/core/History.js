/**
 * Lightweight djb2 hash function for fast string comparison.
 * Returns a 32-bit integer hash.
 * @param {string} str
 * @returns {number}
 */
function djb2Hash(str) {
  let hash = 5381
  for (let i = 0, len = str.length; i < len; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0
  }
  return hash
}

/**
 * @typedef {Object} HistoryOptions
 * @property {number} [maxSize=100] - Maximum number of undo states to retain
 * @property {number} [debounceMs=300] - Debounce interval in milliseconds for automatic snapshots
 * @property {number} [coalesceMs=1000] - Window in which rapid keystrokes are coalesced into a single undo step
 */

/**
 * @typedef {Object} HistoryState
 * @property {string} html - The HTML content at the time of the snapshot
 * @property {import('./Selection.js').SelectionBookmark|null} bookmark - The selection bookmark at the time of the snapshot
 */

/**
 * Manages undo/redo history for the editor using DOM mutation observation
 * and debounced snapshots.
 */
export class History {
  /**
   * Creates a new History manager.
   * @param {import('./EditorEngine.js').EditorEngine} engine - The editor engine instance
   * @param {HistoryOptions} [options={}] - History configuration options
   */
  constructor(engine, options = {}) {
    this.engine = engine
    this.maxSize = options.maxSize || 100
    this.debounceMs = options.debounceMs || 300
    this.coalesceMs = options.coalesceMs || 1000
    this._undoStack = []
    this._redoStack = []
    this._observer = null
    this._debounceTimer = null
    this._coalesceTimer = null
    this._isPerformingUndoRedo = false
    this._isCoalescing = false
    this._lastSnapshot = null
    this._lastNormalized = null
    this._lastNormalizedHash = null
  }

  /**
   * Initializes history tracking by taking an initial snapshot and
   * starting a MutationObserver on the editor element.
   * @returns {void}
   */
  init() {
    this._takeSnapshot()
    this._observer = new MutationObserver(() => {
      if (this._isPerformingUndoRedo) return
      this._debouncedSnapshot()
    })
    this._observer.observe(this.engine.element, {
      childList: true,
      characterData: true,
      attributes: true,
      subtree: true,
    })
  }

  /**
   * Destroys the history manager by disconnecting the MutationObserver
   * and clearing the debounce timer.
   * @returns {void}
   */
  destroy() {
    if (this._observer) {
      this._observer.disconnect()
      this._observer = null
    }
    if (this._debounceTimer) {
      clearTimeout(this._debounceTimer)
      this._debounceTimer = null
    }
    if (this._coalesceTimer) {
      clearTimeout(this._coalesceTimer)
      this._coalesceTimer = null
    }
    this._isCoalescing = false
  }

  /**
   * Takes an immediate snapshot of the current editor state, cancelling
   * any pending debounced snapshot.
   * @returns {void}
   */
  snapshot() {
    if (this._debounceTimer) {
      clearTimeout(this._debounceTimer)
      this._debounceTimer = null
    }
    this._takeSnapshot()
  }

  /**
   * Schedules a debounced snapshot with operation coalescing.
   *
   * Rapid keystrokes within the coalesce window (default 1000ms) are
   * batched into a single undo step. The debounce timer (default 300ms)
   * fires first, but if the coalesce window hasn't expired yet, the
   * snapshot updates the top of the undo stack instead of pushing a
   * new entry. This gives the user natural undo boundaries at typing
   * pauses rather than one entry per character.
   *
   * @private
   * @returns {void}
   */
  _debouncedSnapshot() {
    if (this._debounceTimer) {
      clearTimeout(this._debounceTimer)
    }
    this._debounceTimer = setTimeout(() => {
      if (this._isCoalescing) {
        // Still within the coalesce window — update the top of the stack
        this._updateTopSnapshot()
      } else {
        // Start a new coalesce window
        this._isCoalescing = true
        this._takeSnapshot()
        if (this._coalesceTimer) clearTimeout(this._coalesceTimer)
        this._coalesceTimer = setTimeout(() => {
          this._isCoalescing = false
        }, this.coalesceMs)
      }
    }, this.debounceMs)
  }

  /**
   * Updates the top entry on the undo stack with the current state
   * instead of pushing a new entry. Used during coalescing to batch
   * rapid keystrokes.
   * @private
   * @returns {void}
   */
  _updateTopSnapshot() {
    const html = this.engine.element.innerHTML
    const normalized = html.replace(/\s+/g, ' ').trim()
    const hash = djb2Hash(normalized)

    if (hash === this._lastNormalizedHash && normalized === this._lastNormalized) return

    const bookmark = this.engine.selection.save()

    if (this._undoStack.length > 0) {
      // Replace the top entry
      this._undoStack[this._undoStack.length - 1] = { html, bookmark }
    } else {
      this._undoStack.push({ html, bookmark })
    }

    this._lastSnapshot = html
    this._lastNormalized = normalized
    this._lastNormalizedHash = hash
  }

  /**
   * Captures the current editor HTML and selection bookmark, pushing it
   * onto the undo stack. Clears the redo stack. Skips if content is unchanged.
   * @private
   * @returns {void}
   */
  _takeSnapshot() {
    const html = this.engine.element.innerHTML
    // Normalize whitespace for comparison to catch browser-induced
    // changes like &nbsp; ↔ space that produce visually identical content
    const normalized = html.replace(/\s+/g, ' ').trim()

    // Fast path: compare hashes before full string comparison
    const hash = djb2Hash(normalized)
    if (hash === this._lastNormalizedHash && normalized === this._lastNormalized) return

    const bookmark = this.engine.selection.save()
    this._undoStack.push({ html, bookmark })
    if (this._undoStack.length > this.maxSize) {
      this._undoStack.shift()
    }
    this._redoStack = []
    this._lastSnapshot = html
    this._lastNormalized = normalized
    this._lastNormalizedHash = hash
  }

  /**
   * Temporarily disconnects the MutationObserver to prevent recursive snapshots.
   * @private
   * @returns {void}
   */
  _disconnectObserver() {
    if (this._observer) {
      this._observer.disconnect()
    }
  }

  /**
   * Reconnects the MutationObserver after an undo/redo operation.
   * @private
   * @returns {void}
   */
  _reconnectObserver() {
    if (this._observer) {
      this._observer.observe(this.engine.element, {
        childList: true,
        characterData: true,
        attributes: true,
        subtree: true,
      })
    }
  }

  /**
   * Undoes the last change by restoring the previous state from the undo stack.
   * The current state is pushed onto the redo stack. Emits history:undo and content:change events.
   * @returns {void}
   */
  undo() {
    if (!this.canUndo()) return

    this._isPerformingUndoRedo = true
    this._disconnectObserver()

    const currentHtml = this.engine.element.innerHTML
    const currentBookmark = this.engine.selection.save()
    this._redoStack.push({ html: currentHtml, bookmark: currentBookmark })

    const state = this._undoStack.pop()
    // Re-sanitize to ensure no unsafe content is restored from history
    const sanitizedHtml = this.engine.sanitizer.sanitize(state.html)
    this.engine.element.innerHTML = sanitizedHtml
    this._lastSnapshot = sanitizedHtml
    this._lastNormalized = sanitizedHtml.replace(/\s+/g, ' ').trim()
    this._lastNormalizedHash = djb2Hash(this._lastNormalized)

    if (state.bookmark) {
      this.engine.selection.restore(state.bookmark)
    }

    this._reconnectObserver()
    this._isPerformingUndoRedo = false
    this.engine.eventBus.emit('history:undo')
    this.engine.eventBus.emit('content:change')
  }

  /**
   * Redoes the last undone change by restoring state from the redo stack.
   * The current state is pushed onto the undo stack. Emits history:redo and content:change events.
   * @returns {void}
   */
  redo() {
    if (!this.canRedo()) return

    this._isPerformingUndoRedo = true
    this._disconnectObserver()

    const currentHtml = this.engine.element.innerHTML
    const currentBookmark = this.engine.selection.save()
    this._undoStack.push({ html: currentHtml, bookmark: currentBookmark })

    const state = this._redoStack.pop()
    // Re-sanitize to ensure no unsafe content is restored from history
    const sanitizedHtml = this.engine.sanitizer.sanitize(state.html)
    this.engine.element.innerHTML = sanitizedHtml
    this._lastSnapshot = sanitizedHtml
    this._lastNormalized = sanitizedHtml.replace(/\s+/g, ' ').trim()
    this._lastNormalizedHash = djb2Hash(this._lastNormalized)

    if (state.bookmark) {
      this.engine.selection.restore(state.bookmark)
    }

    this._reconnectObserver()
    this._isPerformingUndoRedo = false
    this.engine.eventBus.emit('history:redo')
    this.engine.eventBus.emit('content:change')
  }

  /**
   * Checks whether there are states available to undo.
   * @returns {boolean} True if the undo stack is not empty
   */
  canUndo() {
    return this._undoStack.length > 0
  }

  /**
   * Checks whether there are states available to redo.
   * @returns {boolean} True if the redo stack is not empty
   */
  canRedo() {
    return this._redoStack.length > 0
  }

  /**
   * Clears all undo and redo history.
   * @returns {void}
   */
  clear() {
    this._undoStack = []
    this._redoStack = []
    this._lastSnapshot = null
    this._lastNormalized = null
    this._lastNormalizedHash = null
  }
}
