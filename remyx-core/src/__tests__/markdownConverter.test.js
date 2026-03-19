import { htmlToMarkdown, markdownToHtml } from '../utils/markdownConverter.js'

describe('markdownConverter', () => {
  describe('htmlToMarkdown', () => {
    it('returns empty string for empty input', () => {
      expect(htmlToMarkdown('')).toBe('')
    })

    it('returns empty string for null input', () => {
      expect(htmlToMarkdown(null)).toBe('')
    })

    it('returns empty string for undefined input', () => {
      expect(htmlToMarkdown(undefined)).toBe('')
    })

    it('returns empty string for <p><br></p>', () => {
      expect(htmlToMarkdown('<p><br></p>')).toBe('')
    })

    it('converts headings', () => {
      expect(htmlToMarkdown('<h1>Title</h1>')).toBe('# Title')
      expect(htmlToMarkdown('<h2>Subtitle</h2>')).toBe('## Subtitle')
      expect(htmlToMarkdown('<h3>Section</h3>')).toBe('### Section')
    })

    it('converts paragraphs', () => {
      expect(htmlToMarkdown('<p>Hello world</p>')).toBe('Hello world')
    })

    it('converts bold text', () => {
      expect(htmlToMarkdown('<strong>bold</strong>')).toBe('**bold**')
    })

    it('converts italic text', () => {
      expect(htmlToMarkdown('<em>italic</em>')).toBe('*italic*')
    })

    it('converts links', () => {
      const result = htmlToMarkdown('<a href="https://example.com">link</a>')
      expect(result).toBe('[link](https://example.com)')
    })

    it('converts unordered lists', () => {
      const html = '<ul><li>one</li><li>two</li></ul>'
      const result = htmlToMarkdown(html)
      expect(result).toContain('one')
      expect(result).toContain('two')
      expect(result).toMatch(/^-/m)
    })

    it('converts ordered lists', () => {
      const html = '<ol><li>first</li><li>second</li></ol>'
      const result = htmlToMarkdown(html)
      expect(result).toContain('1.  first')
    })

    it('preserves underline as <u> tag', () => {
      const result = htmlToMarkdown('<u>underlined</u>')
      expect(result).toBe('<u>underlined</u>')
    })

    it('converts <br> to line breaks', () => {
      const result = htmlToMarkdown('<p>line1<br>line2</p>')
      expect(result).toContain('line1')
      expect(result).toContain('line2')
    })
  })

  describe('markdownToHtml', () => {
    it('returns empty string for empty input', () => {
      expect(markdownToHtml('')).toBe('')
    })

    it('returns empty string for null input', () => {
      expect(markdownToHtml(null)).toBe('')
    })

    it('returns empty string for undefined input', () => {
      expect(markdownToHtml(undefined)).toBe('')
    })

    it('converts heading to h1', () => {
      const result = markdownToHtml('# Heading')
      expect(result).toContain('<h1>')
      expect(result).toContain('Heading')
      expect(result).toContain('</h1>')
    })

    it('converts bold to strong', () => {
      const result = markdownToHtml('**bold**')
      expect(result).toContain('<strong>bold</strong>')
    })

    it('converts italic to em', () => {
      const result = markdownToHtml('*italic*')
      expect(result).toContain('<em>italic</em>')
    })

    it('converts links to anchor tags', () => {
      const result = markdownToHtml('[link](https://example.com)')
      expect(result).toContain('<a href="https://example.com">')
      expect(result).toContain('link</a>')
    })

    it('converts paragraphs', () => {
      const result = markdownToHtml('Hello world')
      expect(result).toContain('<p>Hello world</p>')
    })

    it('converts unordered lists', () => {
      const result = markdownToHtml('- item1\n- item2')
      expect(result).toContain('<ul>')
      expect(result).toContain('<li>item1</li>')
      expect(result).toContain('<li>item2</li>')
    })

    it('sanitizes javascript: protocol in links', () => {
      const result = markdownToHtml('[link](javascript:alert(1))')
      expect(result).not.toContain('href')
      expect(result).toContain('link')
    })

    it('sanitizes vbscript: protocol in links', () => {
      const result = markdownToHtml('[link](vbscript:something)')
      expect(result).not.toContain('href')
    })

    it('allows https links', () => {
      const result = markdownToHtml('[link](https://safe.com)')
      expect(result).toContain('href="https://safe.com"')
    })

    it('allows mailto links', () => {
      const result = markdownToHtml('[email](mailto:a@b.com)')
      expect(result).toContain('href="mailto:a@b.com"')
    })

    it('allows data:image URIs in images', () => {
      const result = markdownToHtml('![img](data:image/png;base64,abc)')
      expect(result).toContain('<img')
      expect(result).toContain('src="data:image/png;base64,abc"')
    })

    it('blocks data:text/html URIs in images', () => {
      const result = markdownToHtml('![img](data:text/html,<script>alert(1)</script>)')
      expect(result).not.toContain('<img')
    })

    it('converts link with title attribute', () => {
      const result = markdownToHtml('[link](https://example.com "My Title")')
      expect(result).toContain('title="My Title"')
    })
  })
})
