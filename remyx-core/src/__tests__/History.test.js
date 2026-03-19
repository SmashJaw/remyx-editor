import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { History } from '../core/History.js'

describe('History', () => {
  let history
  let mockEngine

  beforeEach(() => {
    const element = document.createElement('div')
    element.setAttribute('contenteditable', 'true')
    element.innerHTML = '<p>initial</p>'
    document.body.appendChild(element)

    mockEngine = {
      element,
      eventBus: { emit: vi.fn() },
      selection: {
        save: vi.fn().mockReturnValue(null),
        restore: vi.fn(),
      },
      sanitizer: {
        sanitize: vi.fn((html) => html),
      },
    }
    history = new History(mockEngine)
  })

  describe('constructor', () => {
    it('should set default maxSize to 100', () => {
      expect(history.maxSize).toBe(100)
    })

    it('should set default debounceMs to 300', () => {
      expect(history.debounceMs).toBe(300)
    })

    it('should accept custom options', () => {
      const h = new History(mockEngine, { maxSize: 50, debounceMs: 500 })
      expect(h.maxSize).toBe(50)
      expect(h.debounceMs).toBe(500)
    })

    it('should initialize with empty stacks', () => {
      expect(history.canUndo()).toBe(false)
      expect(history.canRedo()).toBe(false)
    })
  })

  describe('snapshot', () => {
    it('should push current state to undo stack', () => {
      history.snapshot()
      expect(history.canUndo()).toBe(true)
    })

    it('should not create duplicate snapshots for the same content', () => {
      history.snapshot()
      history.snapshot()
      // Both calls have same innerHTML, so second should be skipped
      // First snapshot pushes, second is identical so doesn't push
      expect(history._undoStack.length).toBe(1)
    })

    it('should create new snapshot when content changes', () => {
      history.snapshot()
      mockEngine.element.innerHTML = '<p>changed</p>'
      history.snapshot()
      expect(history._undoStack.length).toBe(2)
    })

    it('should clear redo stack on new snapshot', () => {
      history.snapshot()
      mockEngine.element.innerHTML = '<p>state 2</p>'
      history.snapshot()
      // Simulate undo to populate redo
      history.undo()
      expect(history.canRedo()).toBe(true)
      // New snapshot should clear redo
      mockEngine.element.innerHTML = '<p>state 3</p>'
      history.snapshot()
      expect(history.canRedo()).toBe(false)
    })

    it('should enforce maxSize limit', () => {
      const h = new History(mockEngine, { maxSize: 3 })
      for (let i = 0; i < 5; i++) {
        mockEngine.element.innerHTML = `<p>state ${i}</p>`
        h.snapshot()
      }
      expect(h._undoStack.length).toBe(3)
    })
  })

  describe('undo', () => {
    it('should do nothing if nothing to undo', () => {
      history.undo()
      expect(mockEngine.eventBus.emit).not.toHaveBeenCalledWith('history:undo')
    })

    it('should restore previous state', () => {
      history.snapshot()
      mockEngine.element.innerHTML = '<p>changed</p>'
      history.snapshot()
      mockEngine.element.innerHTML = '<p>latest</p>'
      history.undo()
      expect(mockEngine.element.innerHTML).toBe('<p>changed</p>')
    })

    it('should emit history:undo and content:change events', () => {
      history.snapshot()
      mockEngine.element.innerHTML = '<p>changed</p>'
      history.snapshot()
      history.undo()
      expect(mockEngine.eventBus.emit).toHaveBeenCalledWith('history:undo')
      expect(mockEngine.eventBus.emit).toHaveBeenCalledWith('content:change')
    })

    it('should move state to redo stack', () => {
      history.snapshot()
      mockEngine.element.innerHTML = '<p>changed</p>'
      history.snapshot()
      history.undo()
      expect(history.canRedo()).toBe(true)
    })

    it('should sanitize HTML before restoring', () => {
      history.snapshot()
      mockEngine.element.innerHTML = '<p>changed</p>'
      history.snapshot()
      history.undo()
      expect(mockEngine.sanitizer.sanitize).toHaveBeenCalled()
    })

    it('should restore selection bookmark if available', () => {
      const bookmark = { startOffset: 0, endOffset: 5, collapsed: false }
      mockEngine.selection.save.mockReturnValue(bookmark)
      history.snapshot()
      mockEngine.element.innerHTML = '<p>changed</p>'
      history.snapshot()
      history.undo()
      expect(mockEngine.selection.restore).toHaveBeenCalled()
    })
  })

  describe('redo', () => {
    it('should do nothing if nothing to redo', () => {
      history.redo()
      expect(mockEngine.eventBus.emit).not.toHaveBeenCalledWith('history:redo')
    })

    it('should restore next state after undo', () => {
      history.snapshot()
      mockEngine.element.innerHTML = '<p>changed</p>'
      history.snapshot()
      history.undo()
      history.redo()
      expect(mockEngine.element.innerHTML).toBe('<p>changed</p>')
    })

    it('should emit history:redo and content:change events', () => {
      history.snapshot()
      mockEngine.element.innerHTML = '<p>changed</p>'
      history.snapshot()
      history.undo()
      history.redo()
      expect(mockEngine.eventBus.emit).toHaveBeenCalledWith('history:redo')
      expect(mockEngine.eventBus.emit).toHaveBeenCalledWith('content:change')
    })
  })

  describe('canUndo / canRedo', () => {
    it('should return false when stacks are empty', () => {
      expect(history.canUndo()).toBe(false)
      expect(history.canRedo()).toBe(false)
    })

    it('should return true when undo is available', () => {
      history.snapshot()
      expect(history.canUndo()).toBe(true)
    })

    it('should return true for redo after undo', () => {
      history.snapshot()
      mockEngine.element.innerHTML = '<p>changed</p>'
      history.snapshot()
      history.undo()
      expect(history.canRedo()).toBe(true)
    })
  })

  describe('clear', () => {
    it('should empty both stacks', () => {
      history.snapshot()
      mockEngine.element.innerHTML = '<p>changed</p>'
      history.snapshot()
      history.undo()
      history.clear()
      expect(history.canUndo()).toBe(false)
      expect(history.canRedo()).toBe(false)
    })

    it('should reset lastSnapshot', () => {
      history.snapshot()
      history.clear()
      expect(history._lastSnapshot).toBeNull()
    })
  })

  describe('init / destroy', () => {
    it('should take initial snapshot on init', () => {
      history.init()
      expect(history.canUndo()).toBe(true)
      history.destroy()
    })

    it('should set up and tear down MutationObserver', () => {
      history.init()
      expect(history._observer).not.toBeNull()
      history.destroy()
      expect(history._observer).toBeNull()
    })

    it('should clear debounce timer on destroy', () => {
      history.init()
      history._debounceTimer = setTimeout(() => {}, 10000)
      history.destroy()
      expect(history._debounceTimer).toBeNull()
    })
  })

  describe('snapshot clears pending debounce timer', () => {
    it('should cancel a pending debounce timer when snapshot is called', () => {
      const clearSpy = vi.spyOn(global, 'clearTimeout')
      // Set up a pending debounce timer
      history._debounceTimer = setTimeout(() => {}, 10000)
      const pendingTimer = history._debounceTimer

      history.snapshot()

      expect(clearSpy).toHaveBeenCalledWith(pendingTimer)
      expect(history._debounceTimer).toBeNull()
      clearSpy.mockRestore()
    })

    it('should not call clearTimeout when no debounce timer is pending', () => {
      const clearSpy = vi.spyOn(global, 'clearTimeout')
      history._debounceTimer = null

      history.snapshot()

      // clearTimeout should not have been called with a truthy value
      expect(clearSpy).not.toHaveBeenCalled()
      clearSpy.mockRestore()
    })
  })

  describe('_debouncedSnapshot', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should reset timer on repeated calls', () => {
      const snapshotSpy = vi.spyOn(history, '_takeSnapshot' in history ? '_takeSnapshot' : 'snapshot')
      // Manually test _debouncedSnapshot behavior
      history._debouncedSnapshot()
      const firstTimer = history._debounceTimer

      // Call again before timer fires - should reset
      history._debouncedSnapshot()
      const secondTimer = history._debounceTimer

      // Timer IDs should differ (timer was reset)
      expect(secondTimer).not.toBe(firstTimer)
    })

    it('should call _takeSnapshot after debounce delay', () => {
      // Take an initial snapshot so content differs for next one
      history.snapshot()
      mockEngine.element.innerHTML = '<p>debounced change</p>'

      history._debouncedSnapshot()

      // Before timer fires, no new snapshot
      const stackSizeBefore = history._undoStack.length

      vi.advanceTimersByTime(history.debounceMs)

      // After timer fires, snapshot should have been taken
      expect(history._undoStack.length).toBe(stackSizeBefore + 1)
    })
  })

  describe('_disconnectObserver when observer is null', () => {
    it('should be a no-op when _observer is null', () => {
      history._observer = null
      expect(() => history._disconnectObserver()).not.toThrow()
    })
  })

  describe('_reconnectObserver when observer is null', () => {
    it('should be a no-op when _observer is null', () => {
      history._observer = null
      expect(() => history._reconnectObserver()).not.toThrow()
    })
  })

  describe('redo restores bookmark', () => {
    it('should restore selection bookmark from redo state if present', () => {
      const bookmark = { startOffset: 2, endOffset: 8, collapsed: false }
      mockEngine.selection.save.mockReturnValue(bookmark)

      history.snapshot()
      mockEngine.element.innerHTML = '<p>second state</p>'
      history.snapshot()

      // Undo to populate redo stack (redo state will have bookmark)
      history.undo()

      // Now redo - should restore the bookmark from the redo state
      mockEngine.selection.restore.mockClear()
      history.redo()

      expect(mockEngine.selection.restore).toHaveBeenCalled()
      expect(mockEngine.eventBus.emit).toHaveBeenCalledWith('history:redo')
    })

    it('should not call restore when redo state has no bookmark', () => {
      mockEngine.selection.save.mockReturnValue(null)

      history.snapshot()
      mockEngine.element.innerHTML = '<p>second state</p>'
      history.snapshot()

      history.undo()

      mockEngine.selection.restore.mockClear()
      history.redo()

      // bookmark is null, so restore should not be called
      expect(mockEngine.selection.restore).not.toHaveBeenCalled()
    })
  })
})
