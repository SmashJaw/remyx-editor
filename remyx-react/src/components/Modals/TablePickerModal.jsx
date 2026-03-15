import React, { useState } from 'react'
import { ModalOverlay } from './ModalOverlay.jsx'

const MAX_SIZE = 10

export function TablePickerModal({ open, onClose, engine }) {
  const [hover, setHover] = useState({ row: 0, col: 0 })
  const [rows, setRows] = useState(3)
  const [cols, setCols] = useState(3)

  const handleInsert = () => {
    engine.executeCommand('insertTable', { rows, cols })
    onClose()
  }

  return (
    <ModalOverlay title="Insert Table" open={open} onClose={onClose} width={320}>
      <div className="rmx-table-picker">
        <div className="rmx-table-grid">
          {Array.from({ length: MAX_SIZE }, (_, r) => (
            <div key={r} className="rmx-table-grid-row">
              {Array.from({ length: MAX_SIZE }, (_, c) => (
                <div
                  key={c}
                  className={`rmx-table-grid-cell ${r < hover.row && c < hover.col ? 'rmx-active' : ''}`}
                  onMouseEnter={() => {
                    setHover({ row: r + 1, col: c + 1 })
                    setRows(r + 1)
                    setCols(c + 1)
                  }}
                  onClick={() => {
                    setRows(r + 1)
                    setCols(c + 1)
                    handleInsert()
                  }}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="rmx-table-picker-info">{rows} x {cols}</div>
      </div>
      <div className="rmx-modal-form" style={{ marginTop: 12 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div className="rmx-form-group" style={{ flex: 1 }}>
            <label className="rmx-form-label">Rows</label>
            <input type="number" className="rmx-form-input" value={rows} min={1} max={20}
              onChange={(e) => setRows(parseInt(e.target.value) || 1)} />
          </div>
          <div className="rmx-form-group" style={{ flex: 1 }}>
            <label className="rmx-form-label">Columns</label>
            <input type="number" className="rmx-form-input" value={cols} min={1} max={20}
              onChange={(e) => setCols(parseInt(e.target.value) || 1)} />
          </div>
        </div>
        <div className="rmx-modal-actions">
          <button type="button" className="rmx-btn" onClick={onClose}>Cancel</button>
          <button type="button" className="rmx-btn rmx-btn-primary" onClick={handleInsert}>Insert</button>
        </div>
      </div>
    </ModalOverlay>
  )
}
