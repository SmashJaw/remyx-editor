import { vi } from 'vitest'
import { registerHeadingCommands } from '../commands/headings.js'

describe('registerHeadingCommands', () => {
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
        execute: vi.fn((name, ...args) => commands[name]?.execute(mockEngine, ...args)),
      },
      keyboard: { register: vi.fn() },
      eventBus: { emit: vi.fn(), on: vi.fn() },
      history: { snapshot: vi.fn() },
      selection: {
        getSelection: vi.fn().mockReturnValue(window.getSelection()),
        getRange: vi.fn(),
        save: vi.fn(),
        restore: vi.fn(),
        insertHTML: vi.fn(),
        wrapWith: vi.fn(),
        unwrap: vi.fn(),
        getParentBlock: vi.fn(),
        setRange: vi.fn(),
      },
      sanitizer: { sanitize: vi.fn(html => html) },
      getHTML: vi.fn().mockReturnValue('<p>test</p>'),
      setHTML: vi.fn(),
      options: { baseHeadingLevel: 0 },
      isMarkdownMode: false,
      isSourceMode: false,
    }

    registerHeadingCommands(mockEngine)
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('should register heading, h1-h6, and paragraph commands (8 total)', () => {
    expect(commands.heading).toBeDefined()
    for (let i = 1; i <= 6; i++) {
      expect(commands[`h${i}`]).toBeDefined()
    }
    expect(commands.paragraph).toBeDefined()
    expect(mockEngine.commands.register).toHaveBeenCalledTimes(8)
  })

  it('should convert block to <p> when heading execute called with paragraph level', () => {
    const h2 = document.createElement('h2')
    h2.textContent = 'Title'
    mockEngine.element.appendChild(h2)

    mockEngine.selection.getParentBlock.mockReturnValue(h2)
    commands.heading.execute(mockEngine, 'p')

    const p = mockEngine.element.querySelector('p')
    expect(p).not.toBeNull()
    expect(p.textContent).toBe('Title')
    expect(mockEngine.element.querySelector('h2')).toBeNull()
  })

  it('should convert block to <h2> when heading execute called with numeric level', () => {
    const p = document.createElement('p')
    p.textContent = 'Content'
    mockEngine.element.appendChild(p)

    mockEngine.selection.getParentBlock.mockReturnValue(p)
    commands.heading.execute(mockEngine, 2)

    const h2 = mockEngine.element.querySelector('h2')
    expect(h2).not.toBeNull()
    expect(h2.textContent).toBe('Content')
  })

  it('should convert block to <h3> when h3 command execute is called', () => {
    const p = document.createElement('p')
    p.textContent = 'Content'
    mockEngine.element.appendChild(p)

    mockEngine.selection.getParentBlock.mockReturnValue(p)
    commands.h3.execute(mockEngine)

    expect(mockEngine.element.querySelector('h3')).not.toBeNull()
    expect(mockEngine.element.querySelector('h3').textContent).toBe('Content')
  })

  it('should convert block to <p> when paragraph command execute is called', () => {
    const h1 = document.createElement('h1')
    h1.textContent = 'Title'
    mockEngine.element.appendChild(h1)

    mockEngine.selection.getParentBlock.mockReturnValue(h1)
    commands.paragraph.execute(mockEngine)

    expect(mockEngine.element.querySelector('p')).not.toBeNull()
    expect(mockEngine.element.querySelector('h1')).toBeNull()
  })

  it('should return heading tag when isActive and block is a heading', () => {
    const h2 = document.createElement('h2')
    mockEngine.selection.getParentBlock.mockReturnValue(h2)
    const result = commands.heading.isActive(mockEngine)
    expect(result).toBe('h2')
  })

  it('should return false when isActive and no block', () => {
    mockEngine.selection.getParentBlock.mockReturnValue(null)
    expect(commands.heading.isActive(mockEngine)).toBe(false)
  })

  it('should return true for h1 isActive when block matches', () => {
    const h1 = document.createElement('h1')
    mockEngine.selection.getParentBlock.mockReturnValue(h1)
    expect(commands.h1.isActive(mockEngine)).toBe(true)
  })

  it('should return false for h1 isActive when block does not match', () => {
    const h3 = document.createElement('h3')
    mockEngine.selection.getParentBlock.mockReturnValue(h3)
    expect(commands.h1.isActive(mockEngine)).toBe(false)
  })

  it('should return true for paragraph isActive when block is P', () => {
    const p = document.createElement('p')
    mockEngine.selection.getParentBlock.mockReturnValue(p)
    expect(commands.paragraph.isActive(mockEngine)).toBe(true)
  })

  it('should have correct meta for heading', () => {
    expect(commands.heading.meta).toEqual({ icon: 'heading', tooltip: 'Heading' })
  })

  describe('with baseHeadingLevel offset', () => {
    beforeEach(() => {
      commands = {}
      mockEngine.options.baseHeadingLevel = 2
      mockEngine.commands.register.mockClear()
      registerHeadingCommands(mockEngine)
    })

    it('should apply baseHeadingLevel offset to heading command', () => {
      const p = document.createElement('p')
      p.textContent = 'Content'
      mockEngine.element.appendChild(p)

      mockEngine.selection.getParentBlock.mockReturnValue(p)
      commands.heading.execute(mockEngine, 1)

      // baseHeadingLevel=2, logical level=1 => effective=2
      expect(mockEngine.element.querySelector('h2')).not.toBeNull()
    })

    it('should clamp heading level to 6', () => {
      const p = document.createElement('p')
      p.textContent = 'Content'
      mockEngine.element.appendChild(p)

      mockEngine.selection.getParentBlock.mockReturnValue(p)
      commands.heading.execute(mockEngine, 6)

      // baseHeadingLevel=2, logical level=6 => clamped to h6
      expect(mockEngine.element.querySelector('h6')).not.toBeNull()
    })

    it('should apply offset to individual heading commands', () => {
      const p = document.createElement('p')
      p.textContent = 'Content'
      mockEngine.element.appendChild(p)

      mockEngine.selection.getParentBlock.mockReturnValue(p)
      commands.h1.execute(mockEngine)

      // h1 with baseHeadingLevel=2 => effective h2
      expect(mockEngine.element.querySelector('h2')).not.toBeNull()
    })
  })
})
