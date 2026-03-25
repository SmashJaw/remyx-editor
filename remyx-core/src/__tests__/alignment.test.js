import { vi } from 'vitest'
import { registerAlignmentCommands } from '../commands/alignment.js'

describe('registerAlignmentCommands', () => {
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
      },
      sanitizer: { sanitize: vi.fn(html => html) },
      getHTML: vi.fn().mockReturnValue('<p>test</p>'),
      setHTML: vi.fn(),
      options: { baseHeadingLevel: 0 },
      isMarkdownMode: false,
      isSourceMode: false,
    }

    registerAlignmentCommands(mockEngine)
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('should register all 4 alignment commands', () => {
    expect(mockEngine.commands.register).toHaveBeenCalledTimes(4)
    expect(commands.alignLeft).toBeDefined()
    expect(commands.alignCenter).toBeDefined()
    expect(commands.alignRight).toBeDefined()
    expect(commands.alignJustify).toBeDefined()
  })

  it('should set textAlign to left when executing alignLeft', () => {
    const block = document.createElement('p')
    block.textContent = 'text'
    mockEngine.element.appendChild(block)
    mockEngine.selection.getParentBlock.mockReturnValue(block)

    commands.alignLeft.execute(mockEngine)
    expect(block.style.textAlign).toBe('left')
  })

  it('should set textAlign to center when executing alignCenter', () => {
    const block = document.createElement('p')
    block.textContent = 'text'
    mockEngine.element.appendChild(block)
    mockEngine.selection.getParentBlock.mockReturnValue(block)

    commands.alignCenter.execute(mockEngine)
    expect(block.style.textAlign).toBe('center')
  })

  it('should set textAlign to right when executing alignRight', () => {
    const block = document.createElement('p')
    block.textContent = 'text'
    mockEngine.element.appendChild(block)
    mockEngine.selection.getParentBlock.mockReturnValue(block)

    commands.alignRight.execute(mockEngine)
    expect(block.style.textAlign).toBe('right')
  })

  it('should set textAlign to justify when executing alignJustify', () => {
    const block = document.createElement('p')
    block.textContent = 'text'
    mockEngine.element.appendChild(block)
    mockEngine.selection.getParentBlock.mockReturnValue(block)

    commands.alignJustify.execute(mockEngine)
    expect(block.style.textAlign).toBe('justify')
  })

  it('should return true for alignLeft isActive when no alignment set', () => {
    const block = document.createElement('p')
    mockEngine.selection.getParentBlock.mockReturnValue(block)
    expect(commands.alignLeft.isActive(mockEngine)).toBe(true)
  })

  it('should return true for alignLeft isActive when textAlign is start', () => {
    const block = document.createElement('p')
    block.style.textAlign = 'start'
    mockEngine.selection.getParentBlock.mockReturnValue(block)
    expect(commands.alignLeft.isActive(mockEngine)).toBe(true)
  })

  it('should return false for alignLeft isActive when no block', () => {
    mockEngine.selection.getParentBlock.mockReturnValue(null)
    expect(commands.alignLeft.isActive(mockEngine)).toBe(false)
  })

  it('should return true for alignCenter isActive when textAlign is center', () => {
    const block = document.createElement('p')
    block.style.textAlign = 'center'
    mockEngine.selection.getParentBlock.mockReturnValue(block)
    expect(commands.alignCenter.isActive(mockEngine)).toBe(true)
  })

  it('should return true for alignRight isActive when textAlign is right', () => {
    const block = document.createElement('p')
    block.style.textAlign = 'right'
    mockEngine.selection.getParentBlock.mockReturnValue(block)
    expect(commands.alignRight.isActive(mockEngine)).toBe(true)
  })

  it('should return true for alignJustify isActive when textAlign is justify', () => {
    const block = document.createElement('p')
    block.style.textAlign = 'justify'
    mockEngine.selection.getParentBlock.mockReturnValue(block)
    expect(commands.alignJustify.isActive(mockEngine)).toBe(true)
  })

  it('should have correct meta for each alignment command', () => {
    expect(commands.alignLeft.meta).toEqual({ icon: 'alignLeft', tooltip: 'Align Left' })
    expect(commands.alignCenter.meta).toEqual({ icon: 'alignCenter', tooltip: 'Align Center' })
    expect(commands.alignRight.meta).toEqual({ icon: 'alignRight', tooltip: 'Align Right' })
    expect(commands.alignJustify.meta).toEqual({ icon: 'alignJustify', tooltip: 'Justify' })
  })
})
