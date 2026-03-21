import { vi } from 'vitest'
import { registerFormattingCommands } from '../commands/formatting.js'

describe('registerFormattingCommands - extended coverage', () => {
  let commands
  let mockEngine

  beforeEach(() => {
    commands = {}

    const element = document.createElement('div')
    element.setAttribute('contenteditable', 'true')
    document.body.appendChild(element)

    mockEngine = {
      element,
      commands: {
        register: vi.fn((name, def) => { commands[name] = def }),
      },
      selection: {
        getSelection: vi.fn(),
        getParentElement: vi.fn(),
      },
    }

    registerFormattingCommands(mockEngine)
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  // highlight command
  describe('highlight', () => {
    it('should return early if no selection', () => {
      mockEngine.selection.getSelection.mockReturnValue(null)
      commands.highlight.execute(mockEngine)
      // No error should be thrown
    })

    it('should return early if selection has no ranges', () => {
      mockEngine.selection.getSelection.mockReturnValue({ rangeCount: 0 })
      commands.highlight.execute(mockEngine)
    })

    it('should return early if range is collapsed', () => {
      const sel = window.getSelection()
      const p = document.createElement('p')
      p.textContent = 'text'
      mockEngine.element.appendChild(p)
      const range = document.createRange()
      range.selectNodeContents(p)
      range.collapse(true)
      sel.removeAllRanges()
      sel.addRange(range)

      mockEngine.selection.getSelection.mockReturnValue(sel)
      mockEngine.selection.getParentElement.mockReturnValue(p)

      commands.highlight.execute(mockEngine)
    })

    it('should wrap selection in mark with yellow by default', () => {
      const p = document.createElement('p')
      p.textContent = 'highlight me'
      mockEngine.element.appendChild(p)

      const sel = window.getSelection()
      const range = document.createRange()
      range.selectNodeContents(p)
      sel.removeAllRanges()
      sel.addRange(range)

      mockEngine.selection.getSelection.mockReturnValue(sel)
      mockEngine.selection.getParentElement.mockReturnValue(p)

      commands.highlight.execute(mockEngine)
      const mark = mockEngine.element.querySelector('mark')
      expect(mark).not.toBeNull()
      expect(mark.getAttribute('data-highlight-color')).toBe('yellow')
    })

    it('should support different highlight colors', () => {
      for (const color of ['green', 'blue', 'pink', 'orange', 'purple']) {
        const p = document.createElement('p')
        p.textContent = 'color test'
        mockEngine.element.appendChild(p)

        const sel = window.getSelection()
        const range = document.createRange()
        range.selectNodeContents(p)
        sel.removeAllRanges()
        sel.addRange(range)

        mockEngine.selection.getSelection.mockReturnValue(sel)
        mockEngine.selection.getParentElement.mockReturnValue(p)

        commands.highlight.execute(mockEngine, { color })
        const marks = mockEngine.element.querySelectorAll('mark')
        const lastMark = marks[marks.length - 1]
        expect(lastMark.getAttribute('data-highlight-color')).toBe(color)
      }
    })

    it('should toggle off existing mark', () => {
      const mark = document.createElement('mark')
      mark.textContent = 'highlighted'
      const p = document.createElement('p')
      p.appendChild(mark)
      mockEngine.element.appendChild(p)

      const sel = window.getSelection()
      const range = document.createRange()
      range.selectNodeContents(mark)
      sel.removeAllRanges()
      sel.addRange(range)

      mockEngine.selection.getSelection.mockReturnValue(sel)
      mockEngine.selection.getParentElement.mockReturnValue(mark)

      commands.highlight.execute(mockEngine)
      expect(mockEngine.element.querySelector('mark')).toBeNull()
    })

    it('isActive returns true when inside mark', () => {
      const mark = document.createElement('mark')
      mark.textContent = 'text'
      mockEngine.element.appendChild(mark)
      mockEngine.selection.getParentElement.mockReturnValue(mark)
      expect(commands.highlight.isActive(mockEngine)).toBe(true)
    })

    it('isActive returns false when not inside mark', () => {
      mockEngine.selection.getParentElement.mockReturnValue(null)
      expect(commands.highlight.isActive(mockEngine)).toBe(false)
    })
  })

  // removeFormat command
  describe('removeFormat', () => {
    it('should return early if no selection', () => {
      mockEngine.selection.getSelection.mockReturnValue(null)
      commands.removeFormat.execute(mockEngine)
    })

    it('should return early if range is collapsed', () => {
      const p = document.createElement('p')
      p.textContent = 'text'
      mockEngine.element.appendChild(p)

      const sel = window.getSelection()
      const range = document.createRange()
      range.selectNodeContents(p)
      range.collapse(true)
      sel.removeAllRanges()
      sel.addRange(range)

      mockEngine.selection.getSelection.mockReturnValue(sel)
      commands.removeFormat.execute(mockEngine)
    })

    it('should remove formatting tags from selection', () => {
      const p = document.createElement('p')
      const strong = document.createElement('strong')
      strong.textContent = 'bold '
      const em = document.createElement('em')
      em.textContent = 'italic'
      p.appendChild(strong)
      p.appendChild(em)
      mockEngine.element.appendChild(p)

      const sel = window.getSelection()
      const range = document.createRange()
      range.selectNodeContents(p)
      sel.removeAllRanges()
      sel.addRange(range)

      mockEngine.selection.getSelection.mockReturnValue(sel)
      commands.removeFormat.execute(mockEngine)

      expect(mockEngine.element.querySelector('strong')).toBeNull()
      expect(mockEngine.element.querySelector('em')).toBeNull()
      expect(p.textContent).toBe('bold italic')
    })

    it('should have correct shortcut', () => {
      expect(commands.removeFormat.shortcut).toBe('mod+\\')
    })
  })

  // bold/italic/underline/strikethrough isActive tests
  describe('isActive states', () => {
    it('bold isActive when inside STRONG', () => {
      const strong = document.createElement('strong')
      strong.textContent = 'bold'
      mockEngine.element.appendChild(strong)

      // First check: parent is STRONG
      mockEngine.selection.getParentElement.mockReturnValue(strong)
      expect(commands.bold.isActive(mockEngine)).toBe(true)
    })

    it('bold isActive when inside B', () => {
      const b = document.createElement('b')
      b.textContent = 'bold'
      mockEngine.element.appendChild(b)
      mockEngine.selection.getParentElement.mockReturnValue(b)
      expect(commands.bold.isActive(mockEngine)).toBe(true)
    })

    it('italic isActive when inside EM or I', () => {
      const em = document.createElement('em')
      em.textContent = 'italic'
      mockEngine.element.appendChild(em)
      mockEngine.selection.getParentElement.mockReturnValue(em)
      expect(commands.italic.isActive(mockEngine)).toBe(true)
    })

    it('underline isActive when inside U', () => {
      const u = document.createElement('u')
      u.textContent = 'underline'
      mockEngine.element.appendChild(u)
      mockEngine.selection.getParentElement.mockReturnValue(u)
      expect(commands.underline.isActive(mockEngine)).toBe(true)
    })

    it('strikethrough isActive when inside S or DEL', () => {
      const s = document.createElement('s')
      s.textContent = 'strike'
      mockEngine.element.appendChild(s)
      mockEngine.selection.getParentElement.mockReturnValue(s)
      expect(commands.strikethrough.isActive(mockEngine)).toBe(true)
    })

    it('subscript isActive when inside SUB', () => {
      const sub = document.createElement('sub')
      sub.textContent = 'sub'
      mockEngine.element.appendChild(sub)
      mockEngine.selection.getParentElement.mockReturnValue(sub)
      expect(commands.subscript.isActive(mockEngine)).toBe(true)
    })

    it('superscript isActive when inside SUP', () => {
      const sup = document.createElement('sup')
      sup.textContent = 'sup'
      mockEngine.element.appendChild(sup)
      mockEngine.selection.getParentElement.mockReturnValue(sup)
      expect(commands.superscript.isActive(mockEngine)).toBe(true)
    })

    it('returns false when not inside any formatting', () => {
      mockEngine.selection.getParentElement.mockReturnValue(null)
      expect(commands.bold.isActive(mockEngine)).toBe(false)
      expect(commands.italic.isActive(mockEngine)).toBe(false)
      expect(commands.underline.isActive(mockEngine)).toBe(false)
    })
  })

  // toggleInlineTag edge cases
  describe('toggleInlineTag edge cases', () => {
    it('returns early when no selection', () => {
      mockEngine.selection.getSelection.mockReturnValue(null)
      commands.bold.execute(mockEngine)
      // Should not throw
    })

    it('returns early when selection has no ranges', () => {
      mockEngine.selection.getSelection.mockReturnValue({ rangeCount: 0 })
      commands.bold.execute(mockEngine)
    })

    it('returns early when range is collapsed', () => {
      const p = document.createElement('p')
      p.textContent = 'text'
      mockEngine.element.appendChild(p)
      const sel = window.getSelection()
      const range = document.createRange()
      range.selectNodeContents(p)
      range.collapse(true)
      sel.removeAllRanges()
      sel.addRange(range)
      mockEngine.selection.getSelection.mockReturnValue(sel)
      mockEngine.selection.getParentElement.mockReturnValue(p)

      commands.bold.execute(mockEngine)
      expect(mockEngine.element.querySelector('strong')).toBeNull()
    })

    it('wraps selection in strong tag', () => {
      const p = document.createElement('p')
      p.textContent = 'wrap me'
      mockEngine.element.appendChild(p)
      const sel = window.getSelection()
      const range = document.createRange()
      range.selectNodeContents(p)
      sel.removeAllRanges()
      sel.addRange(range)
      mockEngine.selection.getSelection.mockReturnValue(sel)
      mockEngine.selection.getParentElement.mockReturnValue(p)

      commands.bold.execute(mockEngine)
      expect(mockEngine.element.querySelector('strong')).not.toBeNull()
    })

    it('unwraps when parent is already the target tag', () => {
      const strong = document.createElement('strong')
      strong.textContent = 'bold text'
      const p = document.createElement('p')
      p.appendChild(strong)
      mockEngine.element.appendChild(p)

      const sel = window.getSelection()
      const range = document.createRange()
      range.selectNodeContents(strong)
      sel.removeAllRanges()
      sel.addRange(range)
      mockEngine.selection.getSelection.mockReturnValue(sel)
      mockEngine.selection.getParentElement.mockReturnValue(strong)

      commands.bold.execute(mockEngine)
      expect(mockEngine.element.querySelector('strong')).toBeNull()
      expect(p.textContent).toBe('bold text')
    })

    it('unwraps when ancestor is the target tag', () => {
      const strong = document.createElement('strong')
      const span = document.createElement('span')
      span.textContent = 'nested'
      strong.appendChild(span)
      const p = document.createElement('p')
      p.appendChild(strong)
      mockEngine.element.appendChild(p)

      const sel = window.getSelection()
      const range = document.createRange()
      range.selectNodeContents(span)
      sel.removeAllRanges()
      sel.addRange(range)
      mockEngine.selection.getSelection.mockReturnValue(sel)
      mockEngine.selection.getParentElement.mockReturnValue(span)

      commands.bold.execute(mockEngine)
      expect(mockEngine.element.querySelector('strong')).toBeNull()
    })
  })

  // Shortcut checks
  describe('shortcuts', () => {
    it('subscript has correct shortcut', () => {
      expect(commands.subscript.shortcut).toBe('mod+,')
    })

    it('superscript has correct shortcut', () => {
      expect(commands.superscript.shortcut).toBe('mod+.')
    })

    it('subscript has alternate shortcuts', () => {
      expect(commands.subscript.alternateShortcuts).toEqual(['mod+shift+,'])
    })

    it('superscript has alternate shortcuts', () => {
      expect(commands.superscript.alternateShortcuts).toEqual(['mod+shift+.'])
    })
  })
})
