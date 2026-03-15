import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PluginManager } from '../plugins/PluginManager.js'

describe('PluginManager', () => {
  let manager
  let mockEngine

  beforeEach(() => {
    mockEngine = {
      element: document.createElement('div'),
      commands: {
        register: vi.fn(),
        execute: vi.fn(),
      },
      eventBus: {
        on: vi.fn(),
        off: vi.fn(),
        emit: vi.fn(),
      },
      selection: {
        getSelection: vi.fn(),
        getRange: vi.fn(),
        getActiveFormats: vi.fn().mockReturnValue({}),
      },
      history: { snapshot: vi.fn() },
      keyboard: { register: vi.fn() },
      getHTML: vi.fn().mockReturnValue(''),
      getText: vi.fn().mockReturnValue(''),
      isEmpty: vi.fn().mockReturnValue(true),
      options: { theme: 'light' },
    }
    manager = new PluginManager(mockEngine)
  })

  describe('register', () => {
    it('should register a plugin', () => {
      const plugin = { name: 'test-plugin' }
      manager.register(plugin)
      expect(manager.has('test-plugin')).toBe(true)
    })

    it('should warn and skip plugins without a name', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      manager.register({})
      manager.register(null)
      expect(consoleSpy).toHaveBeenCalledTimes(2)
      consoleSpy.mockRestore()
    })

    it('should warn on duplicate registration', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      manager.register({ name: 'test' })
      manager.register({ name: 'test' })
      expect(consoleSpy).toHaveBeenCalledWith('Plugin "test" already registered')
      consoleSpy.mockRestore()
    })

    it('should register plugin commands', () => {
      const cmd = { name: 'test-cmd', execute: vi.fn() }
      manager.register({ name: 'test', commands: [cmd] })
      expect(mockEngine.commands.register).toHaveBeenCalledWith('test-cmd', cmd)
    })

    it('should emit plugin:registered event', () => {
      manager.register({ name: 'test' })
      expect(mockEngine.eventBus.emit).toHaveBeenCalledWith('plugin:registered', { name: 'test' })
    })
  })

  describe('initAll', () => {
    it('should call init on all plugins', () => {
      const initFn = vi.fn()
      manager.register({ name: 'test', init: initFn })
      manager.initAll()
      expect(initFn).toHaveBeenCalled()
    })

    it('should pass restricted API to regular plugins', () => {
      let receivedApi = null
      manager.register({
        name: 'test',
        init(api) { receivedApi = api },
      })
      manager.initAll()

      // The restricted API should have specific methods but not the full engine
      expect(receivedApi).not.toBe(mockEngine)
      expect(receivedApi.element).toBe(mockEngine.element)
      expect(typeof receivedApi.executeCommand).toBe('function')
      expect(typeof receivedApi.on).toBe('function')
      expect(typeof receivedApi.off).toBe('function')
      expect(typeof receivedApi.getHTML).toBe('function')
      expect(typeof receivedApi.getText).toBe('function')
      expect(typeof receivedApi.isEmpty).toBe('function')
    })

    it('should pass full engine to plugins with requiresFullAccess', () => {
      let receivedApi = null
      manager.register({
        name: 'test',
        requiresFullAccess: true,
        init(api) { receivedApi = api },
      })
      manager.initAll()
      expect(receivedApi).toBe(mockEngine)
    })

    it('should catch and log errors from plugin init', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      manager.register({
        name: 'bad-plugin',
        init() { throw new Error('init failed') },
      })
      expect(() => manager.initAll()).not.toThrow()
      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('should skip plugins without an init method', () => {
      manager.register({ name: 'no-init' })
      expect(() => manager.initAll()).not.toThrow()
    })
  })

  describe('destroyAll', () => {
    it('should call destroy on all plugins', () => {
      const destroyFn = vi.fn()
      manager.register({ name: 'test', destroy: destroyFn })
      manager.destroyAll()
      expect(destroyFn).toHaveBeenCalled()
    })

    it('should pass restricted API to regular plugins on destroy', () => {
      let receivedApi = null
      manager.register({
        name: 'test',
        destroy(api) { receivedApi = api },
      })
      manager.destroyAll()
      expect(receivedApi).not.toBe(mockEngine)
    })

    it('should pass full engine to requiresFullAccess plugins on destroy', () => {
      let receivedApi = null
      manager.register({
        name: 'test',
        requiresFullAccess: true,
        destroy(api) { receivedApi = api },
      })
      manager.destroyAll()
      expect(receivedApi).toBe(mockEngine)
    })

    it('should clear all plugins after destroy', () => {
      manager.register({ name: 'test' })
      manager.destroyAll()
      expect(manager.has('test')).toBe(false)
      expect(manager.getAll()).toHaveLength(0)
    })

    it('should catch and log errors from plugin destroy', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      manager.register({
        name: 'bad-plugin',
        destroy() { throw new Error('destroy failed') },
      })
      expect(() => manager.destroyAll()).not.toThrow()
      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })

  describe('get', () => {
    it('should return a registered plugin', () => {
      const plugin = { name: 'test' }
      manager.register(plugin)
      expect(manager.get('test')).toBe(plugin)
    })

    it('should return undefined for unregistered plugin', () => {
      expect(manager.get('nonexistent')).toBeUndefined()
    })
  })

  describe('has', () => {
    it('should return true for registered plugins', () => {
      manager.register({ name: 'test' })
      expect(manager.has('test')).toBe(true)
    })

    it('should return false for unregistered plugins', () => {
      expect(manager.has('nonexistent')).toBe(false)
    })
  })

  describe('getAll', () => {
    it('should return all registered plugins', () => {
      manager.register({ name: 'a' })
      manager.register({ name: 'b' })
      const all = manager.getAll()
      expect(all).toHaveLength(2)
      expect(all.map((p) => p.name)).toContain('a')
      expect(all.map((p) => p.name)).toContain('b')
    })

    it('should return empty array when no plugins registered', () => {
      expect(manager.getAll()).toEqual([])
    })
  })

  describe('restricted API', () => {
    it('should provide read-only options copy', () => {
      let receivedApi = null
      manager.register({
        name: 'test',
        init(api) { receivedApi = api },
      })
      manager.initAll()
      const opts = receivedApi.options
      opts.theme = 'dark'
      // Should not affect engine options
      expect(mockEngine.options.theme).toBe('light')
    })

    it('should expose getSelection and getRange', () => {
      let receivedApi = null
      manager.register({
        name: 'test',
        init(api) { receivedApi = api },
      })
      manager.initAll()
      expect(typeof receivedApi.getSelection).toBe('function')
      expect(typeof receivedApi.getRange).toBe('function')
      expect(typeof receivedApi.getActiveFormats).toBe('function')
    })
  })
})
