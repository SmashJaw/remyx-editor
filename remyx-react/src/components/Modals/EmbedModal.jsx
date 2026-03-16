import { useState } from 'react'
import { ModalOverlay } from './ModalOverlay.jsx'

const DANGEROUS_PROTOCOL = /^\s*(javascript|vbscript|data\s*:\s*text\/html)\s*:/i

export function EmbedModal({ open, onClose, engine }) {
  const [url, setUrl] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!url.trim()) return
    if (DANGEROUS_PROTOCOL.test(url)) return
    engine.executeCommand('embedMedia', { url })
    onClose()
    setUrl('')
  }

  return (
    <ModalOverlay title="Embed Media" open={open} onClose={onClose}>
      <form onSubmit={handleSubmit} className="rmx-modal-form">
        <div className="rmx-form-group">
          <label className="rmx-form-label">Video URL</label>
          <input
            type="url"
            className="rmx-form-input"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            required
            autoFocus
          />
        </div>
        <p className="rmx-form-hint">Supports YouTube, Vimeo, and Dailymotion URLs</p>
        <div className="rmx-modal-actions">
          <button type="button" className="rmx-btn" onClick={onClose}>Cancel</button>
          <button type="submit" className="rmx-btn rmx-btn-primary" disabled={!url.trim()}>Embed</button>
        </div>
      </form>
    </ModalOverlay>
  )
}
