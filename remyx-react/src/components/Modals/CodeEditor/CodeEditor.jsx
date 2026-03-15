import React, { useRef, useMemo, useCallback } from 'react'
import { highlightHTML } from './highlightHTML.js'
import { highlightMarkdown } from './highlightMarkdown.js'
import './CodeEditor.css'

export function CodeEditor({ value, onChange, language = 'html' }) {
  const textareaRef = useRef(null)
  const preRef = useRef(null)
  const gutterRef = useRef(null)

  // Tokenize the source for highlighting
  const highlighted = useMemo(() => {
    const highlighter = language === 'markdown' ? highlightMarkdown : highlightHTML
    return highlighter(value || '')
  }, [value, language])

  // Count lines for the gutter
  const lineCount = useMemo(() => {
    return (value || '').split('\n').length
  }, [value])

  // Sync scroll between textarea, pre, and gutter
  const handleScroll = useCallback(() => {
    const ta = textareaRef.current
    if (!ta) return
    if (preRef.current) {
      preRef.current.scrollTop = ta.scrollTop
      preRef.current.scrollLeft = ta.scrollLeft
    }
    if (gutterRef.current) {
      gutterRef.current.scrollTop = ta.scrollTop
    }
  }, [])

  // Tab key inserts 2 spaces
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const ta = e.target
      const start = ta.selectionStart
      const end = ta.selectionEnd
      // Use execCommand to preserve undo stack where supported
      if (document.execCommand) {
        document.execCommand('insertText', false, '  ')
      } else {
        const newValue = value.substring(0, start) + '  ' + value.substring(end)
        onChange(newValue)
        requestAnimationFrame(() => {
          ta.selectionStart = ta.selectionEnd = start + 2
        })
      }
    }
  }, [value, onChange])

  return (
    <div className="rmx-code-editor">
      {/* Line number gutter */}
      <div ref={gutterRef} className="rmx-code-gutter" aria-hidden="true">
        {Array.from({ length: lineCount }, (_, i) => (
          <div key={i} className="rmx-code-line-number">{i + 1}</div>
        ))}
      </div>

      {/* Editor body: highlighted pre + transparent textarea */}
      <div className="rmx-code-body">
        <pre ref={preRef} className="rmx-code-highlight" aria-hidden="true">
          <code>
            {highlighted.map((token, i) =>
              token.className
                ? <span key={i} className={token.className}>{token.text}</span>
                : token.text
            )}
            {'\n'}
          </code>
        </pre>

        <textarea
          ref={textareaRef}
          className="rmx-code-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onScroll={handleScroll}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          data-gramm="false"
        />
      </div>
    </div>
  )
}
