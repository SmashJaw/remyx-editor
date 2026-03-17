import { cleanPastedHTML, looksLikeMarkdown } from '../utils/pasteClean.js'
import { markdownToHtml } from '../utils/markdownConverter.js'
import { isImportableFile, convertDocument } from '../utils/documentConverter/index.js'
import { DEFAULT_MAX_FILE_SIZE } from '../constants/defaults.js'

export class Clipboard {
  constructor(engine) {
    this.engine = engine
    this._handlePaste = this._handlePaste.bind(this)
    this._handleCopy = this._handleCopy.bind(this)
    this._handleCut = this._handleCut.bind(this)
  }

  init() {
    this.engine.element.addEventListener('paste', this._handlePaste)
    this.engine.element.addEventListener('copy', this._handleCopy)
    this.engine.element.addEventListener('cut', this._handleCut)
  }

  destroy() {
    this.engine.element.removeEventListener('paste', this._handlePaste)
    this.engine.element.removeEventListener('copy', this._handleCopy)
    this.engine.element.removeEventListener('cut', this._handleCut)
  }

  _handlePaste(e) {
    e.preventDefault()
    this.engine.history.snapshot()

    const clipboardData = e.clipboardData || window.clipboardData
    let html = clipboardData.getData('text/html')
    const text = clipboardData.getData('text/plain')

    // Handle file paste (images and attachments)
    const files = Array.from(clipboardData.files || [])
    const imageFile = files.find((f) => f.type.startsWith('image/'))
    if (imageFile) {
      this._handleImagePaste(imageFile)
      return
    }

    // Handle importable document files (PDF, DOCX, etc.)
    const importableFiles = files.filter((f) => !f.type.startsWith('image/') && isImportableFile(f))
    if (importableFiles.length > 0) {
      // Serialize async conversions to prevent race conditions with insertHTML
      const validFiles = importableFiles.filter((f) => !this._exceedsMaxFileSize(f))
      let chain = Promise.resolve()
      for (const file of validFiles) {
        chain = chain.then(() =>
          convertDocument(file)
            .then((html) => {
              const sanitized = this.engine.sanitizer.sanitize(html)
              this.engine.selection.insertHTML(sanitized)
              this.engine.eventBus.emit('content:change')
            })
            .catch((err) => {
              console.warn('Document import failed on paste:', err.message)
            })
        )
      }
      return
    }

    // Handle non-image file paste as attachment
    const nonImageFiles = files.filter((f) => !f.type.startsWith('image/'))
    if (nonImageFiles.length > 0 && this.engine.options.uploadHandler) {
      nonImageFiles.forEach((file) => {
        this.engine.options.uploadHandler(file).then((url) => {
          this.engine.commands.execute('insertAttachment', {
            url,
            filename: file.name,
            filesize: file.size,
          })
        }).catch((err) => {
          console.error(`File upload failed for "${file.name}":`, err)
          this.engine.eventBus.emit('upload:error', { file, error: err })
        })
      })
      return
    }

    if (html) {
      // Rich text paste — clean source-specific markup, then sanitize
      html = cleanPastedHTML(html)
      html = this.engine.sanitizer.sanitize(html)
      this.engine.selection.insertHTML(html)
    } else if (text) {
      this._handleTextPaste(text)
    }

    this.engine.eventBus.emit('paste', { html, text })
    this.engine.eventBus.emit('content:change')
  }

  /**
   * Handle plain-text paste with smart format detection.
   * - In markdown mode: always parse as markdown
   * - In HTML mode: auto-detect markdown patterns and convert,
   *   otherwise treat as plain text with paragraph wrapping
   */
  _handleTextPaste(text) {
    if (this.engine.outputFormat === 'markdown' || looksLikeMarkdown(text)) {
      // Convert markdown → HTML for display in the editor
      let parsedHtml = markdownToHtml(text)
      parsedHtml = this.engine.sanitizer.sanitize(parsedHtml)
      this.engine.selection.insertHTML(parsedHtml)
    } else {
      // Plain text — escape HTML entities and wrap in paragraphs
      const escaped = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
      const formatted = escaped
        .split(/\n\n+/)
        .map((para) => `<p>${para.replace(/\n/g, '<br>')}</p>`)
        .join('')
      this.engine.selection.insertHTML(formatted || '<p><br></p>')
    }
  }

  _handleCopy() {
    // Let browser handle default copy behavior
  }

  _handleCut() {
    // Let browser handle default cut, just record for undo
    setTimeout(() => {
      this.engine.eventBus.emit('content:change')
    }, 0)
  }

  /**
   * Check if a file exceeds the configured maximum size.
   * @param {File} file
   * @returns {boolean} true if the file is too large
   */
  _exceedsMaxFileSize(file) {
    const maxSize = this.engine.options.maxFileSize ?? DEFAULT_MAX_FILE_SIZE
    if (maxSize > 0 && file.size > maxSize) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1)
      const limitMB = (maxSize / (1024 * 1024)).toFixed(0)
      console.warn(`[Remyx] File "${file.name}" (${sizeMB} MB) exceeds the ${limitMB} MB limit.`)
      this.engine.eventBus.emit('file:too-large', { file, maxSize })
      return true
    }
    return false
  }

  _handleImagePaste(file) {
    if (this._exceedsMaxFileSize(file)) return

    if (this.engine.options.uploadHandler) {
      this.engine.options.uploadHandler(file).then((url) => {
        this.engine.commands.execute('insertImage', { src: url, alt: file.name })
      }).catch((err) => {
        console.error(`Image upload failed for "${file.name}":`, err)
        this.engine.eventBus.emit('upload:error', { file, error: err })
      })
    } else {
      const reader = new FileReader()
      reader.onload = (e) => {
        const src = e.target.result
        this.engine.commands.execute('insertImage', { src, alt: file.name })
      }
      reader.readAsDataURL(file)
    }
  }
}
