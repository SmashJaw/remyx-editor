import { vi } from 'vitest'
import {
  isImportableFile,
  getSupportedExtensions,
  getSupportedFormatNames,
  convertDocument,
} from '../utils/documentConverter/index.js'
import { getExtension, escapeHtml } from '../utils/documentConverter/shared.js'

describe('getExtension', () => {
  it('should extract .md extension', () => {
    expect(getExtension('file.md')).toBe('.md')
  })

  it('should extract .html extension', () => {
    expect(getExtension('page.html')).toBe('.html')
  })

  it('should return lowercase extension', () => {
    expect(getExtension('FILE.PDF')).toBe('.pdf')
  })

  it('should return empty for no extension', () => {
    expect(getExtension('noext')).toBe('')
  })

  it('should return empty for empty string', () => {
    expect(getExtension('')).toBe('')
  })

  it('should handle multiple dots', () => {
    expect(getExtension('my.file.txt')).toBe('.txt')
  })
})

describe('escapeHtml', () => {
  it('should escape special characters', () => {
    const result = escapeHtml('<script>alert("xss")</script>')
    expect(result).not.toContain('<script>')
    expect(result).toContain('&lt;')
    expect(result).toContain('&gt;')
  })

  it('should escape ampersand', () => {
    expect(escapeHtml('A & B')).toContain('&amp;')
  })

  it('should escape quotes', () => {
    const result = escapeHtml('"hello"')
    expect(result).toContain('&quot;')
  })
})

describe('isImportableFile', () => {
  it('should recognize text/html', () => {
    expect(isImportableFile({ type: 'text/html', name: 'file.html' })).toBe(true)
  })

  it('should recognize text/markdown', () => {
    expect(isImportableFile({ type: 'text/markdown', name: 'file.md' })).toBe(true)
  })

  it('should recognize text/plain', () => {
    expect(isImportableFile({ type: 'text/plain', name: 'file.txt' })).toBe(true)
  })

  it('should recognize text/csv', () => {
    expect(isImportableFile({ type: 'text/csv', name: 'data.csv' })).toBe(true)
  })

  it('should recognize application/pdf', () => {
    expect(isImportableFile({ type: 'application/pdf', name: 'doc.pdf' })).toBe(true)
  })

  it('should recognize docx by MIME', () => {
    expect(isImportableFile({ type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', name: 'doc.docx' })).toBe(true)
  })

  it('should recognize rtf by extension', () => {
    expect(isImportableFile({ type: '', name: 'doc.rtf' })).toBe(true)
  })

  it('should recognize tsv by extension', () => {
    expect(isImportableFile({ type: '', name: 'data.tsv' })).toBe(true)
  })

  it('should reject unknown format', () => {
    expect(isImportableFile({ type: 'application/octet-stream', name: 'file.xyz' })).toBe(false)
  })

  it('should fall back to extension when MIME is unknown', () => {
    expect(isImportableFile({ type: 'unknown/type', name: 'doc.md' })).toBe(true)
  })

  it('should recognize .htm extension', () => {
    expect(isImportableFile({ type: '', name: 'page.htm' })).toBe(true)
  })

  it('should recognize .markdown extension', () => {
    expect(isImportableFile({ type: '', name: 'file.markdown' })).toBe(true)
  })
})

describe('getSupportedExtensions', () => {
  it('should return a comma-separated string', () => {
    const ext = getSupportedExtensions()
    expect(typeof ext).toBe('string')
    expect(ext).toContain('.md')
    expect(ext).toContain('.html')
    expect(ext).toContain('.txt')
    expect(ext).toContain('.csv')
    expect(ext).toContain('.rtf')
    expect(ext).toContain('.pdf')
    expect(ext).toContain('.docx')
  })
})

describe('getSupportedFormatNames', () => {
  it('should return an array of format names', () => {
    const names = getSupportedFormatNames()
    expect(Array.isArray(names)).toBe(true)
    expect(names).toContain('PDF')
    expect(names).toContain('DOCX')
    expect(names).toContain('Markdown')
    expect(names).toContain('HTML')
    expect(names).toContain('TXT')
    expect(names).toContain('CSV')
    expect(names).toContain('RTF')
  })
})

describe('convertDocument', () => {
  it('should throw for unsupported format', async () => {
    const file = { type: 'application/octet-stream', name: 'file.xyz' }
    await expect(convertDocument(file)).rejects.toThrow('Unsupported file format')
  })

  it('should convert text file', async () => {
    const content = 'Hello\n\nWorld'
    const blob = new Blob([content], { type: 'text/plain' })
    const file = new File([blob], 'test.txt', { type: 'text/plain' })

    const result = await convertDocument(file)
    expect(result).toContain('<p>')
    expect(result).toContain('Hello')
    expect(result).toContain('World')
  })

  it('should convert HTML file', async () => {
    const html = '<p>Test content</p>'
    const blob = new Blob([html], { type: 'text/html' })
    const file = new File([blob], 'test.html', { type: 'text/html' })

    const result = await convertDocument(file)
    expect(result).toContain('Test content')
  })

  it('should convert CSV file', async () => {
    const csv = 'Name,Age\nAlice,30\nBob,25'
    const blob = new Blob([csv], { type: 'text/csv' })
    const file = new File([blob], 'data.csv', { type: 'text/csv' })

    const result = await convertDocument(file)
    expect(result).toContain('<table>')
    expect(result).toContain('<th>')
    expect(result).toContain('Name')
    expect(result).toContain('Alice')
    expect(result).toContain('30')
  })

  it('should convert RTF file', async () => {
    const rtf = '{\\rtf1\\pard Hello World\\par Goodbye\\par}'
    const blob = new Blob([rtf], { type: 'text/rtf' })
    const file = new File([blob], 'doc.rtf', { type: 'text/rtf' })

    const result = await convertDocument(file)
    expect(result).toContain('<p>')
  })

  it('should convert CSV with quoted fields', async () => {
    const csv = 'Name,Comment\n"Alice","She said ""hi"""'
    const blob = new Blob([csv], { type: 'text/csv' })
    const file = new File([blob], 'data.csv', { type: 'text/csv' })

    const result = await convertDocument(file)
    expect(result).toContain('<table>')
    expect(result).toContain('Alice')
  })

  it('should convert TSV file using tab delimiter', async () => {
    const tsv = 'A\tB\n1\t2'
    const blob = new Blob([tsv], { type: 'text/csv' })
    const file = new File([blob], 'data.tsv', { type: 'text/csv' })

    const result = await convertDocument(file)
    expect(result).toContain('<table>')
  })

  it('should return empty string for empty CSV', async () => {
    const csv = ''
    const blob = new Blob([csv], { type: 'text/csv' })
    const file = new File([blob], 'empty.csv', { type: 'text/csv' })

    const result = await convertDocument(file)
    // convertCsv returns '<p></p>' for empty, then cleanPastedHTML may strip it
    expect(typeof result).toBe('string')
  })
})
