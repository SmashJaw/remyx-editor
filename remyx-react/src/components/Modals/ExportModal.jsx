import React from 'react'
import { ModalOverlay } from './ModalOverlay.jsx'
import { exportAsMarkdown, exportAsPDF, exportAsDocx } from '@remyx/core'

export function ExportModal({ open, onClose, engine }) {
  const handlePDF = () => {
    exportAsPDF(engine.getHTML())
    onClose()
  }

  const handleMarkdown = () => {
    exportAsMarkdown(engine.getHTML())
    onClose()
  }

  const handleDocx = () => {
    exportAsDocx(engine.getHTML())
    onClose()
  }

  return (
    <ModalOverlay title="Export Document" open={open} onClose={onClose} width={360}>
      <div className="rmx-export-options">
        <button type="button" className="rmx-export-btn" onClick={handlePDF}>
          <span className="rmx-export-btn-label">PDF</span>
          <span className="rmx-export-btn-hint">Opens print dialog to save as PDF</span>
        </button>
        <button type="button" className="rmx-export-btn" onClick={handleMarkdown}>
          <span className="rmx-export-btn-label">Markdown</span>
          <span className="rmx-export-btn-hint">Downloads .md file</span>
        </button>
        <button type="button" className="rmx-export-btn" onClick={handleDocx}>
          <span className="rmx-export-btn-label">Word Document</span>
          <span className="rmx-export-btn-hint">Downloads .doc file</span>
        </button>
      </div>
    </ModalOverlay>
  )
}
