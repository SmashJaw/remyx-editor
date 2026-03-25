/**
 * AwarenessProtocol — Cursor and presence tracking for collaborative editing.
 *
 * Tracks the local user's cursor position (as character offset), broadcasts
 * it periodically, renders remote users' cursors as colored overlays, and
 * manages presence state (active/idle/offline).
 */

import { rangeToOffset, offsetToRange } from './CrdtEngine.js'

/**
 * @typedef {Object} AwarenessState
 * @property {{ offset: number, length: number }|null} cursor
 * @property {string} userName
 * @property {string} userColor
 * @property {'active'|'idle'|'offline'} status
 * @property {number} lastActive
 */

const IDLE_TIMEOUT = 30000 // 30 seconds

export class AwarenessProtocol {
  /**
   * @param {string} userId
   * @param {string} userName
   * @param {string} userColor
   */
  constructor(userId, userName, userColor) {
    this.userId = userId

    /** @type {AwarenessState} */
    this._localState = {
      cursor: null,
      userName,
      userColor,
      status: 'active',
      lastActive: Date.now(),
    }

    /** @type {Map<string, AwarenessState>} */
    this._remoteStates = new Map()

    /** @type {number|null} */
    this._broadcastInterval = null

    /** @type {number|null} */
    this._idleTimer = null

    /** @type {HTMLElement|null} */
    this._cursorsContainer = null

    /** @type {number|null} */
    this._renderRafId = null
  }

  // --- Local Cursor ---

  /**
   * Update local cursor position from current browser selection.
   * @param {HTMLElement} element - contenteditable root
   * @param {Object} selection - engine.selection instance
   */
  updateLocalCursor(element, selection) {
    try {
      const sel = window.getSelection()
      if (!sel || sel.rangeCount === 0 || !element.contains(sel.anchorNode)) {
        this._localState.cursor = null
        return
      }
      const range = sel.getRangeAt(0)
      this._localState.cursor = rangeToOffset(element, range)
      this._localState.lastActive = Date.now()
    } catch {
      this._localState.cursor = null
    }
  }

  // --- Presence ---

  /**
   * Set the local user's status.
   * @param {'active'|'idle'|'offline'} status
   */
  setStatus(status) {
    this._localState.status = status
  }

  /**
   * Reset the idle timer (called on user input).
   */
  resetIdleTimer() {
    this._localState.status = 'active'
    this._localState.lastActive = Date.now()
    clearTimeout(this._idleTimer)
    this._idleTimer = setTimeout(() => {
      this._localState.status = 'idle'
    }, IDLE_TIMEOUT)
  }

  // --- Remote State ---

  /**
   * Apply awareness state from a remote user.
   * @param {string} userId
   * @param {AwarenessState} state
   */
  applyRemoteAwareness(userId, state) {
    if (userId === this.userId) return
    this._remoteStates.set(userId, { ...state })
  }

  /**
   * Remove a user (on leave/disconnect).
   * @param {string} userId
   */
  removeUser(userId) {
    this._remoteStates.delete(userId)
  }

  /**
   * Get list of all remote collaborators.
   * @returns {Array<{ userId: string, userName: string, userColor: string, cursor: Object|null, status: string }>}
   */
  getCollaborators() {
    return Array.from(this._remoteStates.entries()).map(([userId, state]) => ({
      userId,
      userName: state.userName,
      userColor: state.userColor,
      cursor: state.cursor,
      status: state.status,
    }))
  }

  // --- Remote Cursor Rendering ---

  /**
   * Render remote cursors as absolutely-positioned overlays.
   * Throttled to requestAnimationFrame.
   * @param {HTMLElement} element - contenteditable root
   */
  renderRemoteCursors(element) {
    if (this._renderRafId) cancelAnimationFrame(this._renderRafId)
    this._renderRafId = requestAnimationFrame(() => {
      this._doRender(element)
    })
  }

  /**
   * @private
   */
  _doRender(element) {
    // Ensure container exists
    if (!this._cursorsContainer) {
      this._cursorsContainer = document.createElement('div')
      this._cursorsContainer.className = 'rmx-collab-cursors-container'
      this._cursorsContainer.setAttribute('aria-hidden', 'true')
      element.parentNode?.insertBefore(this._cursorsContainer, element.nextSibling)
    }

    // Clear existing cursor elements
    this._cursorsContainer.innerHTML = ''

    const editorRect = element.getBoundingClientRect()
    let count = 0

    for (const [userId, state] of this._remoteStates) {
      if (!state.cursor || state.status === 'offline') continue
      if (count >= 20) break // max 20 cursors for performance
      count++

      try {
        const range = offsetToRange(element, state.cursor.offset, state.cursor.length)
        if (!range) continue

        const rects = range.getClientRects()
        if (rects.length === 0) continue

        // Caret line (at the start of the range)
        const startRect = rects[0]
        const caret = document.createElement('div')
        caret.className = 'rmx-collab-cursor'
        caret.style.cssText = `
          left: ${startRect.left - editorRect.left}px;
          top: ${startRect.top - editorRect.top}px;
          height: ${startRect.height}px;
          background-color: ${state.userColor};
        `

        // Name label
        const label = document.createElement('span')
        label.className = 'rmx-collab-cursor-label'
        label.textContent = state.userName
        label.style.backgroundColor = state.userColor
        caret.appendChild(label)

        this._cursorsContainer.appendChild(caret)

        // Selection highlight (if range has length)
        if (state.cursor.length > 0) {
          for (const rect of rects) {
            const highlight = document.createElement('div')
            highlight.className = 'rmx-collab-selection'
            highlight.style.cssText = `
              left: ${rect.left - editorRect.left}px;
              top: ${rect.top - editorRect.top}px;
              width: ${rect.width}px;
              height: ${rect.height}px;
              background-color: ${state.userColor};
            `
            this._cursorsContainer.appendChild(highlight)
          }
        }
      } catch {
        // Skip cursors with invalid positions
      }
    }
  }

  /**
   * Remove all remote cursor overlays.
   * @param {HTMLElement} element
   */
  clearRemoteCursors(element) {
    if (this._cursorsContainer) {
      this._cursorsContainer.innerHTML = ''
    }
  }

  // --- Broadcasting ---

  /**
   * Get the local awareness state for transmission.
   * @returns {AwarenessState}
   */
  getLocalState() {
    return { ...this._localState }
  }

  /**
   * Start periodic awareness broadcasting.
   * @param {function(AwarenessState): void} sendFn - called with state to broadcast
   * @param {number} [intervalMs=1000]
   */
  startBroadcasting(sendFn, intervalMs = 1000) {
    this.stopBroadcasting()
    this._broadcastInterval = setInterval(() => {
      sendFn(this.getLocalState())
    }, intervalMs)
  }

  /**
   * Stop periodic broadcasting.
   */
  stopBroadcasting() {
    if (this._broadcastInterval) {
      clearInterval(this._broadcastInterval)
      this._broadcastInterval = null
    }
  }

  /**
   * Clean up all resources.
   */
  destroy() {
    this.stopBroadcasting()
    clearTimeout(this._idleTimer)
    if (this._renderRafId) cancelAnimationFrame(this._renderRafId)
    if (this._cursorsContainer) {
      this._cursorsContainer.remove()
      this._cursorsContainer = null
    }
    this._remoteStates.clear()
  }
}
