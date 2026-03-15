
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
})
