import { registerSourceModeCommands } from '../commands/sourceMode.js'

describe('registerSourceModeCommands', () => {
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
      },
      sanitizer: { sanitize: jest.fn(html => html) },
      getHTML: jest.fn().mockReturnValue('<p>test</p>'),
      setHTML: jest.fn(),
      options: { baseHeadingLevel: 0 },
      isMarkdownMode: false,
      isSourceMode: false,
    }

    registerSourceModeCommands(mockEngine)
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('should register sourceMode command', () => {
    expect(mockEngine.commands.register).toHaveBeenCalledTimes(1)
    expect(commands.sourceMode).toBeDefined()
  })

  it('should have mod+shift+u shortcut', () => {
    expect(commands.sourceMode.shortcut).toBe('mod+shift+u')
  })

  it('should toggle isSourceMode to true', () => {
    commands.sourceMode.execute(mockEngine)
    expect(mockEngine.isSourceMode).toBe(true)
  })

  it('should toggle isSourceMode back to false', () => {
    mockEngine.isSourceMode = true
    commands.sourceMode.execute(mockEngine)
    expect(mockEngine.isSourceMode).toBe(false)
  })

  it('should emit mode:change event when toggling on', () => {
    commands.sourceMode.execute(mockEngine)
    expect(mockEngine.eventBus.emit).toHaveBeenCalledWith('mode:change', { sourceMode: true })
  })

  it('should emit mode:change event when toggling off', () => {
    mockEngine.isSourceMode = true
    commands.sourceMode.execute(mockEngine)
    expect(mockEngine.eventBus.emit).toHaveBeenCalledWith('mode:change', { sourceMode: false })
  })

  it('should return true for isActive when sourceMode is on', () => {
    mockEngine.isSourceMode = true
    expect(commands.sourceMode.isActive(mockEngine)).toBe(true)
  })

  it('should return false for isActive when sourceMode is off', () => {
    mockEngine.isSourceMode = false
    expect(commands.sourceMode.isActive(mockEngine)).toBe(false)
  })

  it('should have correct meta', () => {
    expect(commands.sourceMode.meta).toEqual({ icon: 'sourceMode', tooltip: 'Source Code' })
  })
})
