import React, { useState, useCallback, useRef } from 'react'

/**
 * Format a timestamp as a relative time string.
 * @param {number} ts — timestamp in milliseconds
 * @returns {string}
 */
function timeAgo(ts) {
  const seconds = Math.floor((Date.now() - ts) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

/**
 * Render body text with @mentions highlighted.
 */
function CommentBody({ text }) {
  if (!text) return null
  const parts = text.split(/(@[\w.-]+)/g)
  return (
    <span>
      {parts.map((part, i) =>
        part.startsWith('@') ? (
          <span key={i} className="rmx-comment-mention">{part}</span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  )
}

/**
 * CommentsPanel — sidebar component displaying all comment threads.
 *
 * @param {object} props
 * @param {import('../../hooks/useComments.js').CommentThread[]} props.threads
 * @param {object|null} props.activeThread
 * @param {Function} props.onNavigate — called with threadId when a thread is clicked
 * @param {Function} props.onResolve — called with (threadId, resolved)
 * @param {Function} props.onDelete  — called with threadId
 * @param {Function} props.onReply   — called with (threadId, { author, body })
 * @param {string}   [props.className] — additional CSS class
 * @param {'all'|'open'|'resolved'} [props.filter='all'] — which threads to show
 */
function CommentsPanelInner({
  threads = [],
  activeThread,
  onNavigate,
  onResolve,
  onDelete,
  onReply,
  className = '',
  filter = 'all',
}) {
  const [replyingTo, setReplyingTo] = useState(null)
  const [replyText, setReplyText] = useState('')
  const replyInputRef = useRef(null)

  const filteredThreads = threads.filter(t => {
    if (filter === 'open') return !t.resolved
    if (filter === 'resolved') return t.resolved
    return true
  })

  const unresolvedCount = threads.filter(t => !t.resolved).length

  const handleReplySubmit = useCallback((threadId) => {
    if (!replyText.trim()) return
    onReply?.(threadId, { author: 'You', body: replyText.trim() })
    setReplyText('')
    setReplyingTo(null)
  }, [replyText, onReply])

  const startReply = useCallback((threadId) => {
    setReplyingTo(threadId)
    setReplyText('')
    requestAnimationFrame(() => replyInputRef.current?.focus())
  }, [])

  return (
    <div className={`rmx-comments-panel ${className}`.trim()} role="complementary" aria-label="Comments">
      <div className="rmx-comments-panel-header">
        <span>Comments</span>
        <span className="rmx-comments-panel-count">
          {unresolvedCount} open · {threads.length - unresolvedCount} resolved
        </span>
      </div>

      {filteredThreads.length === 0 ? (
        <div style={{ color: 'var(--rmx-text-secondary)', fontSize: 13, padding: '8px 0' }}>
          {filter === 'resolved'
            ? 'No resolved comments'
            : filter === 'open'
            ? 'No open comments'
            : 'No comments yet. Select text and click "Add Comment" to start.'}
        </div>
      ) : (
        filteredThreads.map((thread) => (
          <div
            key={thread.id}
            className={`rmx-comment-thread${thread.resolved ? ' rmx-resolved' : ''}${
              activeThread?.id === thread.id ? ' rmx-active' : ''
            }`}
            onClick={() => onNavigate?.(thread.id)}
          >
            <div className="rmx-comment-thread-header">
              <span className="rmx-comment-author">{thread.author}</span>
              <span className="rmx-comment-time">{timeAgo(thread.createdAt)}</span>
            </div>

            <div className="rmx-comment-body">
              <CommentBody text={thread.body} />
            </div>

            <span className={`rmx-comment-status ${thread.resolved ? 'rmx-closed' : 'rmx-open'}`}>
              {thread.resolved ? 'Resolved' : 'Open'}
            </span>

            {/* Replies */}
            {thread.replies.map((reply) => (
              <div key={reply.id} className="rmx-comment-reply">
                <div className="rmx-comment-thread-header">
                  <span className="rmx-comment-author">{reply.author}</span>
                  <span className="rmx-comment-time">{timeAgo(reply.createdAt)}</span>
                </div>
                <div className="rmx-comment-body">
                  <CommentBody text={reply.body} />
                </div>
              </div>
            ))}

            {/* Reply input */}
            {replyingTo === thread.id && (
              <div className="rmx-comment-reply" style={{ marginTop: 6 }}>
                <input
                  ref={replyInputRef}
                  type="text"
                  placeholder="Reply..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleReplySubmit(thread.id)
                    if (e.key === 'Escape') setReplyingTo(null)
                  }}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    width: '100%',
                    padding: '4px 8px',
                    fontSize: 12,
                    border: '1px solid var(--rmx-border, #e2e8f0)',
                    borderRadius: 4,
                    outline: 'none',
                  }}
                />
              </div>
            )}

            {/* Actions */}
            <div className="rmx-comment-actions" onClick={(e) => e.stopPropagation()}>
              <button
                className="rmx-comment-action-btn"
                onClick={() => startReply(thread.id)}
              >
                Reply
              </button>
              <button
                className="rmx-comment-action-btn rmx-resolve-btn"
                onClick={() => onResolve?.(thread.id, !thread.resolved)}
              >
                {thread.resolved ? 'Reopen' : 'Resolve'}
              </button>
              <button
                className="rmx-comment-action-btn rmx-delete-btn"
                onClick={() => onDelete?.(thread.id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

export const CommentsPanel = React.memo(CommentsPanelInner)
