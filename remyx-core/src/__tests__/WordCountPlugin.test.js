import { vi } from 'vitest'
import { WordCountPlugin } from '../plugins/builtins/WordCountPlugin.js'

describe('WordCountPlugin', () => {
  let plugin

  beforeEach(() => {
    plugin = WordCountPlugin()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('plugin structure', () => {
    it('should have name "wordCount"', () => {
      expect(plugin.name).toBe('wordCount')
    })

    it('should require full access', () => {
      expect(plugin.requiresFullAccess).toBe(true)
    })

    it('should have init and destroy functions', () => {
      expect(typeof plugin.init).toBe('function')
      expect(typeof plugin.destroy).toBe('function')
    })
  })

  describe('word counting', () => {
    it('should count words in simple text', () => {
      const engine = createMockEngine('Hello world foo bar')
      plugin.init(engine)

      expect(engine._wordCount.wordCount).toBe(4)
    })

    it('should count single word', () => {
      const engine = createMockEngine('Hello')
      plugin.init(engine)

      expect(engine._wordCount.wordCount).toBe(1)
    })

    it('should return 0 for empty content', () => {
      const engine = createMockEngine('')
      plugin.init(engine)

      expect(engine._wordCount.wordCount).toBe(0)
    })

    it('should return 0 for whitespace-only content', () => {
      const engine = createMockEngine('   \n\t  ')
      plugin.init(engine)

      expect(engine._wordCount.wordCount).toBe(0)
    })

    it('should handle multiple spaces between words', () => {
      const engine = createMockEngine('hello   world    test')
      plugin.init(engine)

      expect(engine._wordCount.wordCount).toBe(3)
    })

    it('should handle newlines and tabs as word separators', () => {
      const engine = createMockEngine('hello\nworld\ttab')
      plugin.init(engine)

      expect(engine._wordCount.wordCount).toBe(3)
    })
  })

  describe('character counting', () => {
    it('should count characters including spaces', () => {
      const engine = createMockEngine('Hi there')
      plugin.init(engine)

      expect(engine._wordCount.charCount).toBe(8)
    })

    it('should return 0 for empty content', () => {
      const engine = createMockEngine('')
      plugin.init(engine)

      expect(engine._wordCount.charCount).toBe(0)
    })

    it('should count whitespace characters', () => {
      const engine = createMockEngine('  ')
      plugin.init(engine)

      expect(engine._wordCount.charCount).toBe(2)
    })
  })

  describe('event emission', () => {
    it('should emit wordcount:update on init', () => {
      const engine = createMockEngine('Hello world')
      const emitSpy = vi.spyOn(engine.eventBus, 'emit')
      plugin.init(engine)

      expect(emitSpy).toHaveBeenCalledWith('wordcount:update', {
        wordCount: 2,
        charCount: 11,
      })
    })

    it('should emit wordcount:update on content:change (debounced)', () => {
      vi.useFakeTimers()
      const engine = createMockEngine('Hello')
      plugin.init(engine)

      engine._text = 'Hello world again'
      const emitSpy = vi.spyOn(engine.eventBus, 'emit')
      engine.eventBus.trigger('content:change')

      // Task 248: content:change handler is debounced with 100ms timeout
      vi.advanceTimersByTime(100)

      expect(emitSpy).toHaveBeenCalledWith('wordcount:update', {
        wordCount: 3,
        charCount: 17,
      })
      vi.useRealTimers()
    })

    it('should store word count data on engine._wordCount', () => {
      const engine = createMockEngine('one two three')
      plugin.init(engine)

      expect(engine._wordCount).toEqual({
        wordCount: 3,
        charCount: 13,
      })
    })
  })

  describe('content:change subscription', () => {
    it('should subscribe to content:change event', () => {
      const engine = createMockEngine('test')
      plugin.init(engine)

      expect(engine.eventBus.listeners['content:change']).toBeDefined()
      expect(engine.eventBus.listeners['content:change'].length).toBeGreaterThan(0)
    })

    it('should update counts when content changes (debounced)', () => {
      vi.useFakeTimers()
      const engine = createMockEngine('one')
      plugin.init(engine)

      expect(engine._wordCount.wordCount).toBe(1)

      engine._text = 'one two three four'
      engine.eventBus.trigger('content:change')

      // Task 248: content:change handler is debounced with 100ms timeout
      vi.advanceTimersByTime(100)

      expect(engine._wordCount.wordCount).toBe(4)
      expect(engine._wordCount.charCount).toBe(18)
      vi.useRealTimers()
    })
  })

  describe('destroy', () => {
    it('should disconnect MutationObserver on destroy', () => {
      const engine = createMockEngine('test')
      plugin.init(engine)

      // Should not throw
      expect(() => plugin.destroy()).not.toThrow()
    })

    it('should clear debounce timer on destroy', () => {
      const engine = createMockEngine('test')
      plugin.init(engine)

      const clearSpy = vi.spyOn(global, 'clearTimeout')
      plugin.destroy()

      expect(clearSpy).toHaveBeenCalled()
      clearSpy.mockRestore()
    })

    it('should clean up event subscriptions on destroy (MutationObserver removed in task 248)', () => {
      const freshPlugin = WordCountPlugin()
      const engine = createMockEngine('test')
      freshPlugin.init(engine)

      // Calling destroy should not throw
      expect(() => freshPlugin.destroy()).not.toThrow()

      // Calling destroy again should not throw
      expect(() => freshPlugin.destroy()).not.toThrow()
    })

    it('should clear a pending debounce timer on destroy', () => {
      vi.useFakeTimers()
      const freshPlugin = WordCountPlugin()
      const engine = createMockEngine('test')
      freshPlugin.init(engine)

      // Trigger content:change to schedule a debounced update
      engine.eventBus.trigger('content:change')

      const clearSpy = vi.spyOn(global, 'clearTimeout')
      freshPlugin.destroy()

      expect(clearSpy).toHaveBeenCalled()

      // Advance timers — the debounced update should NOT fire since we destroyed
      vi.advanceTimersByTime(100)

      clearSpy.mockRestore()
      vi.useRealTimers()
    })
  })
})

/**
 * Helper to create a mock engine for WordCountPlugin.
 */
function createMockEngine(text) {
  const listeners = {}
  const element = document.createElement('div')
  element.textContent = text

  return {
    _text: text,
    _wordCount: null,
    getText() { return this._text },
    element,
    eventBus: {
      listeners,
      on(event, handler) {
        if (!listeners[event]) listeners[event] = []
        listeners[event].push(handler)
      },
      emit: vi.fn(),
      trigger(event) {
        if (listeners[event]) {
          listeners[event].forEach(fn => fn())
        }
      },
    },
  }
}
