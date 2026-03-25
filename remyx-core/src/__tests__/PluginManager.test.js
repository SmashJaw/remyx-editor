import { vi } from 'vitest'

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
    let receivedApi

    beforeEach(() => {
      receivedApi = null
      manager.register({
        name: 'test',
        init(api) { receivedApi = api },
      })
      manager.initAll()
    })

    it('should provide read-only options copy', () => {
      const opts = receivedApi.options
      opts.theme = 'dark'
      // Should not affect engine options
      expect(mockEngine.options.theme).toBe('light')
    })

    it('should expose getSelection and getRange', () => {
      expect(typeof receivedApi.getSelection).toBe('function')
      expect(typeof receivedApi.getRange).toBe('function')
      expect(typeof receivedApi.getActiveFormats).toBe('function')
    })

    it('executeCommand delegates to engine.commands.execute', () => {
      receivedApi.executeCommand('bold', 'arg1')
      expect(mockEngine.commands.execute).toHaveBeenCalledWith('bold', 'arg1')
    })

    it('on delegates to engine.eventBus.on', () => {
      const handler = vi.fn()
      receivedApi.on('change', handler)
      expect(mockEngine.eventBus.on).toHaveBeenCalledWith('change', handler)
    })

    it('off delegates to engine.eventBus.off', () => {
      const handler = vi.fn()
      receivedApi.off('change', handler)
      expect(mockEngine.eventBus.off).toHaveBeenCalledWith('change', handler)
    })

    it('getSelection delegates to engine.selection.getSelection', () => {
      receivedApi.getSelection()
      expect(mockEngine.selection.getSelection).toHaveBeenCalled()
    })

    it('getRange delegates to engine.selection.getRange', () => {
      receivedApi.getRange()
      expect(mockEngine.selection.getRange).toHaveBeenCalled()
    })

    it('getActiveFormats delegates to engine.selection.getActiveFormats', () => {
      receivedApi.getActiveFormats()
      expect(mockEngine.selection.getActiveFormats).toHaveBeenCalled()
    })

    it('getHTML delegates to engine.getHTML', () => {
      receivedApi.getHTML()
      expect(mockEngine.getHTML).toHaveBeenCalled()
    })

    it('getText delegates to engine.getText', () => {
      receivedApi.getText()
      expect(mockEngine.getText).toHaveBeenCalled()
    })

    it('isEmpty delegates to engine.isEmpty', () => {
      receivedApi.isEmpty()
      expect(mockEngine.isEmpty).toHaveBeenCalled()
    })
  })

  describe('initAll error handling', () => {
    it('emits plugin:error when init throws', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const error = new Error('init failed')
      manager.register({
        name: 'bad-plugin',
        init() { throw error },
      })
      manager.initAll()
      expect(mockEngine.eventBus.emit).toHaveBeenCalledWith('plugin:error', {
        name: 'bad-plugin',
        error,
      })
      consoleSpy.mockRestore()
    })
  })

  // =======================================================================
  // Expanded Plugin Architecture
  // =======================================================================

  describe('lifecycle hooks', () => {
    it('should wire onContentChange to content:change events', () => {
      const contentChangeHandlers = []
      mockEngine.eventBus.on = vi.fn((event, handler) => {
        if (event === 'content:change') contentChangeHandlers.push(handler)
        return () => {}
      })

      const onContentChange = vi.fn()
      manager.register({ name: 'hooks-test', onContentChange })
      manager.initAll()

      expect(contentChangeHandlers.length).toBeGreaterThan(0)
      contentChangeHandlers[contentChangeHandlers.length - 1]()
      expect(onContentChange).toHaveBeenCalled()
    })

    it('should wire onSelectionChange to selection:change events', () => {
      const selectionHandlers = []
      mockEngine.eventBus.on = vi.fn((event, handler) => {
        if (event === 'selection:change') selectionHandlers.push(handler)
        return () => {}
      })

      const onSelectionChange = vi.fn()
      manager.register({ name: 'sel-test', onSelectionChange })
      manager.initAll()

      expect(selectionHandlers.length).toBeGreaterThan(0)
      selectionHandlers[selectionHandlers.length - 1]()
      expect(onSelectionChange).toHaveBeenCalled()
    })

    it('should isolate errors in onContentChange', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const handlers = []
      mockEngine.eventBus.on = vi.fn((event, handler) => {
        if (event === 'content:change') handlers.push(handler)
        return () => {}
      })

      manager.register({
        name: 'bad-hook',
        onContentChange() { throw new Error('hook crash') },
      })
      manager.initAll()

      // Should not throw
      expect(() => handlers[handlers.length - 1]()).not.toThrow()
      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })

  describe('dependency resolution', () => {
    it('should initialize plugins in dependency order', () => {
      const order = []
      manager.register({
        name: 'base',
        init() { order.push('base') },
      })
      manager.register({
        name: 'derived',
        dependencies: ['base'],
        init() { order.push('derived') },
      })
      manager.initAll()
      expect(order).toEqual(['base', 'derived'])
    })

    it('should handle deep dependency chains', () => {
      const order = []
      manager.register({ name: 'c', dependencies: ['b'], init() { order.push('c') } })
      manager.register({ name: 'b', dependencies: ['a'], init() { order.push('b') } })
      manager.register({ name: 'a', init() { order.push('a') } })
      manager.initAll()
      expect(order).toEqual(['a', 'b', 'c'])
    })

    it('should detect circular dependencies and still initialize', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const order = []
      manager.register({ name: 'x', dependencies: ['y'], init() { order.push('x') } })
      manager.register({ name: 'y', dependencies: ['x'], init() { order.push('y') } })
      manager.initAll()

      // Both should still be initialized
      expect(order.length).toBe(2)
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Circular'))
      consoleSpy.mockRestore()
    })

    it('should skip dependencies on unregistered plugins', () => {
      const order = []
      manager.register({
        name: 'dep-on-missing',
        dependencies: ['nonexistent'],
        init() { order.push('dep-on-missing') },
      })
      manager.initAll()
      expect(order).toEqual(['dep-on-missing'])
    })

    it('activatePlugin initializes dependencies first', () => {
      const order = []
      manager.register({
        name: 'lazy-base',
        lazy: true,
        init() { order.push('lazy-base') },
      })
      manager.register({
        name: 'lazy-derived',
        lazy: true,
        dependencies: ['lazy-base'],
        init() { order.push('lazy-derived') },
      })
      manager.initAll() // skips lazy plugins
      expect(order).toEqual([])

      manager.activatePlugin('lazy-derived')
      expect(order).toEqual(['lazy-base', 'lazy-derived'])
    })
  })

  describe('scoped plugin settings', () => {
    it('should return default settings', () => {
      manager.register({
        name: 'settings-test',
        defaultSettings: { fontSize: 14, theme: 'light' },
      })
      expect(manager.getPluginSetting('settings-test', 'fontSize')).toBe(14)
      expect(manager.getPluginSetting('settings-test', 'theme')).toBe('light')
    })

    it('should allow setting and getting values', () => {
      manager.register({ name: 'st', defaultSettings: { x: 1 } })
      expect(manager.setPluginSetting('st', 'x', 42)).toBe(true)
      expect(manager.getPluginSetting('st', 'x')).toBe(42)
    })

    it('should validate against schema type', () => {
      manager.register({
        name: 'validated',
        settingsSchema: [
          { key: 'count', type: 'number', label: 'Count', defaultValue: 0 },
          { key: 'enabled', type: 'boolean', label: 'Enabled', defaultValue: true },
        ],
        defaultSettings: { count: 0, enabled: true },
      })

      expect(manager.setPluginSetting('validated', 'count', 'not-a-number')).toBe(false)
      expect(manager.setPluginSetting('validated', 'count', 5)).toBe(true)
      expect(manager.setPluginSetting('validated', 'enabled', 'nope')).toBe(false)
      expect(manager.setPluginSetting('validated', 'enabled', false)).toBe(true)
    })

    it('should validate select options', () => {
      manager.register({
        name: 'select-test',
        settingsSchema: [
          { key: 'mode', type: 'select', label: 'Mode', defaultValue: 'a', options: [
            { label: 'A', value: 'a' }, { label: 'B', value: 'b' },
          ]},
        ],
        defaultSettings: { mode: 'a' },
      })

      expect(manager.setPluginSetting('select-test', 'mode', 'c')).toBe(false) // not in options
      expect(manager.setPluginSetting('select-test', 'mode', 'b')).toBe(true)
    })

    it('should support custom validation', () => {
      manager.register({
        name: 'custom-val',
        settingsSchema: [
          { key: 'port', type: 'number', label: 'Port', defaultValue: 3000,
            validate: (v) => v >= 1 && v <= 65535 },
        ],
        defaultSettings: { port: 3000 },
      })

      expect(manager.setPluginSetting('custom-val', 'port', 0)).toBe(false)
      expect(manager.setPluginSetting('custom-val', 'port', 8080)).toBe(true)
    })

    it('should return all settings as plain object', () => {
      manager.register({ name: 'all-s', defaultSettings: { a: 1, b: 2 } })
      manager.setPluginSetting('all-s', 'b', 99)
      const all = manager.getPluginSettings('all-s')
      expect(all).toEqual({ a: 1, b: 99 })
    })

    it('should emit plugin:settingChanged event', () => {
      manager.register({ name: 'evt-s', defaultSettings: { x: 0 } })
      manager.setPluginSetting('evt-s', 'x', 5)
      expect(mockEngine.eventBus.emit).toHaveBeenCalledWith('plugin:settingChanged', {
        pluginName: 'evt-s', key: 'x', value: 5,
      })
    })

    it('restricted API exposes getSetting and setSetting', () => {
      let receivedApi = null
      const unsubs = []
      mockEngine.eventBus.on = vi.fn((event, handler) => {
        unsubs.push(() => {})
        return () => {}
      })

      manager.register({
        name: 'api-settings',
        defaultSettings: { color: 'red' },
        init(api) { receivedApi = api },
      })
      manager.initAll()

      expect(typeof receivedApi.getSetting).toBe('function')
      expect(typeof receivedApi.setSetting).toBe('function')
      expect(receivedApi.getSetting('color')).toBe('red')
    })

    it('setPluginSetting returns false for unknown plugin', () => {
      expect(manager.setPluginSetting('nonexistent', 'x', 1)).toBe(false)
    })
  })

  describe('metadata', () => {
    it('createPlugin preserves version, description, author', () => {
      const { createPlugin } = require('../plugins/createPlugin.js')
      const plugin = createPlugin({
        name: 'meta-test',
        version: '2.1.0',
        description: 'A test plugin',
        author: 'Test Author',
      })
      expect(plugin.version).toBe('2.1.0')
      expect(plugin.description).toBe('A test plugin')
      expect(plugin.author).toBe('Test Author')
    })

    it('createPlugin defaults metadata', () => {
      const { createPlugin } = require('../plugins/createPlugin.js')
      const plugin = createPlugin({ name: 'minimal' })
      expect(plugin.version).toBe('0.0.0')
      expect(plugin.description).toBe('')
      expect(plugin.author).toBe('')
      expect(plugin.dependencies).toEqual([])
      expect(plugin.settingsSchema).toEqual([])
      expect(plugin.defaultSettings).toEqual({})
    })
  })
})

// =======================================================================
// Plugin Registry (global)
// =======================================================================
describe('Plugin Registry', () => {
  const {
    registerPluginInRegistry,
    unregisterPluginFromRegistry,
    listRegisteredPlugins,
    searchPluginRegistry,
  } = require('../plugins/PluginManager.js')

  afterEach(() => {
    // Clean up registry entries from tests
    for (const entry of listRegisteredPlugins()) {
      unregisterPluginFromRegistry(entry.name)
    }
  })

  it('registerPluginInRegistry adds an entry', () => {
    registerPluginInRegistry({ name: 'test-reg', version: '1.0.0', description: 'Test', author: 'X' })
    expect(listRegisteredPlugins().length).toBe(1)
    expect(listRegisteredPlugins()[0].name).toBe('test-reg')
  })

  it('unregisterPluginFromRegistry removes an entry', () => {
    registerPluginInRegistry({ name: 'to-remove', version: '1.0.0', description: '', author: '' })
    expect(unregisterPluginFromRegistry('to-remove')).toBe(true)
    expect(listRegisteredPlugins().length).toBe(0)
  })

  it('unregisterPluginFromRegistry returns false for unknown', () => {
    expect(unregisterPluginFromRegistry('nope')).toBe(false)
  })

  it('searchPluginRegistry searches by name', () => {
    registerPluginInRegistry({ name: 'code-highlight', version: '1.0.0', description: 'Syntax highlighting', author: 'A' })
    registerPluginInRegistry({ name: 'word-count', version: '1.0.0', description: 'Count words', author: 'B' })
    const results = searchPluginRegistry('code')
    expect(results.length).toBe(1)
    expect(results[0].name).toBe('code-highlight')
  })

  it('searchPluginRegistry searches by description', () => {
    registerPluginInRegistry({ name: 'x', version: '1.0.0', description: 'Math equation editor', author: '' })
    const results = searchPluginRegistry('equation')
    expect(results.length).toBe(1)
  })

  it('searchPluginRegistry searches by tags', () => {
    registerPluginInRegistry({ name: 'tagged', version: '1.0.0', description: '', author: '', tags: ['formatting', 'style'] })
    const results = searchPluginRegistry('style')
    expect(results.length).toBe(1)
  })

  it('searchPluginRegistry returns all for empty query', () => {
    registerPluginInRegistry({ name: 'a', version: '1.0.0', description: '', author: '' })
    registerPluginInRegistry({ name: 'b', version: '1.0.0', description: '', author: '' })
    expect(searchPluginRegistry('').length).toBe(2)
  })

  it('ignores entries without a name', () => {
    registerPluginInRegistry(null)
    registerPluginInRegistry({})
    expect(listRegisteredPlugins().length).toBe(0)
  })
})
