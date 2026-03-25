import { useState, useEffect, useRef, useCallback } from 'react'
import PropTypes from 'prop-types'
import { ModalOverlay } from './ModalOverlay.jsx'

const DANGEROUS_PROTOCOL = /^\s*(javascript|vbscript|data\s*:\s*text\/html)\s*:/i

const ALLOWED_EMBED_DOMAINS = [
  { pattern: /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/, toEmbed: (id) => `https://www.youtube.com/embed/${id}` },
  { pattern: /vimeo\.com\/(\d+)/, toEmbed: (id) => `https://player.vimeo.com/video/${id}` },
  { pattern: /dailymotion\.com\/video\/([a-zA-Z0-9]+)/, toEmbed: (id) => `https://www.dailymotion.com/embed/video/${id}` },
]

function getEmbedUrl(url) {
  if (!url) return null
  for (const domain of ALLOWED_EMBED_DOMAINS) {
    const match = url.match(domain.pattern)
    if (match) return domain.toEmbed(match[1])
  }
  return null
}

export function EmbedModal({ open, onClose, engine, data }) {
  const [url, setUrl] = useState('')
  const [previewUrl, setPreviewUrl] = useState(null)
  const [iframeLoaded, setIframeLoaded] = useState(false)
  const debounceRef = useRef(null)

  // Debounce the preview URL update
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!url.trim()) {
      setPreviewUrl(null)
      return
    }
    debounceRef.current = setTimeout(() => {
      setPreviewUrl(getEmbedUrl(url.trim()))
      setIframeLoaded(false)
    }, 500)
    return () => clearTimeout(debounceRef.current)
  }, [url])

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setUrl('')
      setPreviewUrl(null)
    }
  }, [open])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!url.trim()) return
    // Decode percent-encoding before validation to prevent bypasses like java%73cript:
    let decoded
    try {
      decoded = decodeURIComponent(url.trim())
    } catch {
      decoded = url.trim()
    }
    if (DANGEROUS_PROTOCOL.test(decoded)) return
    if (engine._savedSelection) { engine.selection.restore(engine._savedSelection); engine._savedSelection = null }
    engine.executeCommand('embedMedia', { url })
    onClose()
    setUrl('')
  }

  return (
    <ModalOverlay title="Embed Media" open={open} onClose={onClose}>
      <form onSubmit={handleSubmit} className="rmx-modal-form">
        <div className="rmx-form-group">
          <label className="rmx-form-label" htmlFor="rmx-embed-url">Video URL</label>
          <input
            id="rmx-embed-url"
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

        {url.trim() && (
          <div className="rmx-embed-preview">
            {previewUrl ? (
              <div className="rmx-embed-loading-container">
                {!iframeLoaded && <div className="rmx-embed-loading-text">Loading preview...</div>}
                <iframe
                  src={previewUrl}
                  title="Embed preview"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  sandbox="allow-scripts allow-same-origin allow-presentation"
                  onLoad={() => setIframeLoaded(true)}
                />
              </div>
            ) : (
              <div className="rmx-embed-preview-placeholder">
                Enter a valid YouTube, Vimeo, or Dailymotion URL to see a preview
              </div>
            )}
          </div>
        )}

        <div className="rmx-modal-actions">
          <button type="button" className="rmx-btn" onClick={onClose}>Cancel</button>
          <button type="submit" className="rmx-btn rmx-btn-primary" disabled={!url.trim()}>Embed</button>
        </div>
      </form>
    </ModalOverlay>
  )
}

EmbedModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  engine: PropTypes.object,
}
