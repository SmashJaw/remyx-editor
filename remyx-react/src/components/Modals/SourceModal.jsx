import React, { useState, useEffect } from 'react'
import { ModalOverlay } from './ModalOverlay.jsx'
import { CodeEditor } from './CodeEditor/CodeEditor.jsx'
import { htmlToMarkdown, markdownToHtml, formatHTML } from '@remyx/core'

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
    const htmlToApply = isMarkdown ? markdownToHtml(source) : source
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
