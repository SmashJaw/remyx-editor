import { vi } from 'vitest'
import { createPlugin } from '../plugins/createPlugin.js'

describe('createPlugin', () => {
  describe('name validation', () => {
    it('should preserve the plugin name from the definition', () => {
      const plugin = createPlugin({ name: 'my-plugin' })
      expect(plugin.name).toBe('my-plugin')
    })

    it('should handle names with special characters', () => {
      const plugin = createPlugin({ name: 'plugin_v2.1' })
      expect(plugin.name).toBe('plugin_v2.1')
    })

    it('should handle empty string name', () => {
      const plugin = createPlugin({ name: '' })
      expect(plugin.name).toBe('')
    })
  })

  describe('default values', () => {
    let plugin

    beforeEach(() => {
      plugin = createPlugin({ name: 'test' })
    })

    it('should default requiresFullAccess to false', () => {
      expect(plugin.requiresFullAccess).toBe(false)
    })

    it('should default init to a no-op function', () => {
      expect(typeof plugin.init).toBe('function')
      expect(plugin.init()).toBeUndefined()
    })

    it('should default destroy to a no-op function', () => {
      expect(typeof plugin.destroy).toBe('function')
      expect(plugin.destroy()).toBeUndefined()
    })

    it('should default commands to an empty array', () => {
      expect(plugin.commands).toEqual([])
    })

    it('should default toolbarItems to an empty array', () => {
      expect(plugin.toolbarItems).toEqual([])
    })

    it('should default statusBarItems to an empty array', () => {
      expect(plugin.statusBarItems).toEqual([])
    })

    it('should default contextMenuItems to an empty array', () => {
      expect(plugin.contextMenuItems).toEqual([])
    })
  })

  describe('custom values', () => {
    it('should pass through requiresFullAccess when set to true', () => {
      const plugin = createPlugin({ name: 'test', requiresFullAccess: true })
      expect(plugin.requiresFullAccess).toBe(true)
    })

    it('should preserve custom init function', () => {
      const init = vi.fn()
      const plugin = createPlugin({ name: 'test', init })
      plugin.init('engine')
      expect(init).toHaveBeenCalledWith('engine')
    })

    it('should preserve custom destroy function', () => {
      const destroy = vi.fn()
      const plugin = createPlugin({ name: 'test', destroy })
      plugin.destroy('engine')
      expect(destroy).toHaveBeenCalledWith('engine')
    })

    it('should preserve custom commands array', () => {
      const commands = [{ name: 'doSomething', execute: vi.fn() }]
      const plugin = createPlugin({ name: 'test', commands })
      expect(plugin.commands).toBe(commands)
      expect(plugin.commands).toHaveLength(1)
    })

    it('should preserve custom toolbarItems array', () => {
      const toolbarItems = [{ command: 'bold', icon: 'B' }]
      const plugin = createPlugin({ name: 'test', toolbarItems })
      expect(plugin.toolbarItems).toBe(toolbarItems)
    })

    it('should preserve custom statusBarItems array', () => {
      const statusBarItems = [{ label: 'Words: 0' }]
      const plugin = createPlugin({ name: 'test', statusBarItems })
      expect(plugin.statusBarItems).toBe(statusBarItems)
    })

    it('should preserve custom contextMenuItems array', () => {
      const contextMenuItems = [{ label: 'Copy', action: vi.fn() }]
      const plugin = createPlugin({ name: 'test', contextMenuItems })
      expect(plugin.contextMenuItems).toBe(contextMenuItems)
    })
  })

  describe('returned object structure', () => {
    it('should return an object with all expected keys', () => {
      const plugin = createPlugin({ name: 'test' })
      const keys = Object.keys(plugin).sort()
      expect(keys).toEqual([
        'commands',
        'contextMenuItems',
        'destroy',
        'init',
        'name',
        'requiresFullAccess',
        'statusBarItems',
        'toolbarItems',
      ])
    })

    it('should return a new object each time', () => {
      const def = { name: 'test' }
      const plugin1 = createPlugin(def)
      const plugin2 = createPlugin(def)
      expect(plugin1).not.toBe(plugin2)
    })

    it('should not include extra properties from the definition', () => {
      const plugin = createPlugin({ name: 'test', extraProp: 'nope' })
      expect(plugin.extraProp).toBeUndefined()
    })
  })
})
