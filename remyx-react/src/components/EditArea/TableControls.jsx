import React from 'react'

export function TableControls({ table, engine, editorRect }) {
  if (!table || !engine || !editorRect) return null

  const tableRect = table.getBoundingClientRect()
  const top = tableRect.top - editorRect.top
  const left = tableRect.left - editorRect.left

  return (
    <div
      className="rmx-table-controls"
      style={{ position: 'absolute', top: top - 28, left }}
      onMouseDown={(e) => e.preventDefault()}
    >
      <button
        className="rmx-table-control-btn"
        onClick={() => engine.executeCommand('addRowBefore')}
        title="Insert Row Above"
        type="button"
      >
        +Row↑
      </button>
      <button
        className="rmx-table-control-btn"
        onClick={() => engine.executeCommand('addRowAfter')}
        title="Insert Row Below"
        type="button"
      >
        +Row↓
      </button>
      <button
        className="rmx-table-control-btn"
        onClick={() => engine.executeCommand('addColBefore')}
        title="Insert Column Left"
        type="button"
      >
        +Col←
      </button>
      <button
        className="rmx-table-control-btn"
        onClick={() => engine.executeCommand('addColAfter')}
        title="Insert Column Right"
        type="button"
      >
        +Col→
      </button>
      <button
        className="rmx-table-control-btn rmx-danger"
        onClick={() => engine.executeCommand('deleteTable')}
        title="Delete Table"
        type="button"
      >
        ×
      </button>
    </div>
  )
}
