import { useState, useRef } from 'react'
import PropTypes from 'prop-types'
import { ModalOverlay } from './ModalOverlay.jsx'

const DANGEROUS_PROTOCOL = /^\s*(javascript|vbscript|data\s*:\s*text\/html)\s*:/i

export function AttachmentModal({ open, onClose, engine }) {
  const [tab, setTab] = useState('url')
  const [url, setUrl] = useState('')
  const [filename, setFilename] = useState('')
  const [filesize, setFilesize] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)

  const hasUploadHandler = !!engine?.options?.uploadHandler

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
    engine.executeCommand('insertAttachment', {
      url,
      filename: filename || 'file',
      filesize,
    })
    handleClose()
  }

  const handleClose = () => {
    onClose()
    setUrl('')
    setFilename('')
    setFilesize(null)
    setUploading(false)
    setError('')
    setTab('url')
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    setFilename(file.name)
    setFilesize(file.size)

    if (engine.options.uploadHandler) {
      setUploading(true)
      setError('')
      engine.options.uploadHandler(file)
        .then((resultUrl) => {
          setUrl(resultUrl)
          setTab('url')
          setUploading(false)
        })
        .catch((err) => {
          console.error('File upload failed:', err)
          setError(err.message || 'File upload failed. Please try again.')
          setUploading(false)
        })
    }
  }

  return (
    <ModalOverlay title="Attach File" open={open} onClose={handleClose}>
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
          {hasUploadHandler ? (
            <>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <button
                type="button"
                className="rmx-btn rmx-btn-upload"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? 'Uploading...' : 'Choose File'}
              </button>
              <p className="rmx-upload-hint">or drag and drop a file into the editor</p>
            </>
          ) : (
            <p className="rmx-upload-hint">
              File upload is not available. Provide an <code>uploadHandler</code> prop to enable uploads, or use the URL tab to link to a file directly.
            </p>
          )}
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
            <label className="rmx-form-label">File URL</label>
            <input
              type="url"
              className="rmx-form-input"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/document.pdf"
              required
              autoFocus
            />
          </div>
        )}
        <div className="rmx-form-group">
          <label className="rmx-form-label">Display Name</label>
          <input
            type="text"
            className="rmx-form-input"
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            placeholder="document.pdf"
          />
        </div>
        <div className="rmx-modal-actions">
          <button type="button" className="rmx-btn" onClick={handleClose}>Cancel</button>
          <button type="submit" className="rmx-btn rmx-btn-primary" disabled={!url.trim() || uploading}>
            Insert
          </button>
        </div>
      </form>
    </ModalOverlay>
  )
}

AttachmentModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  engine: PropTypes.object,
}
