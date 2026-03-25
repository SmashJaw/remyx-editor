import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  PluginManager,
  registerPluginInRegistry,
  unregisterPluginFromRegistry,
  listRegisteredPlugins,
  searchPluginRegistry,
} from '../plugins/PluginManager.js'

function createMockEngine() {
  const commandsMap = new Map()
  const element = document.createElement('div')
  document.body.appendChild(element)
  return {
    element,
    commands: {
      register: vi.fn((name, def) => commandsMap.set(name, def)),
      execute: vi.fn((name, ...args) => {
        const cmd = commandsMap.get(name)
        return cmd?.execute?.({ element }, ...args)
      }),
      has: (name) => commandsMap.has(name),
    },
    eventBus: { on: vi.fn(() => vi.fn()), emit: vi.fn(), off: vi.fn() },
    selection: { getSelection: vi.fn(), getRange: vi.fn(), getActiveFormats: vi.fn() },
    getHTML: vi.fn(() => ''),
    getText: vi.fn(() => ''),
    isEmpty: vi.fn(() => true),
    options: {},
  }
}

describe('PluginManager — comprehensive coverage', () => {
  let engine, pm

  beforeEach(() => {
    engine = createMockEngine()
    pm = new PluginManager(engine)
  })

  afterEach(() => {
    pm.destroyAll()
    engine.element.remove()
  })

  describe('register', () => {
    it('registers a plugin', () => {
      pm.register({ name: 'test', init: vi.fn() })
      expect(pm.has('test')).toBe(true)
    })

    it('warns for plugin without name', () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      pm.register({})
      expect(spy).toHaveBeenCalled()
      spy.mockRestore()
    })

    it('warns for duplicate registration', () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      pm.register({ name: 'dup' })
      pm.register({ name: 'dup' })
      expect(spy).toHaveBeenCalled()
      spy.mockRestore()
    })

    it('registers plugin commands', () => {
      pm.register({
        name: 'cmdPlugin',
        commands: [{ name: 'myCmd', execute: vi.fn() }],
      })
      expect(engine.commands.register).toHaveBeenCalledWith('myCmd', expect.any(Object))
    })

    it('wraps lazy plugin commands for auto-init', () => {
      const execFn = vi.fn()
      pm.register({
        name: 'lazyPlugin',
        lazy: true,
        init: vi.fn(),
        commands: [{ name: 'lazyCmd', execute: execFn }],
      })

      // Command should be registered with wrapped execute
      expect(engine.commands.register).toHaveBeenCalled()
    })

    it('emits plugin:registered event', () => {
      pm.register({ name: 'test' })
      expect(engine.eventBus.emit).toHaveBeenCalledWith('plugin:registered', { name: 'test' })
    })

    it('initializes default settings map', () => {
      pm.register({ name: 'withSettings', defaultSettings: { key: 'val' } })
      expect(pm._settings.has('withSettings')).toBe(true)
    })
  })

  describe('initAll', () => {
    it('initializes all non-lazy plugins', () => {
      const initFn = vi.fn()
      pm.register({ name: 'p1', init: initFn, requiresFullAccess: true })
      pm.initAll()
      expect(initFn).toHaveBeenCalled()
    })

    it('skips lazy plugins', () => {
      const initFn = vi.fn()
      pm.register({ name: 'lazy1', lazy: true, init: initFn })
      pm.initAll()
      expect(initFn).not.toHaveBeenCalled()
    })

    it('initializes in dependency order', () => {
      const order = []
      pm.register({ name: 'b', dependencies: ['a'], init: () => order.push('b') })
      pm.register({ name: 'a', init: () => order.push('a') })
      pm.initAll()
      expect(order).toEqual(['a', 'b'])
    })

    it('detects circular dependencies', () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      pm.register({ name: 'x', dependencies: ['y'] })
      pm.register({ name: 'y', dependencies: ['x'] })
      pm.initAll()
      expect(engine.eventBus.emit).toHaveBeenCalledWith('plugin:circularDependency', expect.any(Object))
      // Still initializes them
      expect(pm.isInitialized('x')).toBe(true)
      expect(pm.isInitialized('y')).toBe(true)
      spy.mockRestore()
    })

    it('handles init errors gracefully', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
      pm.register({
        name: 'broken',
        init: () => { throw new Error('init failed') },
      })
      pm.initAll()
      expect(spy).toHaveBeenCalled()
      expect(engine.eventBus.emit).toHaveBeenCalledWith('plugin:error', expect.objectContaining({ name: 'broken' }))
      spy.mockRestore()
    })

    it('restricts API for non-requiresFullAccess plugins', () => {
      let receivedApi = null
      pm.register({
        name: 'restricted',
        requiresFullAccess: false,
        init: (api) => { receivedApi = api },
      })
      pm.initAll()
      expect(receivedApi).toBeTruthy()
      expect(receivedApi.element).toBe(engine.element)
      expect(typeof receivedApi.executeCommand).toBe('function')
      expect(typeof receivedApi.getSetting).toBe('function')
      expect(typeof receivedApi.setSetting).toBe('function')
    })

    it('provides full engine for requiresFullAccess plugins', () => {
      let received = null
      pm.register({
        name: 'full',
        requiresFullAccess: true,
        init: (eng) => { received = eng },
      })
      pm.initAll()
      expect(received).toBe(engine)
    })
  })

  describe('lifecycle hooks', () => {
    it('wires onContentChange handler', () => {
      pm.register({
        name: 'lifecycle',
        onContentChange: vi.fn(),
      })
      pm.initAll()
      expect(engine.eventBus.on).toHaveBeenCalledWith('content:change', expect.any(Function))
    })

    it('wires onSelectionChange handler', () => {
      pm.register({
        name: 'lifecycle2',
        onSelectionChange: vi.fn(),
      })
      pm.initAll()
      expect(engine.eventBus.on).toHaveBeenCalledWith('selection:change', expect.any(Function))
    })

    it('catches errors in lifecycle hooks', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const errorFn = () => { throw new Error('hook error') }
      pm.register({ name: 'hookErr', onContentChange: errorFn })
      pm.initAll()

      // Find and call the handler
      const onCall = engine.eventBus.on.mock.calls.find(c => c[0] === 'content:change')
      if (onCall) onCall[1]()

      expect(spy).toHaveBeenCalled()
      spy.mockRestore()
    })
  })

  describe('activatePlugin', () => {
    it('activates a lazy plugin', () => {
      const initFn = vi.fn()
      pm.register({ name: 'lazy2', lazy: true, init: initFn })
      pm.activatePlugin('lazy2')
      expect(initFn).toHaveBeenCalled()
      expect(pm.isInitialized('lazy2')).toBe(true)
    })

    it('activates dependencies first', () => {
      const order = []
      pm.register({ name: 'dep', init: () => order.push('dep') })
      pm.register({ name: 'main', lazy: true, dependencies: ['dep'], init: () => order.push('main') })
      pm.initAll()
      pm.activatePlugin('main')
      expect(order).toEqual(['dep', 'main'])
    })

    it('warns for nonexistent plugin', () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      pm.activatePlugin('nonexistent')
      expect(spy).toHaveBeenCalled()
      spy.mockRestore()
    })
  })

  describe('destroyAll', () => {
    it('calls destroy on all plugins', () => {
      const destroyFn = vi.fn()
      pm.register({ name: 'destroyable', destroy: destroyFn, requiresFullAccess: true })
      pm.initAll()
      pm.destroyAll()
      expect(destroyFn).toHaveBeenCalled()
    })

    it('handles destroy errors gracefully', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
      pm.register({
        name: 'brokenDestroy',
        destroy: () => { throw new Error('destroy fail') },
      })
      pm.initAll()
      pm.destroyAll()
      expect(spy).toHaveBeenCalled()
      spy.mockRestore()
    })

    it('does not call destroy on uninitilized lazy plugins', () => {
      const destroyFn = vi.fn()
      pm.register({ name: 'lazyNoDestroy', lazy: true, destroy: destroyFn })
      pm.initAll()
      pm.destroyAll()
      expect(destroyFn).not.toHaveBeenCalled()
    })
  })

  describe('settings', () => {
    it('gets default setting', () => {
      pm.register({ name: 'sp', defaultSettings: { theme: 'dark' } })
      expect(pm.getPluginSetting('sp', 'theme')).toBe('dark')
    })

    it('sets and gets setting', () => {
      pm.register({ name: 'sp2', defaultSettings: {} })
      pm.setPluginSetting('sp2', 'key', 'value')
      expect(pm.getPluginSetting('sp2', 'key')).toBe('value')
    })

    it('validates against schema', () => {
      pm.register({
        name: 'validated',
        defaultSettings: {},
        settingsSchema: [
          { key: 'flag', type: 'boolean' },
          { key: 'count', type: 'number' },
          { key: 'name', type: 'string' },
        ],
      })

      expect(pm.setPluginSetting('validated', 'flag', true)).toBe(true)
      expect(pm.setPluginSetting('validated', 'flag', 'notbool')).toBe(false)
      expect(pm.setPluginSetting('validated', 'count', 42)).toBe(true)
      expect(pm.setPluginSetting('validated', 'count', 'notnum')).toBe(false)
      expect(pm.setPluginSetting('validated', 'name', 'hello')).toBe(true)
      expect(pm.setPluginSetting('validated', 'name', 123)).toBe(false)
    })

    it('validates select type', () => {
      pm.register({
        name: 'selectPlugin',
        defaultSettings: {},
        settingsSchema: [
          { key: 'mode', type: 'select', options: [{ value: 'a' }, { value: 'b' }] },
        ],
      })

      expect(pm.setPluginSetting('selectPlugin', 'mode', 'a')).toBe(true)
      expect(pm.setPluginSetting('selectPlugin', 'mode', 'c')).toBe(false)
    })

    it('validates with custom validate function', () => {
      pm.register({
        name: 'customValidate',
        defaultSettings: {},
        settingsSchema: [
          { key: 'x', type: 'number', validate: (v) => v > 0 },
        ],
      })

      expect(pm.setPluginSetting('customValidate', 'x', 5)).toBe(true)
      expect(pm.setPluginSetting('customValidate', 'x', -1)).toBe(false)
    })

    it('returns false for nonexistent plugin', () => {
      expect(pm.setPluginSetting('nonexistent', 'key', 'val')).toBe(false)
    })

    it('getPluginSettings merges defaults with overrides', () => {
      pm.register({ name: 'merged', defaultSettings: { a: 1, b: 2 } })
      pm.setPluginSetting('merged', 'b', 99)
      const settings = pm.getPluginSettings('merged')
      expect(settings).toEqual({ a: 1, b: 99 })
    })
  })

  describe('query methods', () => {
    it('get returns plugin', () => {
      pm.register({ name: 'q1' })
      expect(pm.get('q1')).toBeTruthy()
      expect(pm.get('nonexistent')).toBeUndefined()
    })

    it('getAll returns all plugins', () => {
      pm.register({ name: 'a' })
      pm.register({ name: 'b' })
      expect(pm.getAll()).toHaveLength(2)
    })

    it('has checks registration', () => {
      pm.register({ name: 'c' })
      expect(pm.has('c')).toBe(true)
      expect(pm.has('d')).toBe(false)
    })

    it('isInitialized checks state', () => {
      pm.register({ name: 'e' })
      expect(pm.isInitialized('e')).toBe(false)
      pm.initAll()
      expect(pm.isInitialized('e')).toBe(true)
    })
  })
})

describe('Plugin Registry', () => {
  afterEach(() => {
    // Clean up registry
    for (const p of listRegisteredPlugins()) {
      unregisterPluginFromRegistry(p.name)
    }
  })

  it('registers and lists plugins', () => {
    registerPluginInRegistry({ name: 'regTest', version: '1.0', description: 'Test' })
    const list = listRegisteredPlugins()
    expect(list.find(p => p.name === 'regTest')).toBeTruthy()
  })

  it('unregisters plugins', () => {
    registerPluginInRegistry({ name: 'rm', version: '1.0', description: 'RM' })
    expect(unregisterPluginFromRegistry('rm')).toBe(true)
  })

  it('ignores invalid entries', () => {
    registerPluginInRegistry(null)
    registerPluginInRegistry({})
  })

  it('searches by name', () => {
    registerPluginInRegistry({ name: 'searchable', description: 'A plugin', tags: ['test'] })
    expect(searchPluginRegistry('search').length).toBeGreaterThan(0)
  })

  it('searches by description', () => {
    registerPluginInRegistry({ name: 'x', description: 'unique description', tags: [] })
    expect(searchPluginRegistry('unique').length).toBeGreaterThan(0)
  })

  it('searches by tags', () => {
    registerPluginInRegistry({ name: 'y', description: '', tags: ['special'] })
    expect(searchPluginRegistry('special').length).toBeGreaterThan(0)
  })

  it('returns all when query is empty', () => {
    registerPluginInRegistry({ name: 'z', description: '' })
    expect(searchPluginRegistry('').length).toBeGreaterThan(0)
  })
})
