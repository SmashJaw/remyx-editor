import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { Clipboard } from '../core/Clipboard.js'

vi.mock('../utils/pasteClean.js', () => ({
  cleanPastedHTML: vi.fn((html) => html),
  looksLikeMarkdown: vi.fn(() => false),
}))

vi.mock('../utils/markdownConverter.js', () => ({
  markdownToHtml: vi.fn((text) => `<p>${text}</p>`),
}))

vi.mock('../utils/documentConverter/index.js', () => ({
  isImportableFile: vi.fn(() => false),
  convertDocument: vi.fn(() => Promise.resolve('<p>converted</p>')),
}))

vi.mock('../utils/fileValidation.js', () => ({
  exceedsMaxFileSize: vi.fn(() => false),
}))

vi.mock('../utils/insertPlainText.js', () => ({
  insertPlainText: vi.fn(),
}))

import { cleanPastedHTML } from '../utils/pasteClean.js'
import { exceedsMaxFileSize } from '../utils/fileValidation.js'
import { insertPlainText } from '../utils/insertPlainText.js'

function createMockEngine() {
  const element = document.createElement('div')
  element.contentEditable = 'true'
  document.body.appendChild(element)
  return {
    element,
    options: { uploadHandler: null, maxFileSize: 10 * 1024 * 1024 },
    selection: { insertHTML: vi.fn(), save: vi.fn(), restore: vi.fn() },
    history: { snapshot: vi.fn() },
    eventBus: { emit: vi.fn() },
    sanitizer: { sanitize: vi.fn((html) => html) },
    commands: { execute: vi.fn() },
    outputFormat: 'html',
  }
}

function createPasteEvent({ html = '', text = '', files = [] } = {}) {
  const event = new Event('paste', { bubbles: true, cancelable: true })
  event.clipboardData = {
    getData: vi.fn((type) => {
      if (type === 'text/html') return html
      if (type === 'text/plain') return text
      return ''
    }),
    files,
  }
  return event
}

describe('Clipboard — extended coverage', () => {
  let clipboard, engine

  beforeEach(() => {
    engine = createMockEngine()
    clipboard = new Clipboard(engine)
    cleanPastedHTML.mockImplementation((html) => html)
    exceedsMaxFileSize.mockReturnValue(false)
    insertPlainText.mockImplementation(() => {})
  })

  afterEach(() => {
    clipboard.destroy()
    engine.element.remove()
    vi.restoreAllMocks()
  })

  describe('_looksLikeTSV', () => {
    it('returns true when text has tabs', () => {
      expect(clipboard._looksLikeTSV('A\tB\n1\t2')).toBe(true)
    })
    it('returns false when text has no tabs', () => {
      expect(clipboard._looksLikeTSV('hello world')).toBe(false)
    })
    it('returns false for empty string', () => {
      expect(clipboard._looksLikeTSV('')).toBe(false)
    })
  })

  describe('_htmlTableToTSV', () => {
    it('converts HTML table to TSV string', () => {
      const html = '<table><tr><td>A</td><td>B</td></tr><tr><td>1</td><td>2</td></tr></table>'
      expect(clipboard._htmlTableToTSV(html)).toBe('A\tB\n1\t2')
    })
    it('returns null when no table found', () => {
      expect(clipboard._htmlTableToTSV('<p>not a table</p>')).toBeNull()
    })
  })

  describe('_pasteIntoTable', () => {
    it('pastes TSV data into existing table cells', () => {
      const table = document.createElement('table')
      const tbody = document.createElement('tbody')
      const row1 = document.createElement('tr')
      const td1 = document.createElement('td')
      td1.textContent = 'old'
      const td2 = document.createElement('td')
      td2.textContent = 'old2'
      row1.appendChild(td1)
      row1.appendChild(td2)
      tbody.appendChild(row1)
      table.appendChild(tbody)

      clipboard._pasteIntoTable(table, td1, 'new1\tnew2')
      expect(td1.textContent).toBe('new1')
      expect(td2.textContent).toBe('new2')
    })

    it('adds new rows when TSV data extends beyond existing rows', () => {
      const table = document.createElement('table')
      const tbody = document.createElement('tbody')
      const row1 = document.createElement('tr')
      const td1 = document.createElement('td')
      td1.innerHTML = '<br>'
      row1.appendChild(td1)
      tbody.appendChild(row1)
      table.appendChild(tbody)

      clipboard._pasteIntoTable(table, td1, 'A\nB')
      expect(tbody.querySelectorAll('tr').length).toBe(2)
    })

    it('adds new columns when TSV data extends beyond existing columns', () => {
      const table = document.createElement('table')
      const tbody = document.createElement('tbody')
      const row1 = document.createElement('tr')
      const td1 = document.createElement('td')
      td1.innerHTML = '<br>'
      row1.appendChild(td1)
      tbody.appendChild(row1)
      table.appendChild(tbody)

      clipboard._pasteIntoTable(table, td1, 'A\tB\tC')
      expect(row1.cells.length).toBe(3)
    })
  })

  describe('_handleCopy — table-aware copy', () => {
    it('produces TSV and HTML for table selections', () => {
      const table = document.createElement('table')
      table.className = 'rmx-table'
      const thead = document.createElement('thead')
      const tr1 = document.createElement('tr')
      const th1 = document.createElement('th')
      th1.textContent = 'Name'
      const th2 = document.createElement('th')
      th2.textContent = 'Value'
      tr1.appendChild(th1)
      tr1.appendChild(th2)
      thead.appendChild(tr1)
      table.appendChild(thead)
      engine.element.appendChild(table)

      const clipboardData = { setData: vi.fn() }
      const event = new Event('copy', { bubbles: true, cancelable: true })
      event.clipboardData = clipboardData
      event.preventDefault = vi.fn()

      // Mock window.getSelection to return selection within table
      const mockRange = document.createRange()
      mockRange.selectNodeContents(table)
      const mockSel = window.getSelection()
      mockSel.removeAllRanges()
      mockSel.addRange(mockRange)

      clipboard.init()
      clipboard._handleCopy(event)

      expect(event.preventDefault).toHaveBeenCalled()
      expect(clipboardData.setData).toHaveBeenCalledWith('text/plain', 'Name\tValue')
      expect(clipboardData.setData).toHaveBeenCalledWith('text/html', expect.stringContaining('<table>'))
    })

    it('handles cells with special characters in TSV escaping', () => {
      const table = document.createElement('table')
      table.className = 'rmx-table'
      const tbody = document.createElement('tbody')
      const tr = document.createElement('tr')
      const td1 = document.createElement('td')
      td1.textContent = 'has\ttab'
      const td2 = document.createElement('td')
      td2.textContent = 'has"quote'
      tr.appendChild(td1)
      tr.appendChild(td2)
      tbody.appendChild(tr)
      table.appendChild(tbody)
      engine.element.appendChild(table)

      const clipboardData = { setData: vi.fn() }
      const event = new Event('copy', { bubbles: true, cancelable: true })
      event.clipboardData = clipboardData
      event.preventDefault = vi.fn()

      const mockRange = document.createRange()
      mockRange.selectNodeContents(table)
      const mockSel = window.getSelection()
      mockSel.removeAllRanges()
      mockSel.addRange(mockRange)

      clipboard._handleCopy(event)
      expect(clipboardData.setData).toHaveBeenCalledWith('text/plain', expect.stringContaining('"'))
    })

    it('skips hidden rows when copying', () => {
      const table = document.createElement('table')
      table.className = 'rmx-table'
      const tbody = document.createElement('tbody')
      const tr1 = document.createElement('tr')
      const td1 = document.createElement('td')
      td1.textContent = 'visible'
      tr1.appendChild(td1)
      const tr2 = document.createElement('tr')
      tr2.classList.add('rmx-row-hidden')
      const td2 = document.createElement('td')
      td2.textContent = 'hidden'
      tr2.appendChild(td2)
      tbody.appendChild(tr1)
      tbody.appendChild(tr2)
      table.appendChild(tbody)
      engine.element.appendChild(table)

      const clipboardData = { setData: vi.fn() }
      const event = new Event('copy', { bubbles: true, cancelable: true })
      event.clipboardData = clipboardData
      event.preventDefault = vi.fn()

      const mockRange = document.createRange()
      mockRange.selectNodeContents(table)
      const mockSel = window.getSelection()
      mockSel.removeAllRanges()
      mockSel.addRange(mockRange)

      clipboard._handleCopy(event)
      expect(clipboardData.setData).toHaveBeenCalledWith('text/plain', 'visible')
    })
  })

  describe('_handlePaste — table paste with TSV', () => {
    it('pastes TSV into table when caret is in a cell', () => {
      const table = document.createElement('table')
      const tbody = document.createElement('tbody')
      const tr = document.createElement('tr')
      const td1 = document.createElement('td')
      td1.textContent = 'A'
      const td2 = document.createElement('td')
      td2.textContent = 'B'
      tr.appendChild(td1)
      tr.appendChild(td2)
      tbody.appendChild(tr)
      table.appendChild(tbody)
      engine.element.appendChild(table)

      // Mock getSelection to place caret in td1
      const range = document.createRange()
      range.setStart(td1.firstChild, 0)
      range.collapse(true)
      const sel = window.getSelection()
      sel.removeAllRanges()
      sel.addRange(range)

      clipboard.init()
      const event = createPasteEvent({ text: 'X\tY' })
      engine.element.dispatchEvent(event)

      expect(td1.textContent).toBe('X')
      expect(td2.textContent).toBe('Y')
    })

    it('pastes HTML table into table when caret is in a cell', () => {
      const table = document.createElement('table')
      const tbody = document.createElement('tbody')
      const tr = document.createElement('tr')
      const td1 = document.createElement('td')
      td1.textContent = 'old'
      const td2 = document.createElement('td')
      td2.textContent = 'old2'
      tr.appendChild(td1)
      tr.appendChild(td2)
      tbody.appendChild(tr)
      table.appendChild(tbody)
      engine.element.appendChild(table)

      const range = document.createRange()
      range.setStart(td1.firstChild, 0)
      range.collapse(true)
      const sel = window.getSelection()
      sel.removeAllRanges()
      sel.addRange(range)

      clipboard.init()
      const event = createPasteEvent({
        html: '<table><tr><td>New1</td><td>New2</td></tr></table>',
        text: '',
      })
      engine.element.dispatchEvent(event)

      expect(td1.textContent).toBe('New1')
      expect(td2.textContent).toBe('New2')
    })
  })

  describe('_handleImagePaste — FileReader progress', () => {
    it('emits upload:progress on FileReader progress', () => {
      engine.options.uploadHandler = null
      const file = new File(['data'], 'photo.jpg', { type: 'image/jpeg' })

      const mockReader = {
        readAsDataURL: vi.fn(),
        onload: null,
        onprogress: null,
      }
      vi.spyOn(globalThis, 'FileReader').mockImplementation(function () {
        return mockReader
      })

      clipboard._handleImagePaste(file)

      // Simulate progress event
      mockReader.onprogress({ lengthComputable: true, loaded: 50, total: 100 })
      expect(engine.eventBus.emit).toHaveBeenCalledWith('upload:progress', {
        loaded: 50,
        total: 100,
        percent: 50,
      })

      // Non-computable progress should not emit
      engine.eventBus.emit.mockClear()
      mockReader.onprogress({ lengthComputable: false })
      expect(engine.eventBus.emit).not.toHaveBeenCalledWith('upload:progress', expect.anything())

      globalThis.FileReader.mockRestore()
    })

    it('skips image paste when file exceeds max size', () => {
      exceedsMaxFileSize.mockReturnValue(true)
      const file = new File(['data'], 'big.png', { type: 'image/png' })
      clipboard._handleImagePaste(file)
      expect(engine.commands.execute).not.toHaveBeenCalled()
    })
  })

  describe('_handleCut', () => {
    it('takes a history snapshot on cut', () => {
      clipboard.init()
      const event = new Event('cut', { bubbles: true })
      engine.element.dispatchEvent(event)
      expect(engine.history.snapshot).toHaveBeenCalled()
    })
  })

  describe('_getCaretCell', () => {
    it('returns null when selection is outside a table', () => {
      const p = document.createElement('p')
      p.textContent = 'hello'
      engine.element.appendChild(p)
      const range = document.createRange()
      range.setStart(p.firstChild, 0)
      range.collapse(true)
      const sel = window.getSelection()
      sel.removeAllRanges()
      sel.addRange(range)

      expect(clipboard._getCaretCell()).toBeNull()
    })

    it('returns the TD when selection is inside a table cell', () => {
      const table = document.createElement('table')
      const tbody = document.createElement('tbody')
      const tr = document.createElement('tr')
      const td = document.createElement('td')
      td.textContent = 'cell'
      tr.appendChild(td)
      tbody.appendChild(tr)
      table.appendChild(tbody)
      engine.element.appendChild(table)

      const range = document.createRange()
      range.setStart(td.firstChild, 0)
      range.collapse(true)
      const sel = window.getSelection()
      sel.removeAllRanges()
      sel.addRange(range)

      expect(clipboard._getCaretCell()).toBe(td)
    })
  })

  describe('_handlePaste — text fallback with insertPlainText', () => {
    it('calls insertPlainText when only plain text is provided', () => {
      clipboard.init()
      const event = createPasteEvent({ text: 'hello world' })
      engine.element.dispatchEvent(event)
      expect(insertPlainText).toHaveBeenCalledWith(engine, 'hello world')
    })
  })
})
