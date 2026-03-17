import React from 'react'

/**
 * Compute a human-readable relative time string from a timestamp.
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @returns {string}
 */
function formatTimeAgo(timestamp) {
  if (!timestamp) return 'a previous session'

  const seconds = Math.floor((Date.now() - timestamp) / 1000)

  if (seconds < 10) return 'just now'
  if (seconds < 60) return `${seconds} seconds ago`

  const minutes = Math.floor(seconds / 60)
  if (minutes === 1) return '1 minute ago'
  if (minutes < 60) return `${minutes} minutes ago`

  const hours = Math.floor(minutes / 60)
  if (hours === 1) return '1 hour ago'
  if (hours < 24) return `${hours} hours ago`

  const days = Math.floor(hours / 24)
  if (days === 1) return 'yesterday'
  return `${days} days ago`
}

/**
 * Recovery banner shown above the edit area when autosaved content
 * is detected that differs from the current editor content.
 *
 * @param {{ recoveryData: {recoveredContent: string, timestamp: number}|null, onRecover: () => void, onDismiss: () => void }} props
 */
function RecoveryBannerInner({ recoveryData, onRecover, onDismiss }) {
  if (!recoveryData) return null

  const timeAgo = formatTimeAgo(recoveryData.timestamp)

  return (
    <div className="rmx-recovery-banner" role="alert">
      <svg
        className="rmx-recovery-banner-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
      <span className="rmx-recovery-banner-text">
        Unsaved changes found from {timeAgo}
      </span>
      <div className="rmx-recovery-banner-actions">
        <button
          className="rmx-recovery-btn rmx-recovery-btn--restore"
          onClick={onRecover}
          type="button"
        >
          Restore
        </button>
        <button
          className="rmx-recovery-btn rmx-recovery-btn--dismiss"
          onClick={onDismiss}
          type="button"
        >
          Dismiss
        </button>
      </div>
    </div>
  )
}

export const RecoveryBanner = React.memo(RecoveryBannerInner)
