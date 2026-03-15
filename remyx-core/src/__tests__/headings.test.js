import { registerHeadingCommands } from '../commands/headings.js'

describe('registerHeadingCommands', () => {
  let commands
  let mockEngine

  beforeEach(() => {
    commands = {}
    document.execCommand = jest.fn().mockReturnValue(true)
    document.queryCommandState = jest.fn().mockReturnValue(false)

    const element = document.createElement('div')
    element.setAttribute('contenteditable', 'true')
    document.body.appendChild(element)

    mockEngine = {
      element,
      commands: {
        register: jest.fn((name, def) => { commands[name] = def }),
        execute: jest.fn((name, ...args) => commands[name]?.execute(mockEngine, ...args)),
      },
      keyboard: { register: jest.fn() },
      eventBus: { emit: jest.fn(), on: jest.fn() },
      history: { snapshot: jest.fn() },
      selection: {
        getSelection: jest.fn().mockReturnValue(window.getSelection()),
        getRange: jest.fn(),
        save: jest.fn(),
        restore: jest.fn(),
        insertHTML: jest.fn(),
        wrapWith: jest.fn(),
        unwrap: jest.fn(),
        getParentBlock: jest.fn(),
      },
      sanitizer: { sanitize: jest.fn(html => html) },
      getHTML: jest.fn().mockReturnValue('<p>test</p>'),
      setHTML: jest.fn(),
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

  it('should execute heading with paragraph level', () => {
    const spy = jest.spyOn(document, 'execCommand').mockReturnValue(true)
    commands.heading.execute(mockEngine, 'p')
    expect(spy).toHaveBeenCalledWith('formatBlock', false, '<p>')
    spy.mockRestore()
  })

  it('should execute heading with numeric level', () => {
    const spy = jest.spyOn(document, 'execCommand').mockReturnValue(true)
    commands.heading.execute(mockEngine, 2)
    expect(spy).toHaveBeenCalledWith('formatBlock', false, '<h2>')
    spy.mockRestore()
  })

  it('should execute individual heading commands', () => {
    const spy = jest.spyOn(document, 'execCommand').mockReturnValue(true)
    commands.h3.execute()
    expect(spy).toHaveBeenCalledWith('formatBlock', false, '<h3>')
    spy.mockRestore()
  })

  it('should execute paragraph command', () => {
    const spy = jest.spyOn(document, 'execCommand').mockReturnValue(true)
    commands.paragraph.execute()
    expect(spy).toHaveBeenCalledWith('formatBlock', false, '<p>')
    spy.mockRestore()
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
      const spy = jest.spyOn(document, 'execCommand').mockReturnValue(true)
      commands.heading.execute(mockEngine, 1)
      expect(spy).toHaveBeenCalledWith('formatBlock', false, '<h2>')
      spy.mockRestore()
    })

    it('should clamp heading level to 6', () => {
      const spy = jest.spyOn(document, 'execCommand').mockReturnValue(true)
      commands.heading.execute(mockEngine, 6)
      expect(spy).toHaveBeenCalledWith('formatBlock', false, '<h6>')
      spy.mockRestore()
    })

    it('should apply offset to individual heading commands', () => {
      const spy = jest.spyOn(document, 'execCommand').mockReturnValue(true)
      commands.h1.execute()
      expect(spy).toHaveBeenCalledWith('formatBlock', false, '<h2>')
      spy.mockRestore()
    })
  })
})
