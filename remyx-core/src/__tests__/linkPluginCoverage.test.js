import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { LinkPlugin, detectLinks, slugify } from '../plugins/builtins/linkFeatures/LinkPlugin.js'

vi.mock('../utils/escapeHTML.js', () => ({
  escapeHTMLAttr: vi.fn((str) => str),
  escapeHTML: vi.fn((str) => str),
}))

function createMockEngine() {
  const element = document.createElement('div')
  element.contentEditable = 'true'
  document.body.appendChild(element)
  return {
    element,
    eventBus: { on: vi.fn(() => vi.fn()), emit: vi.fn() },
    history: { snapshot: vi.fn() },
    selection: {
      save: vi.fn(),
      restore: vi.fn(),
      getSelection: vi.fn(() => window.getSelection()),
      getSelectedText: vi.fn(() => 'selected text'),
      wrapWith: vi.fn(() => document.createElement('a')),
      getRange: vi.fn(() => null),
    },
    commands: { has: vi.fn(() => true) },
  }
}

describe('detectLinks', () => {
  it('detects URLs', () => {
    const result = detectLinks('Visit https://example.com today')
    expect(result).toHaveLength(1)
    expect(result[0].type).toBe('url')
    expect(result[0].value).toBe('https://example.com')
  })

  it('detects www URLs', () => {
    const result = detectLinks('Visit www.example.com today')
    expect(result).toHaveLength(1)
    expect(result[0].type).toBe('url')
  })

  it('detects email addresses', () => {
    const result = detectLinks('Contact user@example.com')
    expect(result).toHaveLength(1)
    expect(result[0].type).toBe('email')
    expect(result[0].value).toBe('user@example.com')
  })

  it('detects phone numbers', () => {
    const result = detectLinks('Call (555) 123-4567')
    expect(result).toHaveLength(1)
    expect(result[0].type).toBe('phone')
  })

  it('detects multiple links in text', () => {
    const result = detectLinks('Visit https://example.com and contact user@example.com')
    expect(result.length).toBeGreaterThanOrEqual(2)
  })

  it('sorts results by index', () => {
    const result = detectLinks('user@test.com and https://example.com')
    expect(result[0].index).toBeLessThan(result[1].index)
  })

  it('returns empty array for plain text', () => {
    expect(detectLinks('just plain text')).toEqual([])
  })

  it('does not detect email inside a URL', () => {
    const result = detectLinks('https://user@example.com/path')
    // Email should not be separately detected since it's within the URL
    const emailResults = result.filter(r => r.type === 'email')
    expect(emailResults).toHaveLength(0)
  })
})

describe('slugify', () => {
  it('converts text to lowercase kebab-case', () => {
    expect(slugify('Hello World')).toBe('hello-world')
  })

  it('removes special characters', () => {
    expect(slugify('Hello! @World#')).toBe('hello-world')
  })

  it('collapses multiple dashes', () => {
    expect(slugify('a   b   c')).toBe('a-b-c')
  })

  it('trims leading/trailing dashes', () => {
    expect(slugify(' hello ')).toBe('hello')
  })

  it('returns "anchor" for empty result', () => {
    expect(slugify('!@#$%')).toBe('anchor')
  })
})

describe('LinkPlugin', () => {
  let engine, plugin

  beforeEach(() => {
    engine = createMockEngine()
  })

  afterEach(() => {
    if (plugin) plugin.destroy(engine)
    engine.element.remove()
  })

  describe('init/destroy', () => {
    it('initializes plugin and exposes API', () => {
      plugin = LinkPlugin()
      plugin.init(engine)
      expect(engine._links).toBeTruthy()
      expect(engine._links.detectLinks).toBe(detectLinks)
      expect(engine._links.slugify).toBe(slugify)
    })

    it('cleans up on destroy', () => {
      plugin = LinkPlugin()
      plugin.init(engine)
      plugin.destroy(engine)
    })
  })

  describe('commands — insertBookmark', () => {
    it('inserts a bookmark element', () => {
      plugin = LinkPlugin()
      plugin.init(engine)

      const p = document.createElement('p')
      p.textContent = 'text'
      engine.element.appendChild(p)

      const range = document.createRange()
      range.setStart(p.firstChild, 0)
      range.collapse(true)
      const sel = window.getSelection()
      sel.removeAllRanges()
      sel.addRange(range)

      const cmd = plugin.commands.find(c => c.name === 'insertBookmark')
      const result = cmd.execute(engine, { name: 'Test Bookmark' })

      expect(result).toBeTruthy()
      expect(result.id).toBe('test-bookmark')
      expect(result.classList.contains('rmx-bookmark')).toBe(true)
      expect(engine.eventBus.emit).toHaveBeenCalledWith('bookmark:created', expect.any(Object))
    })

    it('uses provided id for bookmark', () => {
      plugin = LinkPlugin()
      plugin.init(engine)

      const p = document.createElement('p')
      p.textContent = 'text'
      engine.element.appendChild(p)

      const range = document.createRange()
      range.setStart(p.firstChild, 0)
      range.collapse(true)
      const sel = window.getSelection()
      sel.removeAllRanges()
      sel.addRange(range)

      const cmd = plugin.commands.find(c => c.name === 'insertBookmark')
      const result = cmd.execute(engine, { id: 'custom-id' })
      expect(result.id).toBe('custom-id')
    })
  })

  describe('commands — getBookmarks', () => {
    it('returns list of bookmarks', () => {
      plugin = LinkPlugin()
      plugin.init(engine)

      const bookmark = document.createElement('a')
      bookmark.setAttribute('data-bookmark', 'bm1')
      bookmark.textContent = '\ud83d\udccc Test'
      engine.element.appendChild(bookmark)

      const cmd = plugin.commands.find(c => c.name === 'getBookmarks')
      const result = cmd.execute(engine)
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('bm1')
    })
  })

  describe('commands — removeBookmark', () => {
    it('removes a bookmark by id', () => {
      plugin = LinkPlugin()
      plugin.init(engine)

      const bookmark = document.createElement('a')
      bookmark.setAttribute('data-bookmark', 'bm1')
      engine.element.appendChild(bookmark)

      const cmd = plugin.commands.find(c => c.name === 'removeBookmark')
      cmd.execute(engine, 'bm1')
      expect(engine.element.querySelector('[data-bookmark="bm1"]')).toBeNull()
      expect(engine.eventBus.emit).toHaveBeenCalledWith('bookmark:deleted', { id: 'bm1' })
    })
  })

  describe('commands — getBrokenLinks', () => {
    it('returns empty array initially', () => {
      plugin = LinkPlugin()
      plugin.init(engine)
      const cmd = plugin.commands.find(c => c.name === 'getBrokenLinks')
      expect(cmd.execute()).toEqual([])
    })
  })

  describe('commands — linkToBookmark', () => {
    it('creates link to bookmark', () => {
      plugin = LinkPlugin()
      plugin.init(engine)

      const cmd = plugin.commands.find(c => c.name === 'linkToBookmark')
      cmd.execute(engine, 'bm1')

      expect(engine.selection.wrapWith).toHaveBeenCalledWith('a', { href: '#bm1' })
    })

    it('does nothing when no bookmark id', () => {
      plugin = LinkPlugin()
      plugin.init(engine)
      const cmd = plugin.commands.find(c => c.name === 'linkToBookmark')
      cmd.execute(engine, '')
    })
  })

  describe('broken link scanning', () => {
    it('scans links and marks broken ones', async () => {
      const validateLink = vi.fn()
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false)

      const onBrokenLink = vi.fn()

      plugin = LinkPlugin({ validateLink, onBrokenLink, scanInterval: 0 })
      plugin.init(engine)

      const a1 = document.createElement('a')
      a1.href = 'https://good.com'
      const a2 = document.createElement('a')
      a2.href = 'https://broken.com'
      engine.element.appendChild(a1)
      engine.element.appendChild(a2)

      await engine._links.scanForBrokenLinks()

      expect(a1.classList.contains('rmx-link-broken')).toBe(false)
      expect(a2.classList.contains('rmx-link-broken')).toBe(true)
      // jsdom normalizes href with trailing slash
      expect(onBrokenLink).toHaveBeenCalledWith(expect.stringContaining('broken.com'), a2)
    })

    it('handles validateLink rejection', async () => {
      const validateLink = vi.fn().mockRejectedValue(new Error('network'))
      plugin = LinkPlugin({ validateLink, scanInterval: 0 })
      plugin.init(engine)

      const a = document.createElement('a')
      a.href = 'https://error.com'
      engine.element.appendChild(a)

      await engine._links.scanForBrokenLinks()
      expect(a.classList.contains('rmx-link-broken')).toBe(true)
    })

    it('skips mailto and tel links', async () => {
      const validateLink = vi.fn()
      plugin = LinkPlugin({ validateLink, scanInterval: 0 })
      plugin.init(engine)

      const a1 = document.createElement('a')
      a1.href = 'mailto:test@test.com'
      const a2 = document.createElement('a')
      a2.href = 'tel:1234567890'
      engine.element.appendChild(a1)
      engine.element.appendChild(a2)

      await engine._links.scanForBrokenLinks()
      expect(validateLink).not.toHaveBeenCalled()
    })
  })

  describe('link click tracking', () => {
    it('calls onLinkClick callback on anchor click', () => {
      const onLinkClick = vi.fn()
      plugin = LinkPlugin({ onLinkClick })
      plugin.init(engine)

      const a = document.createElement('a')
      a.href = 'https://example.com'
      a.textContent = 'Link'
      a.addEventListener('click', (e) => e.preventDefault()) // prevent jsdom navigation
      engine.element.appendChild(a)

      a.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      expect(onLinkClick).toHaveBeenCalledWith(expect.objectContaining({
        href: expect.stringContaining('example.com'),
        text: 'Link',
      }))
    })
  })

  describe('link hover previews', () => {
    it('shows preview on mouseover after delay', async () => {
      vi.useFakeTimers()
      const onUnfurl = vi.fn().mockResolvedValue({
        title: 'Example',
        description: 'A site',
        image: 'https://example.com/img.png',
      })

      plugin = LinkPlugin({ onUnfurl, showPreviews: true })
      plugin.init(engine)

      const a = document.createElement('a')
      a.href = 'https://example.com'
      a.textContent = 'Link'
      engine.element.appendChild(a)

      a.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }))
      vi.advanceTimersByTime(500)
      await vi.runAllTimersAsync()

      expect(onUnfurl).toHaveBeenCalledWith(expect.stringContaining('example.com'))
      vi.useRealTimers()
    })

    it('hides preview on mouseout', () => {
      const onUnfurl = vi.fn()
      plugin = LinkPlugin({ onUnfurl, showPreviews: true })
      plugin.init(engine)

      const a = document.createElement('a')
      a.href = 'https://example.com'
      engine.element.appendChild(a)

      a.dispatchEvent(new MouseEvent('mouseout', { bubbles: true }))
    })
  })

  describe('exposed API', () => {
    it('provides clearUnfurlCache method', () => {
      plugin = LinkPlugin()
      plugin.init(engine)
      expect(typeof engine._links.clearUnfurlCache).toBe('function')
      engine._links.clearUnfurlCache()
    })

    it('provides getBookmarks method', () => {
      plugin = LinkPlugin()
      plugin.init(engine)
      expect(engine._links.getBookmarks()).toEqual([])
    })
  })
})
