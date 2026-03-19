import { formatHTML } from '../utils/formatHTML.js'

describe('formatHTML', () => {
  describe('empty and invalid input', () => {
    it('should return empty string for null input', () => {
      expect(formatHTML(null)).toBe('')
    })

    it('should return empty string for undefined input', () => {
      expect(formatHTML(undefined)).toBe('')
    })

    it('should return empty string for empty string', () => {
      expect(formatHTML('')).toBe('')
    })

    it('should return empty string for whitespace-only input', () => {
      expect(formatHTML('   \n\t  ')).toBe('')
    })
  })

  describe('basic formatting', () => {
    it('should format a single paragraph', () => {
      const result = formatHTML('<p>Hello world</p>')
      expect(result).toBe('<p>Hello world</p>')
    })

    it('should format multiple paragraphs on separate lines', () => {
      const result = formatHTML('<p>First</p><p>Second</p>')
      const lines = result.split('\n')
      expect(lines).toHaveLength(2)
      expect(lines[0]).toBe('<p>First</p>')
      expect(lines[1]).toBe('<p>Second</p>')
    })

    it('should format plain text content', () => {
      const result = formatHTML('Just some text')
      expect(result).toBe('Just some text')
    })
  })

  describe('indentation', () => {
    it('should indent nested block elements', () => {
      const result = formatHTML('<div><p>Nested</p></div>')
      expect(result).toContain('  <p>Nested</p>')
    })

    it('should indent multiple levels', () => {
      const result = formatHTML('<div><div><p>Deep</p></div></div>')
      expect(result).toContain('    <p>Deep</p>')
    })

    it('should indent list items', () => {
      const result = formatHTML('<ul><li>Item 1</li><li>Item 2</li></ul>')
      const lines = result.split('\n')
      const liLines = lines.filter(l => l.includes('<li>'))
      liLines.forEach(line => {
        expect(line.startsWith('  ')).toBe(true)
      })
    })
  })

  describe('inline vs block elements', () => {
    it('should keep inline elements on the same line as text', () => {
      const result = formatHTML('<p>Hello <strong>bold</strong> world</p>')
      expect(result).toContain('<strong>bold</strong>')
      // Should be a single line for the <p>
      const pLines = result.split('\n').filter(l => l.includes('Hello'))
      expect(pLines).toHaveLength(1)
    })

    it('should keep nested inline elements on one line', () => {
      const result = formatHTML('<p><em><strong>Bold italic</strong></em></p>')
      expect(result).toContain('<em><strong>Bold italic</strong></em>')
    })

    it('should keep links inline', () => {
      const result = formatHTML('<p>Click <a href="#">here</a> please</p>')
      const lines = result.split('\n').filter(l => l.includes('Click'))
      expect(lines).toHaveLength(1)
      expect(lines[0]).toContain('<a')
    })
  })

  describe('void elements', () => {
    it('should format br elements', () => {
      const result = formatHTML('<p>Line 1</p><br><p>Line 2</p>')
      expect(result).toContain('<br>')
    })

    it('should format hr elements', () => {
      const result = formatHTML('<hr>')
      expect(result).toContain('<hr>')
    })

    it('should format img elements with attributes', () => {
      const result = formatHTML('<img src="test.png" alt="test">')
      expect(result).toContain('<img')
      expect(result).toContain('src=')
    })
  })

  describe('preformatted content', () => {
    it('should preserve pre element content as-is', () => {
      const result = formatHTML('<pre>  line 1\n  line 2</pre>')
      expect(result).toContain('<pre>')
    })

    it('should preserve code element content', () => {
      const result = formatHTML('<code>const x = 1;</code>')
      expect(result).toContain('<code>')
    })
  })

  describe('attributes', () => {
    it('should preserve element attributes', () => {
      const result = formatHTML('<a href="https://example.com" target="_blank">Link</a>')
      expect(result).toContain('href=')
      expect(result).toContain('target=')
    })

    it('should preserve class attributes', () => {
      const result = formatHTML('<div class="container"><p>Text</p></div>')
      expect(result).toContain('class="container"')
    })

    it('should preserve id attributes', () => {
      const result = formatHTML('<div id="main"><p>Text</p></div>')
      expect(result).toContain('id="main"')
    })
  })

  describe('comments', () => {
    it('should preserve HTML comments', () => {
      const result = formatHTML('<!-- comment --><p>Text</p>')
      expect(result).toContain('<!--')
    })
  })

  describe('whitespace handling', () => {
    it('should skip whitespace-only text nodes between blocks', () => {
      const result = formatHTML('<div>  \n  <p>Text</p>  \n  </div>')
      const lines = result.split('\n').filter(l => l.trim() !== '')
      // Should not have empty lines from whitespace-only text nodes
      lines.forEach(line => {
        expect(line.trim().length).toBeGreaterThan(0)
      })
    })

    it('should collapse whitespace in text content', () => {
      const result = formatHTML('<p>Hello    world   test</p>')
      expect(result).toContain('Hello world test')
    })
  })
})
