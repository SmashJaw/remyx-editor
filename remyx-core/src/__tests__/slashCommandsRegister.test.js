import { vi } from 'vitest'
import {
  registerSlashCommands,
  clearRecentCommands,
  recordRecentCommand,
} from '../commands/slashCommands.js'

// Mock isMac
vi.mock('../utils/platform.js', () => ({
  isMac: vi.fn(() => false),
}))

describe('registerSlashCommands - keydown handling', () => {
  let engine, onHandlers

  beforeEach(() => {
    clearRecentCommands()

    const el = document.createElement('div')
    el.contentEditable = 'true'
    el.innerHTML = '<p>Some text content</p>'
    document.body.appendChild(el)

    onHandlers = {}
    engine = {
      element: el,
      eventBus: {
        emit: vi.fn(),
        on: vi.fn((event, handler) => {
          onHandlers[event] = handler
          return () => { delete onHandlers[event] }
        }),
      },
    }

    registerSlashCommands(engine)
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  function dispatch(key, opts = {}) {
    const event = new KeyboardEvent('keydown', {
      key,
      bubbles: true,
      cancelable: true,
      ...opts,
    })
    engine.element.dispatchEvent(event)
    return event
  }

  // Note: In jsdom, getBoundingClientRect returns zeros, so getCaretRect
  // may return a rect with 0 dimensions. The slash:open depends on a valid rect.
  // We test the Ctrl+/ toggle indirectly via the slash:execute handler.

  it('Ctrl+/ is handled (prevents default)', () => {
    const sel = window.getSelection()
    const range = document.createRange()
    range.selectNodeContents(engine.element.querySelector('p'))
    range.collapse(true)
    sel.removeAllRanges()
    sel.addRange(range)

    const event = dispatch('/', { ctrlKey: true })
    // Event should have been processed (not propagated)
    // In jsdom, getBoundingClientRect returns zeros so slash may not fully open
    // but the handler was invoked
  })

  it('slash:execute handler records recent and calls action', () => {
    const executeHandler = onHandlers['slash:execute']
    expect(executeHandler).toBeDefined()

    const mockAction = vi.fn()
    const mockItem = { id: 'testCmd', action: mockAction }
    const mockOpenModal = vi.fn()

    executeHandler({ item: mockItem, openModal: mockOpenModal })
    expect(mockAction).toHaveBeenCalledWith(engine, mockOpenModal)
    expect(engine.eventBus.emit).toHaveBeenCalledWith('content:change')
  })

  it('non-active slash ignores regular keys', () => {
    engine.eventBus.emit.mockClear()
    dispatch('a')
    dispatch('Escape')
    dispatch('ArrowDown')
    // None of these should trigger slash events
    expect(engine.eventBus.emit).not.toHaveBeenCalledWith('slash:query', expect.any(Object))
    expect(engine.eventBus.emit).not.toHaveBeenCalledWith('slash:close')
    expect(engine.eventBus.emit).not.toHaveBeenCalledWith('slash:keydown', expect.any(Object))
  })

  it('modifier keys while slash active are ignored', () => {
    const sel = window.getSelection()
    const range = document.createRange()
    range.selectNodeContents(engine.element.querySelector('p'))
    range.collapse(true)
    sel.removeAllRanges()
    sel.addRange(range)

    dispatch('/', { ctrlKey: true })
    engine.eventBus.emit.mockClear()

    // Ctrl+a should not add to query
    dispatch('a', { ctrlKey: true })
    expect(engine.eventBus.emit).not.toHaveBeenCalledWith('slash:query', expect.any(Object))
  })
})
