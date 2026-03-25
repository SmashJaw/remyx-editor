/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { LinkPlugin, detectLinks, slugify } from '../plugins/builtins/linkFeatures/index.js'

// ---- Helpers ----

function createMockEngine() {
  const listeners = {}
  const el = document.createElement('div')
  el.contentEditable = 'true'
  el.innerHTML = '<p>Hello world</p>'
  document.body.appendChild(el)

  return {
    element: el,
    eventBus: {
      on(event, handler) {
        if (!listeners[event]) listeners[event] = []
        listeners[event].push(handler)
        return () => {
          listeners[event] = listeners[event].filter(h => h !== handler)
        }
      },
      emit(event, data) {
        if (listeners[event]) {
          for (const h of listeners[event]) h(data)
        }
      },
    },
    history: { snapshot: vi.fn() },
    selection: {
      getSelectedText: vi.fn().mockReturnValue(''),
      getClosestElement: vi.fn(),
      wrapWith: vi.fn((tag, attrs) => {
        const el = document.createElement(tag)
        Object.entries(attrs).forEach(([k, v]) => { if (v !== undefined) el.setAttribute(k, v) })
        return el
      }),
    },
    commands: { register: vi.fn() },
    _cleanup() { document.body.removeChild(el) },
  }
}

// ---- Tests ----

describe('detectLinks', () => {
  it('detects HTTP URLs', () => {
    const results = detectLinks('Visit https://example.com for more')
    expect(results.length).toBe(1)
    expect(results[0].type).toBe('url')
    expect(results[0].value).toBe('https://example.com')
  })

  it('detects www URLs', () => {
    const results = detectLinks('Go to www.example.com now')
    expect(results.length).toBe(1)
    expect(results[0].type).toBe('url')
    expect(results[0].value).toBe('www.example.com')
  })

  it('detects email addresses', () => {
    const results = detectLinks('Email alice@example.com')
    expect(results.length).toBe(1)
    expect(results[0].type).toBe('email')
    expect(results[0].value).toBe('alice@example.com')
  })

  it('detects phone numbers', () => {
    const results = detectLinks('Call (555) 123-4567')
    expect(results.length).toBe(1)
    expect(results[0].type).toBe('phone')
    expect(results[0].value).toBe('(555) 123-4567')
  })

  it('detects multiple links', () => {
    const results = detectLinks('Visit https://a.com and email bob@x.com')
    expect(results.length).toBe(2)
    expect(results[0].type).toBe('url')
    expect(results[1].type).toBe('email')
  })

  it('returns empty for plain text', () => {
    expect(detectLinks('Just plain text here')).toEqual([])
  })

  it('results are sorted by index', () => {
    const results = detectLinks('bob@x.com then https://a.com')
    expect(results[0].index).toBeLessThan(results[1].index)
  })

  it('does not double-detect email inside URL', () => {
    const results = detectLinks('https://user@example.com/path')
    // Should detect as URL, not also as email
    const emails = results.filter(r => r.type === 'email')
    expect(emails.length).toBe(0)
  })
})

describe('slugify', () => {
  it('converts text to a URL-safe slug', () => {
    expect(slugify('Hello World')).toBe('hello-world')
  })

  it('removes special characters', () => {
    expect(slugify('Section #1: Overview!')).toBe('section-1-overview')
  })

  it('collapses multiple hyphens', () => {
    expect(slugify('a   b   c')).toBe('a-b-c')
  })

  it('trims leading/trailing hyphens', () => {
    expect(slugify('  hello  ')).toBe('hello')
  })

  it('returns "anchor" for empty input', () => {
    expect(slugify('')).toBe('anchor')
    expect(slugify('!!!')).toBe('anchor')
  })
})

describe('LinkPlugin', () => {
  let engine
  let plugin

  beforeEach(() => {
    engine = createMockEngine()
  })

  afterEach(() => {
    plugin?.destroy()
    engine._cleanup()
  })

  it('creates a valid plugin', () => {
    plugin = LinkPlugin()
    expect(plugin.name).toBe('advancedLinks')
    expect(plugin.requiresFullAccess).toBe(true)
    expect(typeof plugin.init).toBe('function')
    expect(typeof plugin.destroy).toBe('function')
  })

  it('registers 6 commands', () => {
    plugin = LinkPlugin()
    expect(plugin.commands.length).toBe(6)
    const names = plugin.commands.map(c => c.name)
    expect(names).toContain('insertBookmark')
    expect(names).toContain('linkToBookmark')
    expect(names).toContain('getBookmarks')
    expect(names).toContain('removeBookmark')
    expect(names).toContain('scanBrokenLinks')
    expect(names).toContain('getBrokenLinks')
  })

  it('has context menu item', () => {
    plugin = LinkPlugin()
    expect(plugin.contextMenuItems.length).toBe(1)
    expect(plugin.contextMenuItems[0].label).toBe('Insert Bookmark Here')
  })

  describe('after init', () => {
    beforeEach(() => {
      plugin = LinkPlugin({
        autoLink: true,
        showPreviews: false,
        scanInterval: 0,
      })
      plugin.init(engine)
    })

    it('exposes _links API on engine', () => {
      expect(engine._links).toBeDefined()
      expect(typeof engine._links.detectLinks).toBe('function')
      expect(typeof engine._links.slugify).toBe('function')
      expect(typeof engine._links.getBrokenLinks).toBe('function')
      expect(typeof engine._links.getBookmarks).toBe('function')
      expect(typeof engine._links.scanForBrokenLinks).toBe('function')
      expect(typeof engine._links.clearUnfurlCache).toBe('function')
    })

    it('insertBookmark creates a bookmark element', () => {
      // Place caret in the editor
      const p = engine.element.querySelector('p')
      const range = document.createRange()
      range.selectNodeContents(p)
      range.collapse(true)
      window.getSelection().removeAllRanges()
      window.getSelection().addRange(range)

      const insertCmd = plugin.commands.find(c => c.name === 'insertBookmark')
      const bookmark = insertCmd.execute(engine, { name: 'Introduction' })

      expect(bookmark).not.toBeNull()
      expect(bookmark.classList.contains('rmx-bookmark')).toBe(true)
      expect(bookmark.getAttribute('data-bookmark')).toBe('introduction')
      expect(bookmark.id).toBe('introduction')
    })

    it('insertBookmark with custom id', () => {
      const p = engine.element.querySelector('p')
      const range = document.createRange()
      range.selectNodeContents(p)
      range.collapse(true)
      window.getSelection().removeAllRanges()
      window.getSelection().addRange(range)

      const insertCmd = plugin.commands.find(c => c.name === 'insertBookmark')
      const bookmark = insertCmd.execute(engine, { name: 'My Section', id: 'custom-id' })

      expect(bookmark.getAttribute('data-bookmark')).toBe('custom-id')
      expect(bookmark.id).toBe('custom-id')
    })

    it('getBookmarks returns all bookmarks', () => {
      const p = engine.element.querySelector('p')
      const range = document.createRange()
      range.selectNodeContents(p)
      range.collapse(true)
      window.getSelection().removeAllRanges()
      window.getSelection().addRange(range)

      const insertCmd = plugin.commands.find(c => c.name === 'insertBookmark')
      insertCmd.execute(engine, { name: 'First' })
      insertCmd.execute(engine, { name: 'Second' })

      const getCmd = plugin.commands.find(c => c.name === 'getBookmarks')
      const bookmarks = getCmd.execute(engine)
      expect(bookmarks.length).toBe(2)
    })

    it('removeBookmark removes a bookmark', () => {
      const p = engine.element.querySelector('p')
      const range = document.createRange()
      range.selectNodeContents(p)
      range.collapse(true)
      window.getSelection().removeAllRanges()
      window.getSelection().addRange(range)

      const insertCmd = plugin.commands.find(c => c.name === 'insertBookmark')
      insertCmd.execute(engine, { name: 'ToRemove', id: 'remove-me' })

      expect(engine.element.querySelector('[data-bookmark="remove-me"]')).not.toBeNull()

      const removeCmd = plugin.commands.find(c => c.name === 'removeBookmark')
      removeCmd.execute(engine, 'remove-me')

      expect(engine.element.querySelector('[data-bookmark="remove-me"]')).toBeNull()
    })

    it('getBrokenLinks returns empty initially', () => {
      const cmd = plugin.commands.find(c => c.name === 'getBrokenLinks')
      expect(cmd.execute()).toEqual([])
    })
  })

  describe('link click tracking', () => {
    it('calls onLinkClick when a link is clicked', () => {
      const onLinkClick = vi.fn()
      plugin = LinkPlugin({ onLinkClick, autoLink: false, showPreviews: false, scanInterval: 0 })
      plugin.init(engine)

      engine.element.innerHTML = '<p><a href="https://example.com">Click me</a></p>'
      const anchor = engine.element.querySelector('a')
      // Use dispatchEvent with bubbles:true so the delegated listener catches it
      anchor.dispatchEvent(new MouseEvent('click', { bubbles: true }))

      expect(onLinkClick).toHaveBeenCalledTimes(1)
      const call = onLinkClick.mock.calls[0][0]
      expect(call.href).toContain('example.com')
      expect(call.text).toBe('Click me')
      expect(call.timestamp).toBeGreaterThan(0)
    })
  })

  describe('broken link scanning', () => {
    it('marks broken links', async () => {
      const validateLink = vi.fn().mockResolvedValue(false)
      plugin = LinkPlugin({ validateLink, scanInterval: 0, autoLink: false, showPreviews: false })
      plugin.init(engine)

      engine.element.innerHTML = '<p><a href="https://broken.example.com">Link</a></p>'

      await plugin.commands.find(c => c.name === 'scanBrokenLinks').execute()
      // Allow async to complete
      await new Promise(r => setTimeout(r, 50))

      const anchor = engine.element.querySelector('a')
      expect(anchor.classList.contains('rmx-link-broken')).toBe(true)
      expect(anchor.getAttribute('data-link-broken')).toBe('true')
    })

    it('does not mark valid links as broken', async () => {
      const validateLink = vi.fn().mockResolvedValue(true)
      plugin = LinkPlugin({ validateLink, scanInterval: 0, autoLink: false, showPreviews: false })
      plugin.init(engine)

      engine.element.innerHTML = '<p><a href="https://valid.example.com">Link</a></p>'

      await plugin.commands.find(c => c.name === 'scanBrokenLinks').execute()
      await new Promise(r => setTimeout(r, 50))

      const anchor = engine.element.querySelector('a')
      expect(anchor.classList.contains('rmx-link-broken')).toBe(false)
    })
  })
})
