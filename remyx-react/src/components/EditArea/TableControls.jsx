import React, { useCallback } from 'react'

export function TableControls({ table, engine, editorRect }) {
  if (!table || !engine || !editorRect) return null

  const tableRect = table.getBoundingClientRect()
  const top = tableRect.top - editorRect.top
  const left = tableRect.left - editorRect.left

  const handleDeleteTable = useCallback(() => {
    if (window.confirm('Are you sure you want to delete this table? This cannot be undone.')) {
      engine.executeCommand('deleteTable')
    }
  }, [engine])

  return (
    <div
      className="rmx-table-controls"
      style={{ position: 'absolute', top: top - 28, left }}
      onMouseDown={(e) => e.preventDefault()}
    >
      <button
        className="rmx-table-control-btn"
        onClick={() => engine.executeCommand('addRowBefore')}
        aria-label="Add row above"
        title="Add row above"
        type="button"
      >
        +Row
      </button>
      <button
        className="rmx-table-control-btn"
        onClick={() => engine.executeCommand('addRowAfter')}
        aria-label="Add row below"
        title="Add row below"
        type="button"
      >
        Row+
      </button>
      <button
        className="rmx-table-control-btn"
        onClick={() => engine.executeCommand('addColBefore')}
        aria-label="Add column before"
        title="Add column before"
        type="button"
      >
        +Col
      </button>
      <button
        className="rmx-table-control-btn"
        onClick={() => engine.executeCommand('addColAfter')}
        aria-label="Add column after"
        title="Add column after"
        type="button"
      >
        Col+
      </button>
      <button
        className="rmx-table-control-btn rmx-danger"
        onClick={handleDeleteTable}
        aria-label="Delete table"
        title="Delete table"
        type="button"
      >
        Delete
      </button>
    </div>
  )
}
