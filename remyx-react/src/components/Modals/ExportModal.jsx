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
        <div className="rmx-form-group rmx-form-error">
          {error}
        </div>
      )}
      <div className="rmx-export-options">
        <button
          type="button"
          className="rmx-export-btn"
          onClick={() => handleExport(exportAsPDF)}
          aria-label="Export as PDF — Opens print dialog"
        >
          <span className="rmx-export-btn-label">PDF</span>
          <span className="rmx-export-btn-hint">Opens print dialog to save as PDF</span>
        </button>
        <button
          type="button"
          className="rmx-export-btn"
          onClick={() => handleExport(exportAsMarkdown)}
          aria-label="Export as Markdown — Downloads .md file"
        >
          <span className="rmx-export-btn-label">Markdown</span>
          <span className="rmx-export-btn-hint">Downloads .md file</span>
        </button>
        <button
          type="button"
          className="rmx-export-btn"
          onClick={() => handleExport(exportAsDocx)}
          aria-label="Export as Word Document — Downloads .doc file"
        >
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
