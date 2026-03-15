import { cleanPastedHTML, looksLikeMarkdown } from '../utils/pasteClean.js'
import { markdownToHtml } from '../utils/markdownConverter.js'
import { isImportableFile, convertDocument } from '../utils/documentConverter/index.js'
import { DEFAULT_MAX_FILE_SIZE } from '../constants/defaults.js'

export class DragDrop {
  constructor(engine) {
    this.engine = engine
    this._handleDragOver = this._handleDragOver.bind(this)
    this._handleDrop = this._handleDrop.bind(this)
    this._handleDragEnter = this._handleDragEnter.bind(this)
    this._handleDragLeave = this._handleDragLeave.bind(this)
  }

  init() {
    const el = this.engine.element
    el.addEventListener('dragover', this._handleDragOver)
    el.addEventListener('drop', this._handleDrop)
    el.addEventListener('dragenter', this._handleDragEnter)
    el.addEventListener('dragleave', this._handleDragLeave)
  }

  destroy() {
    const el = this.engine.element
    el.removeEventListener('dragover', this._handleDragOver)
    el.removeEventListener('drop', this._handleDrop)
    el.removeEventListener('dragenter', this._handleDragEnter)
    el.removeEventListener('dragleave', this._handleDragLeave)
  }

  _handleDragOver(e) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }

  _handleDragEnter(e) {
    e.preventDefault()
    this.engine.element.classList.add('rmx-drag-over')
  }

  _handleDragLeave(e) {
    if (!this.engine.element.contains(e.relatedTarget)) {
      this.engine.element.classList.remove('rmx-drag-over')
    }
  }

  _handleDrop(e) {
    e.preventDefault()
    this.engine.element.classList.remove('rmx-drag-over')

    const files = Array.from(e.dataTransfer.files)
    const imageFiles = files.filter((f) => f.type.startsWith('image/'))

    if (imageFiles.length > 0) {
      this._handleImageDrop(e, imageFiles)
      return
    }

    // Handle importable document files (PDF, DOCX, etc.)
    const importableFiles = files.filter((f) => !f.type.startsWith('image/') && isImportableFile(f))
    if (importableFiles.length > 0) {
      this._handleDocumentDrop(e, importableFiles)
      return
    }

    // Handle non-image file drops as attachments
    const nonImageFiles = files.filter((f) => !f.type.startsWith('image/'))
    if (nonImageFiles.length > 0 && this.engine.options.uploadHandler) {
      this._handleFileDrop(e, nonImageFiles)
      return
    }

    // Set cursor position at drop point
    this._setCursorAtDropPoint(e)
    this.engine.history.snapshot()

    // Handle dropped HTML content (from other apps / rich text sources)
    const html = e.dataTransfer.getData('text/html')
    if (html) {
      // Run full cleaning pipeline — same as paste
      let cleaned = cleanPastedHTML(html)
      cleaned = this.engine.sanitizer.sanitize(cleaned)
      this.engine.selection.insertHTML(cleaned)
      this.engine.eventBus.emit('content:change')
    } else {
      // Plain text drop — check for markdown and convert
      const text = e.dataTransfer.getData('text/plain')
      if (text) {
        this._handleTextDrop(text)
        this.engine.eventBus.emit('content:change')
      }
    }

    this.engine.eventBus.emit('drop', { files, html })
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

  _handleImageDrop(e, imageFiles) {
    this._setCursorAtDropPoint(e)
    this.engine.history.snapshot()

    imageFiles.filter((f) => !this._exceedsMaxFileSize(f)).forEach((file) => {
      if (this.engine.options.uploadHandler) {
        this.engine.options.uploadHandler(file).then((url) => {
          this.engine.commands.execute('insertImage', { src: url, alt: file.name })
        })
      } else {
        const reader = new FileReader()
        reader.onload = (ev) => {
          this.engine.commands.execute('insertImage', { src: ev.target.result, alt: file.name })
        }
        reader.readAsDataURL(file)
      }
    })
  }

  _handleDocumentDrop(e, files) {
    this._setCursorAtDropPoint(e)
    this.engine.history.snapshot()

    files.filter((f) => !this._exceedsMaxFileSize(f)).forEach((file) => {
      convertDocument(file)
        .then((html) => {
          const sanitized = this.engine.sanitizer.sanitize(html)
          this.engine.selection.insertHTML(sanitized)
          this.engine.eventBus.emit('content:change')
        })
        .catch((err) => {
          console.warn('Document import failed on drop:', err.message)
        })
    })
  }

  _handleFileDrop(e, files) {
    this._setCursorAtDropPoint(e)
    this.engine.history.snapshot()

    files.forEach((file) => {
      this.engine.options.uploadHandler(file).then((url) => {
        this.engine.commands.execute('insertAttachment', {
          url,
          filename: file.name,
          filesize: file.size,
        })
      })
    })
  }

  _setCursorAtDropPoint(e) {
    const range = document.caretRangeFromPoint
      ? document.caretRangeFromPoint(e.clientX, e.clientY)
      : null

    if (range) {
      const sel = window.getSelection()
      sel.removeAllRanges()
      sel.addRange(range)
    }
  }

  /**
   * Handle dropped plain text with smart format detection.
   * Auto-detects markdown and converts to HTML for display.
   */
  _handleTextDrop(text) {
    if (this.engine.outputFormat === 'markdown' || looksLikeMarkdown(text)) {
      let parsedHtml = markdownToHtml(text)
      parsedHtml = this.engine.sanitizer.sanitize(parsedHtml)
      this.engine.selection.insertHTML(parsedHtml)
    } else {
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
}
