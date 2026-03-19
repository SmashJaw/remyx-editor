import { describe, it, expect } from 'vitest'
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

  describe('LibreOffice cleanup', () => {
    it('should strip text: namespaced elements', () => {
      const html = '<text:p>LibreOffice paragraph</text:p><p class="P1">Content</p>'
      const result = cleanPastedHTML(html)
      expect(result).not.toContain('<text:')
      expect(result).not.toContain('</text:')
    })

    it('should strip class="P1" attributes', () => {
      const html = '<p class="P1">Paragraph one</p><p class="P2">Paragraph two</p>'
      const result = cleanPastedHTML(html)
      expect(result).not.toContain('class="P1"')
      expect(result).not.toContain('class="P2"')
    })

    it('should strip class="T1" attributes', () => {
      const html = '<span class="T1">Styled text</span><p class="P1">Para</p>'
      const result = cleanPastedHTML(html)
      expect(result).not.toContain('class="T1"')
    })

    it('should strip class="Table1" attributes', () => {
      const html = '<table class="Table1"><tr><td>Cell</td></tr></table><p class="P1">Text</p>'
      const result = cleanPastedHTML(html)
      expect(result).not.toContain('class="Table1"')
    })

    it('should strip office: namespaced elements', () => {
      const html = '<office:text>Content</office:text><p class="P1">Para</p>'
      const result = cleanPastedHTML(html)
      expect(result).not.toContain('<office:')
    })
  })

  describe('Apple Pages cleanup', () => {
    it('should strip class="s1" attributes', () => {
      const html = '<span class="s1">Styled</span><div apple-content-edited="true">wrap</div>'
      const result = cleanPastedHTML(html)
      expect(result).not.toContain('class="s1"')
    })

    it('should strip class="p2" attributes', () => {
      const html = '<p class="p2">Paragraph</p><div apple-content-edited="true">wrap</div>'
      const result = cleanPastedHTML(html)
      expect(result).not.toContain('class="p2"')
    })

    it('should strip apple-content-edited attribute from divs', () => {
      const html = '<div apple-content-edited="true"><p class="p1">Text</p></div>'
      const result = cleanPastedHTML(html)
      expect(result).not.toContain('apple-content-edited')
    })
  })

  describe('Word list paragraph conversion', () => {
    it('should convert bullet list paragraphs to ul/li', () => {
      const html = '<p class="MsoNormal" style="margin-left:36pt;text-indent:-18pt">·  First item</p>' +
        '<p class="MsoNormal" style="margin-left:36pt;text-indent:-18pt">·  Second item</p>'
      const result = cleanPastedHTML(html)
      expect(result).toContain('<ul>')
      expect(result).toContain('<li>')
      expect(result).toContain('First item')
      expect(result).toContain('Second item')
    })

    it('should convert numbered list paragraphs to ol/li', () => {
      const html = '<p class="MsoNormal" style="margin-left:36pt;text-indent:-18pt">1. First</p>' +
        '<p class="MsoNormal" style="margin-left:36pt;text-indent:-18pt">2. Second</p>'
      const result = cleanPastedHTML(html)
      expect(result).toContain('<ol>')
      expect(result).toContain('<li>')
      expect(result).toContain('First')
      expect(result).toContain('Second')
    })

    it('should convert letter list paragraphs to ol/li', () => {
      const html = '<p class="MsoNormal" style="margin-left:36pt;text-indent:-18pt">a. Alpha</p>' +
        '<p class="MsoNormal" style="margin-left:36pt;text-indent:-18pt">b. Bravo</p>'
      const result = cleanPastedHTML(html)
      expect(result).toContain('<ol>')
      expect(result).toContain('<li>')
      expect(result).toContain('Alpha')
      expect(result).toContain('Bravo')
    })

    it('should handle mixed bullet then numbered lists in sequence', () => {
      const html =
        '<p class="MsoNormal" style="margin-left:36pt;text-indent:-18pt">·  Bullet one</p>' +
        '<p class="MsoNormal" style="margin-left:36pt;text-indent:-18pt">·  Bullet two</p>' +
        '<p class="MsoNormal">Regular paragraph</p>' +
        '<p class="MsoNormal" style="margin-left:36pt;text-indent:-18pt">1. Number one</p>' +
        '<p class="MsoNormal" style="margin-left:36pt;text-indent:-18pt">2. Number two</p>'
      const result = cleanPastedHTML(html)
      expect(result).toContain('<ul>')
      expect(result).toContain('<ol>')
      expect(result).toContain('Bullet one')
      expect(result).toContain('Number one')
    })

    it('should not convert paragraphs without indent to list items', () => {
      const html = '<p class="MsoNormal">·  Not a list item</p>'
      const result = cleanPastedHTML(html)
      expect(result).not.toContain('<ul>')
      expect(result).not.toContain('<li>')
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

  describe('detects additional markdown patterns', () => {
    it('should detect task lists with unchecked items', () => {
      expect(looksLikeMarkdown('- [ ] Buy groceries\n- [ ] Walk the dog')).toBe(true)
    })

    it('should detect task lists with checked items', () => {
      expect(looksLikeMarkdown('- [x] Done task\n- [X] Also done')).toBe(true)
    })

    it('should detect markdown images', () => {
      expect(looksLikeMarkdown('![screenshot](image.png)\nSome description text')).toBe(true)
    })

    it('should detect markdown tables with separator', () => {
      expect(looksLikeMarkdown('| Name | Age |\n|------|-----|\n| Alice | 30 |')).toBe(true)
    })

    it('should detect horizontal rules with dashes', () => {
      expect(looksLikeMarkdown('Section one\n---\nSection two')).toBe(true)
    })

    it('should detect horizontal rules with asterisks', () => {
      expect(looksLikeMarkdown('Section one\n***\nSection two')).toBe(true)
    })

    it('should detect horizontal rules with underscores', () => {
      expect(looksLikeMarkdown('Section one\n___\nSection two')).toBe(true)
    })

    it('should detect code fences with language specifier', () => {
      expect(looksLikeMarkdown('```javascript\nconst x = 1\n```')).toBe(true)
    })

    it('should detect multiple inline code spans', () => {
      expect(looksLikeMarkdown('Use `foo` and `bar` in your code\nAnother `baz` reference')).toBe(true)
    })
  })
})
