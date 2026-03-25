import { useState, useCallback } from 'react'
import PropTypes from 'prop-types'
import { ModalOverlay } from './ModalOverlay.jsx'

const MAX_SIZE = 10

export function TablePickerModal({ open, onClose, engine, data }) {
  const [hover, setHover] = useState({ row: 0, col: 0 })
  const [rows, setRows] = useState(3)
  const [cols, setCols] = useState(3)
  const [error, setError] = useState(null)

  const handleInsert = () => {
    try {
      setError(null)
      if (engine._savedSelection) { engine.selection.restore(engine._savedSelection); engine._savedSelection = null }
      engine.executeCommand('insertTable', { rows, cols })
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to insert table')
    }
  }

  // Event delegation handlers for the grid container
  const handleGridMouseOver = useCallback((e) => {
    const cell = e.target.closest('[data-row]')
    if (!cell) return
    const r = parseInt(cell.dataset.row, 10) + 1
    const c = parseInt(cell.dataset.col, 10) + 1
    setHover({ row: r, col: c })
    setRows(r)
    setCols(c)
  }, [])

  const handleGridClick = useCallback((e) => {
    const cell = e.target.closest('[data-row]')
    if (!cell) return
    const r = parseInt(cell.dataset.row, 10) + 1
    const c = parseInt(cell.dataset.col, 10) + 1
    try {
      setError(null)
      if (engine._savedSelection) { engine.selection.restore(engine._savedSelection); engine._savedSelection = null }
      engine.executeCommand('insertTable', { rows: r, cols: c })
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to insert table')
    }
  }, [engine, onClose])

  return (
    <ModalOverlay title="Insert Table" open={open} onClose={onClose} width={320}>
      <div className="rmx-table-picker">
        <div className="rmx-table-grid" onMouseOver={handleGridMouseOver} onClick={handleGridClick} aria-hidden="true">
          {Array.from({ length: MAX_SIZE }, (_, r) => (
            <div key={r} className="rmx-table-grid-row">
              {Array.from({ length: MAX_SIZE }, (_, c) => (
                <div
                  key={c}
                  data-row={r}
                  data-col={c}
                  className={`rmx-table-grid-cell ${r < hover.row && c < hover.col ? 'rmx-active' : ''}`}
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
            <label className="rmx-form-label" htmlFor="rmx-table-rows">Rows</label>
            <input id="rmx-table-rows" type="number" className="rmx-form-input" value={rows} min={1} max={20}
              onChange={(e) => setRows(parseInt(e.target.value) || 1)} />
          </div>
          <div className="rmx-form-group" style={{ flex: 1 }}>
            <label className="rmx-form-label" htmlFor="rmx-table-cols">Columns</label>
            <input id="rmx-table-cols" type="number" className="rmx-form-input" value={cols} min={1} max={20}
              onChange={(e) => setCols(parseInt(e.target.value) || 1)} />
          </div>
        </div>
        {error && <div className="rmx-form-error" style={{ color: '#d32f2f', fontSize: 13, marginBottom: 8 }}>{error}</div>}
        <div className="rmx-modal-actions">
          <button type="button" className="rmx-btn" onClick={onClose}>Cancel</button>
          <button type="button" className="rmx-btn rmx-btn-primary" onClick={handleInsert}>Insert</button>
        </div>
      </div>
    </ModalOverlay>
  )
}

TablePickerModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  engine: PropTypes.object,
}
