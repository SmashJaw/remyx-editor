export class History {
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

  snapshot() {
    if (this._debounceTimer) {
      clearTimeout(this._debounceTimer)
      this._debounceTimer = null
    }
    this._takeSnapshot()
  }

  _debouncedSnapshot() {
    if (this._debounceTimer) {
      clearTimeout(this._debounceTimer)
    }
    this._debounceTimer = setTimeout(() => {
      this._takeSnapshot()
    }, this.debounceMs)
  }

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

  undo() {
    if (!this.canUndo()) return

    this._isPerformingUndoRedo = true
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

    this._isPerformingUndoRedo = false
    this.engine.eventBus.emit('history:undo')
    this.engine.eventBus.emit('content:change')
  }

  redo() {
    if (!this.canRedo()) return

    this._isPerformingUndoRedo = true
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

    this._isPerformingUndoRedo = false
    this.engine.eventBus.emit('history:redo')
    this.engine.eventBus.emit('content:change')
  }

  canUndo() {
    return this._undoStack.length > 0
  }

  canRedo() {
    return this._redoStack.length > 0
  }

  clear() {
    this._undoStack = []
    this._redoStack = []
    this._lastSnapshot = null
  }
}
