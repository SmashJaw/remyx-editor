import { useState, useRef } from 'react'
import PropTypes from 'prop-types'
import { ModalOverlay } from './ModalOverlay.jsx'
import { convertDocument, getSupportedExtensions, getSupportedFormatNames } from '@remyxjs/core'

export function ImportDocumentModal({ open, onClose, engine }) {
  const [file, setFile] = useState(null)
  const [converting, setConverting] = useState(false)
  const [preview, setPreview] = useState('')
  const [error, setError] = useState('')
  const [insertMode, setInsertMode] = useState('insert')
  const fileInputRef = useRef(null)

  const handleFileChange = async (e) => {
    const selected = e.target.files[0]
    if (!selected) return

    setFile(selected)
    setError('')
    setConverting(true)
    setPreview('')

    try {
      const html = await convertDocument(selected)
      setPreview(html)
    } catch (err) {
      setError(err.message || 'Failed to convert document')
      setPreview('')
    } finally {
      setConverting(false)
    }
  }

  const handleInsert = () => {
    if (!preview) return
    engine.executeCommand('importDocument', {
      html: preview,
      mode: insertMode,
    })
    handleClose()
  }

  const handleClose = () => {
    onClose()
    setFile(null)
    setConverting(false)
    setPreview('')
    setError('')
    setInsertMode('insert')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const formats = getSupportedFormatNames().join(', ')

  return (
    <ModalOverlay title="Import Document" open={open} onClose={handleClose}>
      <div className="rmx-upload-area">
        <input
          ref={fileInputRef}
          type="file"
          accept={getSupportedExtensions()}
          onChange={handleFileChange}
          className="rmx-sr-only"
        />
        <button
          type="button"
          className="rmx-btn rmx-btn-upload"
          onClick={() => fileInputRef.current?.click()}
          disabled={converting}
        >
          {converting ? 'Converting...' : 'Choose Document'}
        </button>
        <p className="rmx-upload-hint">
          Supported: {formats}
        </p>
        {file && !converting && !error && (
          <p className="rmx-upload-hint rmx-upload-filename">
            {file.name}
          </p>
        )}
      </div>

      {error && (
        <div className="rmx-form-group rmx-form-error">
          {error}
        </div>
      )}

      {preview && (
        <>
          <div className="rmx-form-group">
            <label className="rmx-form-label">Preview</label>
            <div
              className="rmx-import-preview"
              dangerouslySetInnerHTML={{ __html: engine?.sanitizer ? engine.sanitizer.sanitize(preview) : '' }}
            />
          </div>

          <div className="rmx-form-group">
            <label className="rmx-form-label">Insert Mode</label>
            <div className="rmx-radio-group">
              <label className="rmx-radio-label">
                <input
                  type="radio"
                  name="insertMode"
                  value="insert"
                  checked={insertMode === 'insert'}
                  onChange={() => setInsertMode('insert')}
                />
                Insert at cursor
              </label>
              <label className="rmx-radio-label">
                <input
                  type="radio"
                  name="insertMode"
                  value="replace"
                  checked={insertMode === 'replace'}
                  onChange={() => setInsertMode('replace')}
                />
                Replace all content
              </label>
            </div>
          </div>
        </>
      )}

      <div className="rmx-modal-actions">
        <button type="button" className="rmx-btn" onClick={handleClose}>Cancel</button>
        <button
          type="button"
          className="rmx-btn rmx-btn-primary"
          disabled={!preview || converting}
          onClick={handleInsert}
        >
          Insert
        </button>
      </div>
    </ModalOverlay>
  )
}

ImportDocumentModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  engine: PropTypes.object,
}
