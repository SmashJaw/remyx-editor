import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * React hook for interacting with the CommentsPlugin.
 *
 * Provides reactive state for comment threads and convenience methods
 * for creating, resolving, replying to, and deleting comments.
 *
 * @param {object|null} engine — the EditorEngine instance (from useEditorEngine or onReady)
 * @returns {object} comments API
 */
export function useComments(engine) {
  const [threads, setThreads] = useState([])
  const [activeThread, setActiveThread] = useState(null)
  const unsubsRef = useRef([])

  // Refresh thread list from the plugin
  const refresh = useCallback(() => {
    if (!engine?._comments) return
    setThreads(engine._comments.getAllThreads())
  }, [engine])

  useEffect(() => {
    if (!engine?.eventBus) return

    // Initial load
    refresh()

    // Subscribe to comment lifecycle events
    const events = [
      'comment:created',
      'comment:deleted',
      'comment:resolved',
      'comment:replied',
      'comment:updated',
      'comment:imported',
    ]

    const unsubs = events.map(evt =>
      engine.eventBus.on(evt, refresh)
    )

    // Track which thread is clicked/active
    const unsubClick = engine.eventBus.on('comment:clicked', ({ thread }) => {
      setActiveThread(thread)
    })
    unsubs.push(unsubClick)

    unsubsRef.current = unsubs

    return () => {
      for (const unsub of unsubsRef.current) unsub?.()
      unsubsRef.current = []
    }
  }, [engine, refresh])

  const addComment = useCallback((params) => {
    return engine?._comments?.addComment(params) ?? null
  }, [engine])

  const deleteComment = useCallback((threadId) => {
    engine?._comments?.deleteComment(threadId)
  }, [engine])

  const resolveComment = useCallback((threadId, resolved = true) => {
    engine?._comments?.resolveComment(threadId, resolved)
  }, [engine])

  const replyToComment = useCallback((threadId, params) => {
    return engine?._comments?.replyToComment(threadId, params) ?? null
  }, [engine])

  const editComment = useCallback((threadId, newBody) => {
    engine?._comments?.editComment(threadId, newBody)
  }, [engine])

  const navigateToComment = useCallback((threadId) => {
    engine?._comments?.navigateToComment(threadId)
    const thread = engine?._comments?.getThread(threadId)
    if (thread) setActiveThread(thread)
  }, [engine])

  const importThreads = useCallback((data) => {
    engine?._comments?.importThreads(data)
  }, [engine])

  const exportThreads = useCallback(() => {
    return engine?._comments?.exportThreads() ?? []
  }, [engine])

  const getMentionUsers = useCallback(() => {
    return engine?._comments?.getMentionUsers() ?? []
  }, [engine])

  return {
    /** All comment threads (newest first) */
    threads,
    /** The currently active/clicked thread (or null) */
    activeThread,
    /** Set the active thread manually */
    setActiveThread,
    /** Create a comment on the current selection */
    addComment,
    /** Delete a comment thread by ID */
    deleteComment,
    /** Resolve or unresolve a thread */
    resolveComment,
    /** Add a reply to a thread */
    replyToComment,
    /** Edit a thread's body text */
    editComment,
    /** Scroll to and select the annotated text */
    navigateToComment,
    /** Import threads from serialized data */
    importThreads,
    /** Export all threads as JSON-serializable array */
    exportThreads,
    /** Get the list of available @mention users */
    getMentionUsers,
    /** Force refresh the thread list */
    refresh,
  }
}
