import { useState, useEffect, useRef, useCallback } from 'react'
import PropTypes from 'prop-types'

const FOCUSABLE_SELECTOR = 'input, button:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function FindReplacePanel({ open, onClose, engine }) {
  const [findText, setFindText] = useState('')
  const [replaceText, setReplaceText] = useState('')
  const [caseSensitive, setCaseSensitive] = useState(false)
  const [results, setResults] = useState({ total: 0, current: 0 })
  const [replaceAllMsg, setReplaceAllMsg] = useState('')
  const containerRef = useRef(null)

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
      setReplaceAllMsg('')
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

  // #32: Replace All with count feedback
  const handleReplaceAll = useCallback(() => {
    const count = results.total
    engine.executeCommand('replaceAll', { replaceText })
    setReplaceAllMsg(`Replaced ${count} occurrence${count !== 1 ? 's' : ''}`)
    setTimeout(() => setReplaceAllMsg(''), 3000)
  }, [engine, replaceText, results.total])

  // #31: Escape key handler + focus trap
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
      return
    }

    // Focus trap
    if (e.key === 'Tab' && containerRef.current) {
      const focusable = Array.from(containerRef.current.querySelectorAll(FOCUSABLE_SELECTOR))
      if (focusable.length === 0) { e.preventDefault(); return }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
  }, [onClose])

  if (!open) return null

  return (
    <div
      className="rmx-find-replace-panel"
      onMouseDown={(e) => e.stopPropagation()}
      onKeyDown={handleKeyDown}
      ref={containerRef}
      role="search"
      aria-label="Find and replace"
    >
      <div className="rmx-find-row">
        <label htmlFor="rmx-find-input" className="rmx-sr-only">Find text</label>
        <input
          id="rmx-find-input"
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
        <button type="button" className="rmx-btn rmx-btn-sm" onClick={() => engine.executeCommand('findPrev')} aria-label="Previous match">&#9650;</button>
        <button type="button" className="rmx-btn rmx-btn-sm" onClick={() => engine.executeCommand('findNext')} aria-label="Next match">&#9660;</button>
        <label className="rmx-form-checkbox rmx-find-case">
          <input
            type="checkbox"
            checked={caseSensitive}
            onChange={(e) => setCaseSensitive(e.target.checked)}
            aria-label="Toggle case sensitive search"
          />
          Aa
        </label>
        <button type="button" className="rmx-btn rmx-btn-sm" onClick={onClose} aria-label="Close find and replace">&times;</button>
      </div>
      <div className="rmx-find-row">
        <label htmlFor="rmx-replace-input" className="rmx-sr-only">Replace text</label>
        <input
          id="rmx-replace-input"
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
        <button type="button" className="rmx-btn rmx-btn-sm" onClick={handleReplaceAll}>All</button>
        {replaceAllMsg && <span className="rmx-find-count" role="status">{replaceAllMsg}</span>}
      </div>
    </div>
  )
}

FindReplacePanel.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  engine: PropTypes.object,
}
