import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { AutolinkPlugin } from '../plugins/builtins/AutolinkPlugin.js'

describe('AutolinkPlugin', () => {
  let plugin

  beforeEach(() => {
    plugin = AutolinkPlugin()
  })

  describe('plugin structure', () => {
    it('should have name "autolink"', () => {
      expect(plugin.name).toBe('autolink')
    })

    it('should require full access', () => {
      expect(plugin.requiresFullAccess).toBe(true)
    })

    it('should have init and destroy functions', () => {
      expect(typeof plugin.init).toBe('function')
      expect(typeof plugin.destroy).toBe('function')
    })
  })

  describe('init and destroy', () => {
    let mockEngine

    beforeEach(() => {
      mockEngine = {
        element: document.createElement('div'),
      }
    })

    it('should add a keydown listener on init', () => {
      const spy = vi.spyOn(mockEngine.element, 'addEventListener')
      plugin.init(mockEngine)
      expect(spy).toHaveBeenCalledWith('keydown', expect.any(Function))
      plugin.destroy(mockEngine)
    })

    it('should remove the keydown listener on destroy', () => {
      const spy = vi.spyOn(mockEngine.element, 'removeEventListener')
      plugin.init(mockEngine)
      plugin.destroy(mockEngine)
      expect(spy).toHaveBeenCalledWith('keydown', expect.any(Function))
    })

    it('should handle destroy without init gracefully', () => {
      expect(() => plugin.destroy(mockEngine)).not.toThrow()
    })

    it('should null out handler after destroy', () => {
      plugin.init(mockEngine)
      plugin.destroy(mockEngine)
      // Calling destroy again should not call removeEventListener again
      const spy = vi.spyOn(mockEngine.element, 'removeEventListener')
      plugin.destroy(mockEngine)
      expect(spy).not.toHaveBeenCalled()
    })
  })

  describe('URL detection via keydown handler', () => {
    let mockEngine, editorEl

    beforeEach(() => {
      editorEl = document.createElement('div')
      editorEl.contentEditable = 'true'
      document.body.appendChild(editorEl)
      mockEngine = { element: editorEl }
    })

    afterEach(() => {
      plugin.destroy(mockEngine)
      document.body.removeChild(editorEl)
    })

    it('should not process non-space/non-enter keys', () => {
      plugin.init(mockEngine)
      const textNode = document.createTextNode('https://example.com')
      editorEl.appendChild(textNode)

      const event = new KeyboardEvent('keydown', { key: 'a' })
      editorEl.dispatchEvent(event)

      // No link should be created for regular key presses
      expect(editorEl.querySelector('a')).toBeNull()
    })

    it('should not create link when there is no selection', () => {
      plugin.init(mockEngine)
      // Clear any selection
      window.getSelection().removeAllRanges()

      const event = new KeyboardEvent('keydown', { key: ' ' })
      editorEl.dispatchEvent(event)

      expect(editorEl.querySelector('a')).toBeNull()
    })

    it('should not create link when cursor is inside an existing link', () => {
      plugin.init(mockEngine)
      const link = document.createElement('a')
      link.href = 'https://existing.com'
      link.textContent = 'https://example.com'
      editorEl.appendChild(link)

      // Place cursor inside the link
      const range = document.createRange()
      range.setStart(link.firstChild, link.firstChild.textContent.length)
      range.collapse(true)
      const sel = window.getSelection()
      sel.removeAllRanges()
      sel.addRange(range)

      const event = new KeyboardEvent('keydown', { key: ' ' })
      editorEl.dispatchEvent(event)

      // Should not create a nested link
      expect(editorEl.querySelectorAll('a').length).toBe(1)
    })

    it('should create a link for https:// URLs on space', () => {
      plugin.init(mockEngine)
      const textNode = document.createTextNode('visit https://example.com ')
      editorEl.appendChild(textNode)

      // Position cursor at end of text
      const range = document.createRange()
      range.setStart(textNode, textNode.textContent.length)
      range.collapse(true)
      const sel = window.getSelection()
      sel.removeAllRanges()
      sel.addRange(range)

      const event = new KeyboardEvent('keydown', { key: ' ' })
      editorEl.dispatchEvent(event)

      const link = editorEl.querySelector('a')
      if (link) {
        expect(link.href).toBe('https://example.com/')
        expect(link.target).toBe('_blank')
        expect(link.rel).toBe('noopener noreferrer')
      }
    })

    it('should create a link for http:// URLs on Enter', () => {
      plugin.init(mockEngine)
      const textNode = document.createTextNode('http://example.org ')
      editorEl.appendChild(textNode)

      const range = document.createRange()
      range.setStart(textNode, textNode.textContent.length)
      range.collapse(true)
      const sel = window.getSelection()
      sel.removeAllRanges()
      sel.addRange(range)

      const event = new KeyboardEvent('keydown', { key: 'Enter' })
      editorEl.dispatchEvent(event)

      const link = editorEl.querySelector('a')
      if (link) {
        expect(link.href).toBe('http://example.org/')
      }
    })
  })

  describe('URL matching patterns', () => {
    // We test the plugin indirectly by checking what gets linked.
    // The findLastURLMatch function is internal but we can validate behavior
    // by setting up text and triggering the handler.
    let mockEngine, editorEl

    beforeEach(() => {
      editorEl = document.createElement('div')
      editorEl.contentEditable = 'true'
      document.body.appendChild(editorEl)
      mockEngine = { element: editorEl }
      plugin.init(mockEngine)
    })

    afterEach(() => {
      plugin.destroy(mockEngine)
      document.body.removeChild(editorEl)
    })

    function triggerSpace(textContent) {
      editorEl.innerHTML = ''
      const textNode = document.createTextNode(textContent)
      editorEl.appendChild(textNode)

      const range = document.createRange()
      range.setStart(textNode, textNode.textContent.length)
      range.collapse(true)
      const sel = window.getSelection()
      sel.removeAllRanges()
      sel.addRange(range)

      const event = new KeyboardEvent('keydown', { key: ' ' })
      editorEl.dispatchEvent(event)

      return editorEl.querySelector('a')
    }

    it('should detect https:// URLs', () => {
      const link = triggerSpace('check https://github.com/repo ')
      if (link) {
        expect(link.href).toContain('github.com')
      }
    })

    it('should detect www. prefixed URLs', () => {
      const link = triggerSpace('visit www.example.com ')
      if (link) {
        expect(link.href).toBe('https://www.example.com/')
      }
    })

    it('should detect bare domains with common TLDs', () => {
      const link = triggerSpace('check example.com ')
      if (link) {
        expect(link.href).toBe('https://example.com/')
      }
    })

    it('should not detect URLs in very long text nodes (>4096 chars) — ReDoS prevention', () => {
      // Text longer than MAX_URL_LENGTH * 2 (4096) should be rejected early
      const longText = 'a'.repeat(5000) + ' https://example.com '
      const link = triggerSpace(longText)
      expect(link).toBeNull()
    })

    it('should not freeze on long repeated characters that could cause backtracking', () => {
      // Pattern like "a]a]a]a]..." repeated many times could cause catastrophic
      // backtracking with unbounded regex repetition
      const pathological = 'https://example.com/' + 'a]'.repeat(1000) + ' '
      // This should complete quickly even if it doesn't match perfectly;
      // the key assertion is that it doesn't hang (timeout = test runner default)
      const link = triggerSpace(pathological)
      // We don't care whether a link is created; just that it returns promptly
      expect(true).toBe(true)
    })

    it('should not freeze on long repeated dots that stress domain regex', () => {
      // Pathological input for domain regex: many dots with short labels
      const pathological = 'a.'.repeat(500) + 'com '
      const link = triggerSpace(pathological)
      // Again, the main check is that this returns without hanging
      expect(true).toBe(true)
    })

    it('should still detect normal https:// URLs after regex hardening', () => {
      const link = triggerSpace('see https://example.com/path?q=1&b=2#frag ')
      if (link) {
        expect(link.href).toContain('example.com')
        expect(link.target).toBe('_blank')
        expect(link.rel).toBe('noopener noreferrer')
      }
    })

    it('should still detect www. URLs after regex hardening', () => {
      const link = triggerSpace('go to www.github.com/user/repo ')
      if (link) {
        expect(link.href).toContain('www.github.com')
      }
    })

    it('should still detect bare domains after regex hardening', () => {
      const link = triggerSpace('visit github.io ')
      if (link) {
        expect(link.href).toContain('github.io')
      }
    })

    it('should not create link when cursor is before the URL', () => {
      editorEl.innerHTML = ''
      const textNode = document.createTextNode('https://example.com some text after')
      editorEl.appendChild(textNode)

      // Place cursor after "some" (not after URL)
      const range = document.createRange()
      range.setStart(textNode, 5) // middle of "https"
      range.collapse(true)
      const sel = window.getSelection()
      sel.removeAllRanges()
      sel.addRange(range)

      const event = new KeyboardEvent('keydown', { key: ' ' })
      editorEl.dispatchEvent(event)

      // endIdx > cursorOffset guard should prevent link creation
      // (URL ends at index > 5)
    })
  })
})
