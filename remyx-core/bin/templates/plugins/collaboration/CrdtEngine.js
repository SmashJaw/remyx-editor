/**
 * CrdtEngine — Lightweight operation-based CRDT with vector clocks.
 *
 * Captures DOM mutations as serializable operations, applies remote operations
 * to the local DOM, resolves conflicts via last-writer-wins (LWW), and
 * maintains an offline queue for replay on reconnect.
 *
 * Position model: character offsets within element.textContent.
 */

// ---------------------------------------------------------------------------
// Position mapping: char offset ↔ DOM Range
// ---------------------------------------------------------------------------

/**
 * Convert a character offset + length to a DOM Range.
 * @param {HTMLElement} element - contenteditable root
 * @param {number} offset - start character offset
 * @param {number} length - selection length (0 = caret)
 * @returns {Range|null}
 */
export function offsetToRange(element, offset, length = 0) {
  const range = document.createRange()
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null)
  let charCount = 0
  let startSet = false

  while (walker.nextNode()) {
    const node = walker.currentNode
    const nodeLen = node.textContent.length

    if (!startSet && charCount + nodeLen >= offset) {
      range.setStart(node, offset - charCount)
      startSet = true
      if (length === 0) {
        range.setEnd(node, offset - charCount)
        return range
      }
    }

    if (startSet && charCount + nodeLen >= offset + length) {
      range.setEnd(node, offset + length - charCount)
      return range
    }

    charCount += nodeLen
  }

  // Offset beyond content — collapse to end
  if (!startSet) {
    range.selectNodeContents(element)
    range.collapse(false)
  }
  return range
}

/**
 * Convert a DOM Range to character offset + length.
 * @param {HTMLElement} element - contenteditable root
 * @param {Range} range
 * @returns {{ offset: number, length: number }}
 */
export function rangeToOffset(element, range) {
  const preRange = document.createRange()
  preRange.selectNodeContents(element)
  preRange.setEnd(range.startContainer, range.startOffset)
  const offset = preRange.toString().length
  const length = range.toString().length
  return { offset, length }
}

// ---------------------------------------------------------------------------
// Operation types
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} Operation
 * @property {string} id - unique opId (`${userId}-${seqNum}`)
 * @property {'insert'|'delete'|'format'|'replace'} type
 * @property {string} userId
 * @property {Record<string, number>} clock - vector clock snapshot
 * @property {number} timestamp - wall clock for LWW tiebreak
 * @property {number} position - char offset
 * @property {number} [length] - affected length (delete, format, replace)
 * @property {string} [content] - inserted/replaced content (HTML fragment)
 * @property {Object} [format] - format descriptor (format type)
 */

// ---------------------------------------------------------------------------
// CrdtEngine class
// ---------------------------------------------------------------------------

export class CrdtEngine {
  /**
   * @param {string} userId - unique client identifier
   */
  constructor(userId) {
    this.userId = userId
    /** @type {Record<string, number>} */
    this._clock = { [userId]: 0 }
    /** @type {Operation[]} */
    this._pendingOps = []
    /** @type {Set<string>} */
    this._seenOps = new Set()
    /** @type {number} Item 9: Maximum _seenOps size to prevent unbounded growth */
    this._maxSeenOps = 10000
    /** @type {boolean} */
    this._suppressRemote = false
    /** @type {string|null} */
    this._lastTextContent = null
  }

  /**
   * Item 9: Add op ID to _seenOps with bounded size.
   * Evicts oldest entries when exceeding max.
   * @param {string} opId
   */
  _trackOp(opId) {
    this._seenOps.add(opId)
    if (this._seenOps.size > this._maxSeenOps) {
      // Evict oldest entries (Set preserves insertion order)
      const excess = this._seenOps.size - this._maxSeenOps
      const iter = this._seenOps.values()
      for (let i = 0; i < excess; i++) {
        this._seenOps.delete(iter.next().value)
      }
    }
  }

  // --- Vector Clock ---

  /**
   * Increment local clock and return snapshot.
   * @returns {Record<string, number>}
   */
  _tickLocal() {
    this._clock[this.userId] = (this._clock[this.userId] || 0) + 1
    return { ...this._clock }
  }

  /**
   * Point-wise max merge of remote clock into local.
   * @param {Record<string, number>} remoteClock
   */
  _merge(remoteClock) {
    for (const [uid, seq] of Object.entries(remoteClock)) {
      this._clock[uid] = Math.max(this._clock[uid] || 0, seq)
    }
  }

  // --- Operation Capture ---

  /**
   * Capture DOM mutations as operations.
   * Called from MutationObserver callback.
   * @param {MutationRecord[]} mutations
   * @param {HTMLElement} element - contenteditable root
   * @returns {Operation[]}
   */
  captureOperations(mutations, element) {
    if (this._suppressRemote) return []

    const currentText = element.textContent
    const previousText = this._lastTextContent

    if (previousText === null || currentText === previousText) {
      this._lastTextContent = currentText
      return []
    }

    const ops = []
    const clock = this._tickLocal()
    const opId = `${this.userId}-${this._clock[this.userId]}`

    // Diff to find insert/delete
    if (currentText.length > previousText.length) {
      // Insert detected
      const { position, content } = this._findInsert(previousText, currentText)
      const op = {
        id: opId,
        type: 'insert',
        userId: this.userId,
        clock,
        timestamp: Date.now(),
        position,
        content,
      }
      ops.push(op)
      this._trackOp(opId)
    } else if (currentText.length < previousText.length) {
      // Delete detected
      const { position, length } = this._findDelete(previousText, currentText)
      const op = {
        id: opId,
        type: 'delete',
        userId: this.userId,
        clock,
        timestamp: Date.now(),
        position,
        length,
      }
      ops.push(op)
      this._trackOp(opId)
    } else {
      // Same length — likely a replace (character substitution)
      const { position, length, content } = this._findReplace(previousText, currentText)
      if (content !== undefined) {
        const op = {
          id: opId,
          type: 'replace',
          userId: this.userId,
          clock,
          timestamp: Date.now(),
          position,
          length,
          content,
        }
        ops.push(op)
        this._trackOp(opId)
      }
    }

    this._lastTextContent = currentText
    return ops
  }

  /**
   * Find the position and content of an insertion.
   */
  _findInsert(oldText, newText) {
    let start = 0
    while (start < oldText.length && oldText[start] === newText[start]) start++
    const insertedLength = newText.length - oldText.length
    return { position: start, content: newText.substring(start, start + insertedLength) }
  }

  /**
   * Find the position and length of a deletion.
   */
  _findDelete(oldText, newText) {
    let start = 0
    while (start < newText.length && oldText[start] === newText[start]) start++
    const deletedLength = oldText.length - newText.length
    return { position: start, length: deletedLength }
  }

  /**
   * Find a same-length replacement.
   */
  _findReplace(oldText, newText) {
    let start = 0
    while (start < oldText.length && oldText[start] === newText[start]) start++
    if (start >= oldText.length) return {} // no change
    let end = oldText.length - 1
    let endNew = newText.length - 1
    while (end > start && oldText[end] === newText[endNew]) { end--; endNew-- }
    return {
      position: start,
      length: end - start + 1,
      content: newText.substring(start, endNew + 1),
    }
  }

  // --- OT Position Transform ---

  /**
   * Transform a position against a prior operation.
   * @param {number} pos
   * @param {Operation} op
   * @returns {number}
   */
  _transformPosition(pos, op) {
    if (op.type === 'insert') {
      if (op.position <= pos) return pos + op.content.length
    } else if (op.type === 'delete') {
      if (op.position + op.length <= pos) return pos - op.length
      if (op.position < pos) return op.position
    } else if (op.type === 'replace') {
      if (op.position + op.length <= pos) return pos + (op.content.length - op.length)
      if (op.position < pos) return op.position + op.content.length
    }
    return pos
  }

  // --- Applying Remote Operations ---

  /**
   * Apply remote operations to the editor DOM.
   * @param {Operation[]} ops
   * @param {HTMLElement} element - contenteditable root
   */
  applyRemoteOperations(ops, element) {
    // Filter already-seen ops
    const newOps = ops.filter(op => !this._seenOps.has(op.id))
    if (newOps.length === 0) return

    // Sort by causal order (clock sum, then timestamp, then userId for determinism)
    newOps.sort((a, b) => {
      const sumA = Object.values(a.clock).reduce((s, v) => s + v, 0)
      const sumB = Object.values(b.clock).reduce((s, v) => s + v, 0)
      if (sumA !== sumB) return sumA - sumB
      if (a.timestamp !== b.timestamp) return a.timestamp - b.timestamp
      return a.userId.localeCompare(b.userId)
    })

    this._suppressRemote = true

    for (const op of newOps) {
      this._trackOp(op.id)
      this._applyOp(op, element)
    }

    this._lastTextContent = element.textContent
    this._suppressRemote = false
  }

  /**
   * Apply a single operation to the DOM.
   */
  _applyOp(op, element) {
    try {
      if (op.type === 'insert') {
        const range = offsetToRange(element, op.position)
        if (range) {
          range.collapse(true)
          range.insertNode(document.createTextNode(op.content))
          element.normalize()
        }
      } else if (op.type === 'delete') {
        const range = offsetToRange(element, op.position, op.length)
        if (range) {
          range.deleteContents()
          element.normalize()
        }
      } else if (op.type === 'replace') {
        const range = offsetToRange(element, op.position, op.length)
        if (range) {
          range.deleteContents()
          range.insertNode(document.createTextNode(op.content))
          element.normalize()
        }
      }
    } catch (e) {
      // Silently handle position out-of-bounds (can happen with concurrent edits)
      console.warn('[CrdtEngine] Failed to apply remote op:', e.message)
    }
  }

  // --- Offline Queue ---

  /**
   * Queue an operation for later transmission.
   * @param {Operation} op
   */
  queueOperation(op) {
    this._pendingOps.push(op)
  }

  /**
   * Flush and return all pending operations.
   * @returns {Operation[]}
   */
  flushQueue() {
    const ops = [...this._pendingOps]
    this._pendingOps = []
    return ops
  }

  /**
   * @returns {boolean}
   */
  hasPendingOps() {
    return this._pendingOps.length > 0
  }

  // --- State ---

  /**
   * Initialize text content tracking.
   * @param {HTMLElement} element
   */
  initTextContent(element) {
    this._lastTextContent = element.textContent
  }

  /**
   * Get current state for debugging/sync.
   * @returns {{ clock: Record<string, number>, pendingOps: number, seenOps: number }}
   */
  getState() {
    return {
      clock: { ...this._clock },
      pendingOps: this._pendingOps.length,
      seenOps: this._seenOps.size,
    }
  }

  destroy() {
    this._pendingOps = []
    this._seenOps.clear()
    this._lastTextContent = null
  }
}
