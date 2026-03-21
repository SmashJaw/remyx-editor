import { useState, useRef, useEffect } from 'react'
import PropTypes from 'prop-types'
import { ModalOverlay } from './ModalOverlay.jsx'

// Allowlist-based URL validation for image sources.
// Allows http(s), relative URLs, and safe data URIs (raster images only — SVG blocked
// because data:image/svg+xml can contain embedded <script> and event handlers).
const SAFE_IMAGE_URL = /^\s*(https?:\/\/|\/|\.)/i
const SAFE_DATA_IMAGE = /^\s*data:image\/(png|jpe?g|gif|webp|avif|bmp|ico)(;base64)?,/i

export function ImageModal({ open, onClose, engine, data }) {
  const [tab, setTab] = useState('url')
  const [src, setSrc] = useState('')
  const [alt, setAlt] = useState('')
  const [width, setWidth] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [previewStatus, setPreviewStatus] = useState('idle') // 'idle' | 'loading' | 'loaded' | 'error'
  const fileInputRef = useRef(null)

  // #40: Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setSrc('')
      setAlt('')
      setWidth('')
      setError('')
      setLoading(false)
      setTab('url')
      setPreviewStatus('idle')
    }
  }, [open])

  // #57: Image URL preview
  useEffect(() => {
    if (!src.trim() || tab !== 'url') {
      setPreviewStatus('idle')
      return
    }
    const trimmed = src.trim()
    if (!SAFE_IMAGE_URL.test(trimmed) && !SAFE_DATA_IMAGE.test(trimmed)) {
      setPreviewStatus('idle')
      return
    }
    setPreviewStatus('loading')
  }, [src, tab])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!src.trim() || loading) return
    const trimmedSrc = src.trim()
    // Block anything not matching the allowlist (blocks javascript:, vbscript:, data:image/svg+xml, etc.)
    if (!SAFE_IMAGE_URL.test(trimmedSrc) && !SAFE_DATA_IMAGE.test(trimmedSrc)) return
    if (engine._savedSelection) { engine.selection.restore(engine._savedSelection); engine._savedSelection = null }
    engine.executeCommand('insertImage', {
      src,
      alt,
      width: width ? `${width}px` : undefined,
    })
    onClose()
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    setError('')
    if (engine.options.uploadHandler) {
      setLoading(true)
      engine.options.uploadHandler(file).then((url) => {
        setSrc(url)
        setTab('url')
        setLoading(false)
      }).catch((err) => {
        console.error('Image upload failed:', err)
        setError(err.message || 'Image upload failed. Please try again.')
        setLoading(false)
      })
    } else {
      setLoading(true)
      const reader = new FileReader()
      reader.onload = (ev) => {
        setSrc(ev.target.result)
        setTab('url')
        setLoading(false)
      }
      reader.onerror = () => {
        setError('Failed to read file.')
        setLoading(false)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <ModalOverlay title="Insert Image" open={open} onClose={onClose}>
      <div className="rmx-tabs">
        <button
          type="button"
          className={`rmx-tab ${tab === 'url' ? 'rmx-active' : ''}`}
          onClick={() => setTab('url')}
        >
          URL
        </button>
        <button
          type="button"
          className={`rmx-tab ${tab === 'upload' ? 'rmx-active' : ''}`}
          onClick={() => setTab('upload')}
        >
          Upload
        </button>
      </div>

      {tab === 'upload' && (
        <div className="rmx-upload-area">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="rmx-sr-only"
          />
          <button
            type="button"
            className="rmx-btn rmx-btn-upload"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="rmx-spinner" aria-hidden="true" />
                {' Uploading\u2026'}
              </>
            ) : (
              'Choose Image File'
            )}
          </button>
          <p className="rmx-upload-hint">or drag and drop an image into the editor</p>
        </div>
      )}

      {error && (
        <div className="rmx-form-group rmx-form-error">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="rmx-modal-form">
        {tab === 'url' && (
          <div className="rmx-form-group">
            <label className="rmx-form-label" htmlFor="rmx-image-url">Image URL</label>
            <input
              id="rmx-image-url"
              type="text"
              className="rmx-form-input"
              value={src}
              onChange={(e) => setSrc(e.target.value)}
              placeholder="https://example.com/image.jpg"
              required
              autoFocus
            />
            {/* #57: Image URL preview */}
            {src.trim() && previewStatus !== 'idle' && (
              <div className="rmx-image-url-preview">
                {previewStatus === 'error' ? (
                  <span className="rmx-image-url-preview-error">Image could not be loaded</span>
                ) : (
                  <img
                    src={src.trim()}
                    alt="Preview"
                    onLoad={() => setPreviewStatus('loaded')}
                    onError={() => setPreviewStatus('error')}
                  />
                )}
              </div>
            )}
          </div>
        )}
        <div className="rmx-form-group">
          <label className="rmx-form-label" htmlFor="rmx-image-alt">Alt Text</label>
          <input
            id="rmx-image-alt"
            type="text"
            className="rmx-form-input"
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
            placeholder="Image description"
          />
        </div>
        <div className="rmx-form-group">
          <label className="rmx-form-label" htmlFor="rmx-image-width">Width (px)</label>
          <input
            id="rmx-image-width"
            type="number"
            className="rmx-form-input"
            value={width}
            onChange={(e) => setWidth(e.target.value)}
            placeholder="Auto"
            min="50"
          />
        </div>
        <div className="rmx-modal-actions">
          <button type="button" className="rmx-btn" onClick={onClose}>Cancel</button>
          <button type="submit" className="rmx-btn rmx-btn-primary" disabled={!src.trim() || loading}>
            {loading ? (
              <>
                <span className="rmx-spinner" aria-hidden="true" />
                {' Uploading\u2026'}
              </>
            ) : (
              'Insert'
            )}
          </button>
        </div>
      </form>
    </ModalOverlay>
  )
}

ImageModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  engine: PropTypes.object,
}
