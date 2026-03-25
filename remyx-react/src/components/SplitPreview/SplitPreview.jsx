import React, { useState, useEffect, useCallback, useRef } from 'react'
import { htmlToMarkdown } from '@remyxjs/core'

/**
 * SplitPreview — side-by-side preview pane showing rendered HTML or markdown source.
 * Shown when split view is active. Updates on content:change.
 * Task 246: Debounced content update with 200ms timeout.
 */
export const SplitPreview = React.memo(function SplitPreview({ engine, format }) {
  const [content, setContent] = useState('')
  const previewFormat = format || 'html'
  const debounceRef = useRef(null)

  const updateContent = useCallback(() => {
    if (!engine) return
    const html = engine.getHTML()
    if (previewFormat === 'markdown') {
      setContent(htmlToMarkdown(html))
    } else {
      setContent(html)
    }
  }, [engine, previewFormat])

  useEffect(() => {
    if (!engine) return
    const debouncedUpdate = () => {
      clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(updateContent, 200)
    }
    const unsub = engine.eventBus.on('content:change', debouncedUpdate)
    updateContent() // Initial content without debounce
    return () => {
      unsub()
      clearTimeout(debounceRef.current)
    }
  }, [engine, updateContent])

  return (
    <div className="rmx-split-preview-container" style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      <div className="rmx-split-preview-label">
        <span>{previewFormat === 'markdown' ? 'Markdown' : 'HTML'} Preview</span>
      </div>
      <div className="rmx-split-preview">
        {content}
      </div>
    </div>
  )
})
