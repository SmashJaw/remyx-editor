import { AutosaveManager } from '../core/AutosaveManager.js'
import { EventBus } from '../core/EventBus.js'

/** Create a mock engine with the minimum interface needed by AutosaveManager */
function createMockEngine(html = '<p>Hello</p>') {
  const eventBus = new EventBus()
  return {
    element: document.createElement('div'),
    eventBus,
    getHTML: jest.fn(() => html),
    setHTML: jest.fn(),
  }
}

/** Create an in-memory provider for testing */
function createMemoryProvider() {
  const store = {}
  return {
    save: jest.fn(async (key, content) => {
      store[key] = JSON.stringify({ content, timestamp: Date.now(), version: 1 })
    }),
    load: jest.fn(async (key) => {
      if (!store[key]) return null
      return JSON.parse(store[key])
    }),
    clear: jest.fn(async (key) => { delete store[key] }),
    _store: store,
  }
}

describe('AutosaveManager', () => {
  let engine, manager

  beforeEach(() => {
    jest.useFakeTimers()
    engine = createMockEngine()
  })

  afterEach(() => {
    if (manager) manager.destroy()
    jest.useRealTimers()
  })

  describe('constructor', () => {
    it('creates with default options', () => {
      manager = new AutosaveManager(engine)
      expect(manager.key).toBe('rmx-default')
      expect(manager.interval).toBe(30000)
      expect(manager.debounceMs).toBe(2000)
      expect(manager.enabled).toBe(true)
    })

    it('accepts custom options', () => {
      manager = new AutosaveManager(engine, {
        key: 'doc-123',
        interval: 60000,
        debounce: 5000,
      })
      expect(manager.key).toBe('doc-123')
      expect(manager.interval).toBe(60000)
      expect(manager.debounceMs).toBe(5000)
    })

    it('can be disabled', () => {
      manager = new AutosaveManager(engine, { enabled: false })
      expect(manager.enabled).toBe(false)
    })
  })

  describe('save()', () => {
    it('saves content via provider and emits events', async () => {
      const provider = createMemoryProvider()
      manager = new AutosaveManager(engine, { provider })

      const savingHandler = jest.fn()
      const savedHandler = jest.fn()
      engine.eventBus.on('autosave:saving', savingHandler)
      engine.eventBus.on('autosave:saved', savedHandler)

      await manager.save()

      expect(provider.save).toHaveBeenCalledWith('rmx-default', '<p>Hello</p>', undefined)
      expect(savingHandler).toHaveBeenCalledTimes(1)
      expect(savedHandler).toHaveBeenCalledTimes(1)
      expect(savedHandler).toHaveBeenCalledWith(expect.objectContaining({ timestamp: expect.any(Number) }))
    })

    it('skips save when content unchanged', async () => {
      const provider = createMemoryProvider()
      manager = new AutosaveManager(engine, { provider })

      await manager.save()
      provider.save.mockClear()

      await manager.save()
      expect(provider.save).not.toHaveBeenCalled()
    })

    it('emits autosave:error on provider failure', async () => {
      const provider = createMemoryProvider()
      provider.save.mockRejectedValueOnce(new Error('Write failed'))
      manager = new AutosaveManager(engine, { provider })

      const errorHandler = jest.fn()
      engine.eventBus.on('autosave:error', errorHandler)

      await manager.save()
      expect(errorHandler).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(Error) }))
    })

    it('prevents concurrent saves', async () => {
      let resolveSave
      const provider = createMemoryProvider()
      provider.save.mockImplementationOnce(() => new Promise(r => { resolveSave = r }))
      manager = new AutosaveManager(engine, { provider })

      const p1 = manager.save()
      const p2 = manager.save() // should queue

      resolveSave()
      await p1

      // Second save should have been queued and re-fired
      expect(provider.save).toHaveBeenCalledTimes(1)
    })
  })

  describe('init() and debounced save', () => {
    it('subscribes to content:change and debounces saves', async () => {
      const provider = createMemoryProvider()
      manager = new AutosaveManager(engine, { provider, debounce: 1000 })
      manager.init()

      // Trigger content change
      engine.eventBus.emit('content:change')

      // Should not save immediately
      expect(provider.save).not.toHaveBeenCalled()

      // Advance past debounce
      jest.advanceTimersByTime(1000)

      // Wait for async save to complete
      await Promise.resolve()
      await Promise.resolve()

      expect(provider.save).toHaveBeenCalledTimes(1)
    })

    it('starts periodic interval saves', async () => {
      const provider = createMemoryProvider()
      manager = new AutosaveManager(engine, { provider, interval: 5000 })
      manager.init()

      jest.advanceTimersByTime(5000)
      await Promise.resolve()
      await Promise.resolve()

      expect(provider.save).toHaveBeenCalledTimes(1)
    })

    it('does not init when disabled', () => {
      const provider = createMemoryProvider()
      manager = new AutosaveManager(engine, { provider, enabled: false })
      manager.init()

      engine.eventBus.emit('content:change')
      jest.advanceTimersByTime(10000)

      expect(provider.save).not.toHaveBeenCalled()
    })
  })

  describe('checkRecovery()', () => {
    it('returns recovery data when stored content differs', async () => {
      const provider = createMemoryProvider()
      manager = new AutosaveManager(engine, { provider })

      // Pre-populate storage with different content
      await provider.save('rmx-default', '<p>Old content</p>')

      const result = await manager.checkRecovery('<p>New content</p>')
      expect(result).not.toBeNull()
      expect(result.recoveredContent).toBe('<p>Old content</p>')
      expect(result.timestamp).toBeGreaterThan(0)
    })

    it('returns null when stored content matches', async () => {
      const provider = createMemoryProvider()
      manager = new AutosaveManager(engine, { provider })

      await provider.save('rmx-default', '<p>Same</p>')

      const result = await manager.checkRecovery('<p>Same</p>')
      expect(result).toBeNull()
    })

    it('returns null when no stored content', async () => {
      const provider = createMemoryProvider()
      manager = new AutosaveManager(engine, { provider })

      const result = await manager.checkRecovery('<p>Hello</p>')
      expect(result).toBeNull()
    })
  })

  describe('clearRecovery()', () => {
    it('clears stored content', async () => {
      const provider = createMemoryProvider()
      manager = new AutosaveManager(engine, { provider })

      await provider.save('rmx-default', '<p>Content</p>')
      await manager.clearRecovery()

      expect(provider.clear).toHaveBeenCalledWith('rmx-default')
    })
  })

  describe('destroy()', () => {
    it('clears timers and removes listeners', async () => {
      const provider = createMemoryProvider()
      manager = new AutosaveManager(engine, { provider, debounce: 1000 })
      manager.init()

      manager.destroy()

      // Wait for the final save in destroy() to complete
      await Promise.resolve()
      await Promise.resolve()

      // Content changes after destroy should not trigger saves
      engine.eventBus.emit('content:change')
      jest.advanceTimersByTime(5000)
      await Promise.resolve()

      // Only the final save in destroy() should have been called
      expect(provider.save).toHaveBeenCalledTimes(1)
    })
  })
})
