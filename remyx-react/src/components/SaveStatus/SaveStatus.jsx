import React from 'react'
import PropTypes from 'prop-types'

const STATUS_LABELS = {
  saved: 'Saved',
  saving: 'Saving\u2026',
  unsaved: 'Unsaved changes',
  error: 'Save failed',
}

/**
 * Inline save-status indicator for the StatusBar.
 * Renders a colored dot and label reflecting the current autosave state.
 *
 * @param {{ saveStatus: 'saved'|'saving'|'unsaved'|'error', lastSaved?: number }} props
 */
function SaveStatusInner({ saveStatus }) {
  const label = STATUS_LABELS[saveStatus] || ''
  const className = `rmx-save-status rmx-save-status--${saveStatus}`

  return (
    <span className={className} role="status" aria-live="polite">
      <span className="rmx-save-status-dot" aria-hidden="true" />
      <span className="rmx-save-status-label">{label}</span>
    </span>
  )
}

export const SaveStatus = React.memo(SaveStatusInner)

SaveStatus.propTypes = {
  saveStatus: PropTypes.oneOf(['saved', 'saving', 'unsaved', 'error']).isRequired,
}
