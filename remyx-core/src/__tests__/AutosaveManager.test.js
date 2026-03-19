import { vi } from 'vitest'
import { AutosaveManager } from '../core/AutosaveManager.js'
import { EventBus } from '../core/EventBus.js'

/** Create a mock engine with the minimum interface needed by AutosaveManager */
function createMockEngine(html = '<p>Hello</p>') {
  const eventBus = new EventBus()
  return {
    element: document.createElement('div'),
    eventBus,
    getHTML: vi.fn(() => html),
    setHTML: vi.fn(),
  }
}

/** Create an in-memory provider for testing */
function createMemoryProvider() {
  const store = {}
  return {
    save: vi.fn(async (key, content) => {
      store[key] = JSON.stringify({ content, timestamp: Date.now(), version: 1 })
    }),
    load: vi.fn(async (key) => {
      if (!store[key]) return null
      return JSON.parse(store[key])
    }),
    clear: vi.fn(async (key) => { delete store[key] }),
    _store: store,
  }
}

describe('AutosaveManager', () => {
  let engine, manager

  beforeEach(() => {
    vi.useFakeTimers()
    engine = createMockEngine()
  })

  afterEach(() => {
    if (manager) manager.destroy()
    vi.useRealTimers()
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

      const savingHandler = vi.fn()
      const savedHandler = vi.fn()
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

      const errorHandler = vi.fn()
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
      manager.save() // should queue

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
      vi.advanceTimersByTime(1000)

      // Wait for async save to complete
      await Promise.resolve()
      await Promise.resolve()

      expect(provider.save).toHaveBeenCalledTimes(1)
    })

    it('starts periodic interval saves', async () => {
      const provider = createMemoryProvider()
      manager = new AutosaveManager(engine, { provider, interval: 5000 })
      manager.init()

      vi.advanceTimersByTime(5000)
      await Promise.resolve()
      await Promise.resolve()

      expect(provider.save).toHaveBeenCalledTimes(1)
    })

    it('does not init when disabled', () => {
      const provider = createMemoryProvider()
      manager = new AutosaveManager(engine, { provider, enabled: false })
      manager.init()

      engine.eventBus.emit('content:change')
      vi.advanceTimersByTime(10000)

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
      vi.advanceTimersByTime(5000)
      await Promise.resolve()

      // Only the final save in destroy() should have been called
      expect(provider.save).toHaveBeenCalledTimes(1)
    })

    it('clears pending debounce timer', async () => {
      const provider = createMemoryProvider()
      manager = new AutosaveManager(engine, { provider, debounce: 5000 })
      manager.init()

      // Trigger a debounced save (sets _debounceTimer)
      engine.eventBus.emit('content:change')
      expect(manager._debounceTimer).not.toBeNull()

      manager.destroy()

      // Debounce timer should be cleared
      expect(manager._debounceTimer).toBeNull()

      await Promise.resolve()
      await Promise.resolve()
    })

    it('removes beforeunload handler', async () => {
      const provider = createMemoryProvider()
      manager = new AutosaveManager(engine, { provider })
      const removeSpy = vi.spyOn(window, 'removeEventListener')

      manager.init()
      expect(manager._beforeUnloadHandler).not.toBeNull()

      const handler = manager._beforeUnloadHandler
      manager.destroy()

      expect(removeSpy).toHaveBeenCalledWith('beforeunload', handler)
      expect(manager._beforeUnloadHandler).toBeNull()

      removeSpy.mockRestore()
      await Promise.resolve()
      await Promise.resolve()
    })
  })

  describe('init() beforeunload handler', () => {
    it('sets up a beforeunload handler that calls _attemptSyncSave', () => {
      const provider = createMemoryProvider()
      manager = new AutosaveManager(engine, { provider })
      const addSpy = vi.spyOn(window, 'addEventListener')

      manager.init()

      expect(addSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function))
      expect(manager._beforeUnloadHandler).toBeInstanceOf(Function)

      // Calling the handler should trigger _attemptSyncSave
      const syncSpy = vi.spyOn(manager, '_attemptSyncSave')
      manager._beforeUnloadHandler()
      expect(syncSpy).toHaveBeenCalledTimes(1)

      addSpy.mockRestore()
      syncSpy.mockRestore()
    })
  })

  describe('checkRecovery() error handling', () => {
    it('returns null when provider.load throws', async () => {
      const provider = createMemoryProvider()
      provider.load.mockRejectedValueOnce(new Error('Storage corrupted'))
      manager = new AutosaveManager(engine, { provider })

      const result = await manager.checkRecovery('<p>Current</p>')
      expect(result).toBeNull()
    })
  })

  describe('_scheduleDebouncedSave()', () => {
    it('clears existing debounce timer before setting a new one', () => {
      const provider = createMemoryProvider()
      manager = new AutosaveManager(engine, { provider, debounce: 5000 })
      manager.init()

      // Trigger first content change to set a debounce timer
      engine.eventBus.emit('content:change')
      const firstTimer = manager._debounceTimer

      // Trigger second content change — should clear the first timer
      engine.eventBus.emit('content:change')
      const secondTimer = manager._debounceTimer

      expect(firstTimer).not.toBeNull()
      expect(secondTimer).not.toBeNull()
      // Timers should be different (first was cleared, new one set)
      expect(secondTimer).not.toBe(firstTimer)
    })
  })

  describe('_attemptSyncSave()', () => {
    it('uses provider.saveSync if available', () => {
      const provider = createMemoryProvider()
      manager = new AutosaveManager(engine, { provider })
      // Add saveSync directly on the resolved provider (after createStorageProvider wraps it)
      manager.provider.saveSync = vi.fn()
      // _lastSavedContent must differ from current to trigger save
      manager._lastSavedContent = 'something different'

      manager._attemptSyncSave()

      expect(manager.provider.saveSync).toHaveBeenCalledWith('rmx-default', '<p>Hello</p>')
    })

    it('uses navigator.sendBeacon if provider has endpoint but no saveSync', () => {
      const provider = createMemoryProvider()
      manager = new AutosaveManager(engine, { provider })
      // Set endpoint on the resolved provider (after createStorageProvider wraps it)
      manager.provider.endpoint = 'https://api.example.com/autosave'
      // _lastSavedContent must differ from current to trigger save
      manager._lastSavedContent = 'something different'

      const originalSendBeacon = navigator.sendBeacon
      navigator.sendBeacon = vi.fn(() => true)

      manager._attemptSyncSave()

      expect(navigator.sendBeacon).toHaveBeenCalledTimes(1)
      expect(navigator.sendBeacon).toHaveBeenCalledWith(
        'https://api.example.com/autosave',
        expect.any(String),
      )
      const body = JSON.parse(navigator.sendBeacon.mock.calls[0][1])
      expect(body.key).toBe('rmx-default')
      expect(body.content).toBe('<p>Hello</p>')

      navigator.sendBeacon = originalSendBeacon
    })

    it('returns early if content is unchanged', () => {
      const provider = createMemoryProvider()
      provider.saveSync = vi.fn()
      manager = new AutosaveManager(engine, { provider })

      // Set _lastSavedContent to match what getHTML returns
      manager._lastSavedContent = '<p>Hello</p>'

      manager._attemptSyncSave()

      expect(provider.saveSync).not.toHaveBeenCalled()
    })

    it('returns early if destroyed', () => {
      const provider = createMemoryProvider()
      provider.saveSync = vi.fn()
      manager = new AutosaveManager(engine, { provider })
      manager._destroyed = true

      manager._attemptSyncSave()

      expect(provider.saveSync).not.toHaveBeenCalled()
    })
  })

  describe('save() queuing behavior', () => {
    it('queues a pending save if already saving, then executes it', async () => {
      let resolveSave
      const provider = createMemoryProvider()
      provider.save.mockImplementationOnce(() => new Promise(r => { resolveSave = r }))
      manager = new AutosaveManager(engine, { provider })

      // Start first save
      const p1 = manager.save()
      expect(manager._isSaving).toBe(true)

      // Change content for the second save
      engine.getHTML.mockReturnValue('<p>Updated</p>')

      // This should set _pendingSave = true
      manager.save()
      expect(manager._pendingSave).toBe(true)

      // Complete the first save
      resolveSave()
      await p1
      // Let the queued save execute
      await Promise.resolve()
      await Promise.resolve()

      // The pending save should have fired
      expect(provider.save).toHaveBeenCalledTimes(2)
      expect(provider.save).toHaveBeenLastCalledWith('rmx-default', '<p>Updated</p>', undefined)
    })

    it('skips save() if content unchanged', async () => {
      const provider = createMemoryProvider()
      manager = new AutosaveManager(engine, { provider })

      // First save
      await manager.save()
      expect(provider.save).toHaveBeenCalledTimes(1)

      // Second save with same content should be skipped
      provider.save.mockClear()
      await manager.save()
      expect(provider.save).not.toHaveBeenCalled()
    })
  })
})
