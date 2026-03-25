import { cleanPastedHTML } from '../utils/pasteClean.js'
import { isImportableFile, convertDocument } from '../utils/documentConverter/index.js'
import { exceedsMaxFileSize } from '../utils/fileValidation.js'
import { insertPlainText } from '../utils/insertPlainText.js'

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
      // Serialize uploads to prevent race conditions with concurrent insertAttachment calls
      let chain = Promise.resolve()
      for (const file of nonImageFiles) {
        chain = chain.then(() =>
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
        )
      }
      return
    }

    // Table-aware paste: if caret is in a table cell and clipboard has TSV or table HTML
    const caretCell = this._getCaretCell()
    if (caretCell) {
      const table = caretCell.closest('table')
      if (table) {
        // Try TSV paste first
        if (text && this._looksLikeTSV(text)) {
          this._pasteIntoTable(table, caretCell, text)
          this.engine.eventBus.emit('paste', { html, text })
          this.engine.eventBus.emit('content:change')
          return
        }
        // Try HTML table paste
        if (html && /<table/i.test(html)) {
          const cleaned = cleanPastedHTML(html)
          const tsvFromHtml = this._htmlTableToTSV(cleaned)
          if (tsvFromHtml) {
            this._pasteIntoTable(table, caretCell, tsvFromHtml)
            this.engine.eventBus.emit('paste', { html, text })
            this.engine.eventBus.emit('content:change')
            return
          }
        }
      }
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
   * Task 256: Uses shared insertPlainText utility.
   */
  _handleTextPaste(text) {
    insertPlainText(this.engine, text)
  }

  _handleCopy(e) {
    // Table-aware copy: if selection is within a table, generate clean HTML + TSV
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) return

    const anchor = sel.anchorNode?.nodeType === Node.TEXT_NODE
      ? sel.anchorNode.parentElement : sel.anchorNode
    const focus = sel.focusNode?.nodeType === Node.TEXT_NODE
      ? sel.focusNode.parentElement : sel.focusNode

    const anchorTable = anchor?.closest?.('table.rmx-table')
    const focusTable = focus?.closest?.('table.rmx-table')

    if (anchorTable && focusTable && anchorTable === focusTable) {
      // Selection is within a single table — produce TSV + clean HTML
      const table = anchorTable
      const rows = table.querySelectorAll('thead tr, tbody tr')
      const tsvLines = []
      let htmlRows = ''

      for (const row of rows) {
        if (row.classList.contains('rmx-row-hidden')) continue
        const cells = row.querySelectorAll('td, th')
        const tsvCells = []
        let htmlCells = ''
        for (const cell of cells) {
          const text = cell.textContent.trim()
          // Escape TSV: if text contains tab or newline, quote it
          if (text.includes('\t') || text.includes('\n') || text.includes('"')) {
            tsvCells.push('"' + text.replace(/"/g, '""') + '"')
          } else {
            tsvCells.push(text)
          }
          const tag = cell.tagName.toLowerCase()
          htmlCells += `<${tag}>${cell.innerHTML}</${tag}>`
        }
        tsvLines.push(tsvCells.join('\t'))
        htmlRows += `<tr>${htmlCells}</tr>`
      }

      const tsv = tsvLines.join('\n')
      const html = `<table><tbody>${htmlRows}</tbody></table>`

      e.preventDefault()
      e.clipboardData.setData('text/plain', tsv)
      e.clipboardData.setData('text/html', html)
    }
    // Otherwise let browser handle default copy
  }

  _handleCut() {
    // Capture state before the cut happens
    this.engine.history.snapshot()
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
    return exceedsMaxFileSize(file, this.engine.options.maxFileSize, { eventBus: this.engine.eventBus })
  }

  _getCaretCell() {
    const sel = window.getSelection()
    if (!sel || !sel.anchorNode) return null
    const node = sel.anchorNode.nodeType === Node.TEXT_NODE
      ? sel.anchorNode.parentElement : sel.anchorNode
    return node?.closest?.('td, th') || null
  }

  _looksLikeTSV(text) {
    if (!text.includes('\t')) return false
    const lines = text.trim().split('\n')
    if (lines.length < 1) return false
    // Check if at least first line has tabs
    return lines[0].includes('\t')
  }

  _htmlTableToTSV(html) {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    const table = doc.querySelector('table')
    if (!table) return null
    const lines = []
    const rows = table.querySelectorAll('tr')
    for (const row of rows) {
      const cells = row.querySelectorAll('td, th')
      lines.push(Array.from(cells).map(c => c.textContent.trim()).join('\t'))
    }
    return lines.join('\n')
  }

  _pasteIntoTable(table, startCell, tsv) {
    const tbody = table.querySelector('tbody') || table
    const rows = tsv.trim().split('\n').map(line => line.split('\t'))
    const allRows = Array.from(table.querySelectorAll('tbody tr'))
    const startRow = startCell.closest('tr')
    let startRowIdx = allRows.indexOf(startRow)
    if (startRowIdx < 0) startRowIdx = 0
    let startColIdx = 0
    let prev = startCell.previousElementSibling
    while (prev) {
      startColIdx += prev.colSpan || 1
      prev = prev.previousElementSibling
    }

    for (let r = 0; r < rows.length; r++) {
      const rowIdx = startRowIdx + r
      // Add rows if needed
      while (allRows.length <= rowIdx) {
        const firstRow = allRows[0] || startRow
        const colCount = firstRow ? firstRow.cells.length : rows[0].length
        const newRow = document.createElement('tr')
        for (let c = 0; c < colCount; c++) {
          const td = document.createElement('td')
          td.innerHTML = '<br>'
          newRow.appendChild(td)
        }
        tbody.appendChild(newRow)
        allRows.push(newRow)
      }

      const tr = allRows[rowIdx]
      for (let c = 0; c < rows[r].length; c++) {
        const colIdx = startColIdx + c
        // Add columns if needed
        while (tr.cells.length <= colIdx) {
          const td = document.createElement('td')
          td.innerHTML = '<br>'
          tr.appendChild(td)
          // Also add to other rows for consistency
          allRows.forEach((otherRow, idx) => {
            if (idx !== rowIdx && otherRow.cells.length <= colIdx) {
              const otherTd = document.createElement('td')
              otherTd.innerHTML = '<br>'
              otherRow.appendChild(otherTd)
            }
          })
        }
        const cell = tr.cells[colIdx]
        if (cell) {
          cell.textContent = rows[r][c]
        }
      }
    }
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
      reader.onprogress = (e) => {
        if (e.lengthComputable) {
          this.engine.eventBus.emit('upload:progress', {
            loaded: e.loaded,
            total: e.total,
            percent: Math.round((e.loaded / e.total) * 100),
          })
        }
      }
      reader.onload = (e) => {
        const src = e.target.result
        this.engine.commands.execute('insertImage', { src, alt: file.name })
      }
      reader.readAsDataURL(file)
    }
  }
}
