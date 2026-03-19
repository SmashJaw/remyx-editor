import { vi } from 'vitest'
import { getExtension, readAsText, readAsArrayBuffer, escapeHtml } from '../utils/documentConverter/shared.js'

// Mock all dynamic converter imports
vi.mock('../utils/documentConverter/convertDocx.js', () => ({ __esModule: true, default: vi.fn() }))
vi.mock('../utils/documentConverter/convertPdf.js', () => ({ __esModule: true, default: vi.fn() }))
vi.mock('../utils/documentConverter/convertMarkdown.js', () => ({ __esModule: true, default: vi.fn() }))
vi.mock('../utils/documentConverter/convertHtml.js', () => ({ __esModule: true, default: vi.fn() }))
vi.mock('../utils/documentConverter/convertText.js', () => ({ __esModule: true, default: vi.fn() }))
vi.mock('../utils/documentConverter/convertCsv.js', () => ({ __esModule: true, default: vi.fn() }))
vi.mock('../utils/documentConverter/convertRtf.js', () => ({ __esModule: true, default: vi.fn() }))

// Mock cleanPastedHTML
vi.mock('../utils/pasteClean.js', () => ({
  cleanPastedHTML: vi.fn((html) => `cleaned:${html}`),
}))

describe('shared.js', () => {
  describe('getExtension', () => {
    it('returns the extension including the dot', () => {
      expect(getExtension('file.txt')).toBe('.txt')
    })

    it('returns the last extension for multiple dots', () => {
      expect(getExtension('archive.tar.gz')).toBe('.gz')
    })

    it('returns an empty string when there is no dot', () => {
      expect(getExtension('README')).toBe('')
    })

    it('returns an empty string for an empty filename', () => {
      expect(getExtension('')).toBe('')
    })

    it('lowercases the extension', () => {
      expect(getExtension('Document.DOCX')).toBe('.docx')
    })

    it('handles mixed-case extensions', () => {
      expect(getExtension('report.Pdf')).toBe('.pdf')
    })

    it('handles a filename that is just a dot', () => {
      expect(getExtension('.')).toBe('.')
    })

    it('handles dotfiles', () => {
      expect(getExtension('.gitignore')).toBe('.gitignore')
    })
  })

  describe('readAsText', () => {
    it('resolves with the file content on success', async () => {
      const content = 'hello world'
      const mockFile = new Blob([content], { type: 'text/plain' })
      mockFile.name = 'test.txt'

      const result = await readAsText(mockFile)
      expect(result).toBe(content)
    })

    it('rejects when FileReader encounters an error', async () => {
      const OriginalFileReader = global.FileReader

      function MockFileReader() {
        this.onload = null
        this.onerror = null
        this.readAsText = () => {
          setTimeout(() => this.onerror(new Error('read error')), 0)
        }
      }
      global.FileReader = MockFileReader

      const mockFile = { name: 'bad.txt' }
      await expect(readAsText(mockFile)).rejects.toThrow('Failed to read file: bad.txt')

      global.FileReader = OriginalFileReader
    })
  })

  describe('readAsArrayBuffer', () => {
    it('resolves with an ArrayBuffer on success', async () => {
      const content = 'binary data'
      const mockFile = new Blob([content], { type: 'application/octet-stream' })
      mockFile.name = 'test.bin'

      const result = await readAsArrayBuffer(mockFile)
      expect(result).toBeInstanceOf(ArrayBuffer)
      expect(result.byteLength).toBeGreaterThan(0)
    })

    it('rejects when FileReader encounters an error', async () => {
      const OriginalFileReader = global.FileReader

      function MockFileReader() {
        this.onload = null
        this.onerror = null
        this.readAsArrayBuffer = () => {
          setTimeout(() => this.onerror(new Error('read error')), 0)
        }
      }
      global.FileReader = MockFileReader

      const mockFile = { name: 'bad.bin' }
      await expect(readAsArrayBuffer(mockFile)).rejects.toThrow('Failed to read file: bad.bin')

      global.FileReader = OriginalFileReader
    })
  })

  describe('escapeHtml', () => {
    it('escapes ampersands', () => {
      expect(escapeHtml('a & b')).toBe('a &amp; b')
    })

    it('escapes less-than signs', () => {
      expect(escapeHtml('<div>')).toBe('&lt;div&gt;')
    })

    it('escapes greater-than signs', () => {
      expect(escapeHtml('a > b')).toBe('a &gt; b')
    })

    it('escapes double quotes', () => {
      expect(escapeHtml('say "hello"')).toBe('say &quot;hello&quot;')
    })

    it('escapes all special characters together', () => {
      expect(escapeHtml('<a href="x">&</a>')).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;')
    })

    it('returns the same string when no special characters are present', () => {
      expect(escapeHtml('plain text')).toBe('plain text')
    })

    it('handles an empty string', () => {
      expect(escapeHtml('')).toBe('')
    })
  })
})

describe('documentConverter index.js', () => {
  let isImportableFile, getSupportedExtensions, getSupportedFormatNames, convertDocument
  let cleanPastedHTML

  beforeEach(async () => {
    vi.clearAllMocks()
    const mod = await import('../utils/documentConverter/index.js')
    isImportableFile = mod.isImportableFile
    getSupportedExtensions = mod.getSupportedExtensions
    getSupportedFormatNames = mod.getSupportedFormatNames
    convertDocument = mod.convertDocument

    const pasteCleanMod = await import('../utils/pasteClean.js')
    cleanPastedHTML = pasteCleanMod.cleanPastedHTML
  })

  describe('isImportableFile', () => {
    it('recognizes files by MIME type', () => {
      expect(isImportableFile({ type: 'application/pdf', name: '' })).toBe(true)
      expect(isImportableFile({ type: 'text/html', name: '' })).toBe(true)
      expect(isImportableFile({ type: 'text/plain', name: '' })).toBe(true)
      expect(isImportableFile({ type: 'text/csv', name: '' })).toBe(true)
      expect(isImportableFile({ type: 'application/csv', name: '' })).toBe(true)
      expect(isImportableFile({ type: 'text/markdown', name: '' })).toBe(true)
      expect(isImportableFile({ type: 'text/x-markdown', name: '' })).toBe(true)
      expect(isImportableFile({ type: 'text/rtf', name: '' })).toBe(true)
      expect(isImportableFile({ type: 'application/rtf', name: '' })).toBe(true)
      expect(isImportableFile({
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        name: '',
      })).toBe(true)
    })

    it('recognizes files by extension when MIME type is missing', () => {
      expect(isImportableFile({ type: '', name: 'doc.docx' })).toBe(true)
      expect(isImportableFile({ type: '', name: 'file.pdf' })).toBe(true)
      expect(isImportableFile({ type: '', name: 'notes.md' })).toBe(true)
      expect(isImportableFile({ type: '', name: 'notes.markdown' })).toBe(true)
      expect(isImportableFile({ type: '', name: 'page.html' })).toBe(true)
      expect(isImportableFile({ type: '', name: 'page.htm' })).toBe(true)
      expect(isImportableFile({ type: '', name: 'readme.txt' })).toBe(true)
      expect(isImportableFile({ type: '', name: 'data.csv' })).toBe(true)
      expect(isImportableFile({ type: '', name: 'data.tsv' })).toBe(true)
      expect(isImportableFile({ type: '', name: 'doc.rtf' })).toBe(true)
    })

    it('returns false for unsupported files', () => {
      expect(isImportableFile({ type: '', name: 'image.png' })).toBe(false)
      expect(isImportableFile({ type: 'image/jpeg', name: 'photo.jpg' })).toBe(false)
      expect(isImportableFile({ type: '', name: 'archive.zip' })).toBe(false)
      expect(isImportableFile({ type: 'application/json', name: 'config.json' })).toBe(false)
    })

    it('returns false when both type and name are empty', () => {
      expect(isImportableFile({ type: '', name: '' })).toBe(false)
    })

    it('prefers MIME type over extension', () => {
      // Even with a nonsense extension, a valid MIME type should work
      expect(isImportableFile({ type: 'text/plain', name: 'file.xyz' })).toBe(true)
    })
  })

  describe('getSupportedExtensions', () => {
    it('returns a comma-separated string of extensions', () => {
      const result = getSupportedExtensions()
      expect(typeof result).toBe('string')
      expect(result).toContain('.docx')
      expect(result).toContain('.pdf')
      expect(result).toContain('.md')
      expect(result).toContain('.html')
      expect(result).toContain('.txt')
      expect(result).toContain('.csv')
      expect(result).toContain('.rtf')
      expect(result).toContain('.tsv')
      expect(result).toContain('.htm')
      expect(result).toContain('.markdown')
    })
  })

  describe('getSupportedFormatNames', () => {
    it('returns an array of format name strings', () => {
      const names = getSupportedFormatNames()
      expect(Array.isArray(names)).toBe(true)
      expect(names).toContain('PDF')
      expect(names).toContain('DOCX')
      expect(names).toContain('Markdown')
      expect(names).toContain('HTML')
      expect(names).toContain('TXT')
      expect(names).toContain('CSV')
      expect(names).toContain('TSV')
      expect(names).toContain('RTF')
    })
  })

  describe('convertDocument', () => {
    it('throws for unsupported file formats', async () => {
      const file = { type: '', name: 'image.png' }
      await expect(convertDocument(file)).rejects.toThrow('Unsupported file format: image.png')
    })

    it('converts a docx file and cleans the result', async () => {
      const convertDocx = (await import('../utils/documentConverter/convertDocx.js')).default
      convertDocx.mockResolvedValue('<p>docx content</p>')

      const file = { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', name: 'test.docx' }
      const result = await convertDocument(file)

      expect(convertDocx).toHaveBeenCalledWith(file)
      expect(cleanPastedHTML).toHaveBeenCalledWith('<p>docx content</p>')
      expect(result).toBe('cleaned:<p>docx content</p>')
    })

    it('converts a pdf file and cleans the result', async () => {
      const convertPdf = (await import('../utils/documentConverter/convertPdf.js')).default
      convertPdf.mockResolvedValue('<p>pdf content</p>')

      const file = { type: 'application/pdf', name: 'test.pdf' }
      const result = await convertDocument(file)

      expect(convertPdf).toHaveBeenCalledWith(file)
      expect(cleanPastedHTML).toHaveBeenCalledWith('<p>pdf content</p>')
      expect(result).toBe('cleaned:<p>pdf content</p>')
    })

    it('converts a markdown file and cleans the result', async () => {
      const convertMarkdown = (await import('../utils/documentConverter/convertMarkdown.js')).default
      convertMarkdown.mockResolvedValue('<p>markdown content</p>')

      const file = { type: 'text/markdown', name: 'notes.md' }
      const result = await convertDocument(file)

      expect(convertMarkdown).toHaveBeenCalledWith(file)
      expect(cleanPastedHTML).toHaveBeenCalledWith('<p>markdown content</p>')
      expect(result).toBe('cleaned:<p>markdown content</p>')
    })

    it('converts an html file and cleans the result', async () => {
      const convertHtml = (await import('../utils/documentConverter/convertHtml.js')).default
      convertHtml.mockResolvedValue('<div>html content</div>')

      const file = { type: 'text/html', name: 'page.html' }
      const result = await convertDocument(file)

      expect(convertHtml).toHaveBeenCalledWith(file)
      expect(cleanPastedHTML).toHaveBeenCalledWith('<div>html content</div>')
      expect(result).toBe('cleaned:<div>html content</div>')
    })

    it('converts a text file and cleans the result', async () => {
      const convertText = (await import('../utils/documentConverter/convertText.js')).default
      convertText.mockResolvedValue('<p>text content</p>')

      const file = { type: 'text/plain', name: 'readme.txt' }
      const result = await convertDocument(file)

      expect(convertText).toHaveBeenCalledWith(file)
      expect(cleanPastedHTML).toHaveBeenCalledWith('<p>text content</p>')
      expect(result).toBe('cleaned:<p>text content</p>')
    })

    it('converts a csv file and cleans the result', async () => {
      const convertCsv = (await import('../utils/documentConverter/convertCsv.js')).default
      convertCsv.mockResolvedValue('<table>csv</table>')

      const file = { type: 'text/csv', name: 'data.csv' }
      const result = await convertDocument(file)

      expect(convertCsv).toHaveBeenCalledWith(file)
      expect(cleanPastedHTML).toHaveBeenCalledWith('<table>csv</table>')
      expect(result).toBe('cleaned:<table>csv</table>')
    })

    it('converts an rtf file and cleans the result', async () => {
      const convertRtf = (await import('../utils/documentConverter/convertRtf.js')).default
      convertRtf.mockResolvedValue('<p>rtf content</p>')

      const file = { type: 'text/rtf', name: 'doc.rtf' }
      const result = await convertDocument(file)

      expect(convertRtf).toHaveBeenCalledWith(file)
      expect(cleanPastedHTML).toHaveBeenCalledWith('<p>rtf content</p>')
      expect(result).toBe('cleaned:<p>rtf content</p>')
    })

    it('returns raw result without cleaning when converter returns a non-string', async () => {
      const nonStringResult = { blocks: [{ type: 'paragraph', text: 'hello' }] }
      const convertDocx = (await import('../utils/documentConverter/convertDocx.js')).default
      convertDocx.mockResolvedValue(nonStringResult)

      const file = { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', name: 'test.docx' }
      const result = await convertDocument(file)

      expect(result).toBe(nonStringResult)
      expect(cleanPastedHTML).not.toHaveBeenCalled()
    })

    it('detects format by extension when MIME type is absent', async () => {
      const convertMarkdown = (await import('../utils/documentConverter/convertMarkdown.js')).default
      convertMarkdown.mockResolvedValue('<p>md via ext</p>')

      const file = { type: '', name: 'notes.md' }
      const result = await convertDocument(file)

      expect(convertMarkdown).toHaveBeenCalledWith(file)
      expect(result).toBe('cleaned:<p>md via ext</p>')
    })

    it('detects tsv as csv format by extension', async () => {
      const convertCsv = (await import('../utils/documentConverter/convertCsv.js')).default
      convertCsv.mockResolvedValue('<table>tsv</table>')

      const file = { type: '', name: 'data.tsv' }
      const result = await convertDocument(file)

      expect(convertCsv).toHaveBeenCalledWith(file)
      expect(result).toBe('cleaned:<table>tsv</table>')
    })

    it('detects htm as html format by extension', async () => {
      const convertHtml = (await import('../utils/documentConverter/convertHtml.js')).default
      convertHtml.mockResolvedValue('<div>htm content</div>')

      const file = { type: '', name: 'page.htm' }
      const result = await convertDocument(file)

      expect(convertHtml).toHaveBeenCalledWith(file)
      expect(result).toBe('cleaned:<div>htm content</div>')
    })
  })
})
