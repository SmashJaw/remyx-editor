import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { ModalOverlay } from './ModalOverlay.jsx'
import { exportAsMarkdown, exportAsPDF, exportAsDocx } from '@remyxjs/core'

export function ExportModal({ open, onClose, engine }) {
  const [error, setError] = useState('')

  const handleExport = (exportFn) => {
    try {
      setError('')
      exportFn(engine.getHTML())
      onClose()
    } catch (err) {
      console.error('Export failed:', err)
      setError(err.message || 'Export failed. Please try again.')
    }
  }

  const handleClose = () => {
    setError('')
    onClose()
  }

  return (
    <ModalOverlay title="Export Document" open={open} onClose={handleClose} width={360}>
      {error && (
        <div className="rmx-form-group" style={{ color: 'var(--rmx-error, #dc2626)' }}>
          {error}
        </div>
      )}
      <div className="rmx-export-options">
        <button type="button" className="rmx-export-btn" onClick={() => handleExport(exportAsPDF)}>
          <span className="rmx-export-btn-label">PDF</span>
          <span className="rmx-export-btn-hint">Opens print dialog to save as PDF</span>
        </button>
        <button type="button" className="rmx-export-btn" onClick={() => handleExport(exportAsMarkdown)}>
          <span className="rmx-export-btn-label">Markdown</span>
          <span className="rmx-export-btn-hint">Downloads .md file</span>
        </button>
        <button type="button" className="rmx-export-btn" onClick={() => handleExport(exportAsDocx)}>
          <span className="rmx-export-btn-label">Word Document</span>
          <span className="rmx-export-btn-hint">Downloads .doc file</span>
        </button>
      </div>
    </ModalOverlay>
  )
}

ExportModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  engine: PropTypes.object,
}
