import { useState, useEffect } from 'react'
import { ModalOverlay } from './ModalOverlay.jsx'

// Allowlist-based protocol validation — safer than a blacklist because new
// dangerous protocols (e.g. mhtml:, ms-*:) are blocked by default.
const SAFE_PROTOCOL = /^\s*(https?|mailto|tel|ftp|ftps):\/?\/?/i
const RELATIVE_URL = /^\s*(\/|#|\?|\.)/

export function LinkModal({ open, onClose, engine, data }) {
  const [href, setHref] = useState('')
  const [text, setText] = useState('')
  const [target, setTarget] = useState('_blank')

  useEffect(() => {
    if (open && data) {
      setHref(data.href || '')
      setText(data.text || '')
      setTarget(data.target || '_blank')
    }
  }, [open, data])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!href.trim()) return
    // Decode percent-encoding before validation to prevent bypasses like java%73cript:
    let trimmedHref
    try {
      trimmedHref = decodeURIComponent(href.trim())
    } catch {
      trimmedHref = href.trim()
    }
    // Block any protocol not in the allowlist (blocks javascript:, vbscript:, data:, mhtml:, etc.)
    if (!SAFE_PROTOCOL.test(trimmedHref) && !RELATIVE_URL.test(trimmedHref)) return

    if (data?.href) {
      engine.executeCommand('editLink', { href, text, target })
    } else {
      engine.executeCommand('insertLink', { href, text, target })
    }
    onClose()
  }

  const handleRemove = () => {
    engine.executeCommand('removeLink')
    onClose()
  }

  return (
    <ModalOverlay title={data?.href ? 'Edit Link' : 'Insert Link'} open={open} onClose={onClose}>
      <form onSubmit={handleSubmit} className="rmx-modal-form">
        <div className="rmx-form-group">
          <label className="rmx-form-label">URL</label>
          <input
            type="url"
            className="rmx-form-input"
            value={href}
            onChange={(e) => setHref(e.target.value)}
            placeholder="https://example.com"
            required
            autoFocus
          />
        </div>
        <div className="rmx-form-group">
          <label className="rmx-form-label">Display Text</label>
          <input
            type="text"
            className="rmx-form-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Link text (optional)"
          />
        </div>
        <div className="rmx-form-group">
          <label className="rmx-form-checkbox">
            <input
              type="checkbox"
              checked={target === '_blank'}
              onChange={(e) => setTarget(e.target.checked ? '_blank' : '_self')}
            />
            Open in new tab
          </label>
        </div>
        <div className="rmx-modal-actions">
          {data?.href && (
            <button type="button" className="rmx-btn rmx-btn-danger" onClick={handleRemove}>
              Remove Link
            </button>
          )}
          <div className="rmx-modal-actions-right">
            <button type="button" className="rmx-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="rmx-btn rmx-btn-primary">
              {data?.href ? 'Update' : 'Insert'}
            </button>
          </div>
        </div>
      </form>
    </ModalOverlay>
  )
}
