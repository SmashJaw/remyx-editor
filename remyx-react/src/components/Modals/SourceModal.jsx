import { useState, useEffect, useRef, useCallback } from 'react'
import PropTypes from 'prop-types'
import { ModalOverlay } from './ModalOverlay.jsx'
import { CodeEditor } from './CodeEditor/CodeEditor.jsx'
import { htmlToMarkdown, markdownToHtml, formatHTML } from '@remyxjs/core'

export function SourceModal({ open, onClose, engine }) {
  const [source, setSource] = useState('')
  const [initialSource, setInitialSource] = useState('')
  const isMarkdown = engine?.outputFormat === 'markdown'

  useEffect(() => {
    if (open && engine) {
      const html = engine.getHTML()
      const formatted = isMarkdown ? htmlToMarkdown(html) : formatHTML(html)
      setSource(formatted)
      setInitialSource(formatted)
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

  // #33: Confirm before discarding unsaved changes
  const handleClose = useCallback(() => {
    if (source !== initialSource) {
      const confirmed = window.confirm('You have unsaved changes. Discard them?')
      if (!confirmed) return
    }
    onClose()
  }, [source, initialSource, onClose])

  return (
    <ModalOverlay title={isMarkdown ? 'Markdown Source' : 'Source Code'} open={open} onClose={handleClose} width={750}>
      <div className="rmx-modal-form">
        <CodeEditor
          value={source}
          onChange={setSource}
          language={isMarkdown ? 'markdown' : 'html'}
        />
        <div className="rmx-modal-actions">
          <button type="button" className="rmx-btn" onClick={handleClose}>Cancel</button>
          <button type="button" className="rmx-btn rmx-btn-primary" onClick={handleApply}>Apply</button>
        </div>
      </div>
    </ModalOverlay>
  )
}

SourceModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  engine: PropTypes.object,
}
