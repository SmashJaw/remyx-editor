import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { registerBlockCommands } from '../commands/blocks.js'

function createMockEngine() {
  const element = document.createElement('div')
  element.contentEditable = 'true'
  document.body.appendChild(element)
  const commands = new Map()
  return {
    element,
    commands: {
      register: vi.fn((name, def) => commands.set(name, def)),
      _get: (name) => commands.get(name),
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
}

describe('blocks.js — comprehensive coverage', () => {
  let engine

  beforeEach(() => {
    engine = createMockEngine()
    registerBlockCommands(engine)
  })

  afterEach(() => {
    engine.element.remove()
  })

  function exec(name, ...args) {
    const cmd = engine.commands._get(name)
    return cmd.execute(engine, ...args)
  }

  describe('blockquote', () => {
    it('wraps current block in blockquote', () => {
      const p = document.createElement('p')
      p.textContent = 'text'
      engine.element.appendChild(p)

      engine.selection.getClosestElement.mockReturnValue(null)
      engine.selection.getParentBlock.mockReturnValue(p)
      exec('blockquote')

      expect(engine.element.querySelector('blockquote')).toBeTruthy()
      expect(engine.element.querySelector('blockquote p')).toBeTruthy()
    })

    it('unwraps existing blockquote', () => {
      const bq = document.createElement('blockquote')
      const p = document.createElement('p')
      p.textContent = 'text'
      bq.appendChild(p)
      engine.element.appendChild(bq)

      engine.selection.getClosestElement.mockReturnValue(bq)
      exec('blockquote')

      expect(engine.element.querySelector('blockquote')).toBeNull()
      expect(engine.element.querySelector('p')).toBeTruthy()
    })

    it('isActive returns true when inside blockquote', () => {
      const cmd = engine.commands._get('blockquote')
      engine.selection.getClosestElement.mockReturnValue(document.createElement('blockquote'))
      expect(cmd.isActive(engine)).toBe(true)

      engine.selection.getClosestElement.mockReturnValue(null)
      expect(cmd.isActive(engine)).toBe(false)
    })
  })

  describe('codeBlock', () => {
    it('creates a code block', () => {
      const p = document.createElement('p')
      p.textContent = 'code'
      engine.element.appendChild(p)

      engine.selection.getClosestElement.mockReturnValue(null)
      const range = document.createRange()
      range.selectNodeContents(p)
      range.collapse(true)
      engine.selection.getRange.mockReturnValue(range)

      exec('codeBlock', {})
      expect(engine.element.querySelector('pre')).toBeTruthy()
      expect(engine.element.querySelector('code')).toBeTruthy()
    })

    it('unwraps existing code block', () => {
      const pre = document.createElement('pre')
      const code = document.createElement('code')
      code.textContent = 'var x = 1;'
      pre.appendChild(code)
      engine.element.appendChild(pre)

      engine.selection.getClosestElement.mockReturnValue(pre)
      exec('codeBlock', {})

      expect(engine.element.querySelector('pre')).toBeNull()
      expect(engine.element.querySelector('p')).toBeTruthy()
    })

    it('sets language attribute when provided', () => {
      engine.selection.getClosestElement.mockReturnValue(null)
      const range = document.createRange()
      range.setStart(engine.element, 0)
      range.collapse(true)
      engine.selection.getRange.mockReturnValue(range)

      exec('codeBlock', { language: 'javascript' })
      expect(engine.element.querySelector('code').getAttribute('data-language')).toBe('javascript')
    })
  })

  describe('horizontalRule', () => {
    it('inserts an hr element', () => {
      const p = document.createElement('p')
      p.textContent = 'text'
      engine.element.appendChild(p)

      const range = document.createRange()
      range.setStart(p.firstChild, 4)
      range.collapse(true)
      engine.selection.getRange.mockReturnValue(range)

      exec('horizontalRule')
      expect(engine.element.querySelector('hr')).toBeTruthy()
    })

    it('adds paragraph after hr for continued editing', () => {
      const range = document.createRange()
      range.setStart(engine.element, 0)
      range.collapse(true)
      engine.selection.getRange.mockReturnValue(range)

      exec('horizontalRule')
      const hr = engine.element.querySelector('hr')
      expect(hr.nextSibling?.tagName).toBe('P')
    })
  })

  describe('moveBlockUp', () => {
    it('moves block before its previous sibling', () => {
      const p1 = document.createElement('p')
      p1.textContent = 'first'
      const p2 = document.createElement('p')
      p2.textContent = 'second'
      engine.element.appendChild(p1)
      engine.element.appendChild(p2)

      engine.selection.getParentBlock.mockReturnValue(p2)
      exec('moveBlockUp')

      expect(engine.element.firstChild).toBe(p2)
      expect(engine.eventBus.emit).toHaveBeenCalledWith('content:change')
    })

    it('does nothing when no previous sibling', () => {
      const p = document.createElement('p')
      p.textContent = 'only'
      engine.element.appendChild(p)

      engine.selection.getParentBlock.mockReturnValue(p)
      exec('moveBlockUp')
    })
  })

  describe('moveBlockDown', () => {
    it('moves block after its next sibling', () => {
      const p1 = document.createElement('p')
      p1.textContent = 'first'
      const p2 = document.createElement('p')
      p2.textContent = 'second'
      engine.element.appendChild(p1)
      engine.element.appendChild(p2)

      engine.selection.getParentBlock.mockReturnValue(p1)
      exec('moveBlockDown')

      expect(engine.element.lastChild).toBe(p1)
    })
  })

  describe('duplicateBlock', () => {
    it('clones the current block', () => {
      const p = document.createElement('p')
      p.textContent = 'original'
      engine.element.appendChild(p)

      engine.selection.getParentBlock.mockReturnValue(p)
      exec('duplicateBlock')

      expect(engine.element.children.length).toBe(2)
      expect(engine.element.children[1].textContent).toBe('original')
    })
  })

  describe('deleteBlock', () => {
    it('removes the current block and ensures minimum content', () => {
      const p = document.createElement('p')
      p.textContent = 'delete me'
      engine.element.appendChild(p)

      engine.selection.getParentBlock.mockReturnValue(p)
      exec('deleteBlock')

      expect(engine.element.children.length).toBe(1) // minimum content paragraph
    })

    it('moves cursor to next sibling', () => {
      const p1 = document.createElement('p')
      p1.textContent = 'first'
      const p2 = document.createElement('p')
      p2.textContent = 'second'
      engine.element.appendChild(p1)
      engine.element.appendChild(p2)

      engine.selection.getParentBlock.mockReturnValue(p1)
      exec('deleteBlock')

      expect(engine.element.querySelector('p').textContent).toBe('second')
    })
  })

  describe('selectBlocks', () => {
    it('adds rmx-block-selected class to blocks', () => {
      const p1 = document.createElement('p')
      const p2 = document.createElement('p')
      engine.element.appendChild(p1)
      engine.element.appendChild(p2)

      exec('selectBlocks', { blocks: [p1, p2] })
      expect(p1.classList.contains('rmx-block-selected')).toBe(true)
      expect(p2.classList.contains('rmx-block-selected')).toBe(true)
    })
  })

  describe('clearBlockSelection', () => {
    it('removes rmx-block-selected from all elements', () => {
      const p = document.createElement('p')
      p.classList.add('rmx-block-selected')
      engine.element.appendChild(p)

      exec('clearBlockSelection')
      expect(p.classList.contains('rmx-block-selected')).toBe(false)
    })
  })

  describe('toggleCollapse', () => {
    it('wraps block in details/summary', () => {
      const p = document.createElement('p')
      p.textContent = 'Collapsible section'
      engine.element.appendChild(p)

      engine.selection.getParentBlock.mockReturnValue(p)
      exec('toggleCollapse')

      expect(engine.element.querySelector('details')).toBeTruthy()
      expect(engine.element.querySelector('summary')).toBeTruthy()
    })

    it('unwraps existing details element', () => {
      const details = document.createElement('details')
      details.className = 'rmx-collapsible'
      const summary = document.createElement('summary')
      summary.textContent = 'Title'
      const p = document.createElement('p')
      p.textContent = 'Content'
      details.appendChild(summary)
      details.appendChild(p)
      engine.element.appendChild(details)

      engine.selection.getParentBlock.mockReturnValue(details)
      exec('toggleCollapse')

      expect(engine.element.querySelector('details')).toBeNull()
      expect(engine.element.querySelector('p')).toBeTruthy()
    })
  })

  describe('groupBlocks', () => {
    it('groups selected blocks into a div', () => {
      const p1 = document.createElement('p')
      p1.textContent = 'A'
      p1.classList.add('rmx-block-selected')
      const p2 = document.createElement('p')
      p2.textContent = 'B'
      p2.classList.add('rmx-block-selected')
      engine.element.appendChild(p1)
      engine.element.appendChild(p2)

      exec('groupBlocks')

      const group = engine.element.querySelector('.rmx-block-group')
      expect(group).toBeTruthy()
      expect(group.children.length).toBe(2)
    })
  })

  describe('ungroupBlocks', () => {
    it('removes group wrapper', () => {
      const group = document.createElement('div')
      group.className = 'rmx-block-group'
      const p = document.createElement('p')
      p.textContent = 'inside'
      group.appendChild(p)
      engine.element.appendChild(group)

      engine.selection.getParentBlock.mockReturnValue(group)
      exec('ungroupBlocks')

      expect(engine.element.querySelector('.rmx-block-group')).toBeNull()
      expect(engine.element.querySelector('p').textContent).toBe('inside')
    })
  })
})
