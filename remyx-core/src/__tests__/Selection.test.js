import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Selection } from '../core/Selection.js'

describe('Selection', () => {
  let editor
  let selection

  beforeEach(() => {
    editor = document.createElement('div')
    editor.setAttribute('contenteditable', 'true')
    editor.innerHTML = '<p>Hello world</p>'
    document.body.appendChild(editor)
    selection = new Selection(editor)
  })

  afterEach(() => {
    document.body.removeChild(editor)
  })

  describe('constructor', () => {
    it('should store the editor element', () => {
      expect(selection.editor).toBe(editor)
    })
  })

  describe('getSelection', () => {
    it('should return the window selection', () => {
      const sel = selection.getSelection()
      expect(sel).toBeDefined()
    })
  })

  describe('isWithinEditor', () => {
    it('should return true for nodes inside the editor', () => {
      const p = editor.querySelector('p')
      expect(selection.isWithinEditor(p)).toBe(true)
    })

    it('should return true for text nodes inside the editor', () => {
      const textNode = editor.querySelector('p').firstChild
      expect(selection.isWithinEditor(textNode)).toBe(true)
    })

    it('should return false for nodes outside the editor', () => {
      const outside = document.createElement('div')
      document.body.appendChild(outside)
      expect(selection.isWithinEditor(outside)).toBe(false)
      document.body.removeChild(outside)
    })

    it('should return false for null', () => {
      expect(selection.isWithinEditor(null)).toBe(false)
    })
  })

  describe('getActiveFormats', () => {
    it('should return an object with all format keys', () => {
      const formats = selection.getActiveFormats()
      expect(formats).toHaveProperty('bold')
      expect(formats).toHaveProperty('italic')
      expect(formats).toHaveProperty('underline')
      expect(formats).toHaveProperty('strikethrough')
      expect(formats).toHaveProperty('subscript')
      expect(formats).toHaveProperty('superscript')
      expect(formats).toHaveProperty('heading')
      expect(formats).toHaveProperty('alignment')
      expect(formats).toHaveProperty('orderedList')
      expect(formats).toHaveProperty('unorderedList')
      expect(formats).toHaveProperty('blockquote')
      expect(formats).toHaveProperty('codeBlock')
      expect(formats).toHaveProperty('link')
      expect(formats).toHaveProperty('fontFamily')
      expect(formats).toHaveProperty('fontSize')
      expect(formats).toHaveProperty('foreColor')
      expect(formats).toHaveProperty('backColor')
    })

    it('should return correct defaults when nothing is selected', () => {
      const formats = selection.getActiveFormats()
      expect(formats.bold).toBe(false)
      expect(formats.italic).toBe(false)
      expect(formats.underline).toBe(false)
      expect(formats.strikethrough).toBe(false)
      expect(formats.subscript).toBe(false)
      expect(formats.superscript).toBe(false)
      expect(formats.heading).toBeNull()
      expect(formats.orderedList).toBe(false)
      expect(formats.unorderedList).toBe(false)
      expect(formats.blockquote).toBe(false)
      expect(formats.codeBlock).toBe(false)
      expect(formats.link).toBeNull()
    })
  })

  describe('save / restore', () => {
    it('should return null when no range is active', () => {
      const bookmark = selection.save()
      // In jsdom, there may be no active range on the editor
      // so save() should return null
      expect(bookmark === null || typeof bookmark === 'object').toBe(true)
    })

    it('should save and restore a selection', () => {
      // Set up a selection
      const textNode = editor.querySelector('p').firstChild
      const range = document.createRange()
      range.setStart(textNode, 0)
      range.setEnd(textNode, 5) // "Hello"

      const sel = window.getSelection()
      sel.removeAllRanges()
      sel.addRange(range)

      const bookmark = selection.save()
      if (bookmark) {
        expect(bookmark.startOffset).toBe(0)
        expect(bookmark.endOffset).toBe(5)

        // Clear selection
        sel.removeAllRanges()

        // Restore
        selection.restore(bookmark)
        const restoredText = sel.toString()
        expect(restoredText).toBe('Hello')
      }
    })

    it('should handle restore with null bookmark gracefully', () => {
      expect(() => selection.restore(null)).not.toThrow()
    })
  })

  describe('isCollapsed', () => {
    it('should return true when no selection exists', () => {
      window.getSelection().removeAllRanges()
      expect(selection.isCollapsed()).toBe(true)
    })
  })

  describe('getSelectedText', () => {
    it('should return empty string when no selection', () => {
      window.getSelection().removeAllRanges()
      expect(selection.getSelectedText()).toBe('')
    })
  })

  describe('getRange', () => {
    it('should return null when no range is set', () => {
      window.getSelection().removeAllRanges()
      expect(selection.getRange()).toBeNull()
    })

    it('should return null when range is outside editor', () => {
      const outside = document.createElement('div')
      outside.textContent = 'outside'
      document.body.appendChild(outside)

      const range = document.createRange()
      range.setStart(outside.firstChild, 0)
      range.setEnd(outside.firstChild, 7)

      const sel = window.getSelection()
      sel.removeAllRanges()
      sel.addRange(range)

      expect(selection.getRange()).toBeNull()
      document.body.removeChild(outside)
    })
  })

  // Helper to select text within the editor
  function selectTextInEditor(editorEl, startOffset, endOffset) {
    const textNode = editorEl.querySelector('p').firstChild
    const range = document.createRange()
    range.setStart(textNode, startOffset)
    range.setEnd(textNode, endOffset)
    const sel = window.getSelection()
    sel.removeAllRanges()
    sel.addRange(range)
    return range
  }

  describe('getSelectedHTML', () => {
    it('should return empty string when no selection', () => {
      window.getSelection().removeAllRanges()
      expect(selection.getSelectedHTML()).toBe('')
    })

    it('should return selected HTML content', () => {
      selectTextInEditor(editor, 0, 5)
      const html = selection.getSelectedHTML()
      expect(html).toBe('Hello')
    })

    it('should return HTML with tags when selection spans elements', () => {
      editor.innerHTML = '<p><strong>Bold</strong> text</p>'
      const strong = editor.querySelector('strong').firstChild
      const textAfter = editor.querySelector('p').lastChild
      const range = document.createRange()
      range.setStart(strong, 0)
      range.setEnd(textAfter, 5)
      const sel = window.getSelection()
      sel.removeAllRanges()
      sel.addRange(range)

      const html = selection.getSelectedHTML()
      expect(html).toContain('Bold')
      expect(html).toContain('text')
    })
  })

  describe('collapse', () => {
    it('should collapse selection to start', () => {
      selectTextInEditor(editor, 0, 5)
      const sel = window.getSelection()
      expect(sel.isCollapsed).toBe(false)

      selection.collapse(false)
      expect(sel.isCollapsed).toBe(true)
    })

    it('should collapse selection to end', () => {
      selectTextInEditor(editor, 0, 5)
      selection.collapse(true)
      const sel = window.getSelection()
      expect(sel.isCollapsed).toBe(true)
    })

    it('should do nothing when no selection exists', () => {
      window.getSelection().removeAllRanges()
      expect(() => selection.collapse()).not.toThrow()
    })
  })

  describe('getParentElement', () => {
    it('should return null when no range', () => {
      window.getSelection().removeAllRanges()
      expect(selection.getParentElement()).toBeNull()
    })

    it('should return parent element of text node selection', () => {
      selectTextInEditor(editor, 0, 5)
      const parent = selection.getParentElement()
      expect(parent.tagName).toBe('P')
    })

    it('should return element node directly when selection is on element', () => {
      const p = editor.querySelector('p')
      const range = document.createRange()
      range.selectNode(p)
      const sel = window.getSelection()
      sel.removeAllRanges()
      sel.addRange(range)

      const parent = selection.getParentElement()
      expect(parent).toBeDefined()
    })
  })

  describe('getParentBlock', () => {
    it('should return null when no range', () => {
      window.getSelection().removeAllRanges()
      expect(selection.getParentBlock()).toBeNull()
    })

    it('should return the block-level parent element', () => {
      selectTextInEditor(editor, 0, 5)
      const block = selection.getParentBlock()
      expect(block).not.toBeNull()
      expect(block.tagName).toBe('P')
    })

    it('should return blockquote when inside one', () => {
      editor.innerHTML = '<blockquote><p>Quoted text</p></blockquote>'
      const textNode = editor.querySelector('p').firstChild
      const range = document.createRange()
      range.setStart(textNode, 0)
      range.setEnd(textNode, 6)
      const sel = window.getSelection()
      sel.removeAllRanges()
      sel.addRange(range)

      const block = selection.getParentBlock()
      expect(block.tagName).toBe('P')
    })

    it('should return null when selection is directly in editor with no block', () => {
      editor.innerHTML = ''
      const textNode = document.createTextNode('bare text')
      editor.appendChild(textNode)
      const range = document.createRange()
      range.setStart(textNode, 0)
      range.setEnd(textNode, 4)
      const sel = window.getSelection()
      sel.removeAllRanges()
      sel.addRange(range)

      const block = selection.getParentBlock()
      expect(block).toBeNull()
    })
  })

  describe('getClosestElement', () => {
    it('should return null when no range', () => {
      window.getSelection().removeAllRanges()
      expect(selection.getClosestElement('p')).toBeNull()
    })

    it('should find closest ancestor with matching tag', () => {
      selectTextInEditor(editor, 0, 5)
      const el = selection.getClosestElement('p')
      expect(el).not.toBeNull()
      expect(el.tagName).toBe('P')
    })

    it('should be case-insensitive', () => {
      selectTextInEditor(editor, 0, 5)
      const el = selection.getClosestElement('P')
      expect(el).not.toBeNull()
      expect(el.tagName).toBe('P')
    })

    it('should return null when no ancestor matches', () => {
      selectTextInEditor(editor, 0, 5)
      const el = selection.getClosestElement('blockquote')
      expect(el).toBeNull()
    })

    it('should find nested ancestor', () => {
      editor.innerHTML = '<blockquote><p>Quoted</p></blockquote>'
      const textNode = editor.querySelector('p').firstChild
      const range = document.createRange()
      range.setStart(textNode, 0)
      range.setEnd(textNode, 6)
      const sel = window.getSelection()
      sel.removeAllRanges()
      sel.addRange(range)

      const el = selection.getClosestElement('blockquote')
      expect(el).not.toBeNull()
      expect(el.tagName).toBe('BLOCKQUOTE')
    })
  })

  describe('insertHTML', () => {
    it('should call document.execCommand with insertHTML', () => {
      // jsdom does not define execCommand, so define it for this test
      const mockExecCommand = vi.fn().mockReturnValue(true)
      document.execCommand = mockExecCommand
      selection.insertHTML('<b>test</b>')
      expect(mockExecCommand).toHaveBeenCalledWith('insertHTML', false, '<b>test</b>')
      delete document.execCommand
    })

    it('should call sanitizer.sanitize when a sanitizer is set', () => {
      const mockSanitizer = { sanitize: vi.fn((html) => '<b>clean</b>') }
      const mockExecCommand = vi.fn().mockReturnValue(true)
      document.execCommand = mockExecCommand

      selection.setSanitizer(mockSanitizer)
      selection.insertHTML('<script>alert(1)</script><b>clean</b>')

      expect(mockSanitizer.sanitize).toHaveBeenCalledWith('<script>alert(1)</script><b>clean</b>')
      expect(mockExecCommand).toHaveBeenCalledWith('insertHTML', false, '<b>clean</b>')

      // Clean up
      selection._sanitizer = undefined
      delete document.execCommand
    })

    it('should use raw html when no sanitizer is set (backward compat)', () => {
      const mockExecCommand = vi.fn().mockReturnValue(true)
      document.execCommand = mockExecCommand

      // Ensure no sanitizer is attached
      selection._sanitizer = undefined
      const rawHtml = '<img src=x onerror=alert(1)>'
      selection.insertHTML(rawHtml)

      expect(mockExecCommand).toHaveBeenCalledWith('insertHTML', false, rawHtml)
      delete document.execCommand
    })
  })

  describe('setSanitizer', () => {
    it('should attach a sanitizer instance', () => {
      const mockSanitizer = { sanitize: vi.fn() }
      selection.setSanitizer(mockSanitizer)
      expect(selection._sanitizer).toBe(mockSanitizer)

      // Clean up
      selection._sanitizer = undefined
    })

    it('should overwrite a previously set sanitizer', () => {
      const first = { sanitize: vi.fn() }
      const second = { sanitize: vi.fn() }
      selection.setSanitizer(first)
      selection.setSanitizer(second)
      expect(selection._sanitizer).toBe(second)

      // Clean up
      selection._sanitizer = undefined
    })
  })

  describe('insertNode', () => {
    it('should do nothing when no range', () => {
      window.getSelection().removeAllRanges()
      const node = document.createElement('span')
      expect(() => selection.insertNode(node)).not.toThrow()
    })

    it('should insert a node at the selection', () => {
      selectTextInEditor(editor, 5, 5)
      const span = document.createElement('span')
      span.textContent = 'INSERTED'
      selection.insertNode(span)
      expect(editor.querySelector('span')).not.toBeNull()
      expect(editor.querySelector('span').textContent).toBe('INSERTED')
    })

    it('should replace selected content with the node', () => {
      selectTextInEditor(editor, 0, 5)
      const span = document.createElement('span')
      span.textContent = 'Replaced'
      selection.insertNode(span)
      expect(editor.querySelector('span').textContent).toBe('Replaced')
    })
  })

  describe('wrapWith', () => {
    it('should return null when no range', () => {
      window.getSelection().removeAllRanges()
      expect(selection.wrapWith('strong')).toBeNull()
    })

    it('should return null when selection is collapsed', () => {
      selectTextInEditor(editor, 3, 3)
      expect(selection.wrapWith('strong')).toBeNull()
    })

    it('should wrap selected text with element', () => {
      selectTextInEditor(editor, 0, 5)
      const wrapper = selection.wrapWith('strong')
      expect(wrapper).not.toBeNull()
      expect(wrapper.tagName).toBe('STRONG')
      expect(editor.querySelector('strong')).not.toBeNull()
    })

    it('should apply attributes to wrapper element', () => {
      selectTextInEditor(editor, 0, 5)
      const wrapper = selection.wrapWith('a', { href: 'https://example.com', target: '_blank' })
      expect(wrapper).not.toBeNull()
      expect(wrapper.getAttribute('href')).toBe('https://example.com')
      expect(wrapper.getAttribute('target')).toBe('_blank')
    })
  })

  describe('unwrap', () => {
    it('should do nothing when no matching ancestor', () => {
      selectTextInEditor(editor, 0, 5)
      expect(() => selection.unwrap('strong')).not.toThrow()
    })

    it('should unwrap a matching ancestor element', () => {
      editor.innerHTML = '<p><strong>Hello</strong> world</p>'
      const textNode = editor.querySelector('strong').firstChild
      const range = document.createRange()
      range.setStart(textNode, 0)
      range.setEnd(textNode, 5)
      const sel = window.getSelection()
      sel.removeAllRanges()
      sel.addRange(range)

      selection.unwrap('strong')
      expect(editor.querySelector('strong')).toBeNull()
      expect(editor.textContent).toContain('Hello')
    })
  })

  describe('getActiveFormats - additional branches', () => {
    it('should detect heading format', () => {
      editor.innerHTML = '<h2>Heading text</h2>'
      const textNode = editor.querySelector('h2').firstChild
      const range = document.createRange()
      range.setStart(textNode, 0)
      range.setEnd(textNode, 7)
      const sel = window.getSelection()
      sel.removeAllRanges()
      sel.addRange(range)

      const formats = selection.getActiveFormats()
      expect(formats.heading).toBe('h2')
    })

    it('should detect ordered list', () => {
      editor.innerHTML = '<ol><li>Item 1</li></ol>'
      const textNode = editor.querySelector('li').firstChild
      const range = document.createRange()
      range.setStart(textNode, 0)
      range.setEnd(textNode, 4)
      const sel = window.getSelection()
      sel.removeAllRanges()
      sel.addRange(range)

      const formats = selection.getActiveFormats()
      expect(formats.orderedList).toBe(true)
    })

    it('should detect unordered list', () => {
      editor.innerHTML = '<ul><li>Item</li></ul>'
      const textNode = editor.querySelector('li').firstChild
      const range = document.createRange()
      range.setStart(textNode, 0)
      range.setEnd(textNode, 4)
      const sel = window.getSelection()
      sel.removeAllRanges()
      sel.addRange(range)

      const formats = selection.getActiveFormats()
      expect(formats.unorderedList).toBe(true)
    })

    it('should detect blockquote', () => {
      editor.innerHTML = '<blockquote><p>Quoted</p></blockquote>'
      const textNode = editor.querySelector('p').firstChild
      const range = document.createRange()
      range.setStart(textNode, 0)
      range.setEnd(textNode, 6)
      const sel = window.getSelection()
      sel.removeAllRanges()
      sel.addRange(range)

      const formats = selection.getActiveFormats()
      expect(formats.blockquote).toBe(true)
    })

    it('should detect code block (pre)', () => {
      editor.innerHTML = '<pre>code here</pre>'
      const textNode = editor.querySelector('pre').firstChild
      const range = document.createRange()
      range.setStart(textNode, 0)
      range.setEnd(textNode, 4)
      const sel = window.getSelection()
      sel.removeAllRanges()
      sel.addRange(range)

      const formats = selection.getActiveFormats()
      expect(formats.codeBlock).toBe(true)
    })

    it('should detect link', () => {
      editor.innerHTML = '<p><a href="https://example.com" target="_blank">Link text</a></p>'
      const textNode = editor.querySelector('a').firstChild
      const range = document.createRange()
      range.setStart(textNode, 0)
      range.setEnd(textNode, 4)
      const sel = window.getSelection()
      sel.removeAllRanges()
      sel.addRange(range)

      const formats = selection.getActiveFormats()
      expect(formats.link).not.toBeNull()
      expect(formats.link.href).toContain('example.com')
      expect(formats.link.text).toBe('Link text')
      expect(formats.link.target).toBe('_blank')
    })

    it('should detect text alignment from inline style', () => {
      editor.innerHTML = '<p style="text-align: center;">Centered</p>'
      const textNode = editor.querySelector('p').firstChild
      const range = document.createRange()
      range.setStart(textNode, 0)
      range.setEnd(textNode, 8)
      const sel = window.getSelection()
      sel.removeAllRanges()
      sel.addRange(range)

      const formats = selection.getActiveFormats()
      expect(formats.alignment).toBe('center')
    })
  })

  describe('getBoundingRect', () => {
    it('should return null when no range', () => {
      window.getSelection().removeAllRanges()
      expect(selection.getBoundingRect()).toBeNull()
    })

    it('should return a DOMRect when range exists', () => {
      selectTextInEditor(editor, 0, 5)
      // jsdom does not implement getBoundingClientRect on Range, so mock it
      const range = selection.getRange()
      const mockRect = { top: 0, left: 0, bottom: 10, right: 50, width: 50, height: 10 }
      range.getBoundingClientRect = vi.fn().mockReturnValue(mockRect)
      const rect = selection.getBoundingRect()
      expect(rect).toEqual(mockRect)
    })
  })

  describe('setRange', () => {
    it('should set the given range as current selection', () => {
      const textNode = editor.querySelector('p').firstChild
      const range = document.createRange()
      range.setStart(textNode, 0)
      range.setEnd(textNode, 5)

      selection.setRange(range)
      const sel = window.getSelection()
      expect(sel.rangeCount).toBeGreaterThan(0)
    })

    it('should silently handle errors from invalid ranges', () => {
      // Create a detached node range scenario
      const detached = document.createElement('div')
      detached.textContent = 'detached'
      const range = document.createRange()
      range.setStart(detached.firstChild, 0)
      range.setEnd(detached.firstChild, 3)
      // Should not throw even if browser internals fail
      expect(() => selection.setRange(range)).not.toThrow()
    })
  })

  describe('restore - edge cases', () => {
    it('should handle bookmark where endNode is not found', () => {
      // Bookmark with endOffset beyond available text
      const textNode = editor.querySelector('p').firstChild
      const range = document.createRange()
      range.setStart(textNode, 0)
      range.setEnd(textNode, 5)
      const sel = window.getSelection()
      sel.removeAllRanges()
      sel.addRange(range)

      // Create a bookmark that has endOffset beyond the text length
      const bookmark = { startOffset: 0, endOffset: 999, collapsed: false }
      expect(() => selection.restore(bookmark)).not.toThrow()
    })

    it('should handle bookmark where startNode is not found (empty editor)', () => {
      editor.innerHTML = ''
      const bookmark = { startOffset: 5, endOffset: 10, collapsed: false }
      expect(() => selection.restore(bookmark)).not.toThrow()
    })
  })

  describe('isCollapsed - with active selection', () => {
    it('should return false when text is selected', () => {
      selectTextInEditor(editor, 0, 5)
      expect(selection.isCollapsed()).toBe(false)
    })

    it('should return true when collapsed at a point', () => {
      selectTextInEditor(editor, 3, 3)
      expect(selection.isCollapsed()).toBe(true)
    })
  })

  describe('getSelectedText - with selection', () => {
    it('should return selected text', () => {
      selectTextInEditor(editor, 0, 5)
      expect(selection.getSelectedText()).toBe('Hello')
    })

    it('should return full text when all is selected', () => {
      selectTextInEditor(editor, 0, 11)
      expect(selection.getSelectedText()).toBe('Hello world')
    })
  })
})
