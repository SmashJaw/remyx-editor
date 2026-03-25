/**
 * CommentsPlugin — inline comment threads and annotations.
 *
 * Wraps selected text in `<mark class="rmx-comment" data-comment-id="…">` elements,
 * maintains an in-memory thread store, emits lifecycle events, and supports
 * resolved/unresolved state, @mentions, and comment-only mode.
 *
 * @param {object} [options]
 * @param {Function} [options.onComment]  — called when a comment thread is created
 * @param {Function} [options.onResolve]  — called when a thread is resolved/unresolved
 * @param {Function} [options.onDelete]   — called when a thread is deleted
 * @param {Function} [options.onReply]    — called when a reply is added to a thread
 * @param {string[]} [options.mentionUsers] — list of usernames for @mention autocomplete
 * @param {boolean}  [options.commentOnly]  — if true, editor is non-editable but comments can be added
 */

import { createPlugin } from '@remyxjs/core'

let _nextId = 1

/** Generate a unique comment ID */
function generateId() {
  return `rmx-comment-${Date.now()}-${_nextId++}`
}

/**
 * Parse @mentions from comment body text.
 * @param {string} text
 * @returns {string[]} matched usernames (without the @ prefix)
 */
export function parseMentions(text) {
  if (!text) return []
  const matches = text.match(/@([\w.-]+)/g)
  return matches ? matches.map(m => m.slice(1)) : []
}

/**
 * @typedef {object} CommentReply
 * @property {string} id
 * @property {string} author
 * @property {string} body
 * @property {string[]} mentions
 * @property {number} createdAt
 */

/**
 * @typedef {object} CommentThread
 * @property {string} id
 * @property {string} author
 * @property {string} body
 * @property {string[]} mentions
 * @property {boolean} resolved
 * @property {number} createdAt
 * @property {number} updatedAt
 * @property {CommentReply[]} replies
 */

export function CommentsPlugin(options = {}) {
  const {
    onComment,
    onResolve,
    onDelete,
    onReply,
    mentionUsers = [],
    commentOnly = false,
  } = options

  /** @type {Map<string, CommentThread>} */
  const threads = new Map()

  let engine = null
  let unsubContentChange = null
  let unsubDestroy = null
  let syncTimer = null

  /**
   * Get all comment threads as an array (newest first).
   * @returns {CommentThread[]}
   */
  function getAllThreads() {
    return Array.from(threads.values()).sort((a, b) => b.createdAt - a.createdAt)
  }

  /**
   * Get a single thread by ID.
   * @param {string} id
   * @returns {CommentThread|undefined}
   */
  function getThread(id) {
    return threads.get(id)
  }

  /**
   * Get only unresolved threads (newest first).
   * @returns {CommentThread[]}
   */
  function getUnresolvedThreads() {
    return getAllThreads().filter(t => !t.resolved)
  }

  /**
   * Get only resolved threads (newest first).
   * @returns {CommentThread[]}
   */
  function getResolvedThreads() {
    return getAllThreads().filter(t => t.resolved)
  }

  /**
   * Create a comment thread on the current selection.
   * @param {object} params
   * @param {string} params.author
   * @param {string} params.body
   * @returns {CommentThread|null}
   */
  function addComment({ author = 'Anonymous', body = '' } = {}) {
    if (!engine) return null
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) return null

    const range = sel.getRangeAt(0)
    // Ensure the selection is inside the editor
    if (!engine.element.contains(range.commonAncestorContainer)) return null

    const id = generateId()
    const now = Date.now()
    const mentions = parseMentions(body)

    const thread = {
      id,
      author,
      body,
      mentions,
      resolved: false,
      createdAt: now,
      updatedAt: now,
      replies: [],
    }

    // Wrap the selected text in a <mark>
    engine.history.snapshot()
    const mark = document.createElement('mark')
    mark.className = 'rmx-comment'
    mark.setAttribute('data-comment-id', id)
    mark.setAttribute('data-comment-resolved', 'false')
    mark.setAttribute('title', `${author}: ${body}`)

    try {
      range.surroundContents(mark)
    } catch {
      // surroundContents fails if range crosses element boundaries.
      // Fall back to extracting and re-inserting.
      const fragment = range.extractContents()
      mark.appendChild(fragment)
      range.insertNode(mark)
    }

    sel.removeAllRanges()
    threads.set(id, thread)

    engine.eventBus.emit('comment:created', { thread })
    engine.eventBus.emit('content:change')
    onComment?.(thread)

    return thread
  }

  /**
   * Add a reply to an existing thread.
   * @param {string} threadId
   * @param {object} params
   * @param {string} params.author
   * @param {string} params.body
   * @returns {CommentReply|null}
   */
  function replyToComment(threadId, { author = 'Anonymous', body = '' } = {}) {
    const thread = threads.get(threadId)
    if (!thread) return null

    const reply = {
      id: generateId(),
      author,
      body,
      mentions: parseMentions(body),
      createdAt: Date.now(),
    }

    thread.replies.push(reply)
    thread.updatedAt = Date.now()

    engine?.eventBus.emit('comment:replied', { thread, reply })
    onReply?.({ thread, reply })

    return reply
  }

  /**
   * Resolve or unresolve a thread.
   * @param {string} threadId
   * @param {boolean} [resolved=true]
   */
  function resolveComment(threadId, resolved = true) {
    const thread = threads.get(threadId)
    if (!thread) return

    thread.resolved = resolved
    thread.updatedAt = Date.now()

    // Update the DOM marker
    const mark = engine?.element.querySelector(`[data-comment-id="${threadId}"]`)
    if (mark) {
      mark.setAttribute('data-comment-resolved', String(resolved))
      if (resolved) {
        mark.classList.add('rmx-comment-resolved')
      } else {
        mark.classList.remove('rmx-comment-resolved')
      }
    }

    engine?.eventBus.emit('comment:resolved', { thread, resolved })
    onResolve?.({ thread, resolved })
  }

  /**
   * Delete a comment thread and remove its highlight from the DOM.
   * @param {string} threadId
   */
  function deleteComment(threadId) {
    const thread = threads.get(threadId)
    if (!thread) return

    // Unwrap the <mark> — keep the text content
    const mark = engine?.element.querySelector(`[data-comment-id="${threadId}"]`)
    if (mark) {
      engine.history.snapshot()
      const parent = mark.parentNode
      while (mark.firstChild) {
        parent.insertBefore(mark.firstChild, mark)
      }
      parent.removeChild(mark)
      parent.normalize()
      engine.eventBus.emit('content:change')
    }

    threads.delete(threadId)
    engine?.eventBus.emit('comment:deleted', { thread })
    onDelete?.(thread)
  }

  /**
   * Edit a comment thread's body text.
   * @param {string} threadId
   * @param {string} newBody
   */
  function editComment(threadId, newBody) {
    const thread = threads.get(threadId)
    if (!thread) return

    thread.body = newBody
    thread.mentions = parseMentions(newBody)
    thread.updatedAt = Date.now()

    // Update the title attribute on the mark
    const mark = engine?.element.querySelector(`[data-comment-id="${threadId}"]`)
    if (mark) {
      mark.setAttribute('title', `${thread.author}: ${newBody}`)
    }

    engine?.eventBus.emit('comment:updated', { thread })
  }

  /**
   * Navigate to (scroll into view and select) the annotated text for a thread.
   * @param {string} threadId
   */
  function navigateToComment(threadId) {
    const mark = engine?.element.querySelector(`[data-comment-id="${threadId}"]`)
    if (!mark) return

    mark.scrollIntoView?.({ behavior: 'smooth', block: 'center' })

    // Select the annotated text
    const sel = window.getSelection()
    const range = document.createRange()
    range.selectNodeContents(mark)
    sel.removeAllRanges()
    sel.addRange(range)

    engine?.eventBus.emit('comment:navigated', { threadId })
  }

  /**
   * Import threads from serialized data (e.g., from a server).
   * Matches threads to existing data-comment-id marks in the DOM.
   * @param {CommentThread[]} importedThreads
   */
  function importThreads(importedThreads) {
    for (const t of importedThreads) {
      threads.set(t.id, { ...t })
    }
    engine?.eventBus.emit('comment:imported', { count: importedThreads.length })
  }

  /**
   * Export all threads as a plain JSON-serializable array.
   * @returns {CommentThread[]}
   */
  function exportThreads() {
    return getAllThreads().map(t => ({ ...t, replies: [...t.replies] }))
  }

  /**
   * Sync threads with DOM — remove threads whose marks no longer exist.
   */
  function syncWithDOM() {
    if (!engine) return
    for (const [id] of threads) {
      const mark = engine.element.querySelector(`[data-comment-id="${id}"]`)
      if (!mark) {
        threads.delete(id)
      }
    }
  }

  /**
   * Get the list of available mention users.
   * @returns {string[]}
   */
  function getMentionUsers() {
    return [...mentionUsers]
  }

  return createPlugin({
    name: 'comments',
    requiresFullAccess: true,

    commands: [
      {
        name: 'addComment',
        execute(eng, params) { return addComment(params) },
        isEnabled(eng) {
          const sel = window.getSelection()
          return sel && !sel.isCollapsed && eng.element.contains(sel.anchorNode)
        },
        meta: { icon: 'comment', tooltip: 'Add Comment' },
      },
      {
        name: 'deleteComment',
        execute(eng, threadId) { deleteComment(threadId) },
        meta: { icon: 'trash', tooltip: 'Delete Comment' },
      },
      {
        name: 'resolveComment',
        execute(eng, threadId, resolved) { resolveComment(threadId, resolved) },
        meta: { icon: 'check', tooltip: 'Resolve Comment' },
      },
      {
        name: 'replyToComment',
        execute(eng, threadId, params) { return replyToComment(threadId, params) },
        meta: { icon: 'reply', tooltip: 'Reply to Comment' },
      },
      {
        name: 'editComment',
        execute(eng, threadId, newBody) { editComment(threadId, newBody) },
        meta: { icon: 'edit', tooltip: 'Edit Comment' },
      },
      {
        name: 'navigateToComment',
        execute(eng, threadId) { navigateToComment(threadId) },
        meta: { icon: 'navigate', tooltip: 'Go to Comment' },
      },
    ],

    contextMenuItems: [
      {
        label: 'Add Comment',
        command: 'addComment',
        when: (eng) => {
          const sel = window.getSelection()
          return sel && !sel.isCollapsed
        },
      },
    ],

    init(eng) {
      engine = eng

      // Expose the comments API on the engine for external access
      engine._comments = {
        addComment,
        deleteComment,
        resolveComment,
        replyToComment,
        editComment,
        navigateToComment,
        getAllThreads,
        getThread,
        getUnresolvedThreads,
        getResolvedThreads,
        importThreads,
        exportThreads,
        syncWithDOM,
        getMentionUsers,
      }

      // Comment-only mode: make editor non-editable but keep comment functionality
      if (commentOnly) {
        engine.element.setAttribute('contenteditable', 'false')
        engine.element.classList.add('rmx-comment-only')
      }

      // Scan existing marks in the DOM (e.g., from imported HTML)
      const existingMarks = engine.element.querySelectorAll('[data-comment-id]')
      for (const mark of existingMarks) {
        const id = mark.getAttribute('data-comment-id')
        if (!threads.has(id)) {
          threads.set(id, {
            id,
            author: 'Imported',
            body: mark.getAttribute('title') || '',
            mentions: [],
            resolved: mark.getAttribute('data-comment-resolved') === 'true',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            replies: [],
          })
        }
      }

      // Item 10: Remove MutationObserver, rely on content:change with 100ms debounce
      unsubContentChange = engine.eventBus.on('content:change', () => {
        clearTimeout(syncTimer)
        syncTimer = setTimeout(syncWithDOM, 100)
      })

      // Click handler — emit event when a comment mark is clicked
      engine.element.addEventListener('click', handleClick)

      // Cleanup on engine destroy
      unsubDestroy = engine.eventBus.on('destroy', cleanup)
    },

    destroy() {
      cleanup()
    },
  })

  function handleClick(e) {
    const mark = e.target.closest?.('[data-comment-id]')
    if (mark) {
      const threadId = mark.getAttribute('data-comment-id')
      const thread = threads.get(threadId)
      if (thread) {
        engine.eventBus.emit('comment:clicked', { thread, element: mark })
      }
    }
  }

  function cleanup() {
    clearTimeout(syncTimer)
    syncTimer = null
    unsubContentChange?.()
    unsubDestroy?.()
    engine?.element?.removeEventListener('click', handleClick)
    if (commentOnly && engine?.element) {
      engine.element.removeAttribute('contenteditable')
      engine.element.classList.remove('rmx-comment-only')
    }
    engine = null
  }
}
