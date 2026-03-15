import React, { useState, useEffect, useRef } from 'react'
import { ICON_MAP } from '../../icons/index.jsx'

export function StatusBar({ engine, position = 'bottom' }) {
  const [counts, setCounts] = useState(() => engine?._wordCount || { wordCount: 0, charCount: 0 })

  useEffect(() => {
    if (!engine) return
    if (engine._wordCount) setCounts(engine._wordCount)
    const unsub = engine.eventBus.on('wordcount:update', setCounts)
    return unsub
  }, [engine])

  const className = `rmx-statusbar${position === 'top' ? ' rmx-statusbar-top' : ''}`

  return (
    <div className={className}>
      <span className="rmx-statusbar-item">
        {counts.wordCount} {counts.wordCount === 1 ? 'word' : 'words'}
      </span>
      <span className="rmx-statusbar-sep" aria-hidden="true" />
      <span className="rmx-statusbar-item">
        {counts.charCount} {counts.charCount === 1 ? 'character' : 'characters'}
      </span>
    </div>
  )
}

export function WordCountButton({ engine }) {
  const [counts, setCounts] = useState(() => engine?._wordCount || { wordCount: 0, charCount: 0 })
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!engine) return
    if (engine._wordCount) setCounts(engine._wordCount)
    const unsub = engine.eventBus.on('wordcount:update', setCounts)
    return unsub
  }, [engine])

  // Close popover on outside click
  useEffect(() => {
    if (!open) return
    const handle = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open])

  const WordCountIcon = ICON_MAP.findReplace

  return (
    <div ref={ref} className="rmx-wordcount-btn-wrap" style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        className={`rmx-toolbar-btn ${open ? 'rmx-active' : ''}`}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setOpen(o => !o)
        }}
        onMouseDown={(e) => e.preventDefault()}
        title="Word Count"
        type="button"
        aria-label="Word Count"
        aria-expanded={open}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 7h16M4 12h10M4 17h12" />
        </svg>
      </button>
      {open && (
        <div className="rmx-wordcount-popover">
          <div className="rmx-wordcount-popover-row">
            <span className="rmx-wordcount-popover-label">Words</span>
            <span className="rmx-wordcount-popover-value">{counts.wordCount}</span>
          </div>
          <div className="rmx-wordcount-popover-row">
            <span className="rmx-wordcount-popover-label">Characters</span>
            <span className="rmx-wordcount-popover-value">{counts.charCount}</span>
          </div>
        </div>
      )}
    </div>
  )
}
