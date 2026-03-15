import { htmlToMarkdown, markdownToHtml } from '../utils/markdownConverter.js'

describe('htmlToMarkdown', () => {
  it('should return empty string for empty input', () => {
    expect(htmlToMarkdown('')).toBe('')
    expect(htmlToMarkdown(null)).toBe('')
  })

  it('should return empty string for default empty editor state', () => {
    expect(htmlToMarkdown('<p><br></p>')).toBe('')
  })

  it('should convert paragraph to plain text', () => {
    const md = htmlToMarkdown('<p>Hello world</p>')
    expect(md.trim()).toBe('Hello world')
  })

  it('should convert bold to **', () => {
    const md = htmlToMarkdown('<p><strong>bold text</strong></p>')
    expect(md).toContain('**bold text**')
  })

  it('should convert italic to *', () => {
    const md = htmlToMarkdown('<p><em>italic text</em></p>')
    expect(md).toContain('*italic text*')
  })

  it('should convert headings to # syntax', () => {
    const md = htmlToMarkdown('<h1>Title</h1>')
    expect(md.trim()).toBe('# Title')
  })

  it('should convert h2 to ## syntax', () => {
    const md = htmlToMarkdown('<h2>Subtitle</h2>')
    expect(md.trim()).toBe('## Subtitle')
  })

  it('should convert unordered lists', () => {
    const md = htmlToMarkdown('<ul><li>Item 1</li><li>Item 2</li></ul>')
    expect(md).toMatch(/-\s+Item 1/)
    expect(md).toMatch(/-\s+Item 2/)
  })

  it('should convert ordered lists', () => {
    const md = htmlToMarkdown('<ol><li>First</li><li>Second</li></ol>')
    expect(md).toMatch(/1\.\s+First/)
    expect(md).toMatch(/2\.\s+Second/)
  })

  it('should convert links', () => {
    const md = htmlToMarkdown('<a href="https://example.com">Link</a>')
    expect(md).toContain('[Link](https://example.com)')
  })

  it('should convert blockquotes', () => {
    const md = htmlToMarkdown('<blockquote>A quote</blockquote>')
    expect(md).toContain('> A quote')
  })

  it('should convert code blocks', () => {
    const md = htmlToMarkdown('<pre><code>const x = 1</code></pre>')
    expect(md).toContain('```')
    expect(md).toContain('const x = 1')
  })

  it('should convert horizontal rules', () => {
    const md = htmlToMarkdown('<hr>')
    expect(md.trim()).toBe('---')
  })

  it('should preserve underline as <u> tag', () => {
    const md = htmlToMarkdown('<u>underlined</u>')
    expect(md).toContain('<u>underlined</u>')
  })
})

describe('markdownToHtml', () => {
  it('should return empty string for empty input', () => {
    expect(markdownToHtml('')).toBe('')
    expect(markdownToHtml(null)).toBe('')
  })

  it('should convert plain text to paragraph', () => {
    const html = markdownToHtml('Hello world')
    expect(html).toContain('<p>Hello world</p>')
  })

  it('should convert # heading to h1', () => {
    const html = markdownToHtml('# Title')
    expect(html).toContain('<h1>')
    expect(html).toContain('Title')
  })

  it('should convert **bold** to strong', () => {
    const html = markdownToHtml('**bold**')
    expect(html).toContain('<strong>bold</strong>')
  })

  it('should convert *italic* to em', () => {
    const html = markdownToHtml('*italic*')
    expect(html).toContain('<em>italic</em>')
  })

  it('should convert markdown links', () => {
    const html = markdownToHtml('[Click](https://example.com)')
    expect(html).toContain('href="https://example.com"')
    expect(html).toContain('Click')
  })

  it('should convert unordered lists', () => {
    const html = markdownToHtml('- Item 1\n- Item 2')
    expect(html).toContain('<ul>')
    expect(html).toContain('<li>')
  })

  it('should convert code fences', () => {
    const html = markdownToHtml('```\nconst x = 1\n```')
    expect(html).toContain('<code>')
    expect(html).toContain('const x = 1')
  })

  it('should convert blockquotes', () => {
    const html = markdownToHtml('> A quote')
    expect(html).toContain('<blockquote>')
  })
})
