import { vi } from 'vitest'
import { KeyboardPlugin, getHeadings, selectNextOccurrence } from '../plugins/builtins/keyboardFeatures/KeyboardPlugin.js'

describe('getHeadings', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('should return headings with level, text, and element', () => {
    const container = document.createElement('div')
    const h1 = document.createElement('h1')
    h1.textContent = 'Title'
    const h2 = document.createElement('h2')
    h2.textContent = 'Subtitle'
    const h3 = document.createElement('h3')
    h3.textContent = 'Section'
    container.appendChild(h1)
    container.appendChild(h2)
    container.appendChild(h3)
    document.body.appendChild(container)

    const headings = getHeadings(container)
    expect(headings).toHaveLength(3)
    expect(headings[0]).toEqual({ level: 1, text: 'Title', element: h1 })
    expect(headings[1]).toEqual({ level: 2, text: 'Subtitle', element: h2 })
    expect(headings[2]).toEqual({ level: 3, text: 'Section', element: h3 })
  })

  it('should return empty array if no headings', () => {
    const container = document.createElement('div')
    container.innerHTML = '<p>No headings</p>'
    expect(getHeadings(container)).toEqual([])
  })
})

describe('selectNextOccurrence', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('should return 0 if no selection', () => {
    const el = document.createElement('div')
    document.body.appendChild(el)
    window.getSelection().removeAllRanges()
    expect(selectNextOccurrence(el)).toBe(0)
  })
})

describe('KeyboardPlugin', () => {
  let plugin, engine

  beforeEach(() => {
    const el = document.createElement('div')
    el.contentEditable = 'true'
    el.innerHTML = '<p>Hello World</p>'
    document.body.appendChild(el)

    engine = {
      element: el,
      eventBus: { emit: vi.fn(), on: vi.fn(() => () => {}) },
      history: { snapshot: vi.fn() },
      selection: {
        getSelection: vi.fn(() => window.getSelection()),
        getParentBlock: vi.fn(),
      },
      commands: { register: vi.fn() },
      executeCommand: vi.fn(),
    }
  })

  afterEach(() => {
    plugin?.destroy()
    document.body.innerHTML = ''
  })

  it('should create a plugin with correct name', () => {
    plugin = KeyboardPlugin()
    expect(plugin.name).toBe('keyboard')
    expect(plugin.requiresFullAccess).toBe(true)
  })

  it('should register commands', () => {
    plugin = KeyboardPlugin()
    const names = plugin.commands.map(c => c.name)
    expect(names).toContain('setKeyboardMode')
    expect(names).toContain('getVimMode')
    expect(names).toContain('jumpToHeading')
    expect(names).toContain('getHeadings')
    expect(names).toContain('selectNextOccurrence')
  })

  it('should expose _keyboard API after init', () => {
    plugin = KeyboardPlugin()
    plugin.init(engine)
    expect(engine._keyboard).toBeDefined()
    expect(typeof engine._keyboard.getHeadings).toBe('function')
    expect(typeof engine._keyboard.getVimMode).toBe('function')
    expect(typeof engine._keyboard.selectNextOccurrence).toBe('function')
  })

  it('should return null for vim mode when in default mode', () => {
    plugin = KeyboardPlugin({ mode: 'default' })
    plugin.init(engine)
    expect(engine._keyboard.getVimMode()).toBeNull()
  })

  it('should initialize vim mode when specified', () => {
    plugin = KeyboardPlugin({ mode: 'vim' })
    plugin.init(engine)
    expect(engine.element.classList.contains('rmx-vim-normal')).toBe(true)
    expect(engine._keyboard.getVimMode()).toBe('normal')
  })

  it('should clean up on destroy', () => {
    plugin = KeyboardPlugin({ mode: 'vim' })
    plugin.init(engine)
    plugin.destroy()
    expect(engine.element.classList.contains('rmx-vim-normal')).toBe(false)
    expect(engine.element.classList.contains('rmx-vim-insert')).toBe(false)
  })

  it('setKeyboardMode command should switch to vim', () => {
    plugin = KeyboardPlugin()
    plugin.init(engine)
    const cmd = plugin.commands.find(c => c.name === 'setKeyboardMode')
    cmd.execute(engine, 'vim')
    expect(engine.element.classList.contains('rmx-vim-normal')).toBe(true)
    expect(engine.eventBus.emit).toHaveBeenCalledWith('vim:modeChange', { mode: 'normal' })
  })

  it('setKeyboardMode command should switch away from vim', () => {
    plugin = KeyboardPlugin({ mode: 'vim' })
    plugin.init(engine)
    const cmd = plugin.commands.find(c => c.name === 'setKeyboardMode')
    cmd.execute(engine, 'default')
    expect(engine.element.classList.contains('rmx-vim-normal')).toBe(false)
  })

  it('getVimMode command returns null when not in vim mode', () => {
    plugin = KeyboardPlugin()
    plugin.init(engine)
    const cmd = plugin.commands.find(c => c.name === 'getVimMode')
    expect(cmd.execute()).toBeNull()
  })

  it('getHeadings command returns headings', () => {
    engine.element.innerHTML = '<h1>A</h1><h2>B</h2>'
    plugin = KeyboardPlugin()
    plugin.init(engine)
    const cmd = plugin.commands.find(c => c.name === 'getHeadings')
    const result = cmd.execute(engine)
    expect(result).toHaveLength(2)
    expect(result[0].level).toBe(1)
  })

  it('jumpToHeading command works for valid index', () => {
    engine.element.innerHTML = '<h1>First</h1><h2>Second</h2>'
    plugin = KeyboardPlugin()
    plugin.init(engine)
    const cmd = plugin.commands.find(c => c.name === 'jumpToHeading')
    // Should not throw for valid index
    cmd.execute(engine, 0)
  })

  it('jumpToHeading command handles out-of-bounds index', () => {
    engine.element.innerHTML = '<h1>Only</h1>'
    plugin = KeyboardPlugin()
    plugin.init(engine)
    const cmd = plugin.commands.find(c => c.name === 'jumpToHeading')
    // Should not throw for negative or too-large index
    cmd.execute(engine, -1)
    cmd.execute(engine, 99)
  })

  it('should handle custom key bindings with function action', () => {
    const customFn = vi.fn()
    plugin = KeyboardPlugin({ keyBindings: { 'ctrl+m': customFn } })
    plugin.init(engine)

    const event = new KeyboardEvent('keydown', {
      key: 'm', ctrlKey: true, bubbles: true,
    })
    engine.element.dispatchEvent(event)

    expect(customFn).toHaveBeenCalledWith(engine)
  })

  it('should handle custom key bindings with string action', () => {
    plugin = KeyboardPlugin({ keyBindings: { 'ctrl+m': 'bold' } })
    plugin.init(engine)

    const event = new KeyboardEvent('keydown', {
      key: 'm', ctrlKey: true, bubbles: true,
    })
    engine.element.dispatchEvent(event)

    expect(engine.executeCommand).toHaveBeenCalledWith('bold')
  })
})
