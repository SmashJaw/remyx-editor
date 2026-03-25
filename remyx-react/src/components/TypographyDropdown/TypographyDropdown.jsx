import React, { useState, useRef, useEffect, useCallback } from 'react'

/**
 * TypographyDropdown — toolbar dropdown for line height, letter spacing,
 * and paragraph spacing. Uses the same inline style wrapping pattern as fontSize.
 */

const LINE_HEIGHT_OPTIONS = ['1', '1.15', '1.5', '1.7', '2', '2.5', '3']
const LETTER_SPACING_OPTIONS = ['-0.5px', '0', '0.5px', '1px', '1.5px', '2px', '3px', '5px']
const PARAGRAPH_SPACING_OPTIONS = ['0', '4px', '8px', '12px', '16px', '24px', '32px']

export const TypographyDropdown = React.memo(function TypographyDropdown({ engine, itemStyle }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const handleToggle = useCallback((e) => {
    e.preventDefault()
    setOpen(prev => !prev)
  }, [])

  const handleMouseDown = useCallback((e) => e.preventDefault(), [])

  const handleLineHeight = useCallback((e) => {
    engine?.executeCommand('lineHeight', e.target.value)
  }, [engine])

  const handleLetterSpacing = useCallback((e) => {
    engine?.executeCommand('letterSpacing', e.target.value)
  }, [engine])

  const handleParagraphSpacing = useCallback((e) => {
    engine?.executeCommand('paragraphSpacing', e.target.value)
  }, [engine])

  return (
    <div className="rmx-typography-dropdown" ref={ref} style={itemStyle || undefined}>
      <button
        className="rmx-toolbar-btn"
        onClick={handleToggle}
        onMouseDown={handleMouseDown}
        title="Typography"
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 4h12M5 4v10M13 4v10M7 14h-4M15 14h-4M6 9h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
      {open && (
        <div className="rmx-typography-menu" onMouseDown={handleMouseDown}>
          <div className="rmx-typography-row">
            <label>Line Height</label>
            <select onChange={handleLineHeight} defaultValue="">
              <option value="" disabled>Select...</option>
              {LINE_HEIGHT_OPTIONS.map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>
          <div className="rmx-typography-row">
            <label>Letter Spacing</label>
            <select onChange={handleLetterSpacing} defaultValue="">
              <option value="" disabled>Select...</option>
              {LETTER_SPACING_OPTIONS.map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>
          <div className="rmx-typography-row">
            <label>Paragraph Spacing</label>
            <select onChange={handleParagraphSpacing} defaultValue="">
              <option value="" disabled>Select...</option>
              {PARAGRAPH_SPACING_OPTIONS.map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  )
})
