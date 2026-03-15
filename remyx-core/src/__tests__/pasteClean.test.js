import { cleanPastedHTML, looksLikeMarkdown } from '../utils/pasteClean.js'

describe('cleanPastedHTML', () => {
  describe('basic cleanup', () => {
    it('should return empty string for null input', () => {
      expect(cleanPastedHTML(null)).toBe('')
    })

    it('should return empty string for empty string input', () => {
      expect(cleanPastedHTML('')).toBe('')
    })

    it('should return empty string for undefined input', () => {
      expect(cleanPastedHTML(undefined)).toBe('')
    })

    it('should strip meta tags', () => {
      const html = '<meta charset="utf-8"><p>Content</p>'
      expect(cleanPastedHTML(html)).not.toContain('<meta')
    })

    it('should strip style tags', () => {
      const html = '<style>.foo { color: red; }</style><p>Content</p>'
      const result = cleanPastedHTML(html)
      expect(result).not.toContain('<style')
      expect(result).toContain('Content')
    })

    it('should strip html/head/body wrappers', () => {
      const html = '<html><head><title>Doc</title></head><body><p>Text</p></body></html>'
      const result = cleanPastedHTML(html)
      expect(result).not.toContain('<html')
      expect(result).not.toContain('<body')
      expect(result).not.toContain('<head')
      expect(result).toContain('Text')
    })

    it('should remove empty paragraphs', () => {
      const html = '<p>Hello</p><p></p><p>World</p>'
      const result = cleanPastedHTML(html)
      expect(result).not.toMatch(/<p[^>]*>\s*<\/p>/)
    })

    it('should remove empty divs', () => {
      const html = '<div></div><p>Content</p>'
      const result = cleanPastedHTML(html)
      expect(result).not.toMatch(/<div[^>]*>\s*<\/div>/)
    })

    it('should collapse excessive line breaks', () => {
      const html = '<br><br><br><br><br>'
      const result = cleanPastedHTML(html)
      const brCount = (result.match(/<br/g) || []).length
      expect(brCount).toBeLessThanOrEqual(2)
    })
  })

  describe('semantic tag normalization', () => {
    it('should convert <b> to <strong>', () => {
      const html = '<b>Bold text</b>'
      const result = cleanPastedHTML(html)
      expect(result).toContain('<strong>')
      expect(result).toContain('</strong>')
      expect(result).not.toContain('<b>')
    })

    it('should convert <i> to <em>', () => {
      const html = '<i>Italic text</i>'
      const result = cleanPastedHTML(html)
      expect(result).toContain('<em>')
      expect(result).toContain('</em>')
      expect(result).not.toContain('<i>')
    })

    it('should convert <b with attributes to <strong', () => {
      const html = '<b class="test">Bold</b>'
      const result = cleanPastedHTML(html)
      expect(result).toContain('<strong')
    })
  })

  describe('font tag conversion', () => {
    it('should convert font face to span with font-family', () => {
      const html = '<font face="Arial">Text</font>'
      const result = cleanPastedHTML(html)
      expect(result).toContain('font-family: Arial')
      expect(result).not.toContain('<font')
    })

    it('should convert font color to span with color', () => {
      const html = '<font color="#ff0000">Red</font>'
      const result = cleanPastedHTML(html)
      expect(result).toContain('color: #ff0000')
    })

    it('should strip font size tags without replacement', () => {
      const html = '<font size="5">Big</font>'
      const result = cleanPastedHTML(html)
      expect(result).not.toContain('<font')
      expect(result).toContain('Big')
    })

    it('should remove plain font tags', () => {
      const html = '<font>Plain</font>'
      const result = cleanPastedHTML(html)
      expect(result).not.toContain('<font')
    })
  })

  describe('Microsoft Word cleanup', () => {
    it('should remove Word conditional comments', () => {
      const html = '<!--[if gte mso 9]><xml></xml><![endif]--><p class="MsoNormal">Text</p>'
      const result = cleanPastedHTML(html)
      expect(result).not.toContain('<!--[if')
      expect(result).not.toContain('endif')
    })

    it('should remove mso- styles', () => {
      const html = '<p class="MsoNormal" style="mso-line-height-rule:exactly; font-size: 12pt;">Text</p>'
      const result = cleanPastedHTML(html)
      expect(result).not.toContain('mso-')
    })

    it('should remove class="Mso*" attributes', () => {
      const html = '<p class="MsoNormal">Normal paragraph</p>'
      const result = cleanPastedHTML(html)
      expect(result).not.toContain('MsoNormal')
    })

    it('should remove Word XML namespaced elements', () => {
      const html = '<o:p>Office paragraph</o:p><p class="MsoNormal">Text</p>'
      const result = cleanPastedHTML(html)
      expect(result).not.toContain('<o:p')
    })

    it('should remove lang attributes from Word', () => {
      const html = '<p class="MsoNormal" lang="en-US">Text</p>'
      const result = cleanPastedHTML(html)
      expect(result).not.toContain('lang=')
    })
  })

  describe('Google Docs cleanup', () => {
    it('should remove docs-internal wrapper', () => {
      const html = '<b id="docs-internal-guid-abc123" style="font-weight: normal;"><p>Text</p></b>'
      const result = cleanPastedHTML(html)
      expect(result).not.toContain('docs-internal')
    })

    it('should remove Google Docs heading IDs', () => {
      const html = '<h1 id="h.abc123">Heading</h1>'
      const result = cleanPastedHTML(html)
      expect(result).not.toContain('h.abc123')
    })

    it('should convert Google Docs bold spans to strong', () => {
      const html = '<b id="docs-internal-guid-test"><span style="font-weight: 700">Bold</span></b>'
      const result = cleanPastedHTML(html)
      expect(result).toContain('<strong>')
    })

    it('should convert Google Docs italic spans to em', () => {
      const html = '<b id="docs-internal-guid-test"><span style="font-style: italic">Italic</span></b>'
      const result = cleanPastedHTML(html)
      expect(result).toContain('<em>')
    })

    it('should convert Google Docs strikethrough to s', () => {
      const html = '<b id="docs-internal-guid-test"><span style="text-decoration: line-through">Strike</span></b>'
      const result = cleanPastedHTML(html)
      expect(result).toContain('<s>')
    })
  })

  describe('common cleanup', () => {
    it('should remove empty style attributes', () => {
      const html = '<p style="">Text</p>'
      const result = cleanPastedHTML(html)
      expect(result).not.toContain('style=""')
    })

    it('should remove empty class attributes', () => {
      const html = '<p class="">Text</p>'
      const result = cleanPastedHTML(html)
      expect(result).not.toContain('class=""')
    })

    it('should unwrap empty spans', () => {
      const html = '<span>Inner text</span>'
      const result = cleanPastedHTML(html)
      expect(result).not.toContain('<span>')
      expect(result).toContain('Inner text')
    })
  })
})

describe('looksLikeMarkdown', () => {
  describe('returns false for non-markdown', () => {
    it('should return false for null', () => {
      expect(looksLikeMarkdown(null)).toBe(false)
    })

    it('should return false for empty string', () => {
      expect(looksLikeMarkdown('')).toBe(false)
    })

    it('should return false for short text', () => {
      expect(looksLikeMarkdown('ab')).toBe(false)
    })

    it('should return false for plain text', () => {
      expect(looksLikeMarkdown('Just a regular sentence without any formatting.')).toBe(false)
    })

    it('should return false for single line of plain text', () => {
      expect(looksLikeMarkdown('Hello world')).toBe(false)
    })
  })

  describe('detects headings', () => {
    it('should detect h1 headings', () => {
      expect(looksLikeMarkdown('# Title\nSome text below')).toBe(true)
    })

    it('should detect h2 headings', () => {
      expect(looksLikeMarkdown('## Subtitle\nMore text')).toBe(true)
    })

    it('should detect h3-h6 headings', () => {
      expect(looksLikeMarkdown('### Section\nContent here')).toBe(true)
    })
  })

  describe('detects lists', () => {
    it('should detect unordered lists with dashes', () => {
      expect(looksLikeMarkdown('- Item one\n- Item two\n- Item three')).toBe(true)
    })

    it('should detect unordered lists with asterisks', () => {
      expect(looksLikeMarkdown('* Item one\n* Item two')).toBe(true)
    })

    it('should detect ordered lists', () => {
      expect(looksLikeMarkdown('1. First\n2. Second\n3. Third')).toBe(true)
    })

    it('should detect task lists', () => {
      expect(looksLikeMarkdown('- [ ] Todo\n- [x] Done')).toBe(true)
    })
  })

  describe('detects code', () => {
    it('should detect code fences', () => {
      expect(looksLikeMarkdown('```\nconst x = 1\n```')).toBe(true)
    })

    it('should detect inline code', () => {
      expect(looksLikeMarkdown('Use `console.log()` for debugging\nAnother line with `code`')).toBe(true)
    })
  })

  describe('detects formatting', () => {
    it('should detect bold text', () => {
      expect(looksLikeMarkdown('This is **bold** text\nMore **bold** here')).toBe(true)
    })

    it('should detect bold with underscores', () => {
      expect(looksLikeMarkdown('This is __bold__ text\nMore __bold__ words')).toBe(true)
    })

    it('should detect italic text', () => {
      expect(looksLikeMarkdown('This is *italic* text\nMore *italic* here')).toBe(true)
    })

    it('should detect links', () => {
      expect(looksLikeMarkdown('Check [this link](https://example.com)\nAnd [another](https://test.com)')).toBe(true)
    })

    it('should detect images', () => {
      expect(looksLikeMarkdown('![alt text](image.png)\nMore text')).toBe(true)
    })
  })

  describe('detects block elements', () => {
    it('should detect blockquotes', () => {
      expect(looksLikeMarkdown('> This is quoted\n> And more quoted')).toBe(true)
    })

    it('should detect horizontal rules', () => {
      expect(looksLikeMarkdown('Text above\n---\nText below')).toBe(true)
    })

    it('should detect tables', () => {
      expect(looksLikeMarkdown('| Col1 | Col2 |\n|------|------|\n| A | B |')).toBe(true)
    })
  })

  describe('threshold behavior', () => {
    it('should return true when ratio meets 30% threshold', () => {
      // 1 markdown signal out of 3 lines = 33%
      expect(looksLikeMarkdown('# Heading\nPlain text\nMore plain text')).toBe(true)
    })

    it('should return true with 2+ signals regardless of ratio', () => {
      expect(looksLikeMarkdown('# Heading\nSome text\nMore text\nEven more\n**bold** thing\nPlain\nAnother line')).toBe(true)
    })
  })
})
