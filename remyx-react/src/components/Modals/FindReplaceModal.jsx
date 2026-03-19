import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'

export function FindReplacePanel({ open, onClose, engine }) {
  const [findText, setFindText] = useState('')
  const [replaceText, setReplaceText] = useState('')
  const [caseSensitive, setCaseSensitive] = useState(false)
  const [results, setResults] = useState({ total: 0, current: 0 })

  useEffect(() => {
    if (!engine) return
    const unsub = engine.eventBus.on('find:results', setResults)
    return unsub
  }, [engine])

  useEffect(() => {
    if (!open) {
      engine?.executeCommand('clearFind')
      setFindText('')
      setReplaceText('')
      setResults({ total: 0, current: 0 })
    }
  }, [open, engine])

  const handleFind = () => {
    if (!findText.trim()) return
    try {
      engine.executeCommand('find', { text: findText, caseSensitive })
    } catch (err) {
      console.error('Find command failed:', err)
    }
  }

  if (!open) return null

  return (
    <div className="rmx-find-replace-panel" onMouseDown={(e) => e.stopPropagation()}>
      <div className="rmx-find-row">
        <input
          type="text"
          className="rmx-form-input rmx-find-input"
          value={findText}
          onChange={(e) => setFindText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              if (results.total > 0) {
                engine.executeCommand('findNext')
              } else {
                handleFind()
              }
            }
          }}
          placeholder="Find..."
          autoFocus
        />
        <span className="rmx-find-count">
          {results.total > 0 ? `${results.current}/${results.total}` : 'No results'}
        </span>
        <button type="button" className="rmx-btn rmx-btn-sm" onClick={handleFind}>Find</button>
        <button type="button" className="rmx-btn rmx-btn-sm" onClick={() => engine.executeCommand('findPrev')}>&#9650;</button>
        <button type="button" className="rmx-btn rmx-btn-sm" onClick={() => engine.executeCommand('findNext')}>&#9660;</button>
        <label className="rmx-form-checkbox rmx-find-case">
          <input type="checkbox" checked={caseSensitive} onChange={(e) => setCaseSensitive(e.target.checked)} />
          Aa
        </label>
        <button type="button" className="rmx-btn rmx-btn-sm" onClick={onClose}>×</button>
      </div>
      <div className="rmx-find-row">
        <input
          type="text"
          className="rmx-form-input rmx-find-input"
          value={replaceText}
          onChange={(e) => setReplaceText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              engine.executeCommand('replace', { replaceText })
            }
          }}
          placeholder="Replace..."
        />
        <button type="button" className="rmx-btn rmx-btn-sm" onClick={() => engine.executeCommand('replace', { replaceText })}>Replace</button>
        <button type="button" className="rmx-btn rmx-btn-sm" onClick={() => engine.executeCommand('replaceAll', { replaceText })}>All</button>
      </div>
    </div>
  )
}

FindReplacePanel.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  engine: PropTypes.object,
}
