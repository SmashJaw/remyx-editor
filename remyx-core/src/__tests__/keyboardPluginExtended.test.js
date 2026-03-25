import { vi } from 'vitest'
import { KeyboardPlugin } from '../plugins/builtins/keyboardFeatures/KeyboardPlugin.js'

describe('KeyboardPlugin - vim mode keydown handling', () => {
  let plugin, engine

  beforeEach(() => {
    const el = document.createElement('div')
    el.contentEditable = 'true'
    el.innerHTML = '<p>Hello World testing text</p>'
    document.body.appendChild(el)

    engine = {
      element: el,
      eventBus: { emit: vi.fn(), on: vi.fn(() => () => {}) },
      history: { snapshot: vi.fn() },
      selection: {
        getSelection: vi.fn(() => window.getSelection()),
        getParentBlock: vi.fn(() => el.querySelector('p')),
      },
      commands: { register: vi.fn() },
      executeCommand: vi.fn(),
    }

    // Place cursor in the element
    const sel = window.getSelection()
    const range = document.createRange()
    range.selectNodeContents(el.querySelector('p'))
    range.collapse(true)
    sel.removeAllRanges()
    sel.addRange(range)
  })

  afterEach(() => {
    plugin?.destroy()
    document.body.innerHTML = ''
  })

  function dispatch(key, opts = {}) {
    const event = new KeyboardEvent('keydown', {
      key,
      bubbles: true,
      ...opts,
    })
    engine.element.dispatchEvent(event)
  }

  it('vim mode: "i" enters insert mode', () => {
    plugin = KeyboardPlugin({ mode: 'vim' })
    plugin.init(engine)
    dispatch('i')
    expect(engine.element.classList.contains('rmx-vim-insert')).toBe(true)
    expect(engine.eventBus.emit).toHaveBeenCalledWith('vim:modeChange', { mode: 'insert' })
  })

  it('vim mode: "a" enters insert mode (append)', () => {
    plugin = KeyboardPlugin({ mode: 'vim' })
    plugin.init(engine)
    dispatch('a')
    expect(engine.element.classList.contains('rmx-vim-insert')).toBe(true)
  })

  it('vim mode: Escape returns to normal from insert', () => {
    plugin = KeyboardPlugin({ mode: 'vim' })
    plugin.init(engine)
    dispatch('i') // enter insert
    dispatch('Escape') // back to normal
    expect(engine.element.classList.contains('rmx-vim-normal')).toBe(true)
    expect(engine.element.classList.contains('rmx-vim-insert')).toBe(false)
  })

  it('vim mode: "v" enters visual mode', () => {
    plugin = KeyboardPlugin({ mode: 'vim' })
    plugin.init(engine)
    dispatch('v')
    expect(engine.element.classList.contains('rmx-vim-visual')).toBe(true)
  })

  it('vim mode: Escape from visual returns to normal', () => {
    plugin = KeyboardPlugin({ mode: 'vim' })
    plugin.init(engine)
    dispatch('v') // visual
    dispatch('Escape') // back to normal
    expect(engine.element.classList.contains('rmx-vim-visual')).toBe(false)
  })

  it('vim mode: "u" calls undo', () => {
    plugin = KeyboardPlugin({ mode: 'vim' })
    plugin.init(engine)
    dispatch('u')
    expect(engine.executeCommand).toHaveBeenCalledWith('undo')
  })

  it('vim mode: "o" opens line below', () => {
    plugin = KeyboardPlugin({ mode: 'vim' })
    plugin.init(engine)
    dispatch('o')
    expect(engine.history.snapshot).toHaveBeenCalled()
    expect(engine.element.classList.contains('rmx-vim-insert')).toBe(true)
  })

  it('vim mode: "G" goes to end', () => {
    plugin = KeyboardPlugin({ mode: 'vim' })
    plugin.init(engine)
    dispatch('G')
    // Should not throw
  })

  it('vim mode: navigation keys h/j/k/l/w/b/0/$', () => {
    plugin = KeyboardPlugin({ mode: 'vim' })
    plugin.init(engine)
    for (const key of ['h', 'j', 'k', 'l', 'w', 'b', '0', '$']) {
      dispatch(key)
    }
    // Should not throw
  })

  it('vim mode: "dd" deletes line', () => {
    plugin = KeyboardPlugin({ mode: 'vim' })
    plugin.init(engine)
    dispatch('d')
    dispatch('d')
    expect(engine.history.snapshot).toHaveBeenCalled()
  })

  it('vim mode: single "d" sets pending, other key clears it', () => {
    plugin = KeyboardPlugin({ mode: 'vim' })
    plugin.init(engine)
    dispatch('d')
    dispatch('z') // unknown, clears pending
    // Should not crash
  })

  it('vim mode: "x" deletes character', () => {
    plugin = KeyboardPlugin({ mode: 'vim' })
    plugin.init(engine)
    dispatch('x')
    expect(engine.history.snapshot).toHaveBeenCalled()
  })

  it('emacs mode: ctrl+a moves to line start', () => {
    plugin = KeyboardPlugin({ mode: 'emacs' })
    plugin.init(engine)
    dispatch('a', { ctrlKey: true })
    // Should not throw
  })

  it('emacs mode: ctrl+e moves to line end', () => {
    plugin = KeyboardPlugin({ mode: 'emacs' })
    plugin.init(engine)
    dispatch('e', { ctrlKey: true })
  })

  it('emacs mode: ctrl+k kills to line end', () => {
    plugin = KeyboardPlugin({ mode: 'emacs' })
    plugin.init(engine)
    dispatch('k', { ctrlKey: true })
    expect(engine.history.snapshot).toHaveBeenCalled()
  })

  it('emacs mode: ctrl+y yanks', () => {
    plugin = KeyboardPlugin({ mode: 'emacs' })
    plugin.init(engine)
    // First kill to have something in kill ring
    dispatch('k', { ctrlKey: true })
    dispatch('y', { ctrlKey: true })
    // Should not throw
  })

  it('emacs mode: ctrl+w kills word', () => {
    plugin = KeyboardPlugin({ mode: 'emacs' })
    plugin.init(engine)
    dispatch('w', { ctrlKey: true })
    expect(engine.history.snapshot).toHaveBeenCalled()
  })

  it('emacs mode: ctrl+f/b/n/p navigation', () => {
    plugin = KeyboardPlugin({ mode: 'emacs' })
    plugin.init(engine)
    dispatch('f', { ctrlKey: true })
    dispatch('b', { ctrlKey: true })
    dispatch('n', { ctrlKey: true })
    dispatch('p', { ctrlKey: true })
    // Should not throw
  })

  it('emacs mode: ctrl+d/h delete forward/backward', () => {
    plugin = KeyboardPlugin({ mode: 'emacs' })
    plugin.init(engine)
    dispatch('d', { ctrlKey: true })
    dispatch('h', { ctrlKey: true })
  })

  it('emacs mode: ctrl+space sets mark', () => {
    plugin = KeyboardPlugin({ mode: 'emacs' })
    plugin.init(engine)
    dispatch(' ', { ctrlKey: true })
    // Just sets mark, nothing visible to test
  })

  it('emacs mode: non-ctrl key does not trigger emacs', () => {
    plugin = KeyboardPlugin({ mode: 'emacs' })
    plugin.init(engine)
    dispatch('a')
    // Should not trigger emacs handler
  })

  it('auto-pair: opening bracket inserts pair', () => {
    plugin = KeyboardPlugin({ autoPair: true })
    plugin.init(engine)
    dispatch('(')
    // Auto pair is handled - check no error
  })

  it('jump-to-heading: Ctrl+Shift+G emits event', () => {
    plugin = KeyboardPlugin({ jumpToHeading: true })
    plugin.init(engine)
    dispatch('g', { ctrlKey: true, shiftKey: true })
    expect(engine.eventBus.emit).toHaveBeenCalledWith('keyboard:jumpToHeading')
  })

  it('jumpToHeading=false disables the shortcut', () => {
    plugin = KeyboardPlugin({ jumpToHeading: false })
    plugin.init(engine)
    dispatch('g', { ctrlKey: true, shiftKey: true })
    expect(engine.eventBus.emit).not.toHaveBeenCalledWith('keyboard:jumpToHeading')
  })
})
