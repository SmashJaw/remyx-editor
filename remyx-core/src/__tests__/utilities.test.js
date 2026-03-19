import { describe, it, expect } from 'vitest'
import { cleanPastedHTML, looksLikeMarkdown } from '../utils/pasteClean.js'
import { formatHTML } from '../utils/formatHTML.js'
import { generateId, closestBlock, isBlockEmpty } from '../utils/dom.js'

describe('looksLikeMarkdown', () => {
  it('should return false for null/empty/short input', () => {
    expect(looksLikeMarkdown(null)).toBe(false)
    expect(looksLikeMarkdown('')).toBe(false)
    expect(looksLikeMarkdown('ab')).toBe(false)
  })

  it('should detect headings', () => {
    expect(looksLikeMarkdown('# Hello\nWorld')).toBe(true)
    expect(looksLikeMarkdown('## Subheading\nMore text')).toBe(true)
  })

  it('should detect bold text', () => {
    expect(looksLikeMarkdown('This is **bold** text\nAnother line')).toBe(true)
    expect(looksLikeMarkdown('This is __bold__ text\nAnother line')).toBe(true)
  })

  it('should detect italic text', () => {
    expect(looksLikeMarkdown('This is *italic* text\nAnother line')).toBe(true)
  })

  it('should detect unordered lists', () => {
    expect(looksLikeMarkdown('- Item 1\n- Item 2\n- Item 3')).toBe(true)
    expect(looksLikeMarkdown('* Item 1\n* Item 2')).toBe(true)
  })

  it('should detect ordered lists', () => {
    expect(looksLikeMarkdown('1. Item 1\n2. Item 2\n3. Item 3')).toBe(true)
  })

  it('should detect task lists', () => {
    expect(looksLikeMarkdown('- [ ] Todo 1\n- [x] Done')).toBe(true)
  })

  it('should detect blockquotes', () => {
    expect(looksLikeMarkdown('> A quote\n> Continued\nSome more text')).toBe(true)
  })

  it('should detect code fences', () => {
    expect(looksLikeMarkdown('```\ncode here\n```')).toBe(true)
  })

  it('should detect links', () => {
    expect(looksLikeMarkdown('[Click here](https://example.com)\nSome text')).toBe(true)
  })

  it('should detect images', () => {
    expect(looksLikeMarkdown('![Alt text](image.png)\nCaption')).toBe(true)
  })

  it('should detect horizontal rules', () => {
    expect(looksLikeMarkdown('Above\n---\nBelow')).toBe(true)
  })

  it('should detect inline code', () => {
    expect(looksLikeMarkdown('Use `console.log` to debug\nAnother line')).toBe(true)
  })

  it('should detect tables', () => {
    expect(looksLikeMarkdown('| Col 1 | Col 2 |\n|-------|-------|\n| A | B |')).toBe(true)
  })

  it('should return false for plain text without markdown signals', () => {
    expect(looksLikeMarkdown('This is just a regular sentence.\nAnother sentence here.\nAnd one more.')).toBe(false)
  })

  it('should use ratio threshold for mixed content', () => {
    // Only 1 signal out of 10 lines (10%) should be below 30% threshold
    const lines = Array.from({ length: 10 }, (_, i) => `Line ${i} plain text`)
    lines[0] = '# Heading'
    // 1 signal / 10 lines = 10%, but heading gives +2 signals
    // so 2/10 = 20%, still below 30% but >= 2 signals total => true
    expect(looksLikeMarkdown(lines.join('\n'))).toBe(true)
  })
})

describe('cleanPastedHTML', () => {
  it('should return empty string for falsy input', () => {
    expect(cleanPastedHTML('')).toBe('')
    expect(cleanPastedHTML(null)).toBe('')
  })

  it('should strip meta/head/style/title tags', () => {
    const html = '<html><head><title>Doc</title><style>body{}</style></head><body><p>Content</p></body></html>'
    const result = cleanPastedHTML(html)
    expect(result).not.toContain('<html')
    expect(result).not.toContain('<head')
    expect(result).not.toContain('<title')
    expect(result).not.toContain('<style')
    expect(result).toContain('Content')
  })

  it('should strip meta tags', () => {
    const html = '<meta charset="utf-8"><p>Content</p>'
    const result = cleanPastedHTML(html)
    expect(result).not.toContain('<meta')
    expect(result).toContain('Content')
  })

  it('should remove empty spans', () => {
    const html = '<span>Hello</span> <span>World</span>'
    const result = cleanPastedHTML(html)
    expect(result).not.toContain('<span>')
    expect(result).toContain('Hello')
    expect(result).toContain('World')
  })

  it('should remove empty style attributes', () => {
    const html = '<p style="">Text</p>'
    const result = cleanPastedHTML(html)
    expect(result).not.toContain('style=""')
    expect(result).toContain('Text')
  })

  it('should remove empty class attributes', () => {
    const html = '<p class="">Text</p>'
    const result = cleanPastedHTML(html)
    expect(result).not.toContain('class=""')
  })

  it('should convert font tags to spans', () => {
    const html = '<font face="Arial">Text</font>'
    const result = cleanPastedHTML(html)
    expect(result).not.toContain('<font')
    expect(result).toContain('font-family: Arial')
  })

  it('should convert font color tags to spans', () => {
    const html = '<font color="red">Text</font>'
    const result = cleanPastedHTML(html)
    expect(result).not.toContain('<font')
    expect(result).toContain('color: red')
  })

  it('should normalize b to strong and i to em', () => {
    const html = '<b>Bold</b> <i>Italic</i>'
    const result = cleanPastedHTML(html)
    expect(result).toContain('<strong>')
    expect(result).toContain('</strong>')
    expect(result).toContain('<em>')
    expect(result).toContain('</em>')
  })

  it('should limit consecutive br tags to 2', () => {
    const html = 'Text<br><br><br><br><br>More'
    const result = cleanPastedHTML(html)
    expect(result).toContain('<br><br>')
    // Should not have more than 2 consecutive brs
    expect(result).not.toMatch(/<br\s*\/?><br\s*\/?><br\s*\/?>/)
  })

  it('should clean Word-specific markup', () => {
    const html = '<p class="MsoNormal" style="mso-margin-top: 5pt">Word content<!--[if gte mso 9]>xml<![endif]--></p>'
    const result = cleanPastedHTML(html)
    expect(result).not.toContain('MsoNormal')
    expect(result).not.toContain('mso-')
    expect(result).not.toContain('<!--[if')
    expect(result).toContain('Word content')
  })

  it('should clean Google Docs markup', () => {
    const html = '<b id="docs-internal-guid-123"><span class="c1" dir="ltr">Google text</span></b>'
    const result = cleanPastedHTML(html)
    expect(result).not.toContain('docs-internal')
    expect(result).toContain('Google text')
  })

  it('should remove empty paragraphs', () => {
    const html = '<p>Content</p><p></p><p>More</p>'
    const result = cleanPastedHTML(html)
    expect(result).not.toMatch(/<p[^>]*>\s*<\/p>/)
    expect(result).toContain('Content')
    expect(result).toContain('More')
  })
})

describe('formatHTML', () => {
  it('should return empty string for empty input', () => {
    expect(formatHTML('')).toBe('')
    expect(formatHTML('   ')).toBe('')
  })

  it('should format a simple paragraph', () => {
    const result = formatHTML('<p>Hello</p>')
    expect(result).toContain('<p>')
    expect(result).toContain('Hello')
    expect(result).toContain('</p>')
  })

  it('should indent nested block elements', () => {
    const result = formatHTML('<div><p>Nested</p></div>')
    const lines = result.split('\n')
    // The <p> should be indented inside <div>
    expect(lines.some((l) => l.startsWith('  '))).toBe(true)
  })

  it('should keep inline elements on one line', () => {
    const result = formatHTML('<p>Hello <strong>world</strong></p>')
    // Should be on one line since p only has inline content
    const lines = result.split('\n').filter((l) => l.trim())
    expect(lines.length).toBe(1)
    expect(lines[0]).toContain('<strong>world</strong>')
  })

  it('should handle void elements', () => {
    const result = formatHTML('<p>Text<br>More</p>')
    expect(result).toContain('<br>')
  })

  it('should handle self-closing elements', () => {
    const result = formatHTML('<hr>')
    expect(result).toContain('<hr>')
  })

  it('should format lists with indentation', () => {
    const result = formatHTML('<ul><li>Item 1</li><li>Item 2</li></ul>')
    expect(result).toContain('<ul>')
    expect(result).toContain('</ul>')
    expect(result).toContain('<li>')
  })
})

describe('generateId', () => {
  it('should generate a string starting with rmx-', () => {
    const id = generateId()
    expect(id).toMatch(/^rmx-/)
  })

  it('should generate unique IDs', () => {
    const ids = new Set(Array.from({ length: 50 }, () => generateId()))
    expect(ids.size).toBe(50)
  })

  it('should generate IDs of consistent length', () => {
    const id = generateId()
    // "rmx-" (4) + 9 random chars = 13
    expect(id.length).toBe(13)
  })
})

describe('closestBlock', () => {
  it('should find the nearest block parent', () => {
    const root = document.createElement('div')
    root.innerHTML = '<p><strong>Hello</strong></p>'
    const strong = root.querySelector('strong')
    const block = closestBlock(strong, root)
    expect(block.tagName).toBe('P')
  })

  it('should find heading as block', () => {
    const root = document.createElement('div')
    root.innerHTML = '<h1><em>Title</em></h1>'
    const em = root.querySelector('em')
    const block = closestBlock(em, root)
    expect(block.tagName).toBe('H1')
  })

  it('should handle text nodes', () => {
    const root = document.createElement('div')
    root.innerHTML = '<p>Hello</p>'
    const textNode = root.querySelector('p').firstChild
    const block = closestBlock(textNode, root)
    expect(block.tagName).toBe('P')
  })

  it('should return null when no block parent exists', () => {
    const root = document.createElement('div')
    root.innerHTML = '<span>Text</span>'
    const span = root.querySelector('span')
    const block = closestBlock(span, root)
    expect(block).toBeNull()
  })

  it('should not go past root', () => {
    const outer = document.createElement('div')
    const root = document.createElement('div')
    const p = document.createElement('p')
    p.textContent = 'Hello'
    root.appendChild(p)
    outer.appendChild(root)

    const block = closestBlock(p.firstChild, root)
    expect(block).toBe(p)
  })

  it('should find LI as block', () => {
    const root = document.createElement('div')
    root.innerHTML = '<ul><li>Item</li></ul>'
    const textNode = root.querySelector('li').firstChild
    const block = closestBlock(textNode, root)
    expect(block.tagName).toBe('LI')
  })
})

describe('isBlockEmpty', () => {
  it('should return true for null', () => {
    expect(isBlockEmpty(null)).toBe(true)
  })

  it('should return true for empty block', () => {
    const p = document.createElement('p')
    expect(isBlockEmpty(p)).toBe(true)
  })

  it('should return true for block with only whitespace', () => {
    const p = document.createElement('p')
    p.textContent = '   '
    expect(isBlockEmpty(p)).toBe(true)
  })

  it('should return false for block with text', () => {
    const p = document.createElement('p')
    p.textContent = 'Hello'
    expect(isBlockEmpty(p)).toBe(false)
  })

  it('should return false for block with img', () => {
    const p = document.createElement('p')
    const img = document.createElement('img')
    p.appendChild(img)
    expect(isBlockEmpty(p)).toBe(false)
  })

  it('should return false for block with hr', () => {
    const div = document.createElement('div')
    const hr = document.createElement('hr')
    div.appendChild(hr)
    expect(isBlockEmpty(div)).toBe(false)
  })

  it('should return false for block with input', () => {
    const p = document.createElement('p')
    const input = document.createElement('input')
    p.appendChild(input)
    expect(isBlockEmpty(p)).toBe(false)
  })
})
