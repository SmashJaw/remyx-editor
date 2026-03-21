import { vi } from 'vitest'
import { registerBlockCommands } from '../commands/blocks.js'

describe('registerBlockCommands - extended coverage', () => {
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
      eventBus: { emit: vi.fn() },
      history: { snapshot: vi.fn() },
      selection: {
        getClosestElement: vi.fn(),
        getParentBlock: vi.fn(),
        getRange: vi.fn(),
        setRange: vi.fn(),
      },
    }

    registerBlockCommands(mockEngine)
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  describe('codeBlock with language and selection', () => {
    it('should create code block with selected text', () => {
      const p = document.createElement('p')
      p.textContent = 'selected code'
      mockEngine.element.appendChild(p)

      const sel = window.getSelection()
      const range = document.createRange()
      range.selectNodeContents(p)
      sel.removeAllRanges()
      sel.addRange(range)

      mockEngine.selection.getClosestElement.mockReturnValue(null)
      mockEngine.selection.getRange.mockReturnValue(range)

      commands.codeBlock.execute(mockEngine)
      const code = mockEngine.element.querySelector('code')
      expect(code).not.toBeNull()
      expect(code.textContent).toBe('selected code')
    })

    it('should add paragraph after code block if none exists', () => {
      mockEngine.element.innerHTML = ''
      const textNode = document.createTextNode('x')
      mockEngine.element.appendChild(textNode)

      const range = document.createRange()
      range.selectNodeContents(mockEngine.element)
      range.collapse(true)

      mockEngine.selection.getClosestElement.mockReturnValue(null)
      mockEngine.selection.getRange.mockReturnValue(range)

      commands.codeBlock.execute(mockEngine)
      const pre = mockEngine.element.querySelector('pre')
      expect(pre).not.toBeNull()
    })

    it('should emit codeblock:created event', () => {
      const p = document.createElement('p')
      p.textContent = 'code'
      mockEngine.element.appendChild(p)

      const range = document.createRange()
      range.selectNodeContents(p)
      range.collapse(true)

      mockEngine.selection.getClosestElement.mockReturnValue(null)
      mockEngine.selection.getRange.mockReturnValue(range)

      commands.codeBlock.execute(mockEngine)
      expect(mockEngine.eventBus.emit).toHaveBeenCalledWith('codeblock:created', expect.any(Object))
    })
  })

  describe('moveBlockUp edge cases', () => {
    it('should not move if block tag is not in BLOCK_TAGS', () => {
      const span = document.createElement('span')
      span.textContent = 'not a block'
      mockEngine.element.appendChild(span)
      mockEngine.selection.getParentBlock.mockReturnValue(span)

      commands.moveBlockUp.execute(mockEngine)
      expect(mockEngine.history.snapshot).not.toHaveBeenCalled()
    })
  })

  describe('moveBlockDown edge cases', () => {
    it('should not move if no next sibling', () => {
      const p = document.createElement('p')
      p.textContent = 'only one'
      mockEngine.element.appendChild(p)
      mockEngine.selection.getParentBlock.mockReturnValue(p)

      commands.moveBlockDown.execute(mockEngine)
      expect(mockEngine.history.snapshot).not.toHaveBeenCalled()
    })
  })

  describe('duplicateBlock', () => {
    it('should not duplicate if no block found', () => {
      mockEngine.selection.getParentBlock.mockReturnValue(null)
      commands.duplicateBlock.execute(mockEngine)
      expect(mockEngine.history.snapshot).not.toHaveBeenCalled()
    })

    it('should duplicate and place cursor in clone', () => {
      const p = document.createElement('p')
      p.textContent = 'dup'
      mockEngine.element.appendChild(p)
      mockEngine.selection.getParentBlock.mockReturnValue(p)

      commands.duplicateBlock.execute(mockEngine)
      expect(mockEngine.element.children.length).toBe(2)
      expect(mockEngine.selection.setRange).toHaveBeenCalled()
    })
  })

  describe('deleteBlock edge cases', () => {
    it('should not delete if no block found', () => {
      mockEngine.selection.getParentBlock.mockReturnValue(null)
      commands.deleteBlock.execute(mockEngine)
      expect(mockEngine.history.snapshot).not.toHaveBeenCalled()
    })

    it('should move cursor to previous sibling when no next sibling', () => {
      const p1 = document.createElement('p')
      p1.textContent = 'first'
      const p2 = document.createElement('p')
      p2.textContent = 'second'
      mockEngine.element.appendChild(p1)
      mockEngine.element.appendChild(p2)
      mockEngine.selection.getParentBlock.mockReturnValue(p2)

      commands.deleteBlock.execute(mockEngine)
      expect(mockEngine.element.children.length).toBe(1)
      expect(mockEngine.element.children[0].textContent).toBe('first')
    })
  })

  describe('toggleCollapse edge cases', () => {
    it('should not collapse if no block found', () => {
      mockEngine.selection.getParentBlock.mockReturnValue(null)
      commands.toggleCollapse.execute(mockEngine)
      expect(mockEngine.history.snapshot).not.toHaveBeenCalled()
    })

    it('should use text slice for summary (up to 50 chars)', () => {
      const p = document.createElement('p')
      p.textContent = 'A'.repeat(100)
      mockEngine.element.appendChild(p)
      mockEngine.selection.getParentBlock.mockReturnValue(p)

      commands.toggleCollapse.execute(mockEngine)
      const summary = mockEngine.element.querySelector('summary')
      expect(summary.textContent.length).toBe(50)
    })

    it('should use "Section" as fallback for empty block', () => {
      const p = document.createElement('p')
      p.textContent = ''
      mockEngine.element.appendChild(p)
      mockEngine.selection.getParentBlock.mockReturnValue(p)

      commands.toggleCollapse.execute(mockEngine)
      const summary = mockEngine.element.querySelector('summary')
      expect(summary.textContent).toBe('Section')
    })
  })

  describe('ungroupBlocks edge cases', () => {
    it('should not ungroup if block is not in a group', () => {
      const p = document.createElement('p')
      p.textContent = 'standalone'
      mockEngine.element.appendChild(p)
      mockEngine.selection.getParentBlock.mockReturnValue(p)

      commands.ungroupBlocks.execute(mockEngine)
      expect(mockEngine.history.snapshot).not.toHaveBeenCalled()
    })
  })

  describe('moveGroup edge cases', () => {
    it('should not move if block is not in a group', () => {
      const p = document.createElement('p')
      p.textContent = 'no group'
      mockEngine.element.appendChild(p)
      mockEngine.selection.getParentBlock.mockReturnValue(p)

      commands.moveGroup.execute(mockEngine, { direction: 'up' })
      expect(mockEngine.history.snapshot).not.toHaveBeenCalled()
    })

    it('should not reorder when no previous sibling (direction up)', () => {
      mockEngine.element.innerHTML = ''
      mockEngine.eventBus.emit.mockClear()

      const group = document.createElement('div')
      group.className = 'rmx-block-group'
      group.appendChild(document.createElement('p'))
      mockEngine.element.appendChild(group)
      mockEngine.selection.getParentBlock.mockReturnValue(group)

      commands.moveGroup.execute(mockEngine, { direction: 'up' })
      // Group stays in same position
      expect(mockEngine.element.children[0]).toBe(group)
    })

    it('should not reorder when no next sibling (direction down)', () => {
      mockEngine.element.innerHTML = ''
      mockEngine.eventBus.emit.mockClear()

      const group = document.createElement('div')
      group.className = 'rmx-block-group'
      group.appendChild(document.createElement('p'))
      mockEngine.element.appendChild(group)
      mockEngine.selection.getParentBlock.mockReturnValue(group)

      commands.moveGroup.execute(mockEngine, { direction: 'down' })
      // Group stays in same position
      expect(mockEngine.element.children[0]).toBe(group)
    })
  })

  describe('duplicateGroup edge cases', () => {
    it('should not duplicate if not in a group', () => {
      const p = document.createElement('p')
      p.textContent = 'no group'
      mockEngine.element.appendChild(p)
      mockEngine.selection.getParentBlock.mockReturnValue(p)

      commands.duplicateGroup.execute(mockEngine)
      expect(mockEngine.history.snapshot).not.toHaveBeenCalled()
    })
  })

  describe('horizontalRule edge cases', () => {
    it('should add paragraph after hr when next sibling is not P', () => {
      const div = document.createElement('div')
      div.textContent = 'next'
      mockEngine.element.appendChild(div)

      const range = document.createRange()
      range.setStart(mockEngine.element, 0)
      range.collapse(true)
      mockEngine.selection.getRange.mockReturnValue(range)

      commands.horizontalRule.execute(mockEngine)
      const hr = mockEngine.element.querySelector('hr')
      expect(hr).not.toBeNull()
    })
  })
})
