
import { Sanitizer } from '../core/Sanitizer.js'

describe('Sanitizer', () => {
  let sanitizer

  beforeEach(() => {
    sanitizer = new Sanitizer()
  })

  describe('constructor', () => {
    it('should use default allowed tags and styles', () => {
      expect(sanitizer.allowedTags).toBeDefined()
      expect(sanitizer.allowedStyles).toBeDefined()
    })

    it('should accept custom allowed tags', () => {
      const custom = { p: ['class'], strong: [] }
      const s = new Sanitizer({ allowedTags: custom })
      expect(s.allowedTags).toBe(custom)
    })
  })

  describe('sanitize', () => {
    it('should return empty string for falsy input', () => {
      expect(sanitizer.sanitize('')).toBe('')
      expect(sanitizer.sanitize(null)).toBe('')
      expect(sanitizer.sanitize(undefined)).toBe('')
    })

    it('should preserve allowed tags', () => {
      const html = '<p>Hello <strong>world</strong></p>'
      const result = sanitizer.sanitize(html)
      expect(result).toContain('<p>')
      expect(result).toContain('<strong>')
    })

    it('should preserve plain text content', () => {
      const html = '<p>Hello world</p>'
      const result = sanitizer.sanitize(html)
      expect(result).toContain('Hello world')
    })

    it('should preserve headings', () => {
      const html = '<h1>Title</h1><h2>Subtitle</h2>'
      const result = sanitizer.sanitize(html)
      expect(result).toContain('<h1>')
      expect(result).toContain('<h2>')
    })

    it('should preserve links with allowed attributes', () => {
      const html = '<a href="https://example.com" target="_blank">Link</a>'
      const result = sanitizer.sanitize(html)
      expect(result).toContain('href="https://example.com"')
      expect(result).toContain('target="_blank"')
    })

    it('should preserve images with allowed attributes', () => {
      const html = '<img src="test.png" alt="test" width="100">'
      const result = sanitizer.sanitize(html)
      expect(result).toContain('src="test.png"')
      expect(result).toContain('alt="test"')
      expect(result).toContain('width="100"')
    })

    it('should preserve lists', () => {
      const html = '<ul><li>Item 1</li><li>Item 2</li></ul>'
      const result = sanitizer.sanitize(html)
      expect(result).toContain('<ul>')
      expect(result).toContain('<li>')
    })

    it('should preserve tables', () => {
      const html = '<table><tr><td>Cell</td></tr></table>'
      const result = sanitizer.sanitize(html)
      expect(result).toContain('<table>')
      expect(result).toContain('<td>')
    })

    it('should preserve blockquotes', () => {
      const html = '<blockquote>A quote</blockquote>'
      const result = sanitizer.sanitize(html)
      expect(result).toContain('<blockquote>')
    })

    it('should preserve code blocks', () => {
      const html = '<pre><code>const x = 1</code></pre>'
      const result = sanitizer.sanitize(html)
      expect(result).toContain('<pre>')
      expect(result).toContain('<code>')
    })
  })

  describe('XSS prevention', () => {
    it('should remove script tags and their children entirely', () => {
      const html = '<p>Hello</p><script>alert("xss")</script><p>World</p>'
      const result = sanitizer.sanitize(html)
      expect(result).not.toContain('<script>')
      expect(result).not.toContain('alert')
      expect(result).toContain('Hello')
      expect(result).toContain('World')
    })

    it('should remove style tags and their children entirely', () => {
      const html = '<p>Text</p><style>body { display: none }</style>'
      const result = sanitizer.sanitize(html)
      expect(result).not.toContain('<style>')
      expect(result).not.toContain('display: none')
    })

    it('should remove event handler attributes', () => {
      const html = '<p onclick="alert(1)">Click me</p>'
      const result = sanitizer.sanitize(html)
      expect(result).not.toContain('onclick')
      expect(result).toContain('Click me')
    })

    it('should remove all on* attributes', () => {
      const html = '<img src="x" onerror="alert(1)" onload="alert(2)">'
      const result = sanitizer.sanitize(html)
      expect(result).not.toContain('onerror')
      expect(result).not.toContain('onload')
    })

    it('should neutralize javascript: URLs in href', () => {
      const html = '<a href="javascript:alert(1)">Click</a>'
      const result = sanitizer.sanitize(html)
      expect(result).not.toContain('javascript:')
      expect(result).toContain('href="#"')
    })

    it('should neutralize javascript: with whitespace', () => {
      const html = '<a href="  javascript:alert(1)">Click</a>'
      const result = sanitizer.sanitize(html)
      expect(result).not.toContain('javascript:')
    })

    it('should remove svg tags entirely', () => {
      const html = '<svg onload="alert(1)"><circle r="10"></circle></svg>'
      const result = sanitizer.sanitize(html)
      expect(result).not.toContain('<svg')
      expect(result).not.toContain('<circle')
    })

    it('should remove form tags entirely', () => {
      const html = '<form action="evil.com"><input type="text"></form>'
      const result = sanitizer.sanitize(html)
      expect(result).not.toContain('<form')
    })

    it('should remove object/embed/applet tags entirely', () => {
      const html = '<object data="evil.swf"></object><embed src="evil.swf"><applet code="Evil.class"></applet>'
      const result = sanitizer.sanitize(html)
      expect(result).not.toContain('<object')
      expect(result).not.toContain('<embed')
      expect(result).not.toContain('<applet')
    })

    it('should remove template tags entirely', () => {
      const html = '<template><script>alert(1)</script></template>'
      const result = sanitizer.sanitize(html)
      expect(result).not.toContain('<template')
    })

    it('should remove HTML comments', () => {
      const html = '<p>Hello</p><!-- comment --><p>World</p>'
      const result = sanitizer.sanitize(html)
      expect(result).not.toContain('<!--')
      expect(result).not.toContain('comment')
    })
  })

  describe('tag allowlisting', () => {
    it('should unwrap unknown tags but keep their children', () => {
      const html = '<p><custom>Hello</custom> World</p>'
      const result = sanitizer.sanitize(html)
      expect(result).not.toContain('<custom')
      expect(result).toContain('Hello')
      expect(result).toContain('World')
    })

    it('should unwrap non-dangerous unknown tags', () => {
      const html = '<section><p>Content</p></section>'
      const result = sanitizer.sanitize(html)
      // section is not in ALLOWED_TAGS but is not in DANGEROUS_REMOVE_TAGS
      // so its children should be kept
      expect(result).toContain('Content')
    })
  })

  describe('attribute filtering', () => {
    it('should remove disallowed attributes', () => {
      const html = '<p class="valid" data-custom="invalid">Text</p>'
      const result = sanitizer.sanitize(html)
      expect(result).toContain('class="valid"')
      expect(result).not.toContain('data-custom')
    })

    it('should remove style attribute when not in allowlist for tag', () => {
      const html = '<strong style="color: red">Bold</strong>'
      const result = sanitizer.sanitize(html)
      expect(result).not.toContain('style')
    })

    it('should keep style attribute when allowed for tag', () => {
      const html = '<p style="color: red">Text</p>'
      const result = sanitizer.sanitize(html)
      expect(result).toContain('color')
    })
  })

  describe('style cleaning', () => {
    it('should only keep allowed CSS properties', () => {
      const html = '<p style="color: red; position: absolute; font-size: 14px">Text</p>'
      const result = sanitizer.sanitize(html)
      expect(result).toContain('color')
      expect(result).toContain('font-size')
      expect(result).not.toContain('position')
    })

    it('should block CSS expression() injection', () => {
      const html = '<p style="color: expression(alert(1))">Text</p>'
      const result = sanitizer.sanitize(html)
      expect(result).not.toContain('expression')
    })

    it('should block CSS @import injection', () => {
      const html = '<p style="color: @import url(evil.css)">Text</p>'
      const result = sanitizer.sanitize(html)
      expect(result).not.toContain('@import')
    })

    it('should remove style attribute entirely if no allowed properties remain', () => {
      const html = '<p style="position: absolute; z-index: 9999">Text</p>'
      const result = sanitizer.sanitize(html)
      expect(result).not.toContain('style')
    })
  })

  describe('input restrictions', () => {
    it('should allow checkbox inputs', () => {
      const html = '<input type="checkbox" checked>'
      const result = sanitizer.sanitize(html)
      expect(result).toContain('type="checkbox"')
    })

    it('should remove non-checkbox inputs', () => {
      const html = '<input type="text" value="phishing">'
      const result = sanitizer.sanitize(html)
      expect(result).not.toContain('<input')
    })

    it('should remove password inputs', () => {
      const html = '<input type="password">'
      const result = sanitizer.sanitize(html)
      expect(result).not.toContain('<input')
    })

    it('should remove hidden inputs', () => {
      const html = '<input type="hidden" name="token" value="secret">'
      const result = sanitizer.sanitize(html)
      expect(result).not.toContain('<input')
    })
  })

  describe('iframe domain allowlist', () => {
    it('should allow YouTube iframe', () => {
      const html = '<iframe src="https://www.youtube.com/embed/abc123"></iframe>'
      const result = sanitizer.sanitize(html)
      expect(result).toContain('<iframe')
      expect(result).toContain('youtube.com')
    })

    it('should allow youtube-nocookie.com iframe', () => {
      const html = '<iframe src="https://www.youtube-nocookie.com/embed/abc123"></iframe>'
      const result = sanitizer.sanitize(html)
      expect(result).toContain('<iframe')
    })

    it('should allow Vimeo iframe', () => {
      const html = '<iframe src="https://player.vimeo.com/video/123456"></iframe>'
      const result = sanitizer.sanitize(html)
      expect(result).toContain('<iframe')
      expect(result).toContain('vimeo.com')
    })

    it('should allow Dailymotion iframe', () => {
      const html = '<iframe src="https://www.dailymotion.com/embed/video/abc"></iframe>'
      const result = sanitizer.sanitize(html)
      expect(result).toContain('<iframe')
    })

    it('should remove iframe with disallowed domain', () => {
      const html = '<iframe src="https://evil.example.com/attack"></iframe>'
      const result = sanitizer.sanitize(html)
      expect(result).not.toContain('<iframe')
    })

    it('should remove iframe with no src', () => {
      const html = '<iframe></iframe>'
      const result = sanitizer.sanitize(html)
      expect(result).not.toContain('<iframe')
    })

    it('should remove iframe with http:// src (non-HTTPS)', () => {
      const html = '<iframe src="http://www.youtube.com/embed/abc123"></iframe>'
      const result = sanitizer.sanitize(html)
      expect(result).not.toContain('<iframe')
    })

    it('should remove iframe with javascript: src', () => {
      const html = '<iframe src="javascript:alert(1)"></iframe>'
      const result = sanitizer.sanitize(html)
      expect(result).not.toContain('<iframe')
    })

    it('should remove iframe with data: src', () => {
      const html = '<iframe src="data:text/html,<script>alert(1)</script>"></iframe>'
      const result = sanitizer.sanitize(html)
      expect(result).not.toContain('<iframe')
    })

    it('should accept custom iframeAllowedDomains', () => {
      const custom = new Sanitizer({ iframeAllowedDomains: ['example.com'] })
      const allowed = '<iframe src="https://example.com/page"></iframe>'
      const blocked = '<iframe src="https://www.youtube.com/embed/abc"></iframe>'
      expect(custom.sanitize(allowed)).toContain('<iframe')
      expect(custom.sanitize(blocked)).not.toContain('<iframe')
    })

    it('should allow subdomains of allowed domains', () => {
      const custom = new Sanitizer({ iframeAllowedDomains: ['example.com'] })
      const html = '<iframe src="https://sub.example.com/page"></iframe>'
      expect(custom.sanitize(html)).toContain('<iframe')
    })
  })
})
