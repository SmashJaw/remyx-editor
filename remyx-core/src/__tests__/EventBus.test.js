import { vi } from 'vitest'

import { EventBus } from '../core/EventBus.js'

describe('EventBus', () => {
  let bus

  beforeEach(() => {
    bus = new EventBus()
  })

  describe('on', () => {
    it('should subscribe a handler to an event', () => {
      const handler = vi.fn()
      bus.on('test', handler)
      bus.emit('test', 'data')
      expect(handler).toHaveBeenCalledWith('data')
    })

    it('should allow multiple handlers for the same event', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()
      bus.on('test', handler1)
      bus.on('test', handler2)
      bus.emit('test', 'data')
      expect(handler1).toHaveBeenCalledWith('data')
      expect(handler2).toHaveBeenCalledWith('data')
    })

    it('should return an unsubscribe function', () => {
      const handler = vi.fn()
      const unsub = bus.on('test', handler)
      unsub()
      bus.emit('test', 'data')
      expect(handler).not.toHaveBeenCalled()
    })

    it('should not call handler for different events', () => {
      const handler = vi.fn()
      bus.on('test', handler)
      bus.emit('other', 'data')
      expect(handler).not.toHaveBeenCalled()
    })
  })

  describe('off', () => {
    it('should remove a specific handler', () => {
      const handler = vi.fn()
      bus.on('test', handler)
      bus.off('test', handler)
      bus.emit('test', 'data')
      expect(handler).not.toHaveBeenCalled()
    })

    it('should not throw when removing a handler from a non-existent event', () => {
      const handler = vi.fn()
      expect(() => bus.off('nonexistent', handler)).not.toThrow()
    })

    it('should only remove the specified handler', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()
      bus.on('test', handler1)
      bus.on('test', handler2)
      bus.off('test', handler1)
      bus.emit('test', 'data')
      expect(handler1).not.toHaveBeenCalled()
      expect(handler2).toHaveBeenCalledWith('data')
    })

    it('should clean up the event key when all handlers are removed', () => {
      const handler = vi.fn()
      bus.on('test', handler)
      bus.off('test', handler)
      // Internal check: the map entry should be deleted
      expect(bus._listeners.has('test')).toBe(false)
    })
  })

  describe('once', () => {
    it('should call handler only once', () => {
      const handler = vi.fn()
      bus.once('test', handler)
      bus.emit('test', 'first')
      bus.emit('test', 'second')
      expect(handler).toHaveBeenCalledTimes(1)
      expect(handler).toHaveBeenCalledWith('first')
    })

    it('should return an unsubscribe function', () => {
      const handler = vi.fn()
      const unsub = bus.once('test', handler)
      unsub()
      bus.emit('test', 'data')
      expect(handler).not.toHaveBeenCalled()
    })
  })

  describe('emit', () => {
    it('should pass data to all handlers', () => {
      const handler = vi.fn()
      bus.on('test', handler)
      const payload = { key: 'value' }
      bus.emit('test', payload)
      expect(handler).toHaveBeenCalledWith(payload)
    })

    it('should not throw when emitting an event with no listeners', () => {
      expect(() => bus.emit('nonexistent', 'data')).not.toThrow()
    })

    it('should catch and log errors thrown by handlers', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const badHandler = () => { throw new Error('oops') }
      const goodHandler = vi.fn()
      bus.on('test', badHandler)
      bus.on('test', goodHandler)
      bus.emit('test', 'data')
      expect(consoleSpy).toHaveBeenCalled()
      expect(goodHandler).toHaveBeenCalledWith('data')
      consoleSpy.mockRestore()
    })
  })

  describe('removeAllListeners', () => {
    it('should remove all listeners for a specific event', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()
      bus.on('test', handler1)
      bus.on('other', handler2)
      bus.removeAllListeners('test')
      bus.emit('test', 'data')
      bus.emit('other', 'data')
      expect(handler1).not.toHaveBeenCalled()
      expect(handler2).toHaveBeenCalledWith('data')
    })

    it('should remove all listeners when called without an event name', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()
      bus.on('test', handler1)
      bus.on('other', handler2)
      bus.removeAllListeners()
      bus.emit('test', 'data')
      bus.emit('other', 'data')
      expect(handler1).not.toHaveBeenCalled()
      expect(handler2).not.toHaveBeenCalled()
    })
  })
})
