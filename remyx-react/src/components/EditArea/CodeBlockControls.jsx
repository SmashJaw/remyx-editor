import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'

/**
 * Default language list when the syntax-highlight plugin is not installed.
 * When installed, the plugin's SUPPORTED_LANGUAGES is used instead.
 */
const DEFAULT_LANGUAGES = [
  { id: 'javascript', label: 'JavaScript' },
  { id: 'python', label: 'Python' },
  { id: 'html', label: 'HTML' },
  { id: 'css', label: 'CSS' },
  { id: 'json', label: 'JSON' },
  { id: 'bash', label: 'Bash' },
  { id: 'sql', label: 'SQL' },
  { id: 'java', label: 'Java' },
  { id: 'go', label: 'Go' },
  { id: 'rust', label: 'Rust' },
  { id: 'plaintext', label: 'Plain Text' },
]

/**
 * CodeBlockControls — Floating language selector that appears above a focused
 * code block. Allows the user to pick or search for a programming language,
 * which then triggers syntax highlighting via the SyntaxHighlightPlugin.
 */
export function CodeBlockControls({ codeBlock, engine, editorRect }) {
  if (!codeBlock || !engine || !editorRect) return null

  const code = codeBlock.querySelector('code')
  const currentLang = code?.getAttribute('data-language') || ''

  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useState('')
  const dropdownRef = useRef(null)
  const inputRef = useRef(null)

  // Close dropdown on outside click
  // Include codeBlock in deps to clean up listener when the target block changes
  useEffect(() => {
    if (!open) return
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
        setFilter('')
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open, codeBlock])

  // Reset dropdown state when the code block changes
  useEffect(() => {
    setOpen(false)
    setFilter('')
  }, [codeBlock])

  // Focus filter input when dropdown opens
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus()
    }
  }, [open])

  const handleSelect = useCallback((langId) => {
    engine.executeCommand('setCodeLanguage', { language: langId })
    setOpen(false)
    setFilter('')
  }, [engine])

  // Use plugin's language list if syntax-highlight is installed, else defaults
  const languages = engine?._syntaxHighlight?.SUPPORTED_LANGUAGES || DEFAULT_LANGUAGES

  const filteredLangs = useMemo(() => languages.filter(
    lang => lang.label.toLowerCase().includes(filter.toLowerCase()) ||
            lang.id.toLowerCase().includes(filter.toLowerCase())
  ), [languages, filter])

  const codeBlockRect = codeBlock.getBoundingClientRect()
  const top = codeBlockRect.top - editorRect.top
  const right = editorRect.right - codeBlockRect.right

  const displayLabel = languages.find(l => l.id === currentLang)?.label || currentLang || 'Auto'

  return (
    <div
      ref={dropdownRef}
      className="rmx-codeblock-controls"
      style={{
        position: 'absolute',
        top: top + 4,
        right: right + 4,
        zIndex: 10,
      }}
      onMouseDown={(e) => e.preventDefault()}
    >
      <button
        className="rmx-codeblock-lang-btn"
        onClick={() => setOpen(!open)}
        type="button"
        title="Change language"
      >
        {displayLabel}
      </button>

      {open && (
        <div className="rmx-codeblock-lang-dropdown">
          <input
            ref={inputRef}
            className="rmx-codeblock-lang-search"
            type="text"
            placeholder="Search languages..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setOpen(false)
                setFilter('')
              } else if (e.key === 'Enter' && filteredLangs.length > 0) {
                handleSelect(filteredLangs[0].id)
              }
            }}
          />
          <ul className="rmx-codeblock-lang-list">
            {filteredLangs.map(lang => (
              <li key={lang.id}>
                <button
                  className={`rmx-codeblock-lang-option ${lang.id === currentLang ? 'rmx-active' : ''}`}
                  onClick={() => handleSelect(lang.id)}
                  type="button"
                >
                  {lang.label}
                </button>
              </li>
            ))}
            {filteredLangs.length === 0 && (
              <li className="rmx-codeblock-lang-empty">No languages found</li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
