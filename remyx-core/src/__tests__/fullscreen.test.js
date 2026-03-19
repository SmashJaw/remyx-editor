import { vi } from 'vitest'
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
      },
      sanitizer: { sanitize: vi.fn(html => html) },
      getHTML: vi.fn().mockReturnValue('<p>test</p>'),
      setHTML: vi.fn(),
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
