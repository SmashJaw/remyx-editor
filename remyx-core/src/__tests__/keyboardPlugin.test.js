/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { KeyboardPlugin, getHeadings, selectNextOccurrence } from '../plugins/builtins/keyboardFeatures/index.js'

describe('getHeadings', () => {
  let el

  beforeEach(() => {
    el = document.createElement('div')
    el.innerHTML = '<h1>Title</h1><p>Text</p><h2>Section</h2><h3>Sub</h3>'
    document.body.appendChild(el)
  })

  afterEach(() => { el.remove() })

  it('returns all headings with level and text', () => {
    const headings = getHeadings(el)
    expect(headings.length).toBe(3)
    expect(headings[0]).toEqual(expect.objectContaining({ level: 1, text: 'Title' }))
    expect(headings[1]).toEqual(expect.objectContaining({ level: 2, text: 'Section' }))
    expect(headings[2]).toEqual(expect.objectContaining({ level: 3, text: 'Sub' }))
  })

  it('returns empty for no headings', () => {
    el.innerHTML = '<p>No headings</p>'
    expect(getHeadings(el)).toEqual([])
  })
})

describe('KeyboardPlugin', () => {
  let engine, plugin

  beforeEach(() => {
    const el = document.createElement('div')
    el.contentEditable = 'true'
    el.innerHTML = '<p>Hello world</p>'
    document.body.appendChild(el)
    engine = {
      element: el,
      eventBus: {
        on: vi.fn(() => () => {}),
        emit: vi.fn(),
      },
      history: { snapshot: vi.fn() },
      selection: { getParentBlock: vi.fn() },
      commands: { register: vi.fn() },
      executeCommand: vi.fn(),
      _el: el,
    }
  })

  afterEach(() => {
    plugin?.destroy()
    engine._el.remove()
  })

  it('creates a valid plugin', () => {
    plugin = KeyboardPlugin()
    expect(plugin.name).toBe('keyboard')
    expect(plugin.commands.length).toBe(5)
  })

  it('has required commands', () => {
    plugin = KeyboardPlugin()
    const names = plugin.commands.map(c => c.name)
    expect(names).toContain('setKeyboardMode')
    expect(names).toContain('getVimMode')
    expect(names).toContain('jumpToHeading')
    expect(names).toContain('getHeadings')
    expect(names).toContain('selectNextOccurrence')
  })

  it('exposes _keyboard API after init', () => {
    plugin = KeyboardPlugin()
    plugin.init(engine)
    expect(engine._keyboard).toBeDefined()
    expect(typeof engine._keyboard.getHeadings).toBe('function')
    expect(typeof engine._keyboard.getVimMode).toBe('function')
  })

  it('vim mode initialization adds class', () => {
    plugin = KeyboardPlugin({ mode: 'vim' })
    plugin.init(engine)
    expect(engine.element.classList.contains('rmx-vim-normal')).toBe(true)
  })

  it('default mode does not add vim class', () => {
    plugin = KeyboardPlugin({ mode: 'default' })
    plugin.init(engine)
    expect(engine.element.classList.contains('rmx-vim-normal')).toBe(false)
  })

  it('destroy removes vim classes', () => {
    plugin = KeyboardPlugin({ mode: 'vim' })
    plugin.init(engine)
    plugin.destroy()
    expect(engine.element.classList.contains('rmx-vim-normal')).toBe(false)
  })

  it('setKeyboardMode switches to vim', () => {
    plugin = KeyboardPlugin()
    plugin.init(engine)
    const cmd = plugin.commands.find(c => c.name === 'setKeyboardMode')
    cmd.execute(engine, 'vim')
    expect(engine.element.classList.contains('rmx-vim-normal')).toBe(true)
  })

  it('getVimMode returns null when not in vim mode', () => {
    plugin = KeyboardPlugin()
    plugin.init(engine)
    const cmd = plugin.commands.find(c => c.name === 'getVimMode')
    expect(cmd.execute()).toBeNull()
  })

  it('getHeadings command works', () => {
    plugin = KeyboardPlugin()
    plugin.init(engine)
    engine.element.innerHTML = '<h1>A</h1><h2>B</h2>'
    const cmd = plugin.commands.find(c => c.name === 'getHeadings')
    const headings = cmd.execute(engine)
    expect(headings.length).toBe(2)
  })
})
