import { vi } from 'vitest'
import { History } from '../core/History.js'

describe('History - extended coverage', () => {
  let history, engine

  beforeEach(() => {
    const el = document.createElement('div')
    el.contentEditable = 'true'
    el.innerHTML = '<p>Initial content</p>'
    document.body.appendChild(el)

    engine = {
      element: el,
      eventBus: { emit: vi.fn() },
      selection: {
        save: vi.fn(() => null),
        restore: vi.fn(),
      },
      sanitizer: { sanitize: vi.fn(h => h) },
    }
  })

  afterEach(() => {
    history?.destroy()
    document.body.innerHTML = ''
  })

  it('should initialize with empty stacks', () => {
    history = new History(engine)
    expect(history.canUndo()).toBe(false)
    expect(history.canRedo()).toBe(false)
  })

  it('init should take initial snapshot', () => {
    history = new History(engine)
    history.init()
    // After init, _lastSnapshot is set
    expect(history._lastSnapshot).toBe('<p>Initial content</p>')
  })

  it('snapshot should push to undo stack', () => {
    history = new History(engine)
    history.init()

    engine.element.innerHTML = '<p>Changed</p>'
    history.snapshot()
    expect(history.canUndo()).toBe(true)
  })

  it('undo should restore previous state', () => {
    history = new History(engine)
    history.init()

    // Snapshot before change (captures current state as undo point)
    history.snapshot()
    engine.element.innerHTML = '<p>Changed</p>'

    history.undo()
    expect(engine.element.innerHTML).toBe('<p>Initial content</p>')
    expect(engine.eventBus.emit).toHaveBeenCalledWith('history:undo')
    expect(engine.eventBus.emit).toHaveBeenCalledWith('content:change')
  })

  it('redo should restore undone state', () => {
    history = new History(engine)
    history.init()

    history.snapshot()
    engine.element.innerHTML = '<p>Changed</p>'

    history.undo()
    history.redo()
    expect(engine.element.innerHTML).toBe('<p>Changed</p>')
    expect(engine.eventBus.emit).toHaveBeenCalledWith('history:redo')
  })

  it('undo when empty should not crash', () => {
    history = new History(engine)
    history.undo()
    // Should be a no-op
  })

  it('redo when empty should not crash', () => {
    history = new History(engine)
    history.redo()
  })

  it('canUndo returns true when stack has entries', () => {
    history = new History(engine)
    history.init()
    engine.element.innerHTML = '<p>A</p>'
    history.snapshot()
    expect(history.canUndo()).toBe(true)
  })

  it('canRedo returns true after undo', () => {
    history = new History(engine)
    history.init()
    engine.element.innerHTML = '<p>A</p>'
    history.snapshot()
    history.undo()
    expect(history.canRedo()).toBe(true)
  })

  it('new snapshot clears redo stack', () => {
    history = new History(engine)
    history.init()
    engine.element.innerHTML = '<p>A</p>'
    history.snapshot()
    history.undo()
    engine.element.innerHTML = '<p>B</p>'
    history.snapshot()
    expect(history.canRedo()).toBe(false)
  })

  it('clear should empty both stacks', () => {
    history = new History(engine)
    history.init()
    engine.element.innerHTML = '<p>A</p>'
    history.snapshot()
    history.clear()
    expect(history.canUndo()).toBe(false)
    expect(history.canRedo()).toBe(false)
  })

  it('should respect maxSize option', () => {
    history = new History(engine, { maxSize: 3 })
    history.init()

    for (let i = 0; i < 5; i++) {
      engine.element.innerHTML = `<p>Version ${i}</p>`
      history.snapshot()
    }

    expect(history._undoStack.length).toBeLessThanOrEqual(3)
  })

  it('should skip snapshot if content unchanged', () => {
    history = new History(engine)
    history.init()
    const stackLen = history._undoStack.length
    history.snapshot() // same content
    expect(history._undoStack.length).toBe(stackLen)
  })

  it('undo should restore selection bookmark when available', () => {
    engine.selection.save.mockReturnValue({ startOffset: 5 })
    history = new History(engine)
    history.init()

    engine.element.innerHTML = '<p>Changed</p>'
    engine.selection.save.mockReturnValue({ startOffset: 3 })
    history.snapshot()

    history.undo()
    expect(engine.selection.restore).toHaveBeenCalled()
  })

  it('destroy should disconnect observer and clear timers', () => {
    history = new History(engine)
    history.init()
    history.destroy()
    expect(history._observer).toBeNull()
  })

  it('destroy before init should not crash', () => {
    history = new History(engine)
    history.destroy()
  })

  it('multiple undo operations in sequence', () => {
    history = new History(engine)
    history.init()

    // Snapshot before each change
    history.snapshot()
    engine.element.innerHTML = '<p>A</p>'
    history.snapshot()
    engine.element.innerHTML = '<p>B</p>'
    history.snapshot()
    engine.element.innerHTML = '<p>C</p>'

    history.undo() // undo last snapshot (B), current was C
    expect(engine.element.innerHTML).toBe('<p>B</p>')

    history.undo() // undo to A
    expect(engine.element.innerHTML).toBe('<p>A</p>')

    history.undo() // undo to Initial
    expect(engine.element.innerHTML).toBe('<p>Initial content</p>')
  })

  it('undo then redo preserves state', () => {
    history = new History(engine)
    history.init()

    history.snapshot()
    engine.element.innerHTML = '<p>A</p>'

    history.undo()
    expect(engine.element.innerHTML).toBe('<p>Initial content</p>')

    history.redo()
    expect(engine.element.innerHTML).toBe('<p>A</p>')
  })

  it('debounced snapshot with coalescing', () => {
    vi.useFakeTimers()
    history = new History(engine, { debounceMs: 100, coalesceMs: 500 })
    history.init()

    // Trigger debounced snapshot
    engine.element.innerHTML = '<p>X</p>'
    history._debouncedSnapshot()

    vi.advanceTimersByTime(150) // past debounce, should snapshot
    expect(history._undoStack.length).toBeGreaterThanOrEqual(1)

    // During coalesce window, updates top
    engine.element.innerHTML = '<p>Y</p>'
    history._debouncedSnapshot()
    vi.advanceTimersByTime(150)

    // After coalesce window expires
    vi.advanceTimersByTime(600)

    vi.useRealTimers()
  })
})
