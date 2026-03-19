import { describe, it, expect, beforeEach } from 'vitest'
import { PlaceholderPlugin } from '../plugins/builtins/PlaceholderPlugin.js'

describe('PlaceholderPlugin', () => {
  let plugin

  describe('plugin structure', () => {
    beforeEach(() => {
      plugin = PlaceholderPlugin()
    })

    it('should have name "placeholder"', () => {
      expect(plugin.name).toBe('placeholder')
    })

    it('should require full access', () => {
      expect(plugin.requiresFullAccess).toBe(true)
    })

    it('should have an init function', () => {
      expect(typeof plugin.init).toBe('function')
    })

    it('should have a destroy function', () => {
      expect(typeof plugin.destroy).toBe('function')
    })
  })

  describe('placeholder text', () => {
    it('should use default placeholder text "Start typing..."', () => {
      plugin = PlaceholderPlugin()
      const engine = createMockEngine(true)
      plugin.init(engine)

      expect(engine.element.getAttribute('data-placeholder')).toBe('Start typing...')
    })

    it('should use custom placeholder text when provided', () => {
      plugin = PlaceholderPlugin('Write something here...')
      const engine = createMockEngine(true)
      plugin.init(engine)

      expect(engine.element.getAttribute('data-placeholder')).toBe('Write something here...')
    })

    it('should accept empty string as placeholder text', () => {
      plugin = PlaceholderPlugin('')
      const engine = createMockEngine(true)
      plugin.init(engine)

      expect(engine.element.getAttribute('data-placeholder')).toBe('')
    })
  })

  describe('empty state detection', () => {
    it('should add rmx-empty class when editor is empty on init', () => {
      plugin = PlaceholderPlugin()
      const engine = createMockEngine(true)
      plugin.init(engine)

      expect(engine.element.classList.contains('rmx-empty')).toBe(true)
    })

    it('should not add rmx-empty class when editor has content on init', () => {
      plugin = PlaceholderPlugin()
      const engine = createMockEngine(false)
      plugin.init(engine)

      expect(engine.element.classList.contains('rmx-empty')).toBe(false)
    })

    it('should set data-placeholder attribute when empty', () => {
      plugin = PlaceholderPlugin('Type here')
      const engine = createMockEngine(true)
      plugin.init(engine)

      expect(engine.element.getAttribute('data-placeholder')).toBe('Type here')
    })

    it('should remove rmx-empty class when content changes to non-empty', () => {
      plugin = PlaceholderPlugin()
      const engine = createMockEngine(true)
      plugin.init(engine)

      expect(engine.element.classList.contains('rmx-empty')).toBe(true)

      // Simulate content change to non-empty
      engine._isEmpty = false
      engine.eventBus.trigger('content:change')

      expect(engine.element.classList.contains('rmx-empty')).toBe(false)
    })

    it('should add rmx-empty class when content changes to empty', () => {
      plugin = PlaceholderPlugin()
      const engine = createMockEngine(false)
      plugin.init(engine)

      expect(engine.element.classList.contains('rmx-empty')).toBe(false)

      // Simulate content becoming empty
      engine._isEmpty = true
      engine.eventBus.trigger('content:change')

      expect(engine.element.classList.contains('rmx-empty')).toBe(true)
    })
  })

  describe('event subscriptions', () => {
    it('should subscribe to content:change event', () => {
      plugin = PlaceholderPlugin()
      const engine = createMockEngine(true)
      plugin.init(engine)

      expect(engine.eventBus.listeners['content:change']).toBeDefined()
      expect(engine.eventBus.listeners['content:change'].length).toBeGreaterThan(0)
    })

    it('should subscribe to focus event', () => {
      plugin = PlaceholderPlugin()
      const engine = createMockEngine(true)
      plugin.init(engine)

      expect(engine.eventBus.listeners['focus']).toBeDefined()
    })

    it('should subscribe to blur event', () => {
      plugin = PlaceholderPlugin()
      const engine = createMockEngine(true)
      plugin.init(engine)

      expect(engine.eventBus.listeners['blur']).toBeDefined()
    })

    it('should update state on focus event', () => {
      plugin = PlaceholderPlugin()
      const engine = createMockEngine(true)
      plugin.init(engine)

      engine._isEmpty = false
      engine.eventBus.trigger('focus')

      expect(engine.element.classList.contains('rmx-empty')).toBe(false)
    })

    it('should update state on blur event', () => {
      plugin = PlaceholderPlugin()
      const engine = createMockEngine(false)
      plugin.init(engine)

      engine._isEmpty = true
      engine.eventBus.trigger('blur')

      expect(engine.element.classList.contains('rmx-empty')).toBe(true)
    })
  })
})

/**
 * Helper to create a mock engine with a simple event bus.
 */
function createMockEngine(isEmpty) {
  const listeners = {}
  return {
    _isEmpty: isEmpty,
    isEmpty() { return this._isEmpty },
    element: document.createElement('div'),
    eventBus: {
      listeners,
      on(event, handler) {
        if (!listeners[event]) listeners[event] = []
        listeners[event].push(handler)
      },
      trigger(event) {
        if (listeners[event]) {
          listeners[event].forEach(fn => fn())
        }
      },
    },
  }
}
