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
 * Threshold in characters above which diff-based storage is used
 * instead of full snapshots, to reduce memory usage for large documents.
 * @type {number}
 */
const DIFF_THRESHOLD = 5000

/**
 * Compute a simple character-level diff between two strings.
 * Finds the common prefix and suffix, then stores only the middle
 * replacement segment.
 *
 * @param {string} oldStr - The previous HTML string
 * @param {string} newStr - The new HTML string
 * @returns {{ prefixLen: number, suffixLen: number, insert: string }}
 */
function computeDiff(oldStr, newStr) {
  const minLen = Math.min(oldStr.length, newStr.length)

  // Find common prefix length
  let prefixLen = 0
  while (prefixLen < minLen && oldStr[prefixLen] === newStr[prefixLen]) {
    prefixLen++
  }

  // Find common suffix length (not overlapping with prefix)
  let suffixLen = 0
  const maxSuffix = minLen - prefixLen
  while (
    suffixLen < maxSuffix &&
    oldStr[oldStr.length - 1 - suffixLen] === newStr[newStr.length - 1 - suffixLen]
  ) {
    suffixLen++
  }

  // The inserted/replacement segment from the new string
  const insert = newStr.slice(prefixLen, newStr.length - suffixLen || undefined)

  return { prefixLen, suffixLen, insert }
}

/**
 * Apply a diff to reconstruct the new string from the old string.
 *
 * @param {string} baseStr - The base HTML string
 * @param {{ prefixLen: number, suffixLen: number, insert: string }} diff
 * @returns {string} The reconstructed HTML string
 */
function applyDiff(baseStr, diff) {
  const { prefixLen, suffixLen, insert } = diff
  const prefix = baseStr.slice(0, prefixLen)
  const suffix = suffixLen > 0 ? baseStr.slice(baseStr.length - suffixLen) : ''
  return prefix + insert + suffix
}

/**
 * @typedef {Object} HistoryOptions
 * @property {number} [maxSize=100] - Maximum number of undo states to retain
 * @property {number} [debounceMs=300] - Debounce interval in milliseconds for automatic snapshots
 * @property {number} [coalesceMs=1000] - Window in which rapid keystrokes are coalesced into a single undo step
 */

/**
 * @typedef {Object} HistoryEntry
 * @property {'full'|'diff'} type - Whether this is a full snapshot or a diff
 * @property {string} [html] - Full HTML content (when type === 'full')
 * @property {{ prefixLen: number, suffixLen: number, insert: string }} [patch] - Diff patch (when type === 'diff')
 * @property {import('./Selection.js').SelectionBookmark|null} bookmark - Selection bookmark
 */

/**
 * @typedef {Object} HistoryState
 * @property {string} html - The HTML content at the time of the snapshot
 * @property {import('./Selection.js').SelectionBookmark|null} bookmark - The selection bookmark at the time of the snapshot
 */

/**
 * Manages undo/redo history for the editor using DOM mutation observation
 * and debounced snapshots.
 *
 * For documents larger than 5000 characters, uses diff-based compression
 * to store only the changes between states, significantly reducing memory
 * usage for large documents.
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
   * Creates a history entry, using diff compression for large documents.
   *
   * @private
   * @param {string} html - The HTML to store
   * @param {import('./Selection.js').SelectionBookmark|null} bookmark - The selection bookmark
   * @returns {HistoryEntry}
   */
  _createEntry(html, bookmark) {
    // For short content, or when there's no previous snapshot, store full HTML
    if (html.length < DIFF_THRESHOLD || !this._lastSnapshot) {
      return { type: 'full', html, bookmark }
    }

    // For large content, compute and store a diff against the last snapshot
    const patch = computeDiff(this._lastSnapshot, html)

    // If the diff is larger than the full HTML (rare edge case), store full
    if (patch.insert.length >= html.length * 0.8) {
      return { type: 'full', html, bookmark }
    }

    return { type: 'diff', patch, bookmark }
  }

  /**
   * Resolves a history entry to its full HTML string.
   * For full entries, returns html directly. For diff entries,
   * walks backward through the stack to find the base snapshot
   * and applies diffs forward.
   *
   * @private
   * @param {HistoryEntry[]} stack - The stack (undo or redo) containing the entry
   * @param {number} index - Index of the entry in the stack
   * @returns {string} The full HTML string
   */
  _resolveEntry(stack, index) {
    const entry = stack[index]
    if (entry.type === 'full') {
      return entry.html
    }

    // Walk backward to find the nearest full snapshot
    let baseIndex = index - 1
    while (baseIndex >= 0 && stack[baseIndex].type !== 'full') {
      baseIndex--
    }

    // Start from the base full snapshot
    let html
    if (baseIndex >= 0) {
      html = stack[baseIndex].html
    } else {
      // Fallback: use lastSnapshot if no full entry found in stack
      // This shouldn't normally happen since the first entry is always full
      html = this._lastSnapshot || ''
    }

    // Apply diffs forward from baseIndex+1 to index
    for (let i = baseIndex + 1; i <= index; i++) {
      if (stack[i].type === 'diff') {
        html = applyDiff(html, stack[i].patch)
      } else {
        html = stack[i].html
      }
    }

    return html
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
      // Replace the top entry — always store full for the top during coalescing
      // since we're overwriting frequently
      this._undoStack[this._undoStack.length - 1] = this._createEntry(html, bookmark)
    } else {
      this._undoStack.push({ type: 'full', html, bookmark })
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
    // changes like &nbsp; <-> space that produce visually identical content
    const normalized = html.replace(/\s+/g, ' ').trim()

    // Fast path: compare hashes before full string comparison
    const hash = djb2Hash(normalized)
    if (hash === this._lastNormalizedHash && normalized === this._lastNormalized) return

    const bookmark = this.engine.selection.save()
    const entry = this._createEntry(html, bookmark)

    this._undoStack.push(entry)
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
    this._redoStack.push({ type: 'full', html: currentHtml, bookmark: currentBookmark })

    const stateIndex = this._undoStack.length - 1
    const stateHtml = this._resolveEntry(this._undoStack, stateIndex)
    const stateBookmark = this._undoStack[stateIndex].bookmark
    this._undoStack.pop()

    // Re-sanitize to ensure no unsafe content is restored from history
    const sanitizedHtml = this.engine.sanitizer.sanitize(stateHtml)
    this.engine.element.innerHTML = sanitizedHtml
    this._lastSnapshot = sanitizedHtml
    this._lastNormalized = sanitizedHtml.replace(/\s+/g, ' ').trim()
    this._lastNormalizedHash = djb2Hash(this._lastNormalized)

    if (stateBookmark) {
      this.engine.selection.restore(stateBookmark)
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
    this._undoStack.push({ type: 'full', html: currentHtml, bookmark: currentBookmark })

    const stateIndex = this._redoStack.length - 1
    const stateHtml = this._resolveEntry(this._redoStack, stateIndex)
    const stateBookmark = this._redoStack[stateIndex].bookmark
    this._redoStack.pop()

    // Re-sanitize to ensure no unsafe content is restored from history
    const sanitizedHtml = this.engine.sanitizer.sanitize(stateHtml)
    this.engine.element.innerHTML = sanitizedHtml
    this._lastSnapshot = sanitizedHtml
    this._lastNormalized = sanitizedHtml.replace(/\s+/g, ' ').trim()
    this._lastNormalizedHash = djb2Hash(this._lastNormalized)

    if (stateBookmark) {
      this.engine.selection.restore(stateBookmark)
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
