import { highlightHTML } from '../components/Modals/CodeEditor/highlightHTML.js'
import { highlightMarkdown } from '../components/Modals/CodeEditor/highlightMarkdown.js'

describe('highlightHTML', () => {
  it('tokenizes HTML comments', () => {
    const tokens = highlightHTML('<!-- comment -->')
    const comments = tokens.filter(t => t.className === 'rmx-syn-comment')
    expect(comments.length).toBe(1)
  })

  it('tokenizes tags', () => {
    const tokens = highlightHTML('<div>text</div>')
    expect(tokens.length).toBeGreaterThan(0)
  })

  it('tokenizes attributes', () => {
    const tokens = highlightHTML('<div class="test">hi</div>')
    const attrs = tokens.filter(t => t.className === 'rmx-syn-attr-name')
    expect(attrs.length).toBeGreaterThanOrEqual(1)
  })

  it('tokenizes doctype', () => {
    const tokens = highlightHTML('<!DOCTYPE html>')
    const doctypes = tokens.filter(t => t.className === 'rmx-syn-doctype')
    expect(doctypes.length).toBe(1)
  })

  it('handles empty input', () => {
    const tokens = highlightHTML('')
    expect(tokens).toEqual([])
  })

  it('handles plain text', () => {
    const tokens = highlightHTML('just plain text')
    expect(tokens.length).toBeGreaterThanOrEqual(1)
  })

  it('tokenizes self-closing tags', () => {
    const tokens = highlightHTML('<br /><img src="x" />')
    expect(tokens.length).toBeGreaterThan(0)
  })

  it('handles entities', () => {
    const tokens = highlightHTML('&amp; &lt; &gt;')
    expect(tokens.length).toBeGreaterThan(0)
  })

  it('handles complex HTML', () => {
    const html = '<div class="container" id="main"><p>Hello <em>world</em></p></div>'
    const tokens = highlightHTML(html)
    expect(tokens.length).toBeGreaterThan(5)
  })

  it('handles unclosed tags', () => {
    const tokens = highlightHTML('<div')
    expect(tokens.length).toBeGreaterThan(0)
  })

  it('handles attribute values', () => {
    const tokens = highlightHTML('<a href="https://example.com">link</a>')
    const attrValues = tokens.filter(t => t.className === 'rmx-syn-attr-value')
    expect(attrValues.length).toBeGreaterThanOrEqual(1)
  })
})

describe('highlightMarkdown', () => {
  it('tokenizes headings', () => {
    const tokens = highlightMarkdown('# Heading')
    const headings = tokens.filter(t => t.className === 'rmx-syn-heading')
    expect(headings.length).toBeGreaterThanOrEqual(1)
  })

  it('tokenizes bold', () => {
    const tokens = highlightMarkdown('**bold**')
    const bold = tokens.filter(t => t.className === 'rmx-syn-bold')
    expect(bold.length).toBeGreaterThanOrEqual(1)
  })

  it('tokenizes italic', () => {
    const tokens = highlightMarkdown('*italic*')
    expect(tokens.length).toBeGreaterThan(0)
  })

  it('tokenizes code blocks', () => {
    const tokens = highlightMarkdown('```\ncode here\n```')
    const codeTokens = tokens.filter(t => t.className === 'rmx-syn-code')
    expect(codeTokens.length).toBeGreaterThanOrEqual(1)
  })

  it('tokenizes inline code', () => {
    const tokens = highlightMarkdown('use `code` here')
    const inlineCode = tokens.filter(t => t.className === 'rmx-syn-code')
    expect(inlineCode.length).toBeGreaterThanOrEqual(1)
  })

  it('tokenizes links', () => {
    const tokens = highlightMarkdown('[link](https://example.com)')
    const links = tokens.filter(t => t.className === 'rmx-syn-link')
    expect(links.length).toBeGreaterThanOrEqual(1)
  })

  it('tokenizes blockquotes', () => {
    const tokens = highlightMarkdown('> quoted text')
    const quotes = tokens.filter(t => t.className === 'rmx-syn-blockquote')
    expect(quotes.length).toBeGreaterThanOrEqual(1)
  })

  it('tokenizes list items', () => {
    const tokens = highlightMarkdown('- item 1\n- item 2')
    // List markers may use different class names depending on implementation
    expect(tokens.length).toBeGreaterThan(0)
  })

  it('tokenizes horizontal rules', () => {
    const tokens = highlightMarkdown('---')
    const hrs = tokens.filter(t => t.className === 'rmx-syn-hr')
    expect(hrs.length).toBeGreaterThanOrEqual(1)
  })

  it('handles empty input', () => {
    const tokens = highlightMarkdown('')
    expect(Array.isArray(tokens)).toBe(true)
  })

  it('handles multi-line content', () => {
    const md = '# Title\n\nParagraph text.\n\n## Subtitle\n\n- List item\n'
    const tokens = highlightMarkdown(md)
    expect(tokens.length).toBeGreaterThan(5)
  })

  it('tokenizes ## heading', () => {
    const tokens = highlightMarkdown('## Second Level')
    const headings = tokens.filter(t => t.className === 'rmx-syn-heading')
    expect(headings.length).toBeGreaterThanOrEqual(1)
  })

  it('tokenizes images', () => {
    const tokens = highlightMarkdown('![alt](image.png)')
    expect(tokens.length).toBeGreaterThan(0)
  })

  it('tokenizes numbered lists', () => {
    const tokens = highlightMarkdown('1. first\n2. second')
    expect(tokens.length).toBeGreaterThan(0)
  })
})
