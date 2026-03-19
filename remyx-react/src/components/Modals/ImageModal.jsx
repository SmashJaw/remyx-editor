import { useState, useRef } from 'react'
import PropTypes from 'prop-types'
import { ModalOverlay } from './ModalOverlay.jsx'

// Allowlist-based URL validation for image sources.
// Allows http(s), relative URLs, and safe data URIs (raster images only — SVG blocked
// because data:image/svg+xml can contain embedded <script> and event handlers).
const SAFE_IMAGE_URL = /^\s*(https?:\/\/|\/|\.)/i
const SAFE_DATA_IMAGE = /^\s*data:image\/(png|jpe?g|gif|webp|avif|bmp|ico)(;base64)?,/i

export function ImageModal({ open, onClose, engine }) {
  const [tab, setTab] = useState('url')
  const [src, setSrc] = useState('')
  const [alt, setAlt] = useState('')
  const [width, setWidth] = useState('')
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!src.trim()) return
    const trimmedSrc = src.trim()
    // Block anything not matching the allowlist (blocks javascript:, vbscript:, data:image/svg+xml, etc.)
    if (!SAFE_IMAGE_URL.test(trimmedSrc) && !SAFE_DATA_IMAGE.test(trimmedSrc)) return
    engine.executeCommand('insertImage', {
      src,
      alt,
      width: width ? `${width}px` : undefined,
    })
    onClose()
    setSrc('')
    setAlt('')
    setWidth('')
    setError('')
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    setError('')
    if (engine.options.uploadHandler) {
      engine.options.uploadHandler(file).then((url) => {
        setSrc(url)
        setTab('url')
      }).catch((err) => {
        console.error('Image upload failed:', err)
        setError(err.message || 'Image upload failed. Please try again.')
      })
    } else {
      const reader = new FileReader()
      reader.onload = (ev) => {
        setSrc(ev.target.result)
        setTab('url')
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
            style={{ display: 'none' }}
          />
          <button
            type="button"
            className="rmx-btn rmx-btn-upload"
            onClick={() => fileInputRef.current?.click()}
          >
            Choose Image File
          </button>
          <p className="rmx-upload-hint">or drag and drop an image into the editor</p>
        </div>
      )}

      {error && (
        <div className="rmx-form-group" style={{ color: 'var(--rmx-error, #dc2626)' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="rmx-modal-form">
        {tab === 'url' && (
          <div className="rmx-form-group">
            <label className="rmx-form-label">Image URL</label>
            <input
              type="url"
              className="rmx-form-input"
              value={src}
              onChange={(e) => setSrc(e.target.value)}
              placeholder="https://example.com/image.jpg"
              required
              autoFocus
            />
          </div>
        )}
        <div className="rmx-form-group">
          <label className="rmx-form-label">Alt Text</label>
          <input
            type="text"
            className="rmx-form-input"
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
            placeholder="Image description"
          />
        </div>
        <div className="rmx-form-group">
          <label className="rmx-form-label">Width (px)</label>
          <input
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
          <button type="submit" className="rmx-btn rmx-btn-primary" disabled={!src.trim()}>
            Insert
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
