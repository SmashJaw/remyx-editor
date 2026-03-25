import { vi } from 'vitest'
import { EditorBus } from '../core/EditorBus.js'

describe('EditorBus', () => {
  afterEach(() => {
    EditorBus.reset()
  })

  // ── Registry ──────────────────────────────────────────────────────

  describe('registry', () => {
    it('registers and retrieves an editor by ID', () => {
      const engine = { id: 'a' }
      EditorBus.register('editor-a', engine)
      expect(EditorBus.getEditor('editor-a')).toBe(engine)
      expect(EditorBus.editorCount).toBe(1)
    })

    it('returns undefined for unregistered IDs', () => {
      expect(EditorBus.getEditor('nonexistent')).toBeUndefined()
    })

    it('unregisters an editor', () => {
      EditorBus.register('editor-a', { id: 'a' })
      EditorBus.unregister('editor-a')
      expect(EditorBus.getEditor('editor-a')).toBeUndefined()
      expect(EditorBus.editorCount).toBe(0)
    })

    it('lists all registered editor IDs', () => {
      EditorBus.register('a', {})
      EditorBus.register('b', {})
      EditorBus.register('c', {})
      expect(EditorBus.getEditorIds()).toEqual(['a', 'b', 'c'])
    })

    it('emits editor:registered on register', () => {
      const handler = vi.fn()
      EditorBus.on('editor:registered', handler)
      const engine = { id: 'x' }
      EditorBus.register('x', engine)
      expect(handler).toHaveBeenCalledWith({ id: 'x', engine })
    })

    it('emits editor:unregistered on unregister', () => {
      const handler = vi.fn()
      EditorBus.on('editor:unregistered', handler)
      EditorBus.register('x', {})
      EditorBus.unregister('x')
      expect(handler).toHaveBeenCalledWith({ id: 'x' })
    })
  })

  // ── Pub/Sub ───────────────────────────────────────────────────────

  describe('pub/sub', () => {
    it('subscribes and emits events', () => {
      const handler = vi.fn()
      EditorBus.on('test:event', handler)
      EditorBus.emit('test:event', { value: 42 })
      expect(handler).toHaveBeenCalledWith({ value: 42 })
    })

    it('unsubscribes with off()', () => {
      const handler = vi.fn()
      EditorBus.on('test:event', handler)
      EditorBus.off('test:event', handler)
      EditorBus.emit('test:event', {})
      expect(handler).not.toHaveBeenCalled()
    })

    it('unsubscribes with returned function', () => {
      const handler = vi.fn()
      const unsub = EditorBus.on('test:event', handler)
      unsub()
      EditorBus.emit('test:event', {})
      expect(handler).not.toHaveBeenCalled()
    })

    it('once() fires only once', () => {
      const handler = vi.fn()
      EditorBus.once('test:event', handler)
      EditorBus.emit('test:event', 'first')
      EditorBus.emit('test:event', 'second')
      expect(handler).toHaveBeenCalledTimes(1)
      expect(handler).toHaveBeenCalledWith('first')
    })
  })

  // ── Broadcast ─────────────────────────────────────────────────────

  describe('broadcast', () => {
    it('broadcasts to all registered editors', () => {
      const busA = { emit: vi.fn() }
      const busB = { emit: vi.fn() }
      EditorBus.register('a', { eventBus: busA })
      EditorBus.register('b', { eventBus: busB })

      EditorBus.broadcast('theme:change', { theme: 'dark' })

      expect(busA.emit).toHaveBeenCalledWith('theme:change', { theme: 'dark' })
      expect(busB.emit).toHaveBeenCalledWith('theme:change', { theme: 'dark' })
    })

    it('excludes specified editor from broadcast', () => {
      const busA = { emit: vi.fn() }
      const busB = { emit: vi.fn() }
      EditorBus.register('a', { eventBus: busA })
      EditorBus.register('b', { eventBus: busB })

      EditorBus.broadcast('sync:content', { html: '<p>test</p>' }, { exclude: 'a' })

      expect(busA.emit).not.toHaveBeenCalled()
      expect(busB.emit).toHaveBeenCalledWith('sync:content', { html: '<p>test</p>' })
    })
  })

  // ── Reset ─────────────────────────────────────────────────────────

  describe('reset', () => {
    it('clears all listeners and registry', () => {
      const handler = vi.fn()
      EditorBus.on('test', handler)
      EditorBus.register('a', {})
      EditorBus.reset()

      EditorBus.emit('test', {})
      expect(handler).not.toHaveBeenCalled()
      expect(EditorBus.editorCount).toBe(0)
      expect(EditorBus.getEditorIds()).toEqual([])
    })
  })
})
