import React, { useState, useEffect, useRef, useCallback } from 'react'
import { ICON_MAP } from '../../icons/index.jsx'
import { SaveStatus } from '../SaveStatus/SaveStatus.jsx'

function StatusBarInner({ engine, position = 'bottom', saveStatus, showSaveStatus }) {
  const [counts, setCounts] = useState({ wordCount: 0, charCount: 0 })
  const [dirty, setDirty] = useState(false)

  // Shallow comparison before setting counts to avoid unnecessary re-renders
  const updateCounts = useCallback((newCounts) => {
    setCounts(prev => {
      if (prev.wordCount === newCounts.wordCount && prev.charCount === newCounts.charCount) {
        return prev
      }
      return newCounts
    })
  }, [])

  useEffect(() => {
    if (!engine) return
    if (engine._wordCount) updateCounts(engine._wordCount)
    const unsub = engine.eventBus.on('wordcount:update', updateCounts)
    return unsub
  }, [engine, updateCounts])

  // Track dirty state: set on content:change, clear on save
  useEffect(() => {
    if (!engine) return
    const markDirty = () => setDirty(true)
    const markClean = () => setDirty(false)
    const unsubs = [
      engine.eventBus.on('content:change', markDirty),
      engine.eventBus.on('autosave:saved', markClean),
      engine.eventBus.on('save', markClean),
    ]
    return () => unsubs.forEach(fn => fn())
  }, [engine])

  const className = `rmx-statusbar${position === 'top' ? ' rmx-statusbar-top' : ''}`

  // Show "Edited" indicator when content has changed and autosave is not active
  const showDirtyIndicator = dirty && !showSaveStatus

  return (
    <div className={className}>
      {showSaveStatus && (
        <>
          <SaveStatus saveStatus={saveStatus} />
          <span className="rmx-statusbar-sep" aria-hidden="true" />
        </>
      )}
      {showDirtyIndicator && (
        <>
          <span className="rmx-statusbar-dirty" role="status" aria-live="polite">
            <span className="rmx-statusbar-dirty-dot" aria-hidden="true" />
            Edited
          </span>
          <span className="rmx-statusbar-sep" aria-hidden="true" />
        </>
      )}
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

export const StatusBar = React.memo(StatusBarInner)

function WordCountButtonInner({ engine }) {
  const [counts, setCounts] = useState({ wordCount: 0, charCount: 0 })
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  // Shallow comparison before setting counts to avoid unnecessary re-renders
  const updateCounts = useCallback((newCounts) => {
    setCounts(prev => {
      if (prev.wordCount === newCounts.wordCount && prev.charCount === newCounts.charCount) {
        return prev
      }
      return newCounts
    })
  }, [])

  useEffect(() => {
    if (!engine) return
    if (engine._wordCount) updateCounts(engine._wordCount)
    const unsub = engine.eventBus.on('wordcount:update', updateCounts)
    return unsub
  }, [engine, updateCounts])

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
    <div ref={ref} className="rmx-wordcount-btn-wrap rmx-inline-flex-relative">
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

export const WordCountButton = React.memo(WordCountButtonInner)
