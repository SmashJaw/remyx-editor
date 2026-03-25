import React from 'react'
import PropTypes from 'prop-types'

/**
 * CollaborationBar — Presence indicator showing connected collaborators.
 *
 * Displays a connection status dot, avatar circles for each remote user,
 * and the local user's avatar. Designed to sit above or beside the editor.
 */
function CollaborationBarInner({
  collaborators = [],
  connectionStatus = 'disconnected',
  localUser,
  className = '',
  showCount = true,
}) {
  return (
    <div className={`rmx-collab-bar ${className}`} role="status" aria-label="Collaborators">
      <div
        className="rmx-collab-status-dot"
        data-status={connectionStatus}
        title={connectionStatus}
      />

      {localUser && (
        <div
          className="rmx-collab-avatar rmx-collab-avatar-local"
          style={{ backgroundColor: localUser.userColor }}
          title={`${localUser.userName} (you)`}
        >
          {localUser.userName.charAt(0).toUpperCase()}
        </div>
      )}

      {collaborators.map((c) => (
        <div
          key={c.userId}
          className="rmx-collab-avatar"
          style={{
            backgroundColor: c.userColor,
            opacity: c.status === 'idle' ? 0.6 : 1,
          }}
          title={`${c.userName} (${c.status})`}
        >
          {c.userName.charAt(0).toUpperCase()}
        </div>
      ))}

      {showCount && (
        <span style={{ fontSize: 11, color: '#64748b', marginLeft: 4 }}>
          {collaborators.length + (localUser ? 1 : 0)} user{collaborators.length > 0 ? 's' : ''}
        </span>
      )}
    </div>
  )
}

CollaborationBarInner.propTypes = {
  collaborators: PropTypes.arrayOf(
    PropTypes.shape({
      userId: PropTypes.string.isRequired,
      userName: PropTypes.string.isRequired,
      userColor: PropTypes.string.isRequired,
      status: PropTypes.string,
    })
  ),
  connectionStatus: PropTypes.string,
  localUser: PropTypes.shape({
    userId: PropTypes.string,
    userName: PropTypes.string.isRequired,
    userColor: PropTypes.string.isRequired,
  }),
  className: PropTypes.string,
  showCount: PropTypes.bool,
}

export const CollaborationBar = React.memo(CollaborationBarInner)
