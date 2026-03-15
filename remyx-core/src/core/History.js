/**
 * @typedef {Object} HistoryOptions
 * @property {number} [maxSize=100] - Maximum number of undo states to retain
 * @property {number} [debounceMs=300] - Debounce interval in milliseconds for automatic snapshots
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
    this._undoStack = []
    this._redoStack = []
    this._observer = null
    this._debounceTimer = null
    this._isPerformingUndoRedo = false
    this._lastSnapshot = null
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
   * Schedules a debounced snapshot. Resets the timer if already pending.
   * @private
   * @returns {void}
   */
  _debouncedSnapshot() {
    if (this._debounceTimer) {
      clearTimeout(this._debounceTimer)
    }
    this._debounceTimer = setTimeout(() => {
      this._takeSnapshot()
    }, this.debounceMs)
  }

  /**
   * Captures the current editor HTML and selection bookmark, pushing it
   * onto the undo stack. Clears the redo stack. Skips if content is unchanged.
   * @private
   * @returns {void}
   */
  _takeSnapshot() {
    const html = this.engine.element.innerHTML
    if (html === this._lastSnapshot) return

    const bookmark = this.engine.selection.save()
    this._undoStack.push({ html, bookmark })
    if (this._undoStack.length > this.maxSize) {
      this._undoStack.shift()
    }
    this._redoStack = []
    this._lastSnapshot = html
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
  }
}
