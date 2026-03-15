import { registerFullscreenCommands } from '../commands/fullscreen.js'

describe('registerFullscreenCommands', () => {
  let commands
  let mockEngine
  let editorRoot

  beforeEach(() => {
    commands = {}

    editorRoot = document.createElement('div')
    editorRoot.className = 'rmx-editor'

    const element = document.createElement('div')
    element.setAttribute('contenteditable', 'true')
    editorRoot.appendChild(element)
    document.body.appendChild(editorRoot)

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

    registerFullscreenCommands(mockEngine)
  })

  afterEach(() => {
    // Clean up fullscreen state
    editorRoot.classList.remove('rmx-fullscreen')
    document.body.style.overflow = ''
    document.body.innerHTML = ''
  })

  it('should register fullscreen command', () => {
    expect(mockEngine.commands.register).toHaveBeenCalledTimes(1)
    expect(commands.fullscreen).toBeDefined()
  })

  it('should have mod+shift+f shortcut', () => {
    expect(commands.fullscreen.shortcut).toBe('mod+shift+f')
  })

  it('should add rmx-fullscreen class when entering fullscreen', () => {
    commands.fullscreen.execute(mockEngine)
    expect(editorRoot.classList.contains('rmx-fullscreen')).toBe(true)
  })

  it('should set body overflow to hidden when entering fullscreen', () => {
    commands.fullscreen.execute(mockEngine)
    expect(document.body.style.overflow).toBe('hidden')
  })

  it('should remove rmx-fullscreen class when exiting fullscreen', () => {
    editorRoot.classList.add('rmx-fullscreen')
    commands.fullscreen.execute(mockEngine)
    expect(editorRoot.classList.contains('rmx-fullscreen')).toBe(false)
  })

  it('should emit fullscreen:toggle with true when entering', () => {
    commands.fullscreen.execute(mockEngine)
    expect(mockEngine.eventBus.emit).toHaveBeenCalledWith('fullscreen:toggle', { fullscreen: true })
  })

  it('should emit fullscreen:toggle with false when exiting', () => {
    editorRoot.classList.add('rmx-fullscreen')
    commands.fullscreen.execute(mockEngine)
    expect(mockEngine.eventBus.emit).toHaveBeenCalledWith('fullscreen:toggle', { fullscreen: false })
  })

  it('should return true for isActive when fullscreen', () => {
    editorRoot.classList.add('rmx-fullscreen')
    expect(commands.fullscreen.isActive(mockEngine)).toBe(true)
  })

  it('should return false for isActive when not fullscreen', () => {
    expect(commands.fullscreen.isActive(mockEngine)).toBe(false)
  })

  it('should do nothing if no .rmx-editor root found', () => {
    const standaloneElement = document.createElement('div')
    document.body.appendChild(standaloneElement)
    const eng = { ...mockEngine, element: standaloneElement }
    commands.fullscreen.execute(eng)
    expect(mockEngine.eventBus.emit).not.toHaveBeenCalled()
  })

  it('should have correct meta', () => {
    expect(commands.fullscreen.meta).toEqual({ icon: 'fullscreen', tooltip: 'Fullscreen' })
  })
})
