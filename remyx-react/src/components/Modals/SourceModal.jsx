import { useState, useEffect } from 'react'
import { ModalOverlay } from './ModalOverlay.jsx'
import { CodeEditor } from './CodeEditor/CodeEditor.jsx'
import { htmlToMarkdown, markdownToHtml, formatHTML } from '@remyxjs/core'

export function SourceModal({ open, onClose, engine }) {
  const [source, setSource] = useState('')
  const isMarkdown = engine?.outputFormat === 'markdown'

  useEffect(() => {
    if (open && engine) {
      const html = engine.getHTML()
      setSource(isMarkdown ? htmlToMarkdown(html) : formatHTML(html))
    }
  }, [open, engine, isMarkdown])

  const handleApply = () => {
    engine.history.snapshot()
    const rawHtml = isMarkdown ? markdownToHtml(source) : source
    // Re-sanitize user-edited HTML to prevent XSS injection via source mode
    const htmlToApply = engine.sanitizer.sanitize(rawHtml)
    // Notify if sanitizer modified the input (unsafe content was stripped)
    if (htmlToApply !== rawHtml) {
      engine.eventBus.emit('source:sanitized', {
        message: 'Some HTML elements or attributes were removed for security.',
      })
    }
    engine.setHTML(htmlToApply)
    engine.eventBus.emit('content:change')
    onClose()
  }

  return (
    <ModalOverlay title={isMarkdown ? 'Markdown Source' : 'Source Code'} open={open} onClose={onClose} width={750}>
      <div className="rmx-modal-form">
        <CodeEditor
          value={source}
          onChange={setSource}
          language={isMarkdown ? 'markdown' : 'html'}
        />
        <div className="rmx-modal-actions">
          <button type="button" className="rmx-btn" onClick={onClose}>Cancel</button>
          <button type="button" className="rmx-btn rmx-btn-primary" onClick={handleApply}>Apply</button>
        </div>
      </div>
    </ModalOverlay>
  )
}
