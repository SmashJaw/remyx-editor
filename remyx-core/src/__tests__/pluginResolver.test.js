import { describe, it, expect, afterEach } from 'vitest'
import { resolvePlugins, registerPluginFactory, unregisterPluginFactory } from '../config/pluginResolver.js'

describe('resolvePlugins', () => {
  afterEach(() => {
    unregisterPluginFactory('TestPlugin')
  })

  it('returns undefined for null/undefined input', () => {
    expect(resolvePlugins(null)).toBeUndefined()
    expect(resolvePlugins(undefined)).toBeUndefined()
  })

  it('returns undefined for non-array input', () => {
    expect(resolvePlugins('TablePlugin')).toBeUndefined()
    expect(resolvePlugins(42)).toBeUndefined()
  })

  it('resolves built-in plugins by string name', async () => {
    const result = await resolvePlugins(['TablePlugin', 'MathPlugin'])
    expect(result).toHaveLength(2)
    // Each resolved plugin should be a valid plugin object (has name/init or is a function)
    expect(result[0]).toBeDefined()
    expect(result[1]).toBeDefined()
  })

  it('resolves plugins by object with name and options', async () => {
    const result = await resolvePlugins([
      { name: 'CollaborationPlugin', options: { roomId: 'test-room' } },
    ])
    expect(result).toHaveLength(1)
    expect(result[0]).toBeDefined()
  })

  it('passes through already-instantiated plugin objects', async () => {
    const myPlugin = { name: 'custom', init() {}, destroy() {} }
    const result = await resolvePlugins([myPlugin])
    expect(result).toHaveLength(1)
    expect(result[0]).toBe(myPlugin)
  })

  it('passes through plugin functions', async () => {
    const myFactory = () => ({ name: 'custom', init() {} })
    const result = await resolvePlugins([myFactory])
    expect(result).toHaveLength(1)
    expect(result[0]).toBe(myFactory)
  })

  it('handles mixed arrays of strings, objects, and instances', async () => {
    const myPlugin = { name: 'custom', init() {}, destroy() {} }
    const result = await resolvePlugins([
      'TablePlugin',
      { name: 'MathPlugin' },
      myPlugin,
    ])
    expect(result).toHaveLength(3)
  })

  it('throws for unknown plugin names', async () => {
    await expect(resolvePlugins(['NonExistentPlugin'])).rejects.toThrow('unknown plugin "NonExistentPlugin"')
  })

  it('throws for invalid entry types', async () => {
    try {
      await resolvePlugins([42])
      expect.fail('should have thrown')
    } catch (err) {
      expect(err.message).toContain('invalid plugin entry at index 0')
    }
  })

  it('resolves all 17 built-in plugins', async () => {
    const allNames = [
      'WordCountPlugin', 'AutolinkPlugin', 'PlaceholderPlugin',
      'SyntaxHighlightPlugin', 'TablePlugin', 'BlockTemplatePlugin',
      'CommentsPlugin', 'CalloutPlugin', 'LinkPlugin', 'TemplatePlugin',
      'KeyboardPlugin', 'DragDropPlugin', 'MathPlugin', 'TocPlugin',
      'AnalyticsPlugin', 'SpellcheckPlugin', 'CollaborationPlugin',
    ]
    const result = await resolvePlugins(allNames)
    expect(result).toHaveLength(17)
    result.forEach(p => expect(p).toBeDefined())
  })
})

describe('registerPluginFactory / unregisterPluginFactory', () => {
  afterEach(() => {
    unregisterPluginFactory('TestPlugin')
  })

  it('registers a custom plugin that can be resolved by name', async () => {
    const factory = (opts) => ({ name: 'test', init() {}, options: opts })
    registerPluginFactory('TestPlugin', factory)

    const result = await resolvePlugins([{ name: 'TestPlugin', options: { color: 'red' } }])
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('test')
    expect(result[0].options).toEqual({ color: 'red' })
  })

  it('custom plugins override built-ins with the same name', async () => {
    const customTable = () => ({ name: 'custom-table', init() {} })
    registerPluginFactory('TablePlugin', customTable)

    const result = await resolvePlugins(['TablePlugin'])
    expect(result[0].name).toBe('custom-table')

    // Clean up override
    unregisterPluginFactory('TablePlugin')
  })

  it('unregister removes the custom factory', async () => {
    registerPluginFactory('TestPlugin', () => ({ name: 'test', init() {} }))
    unregisterPluginFactory('TestPlugin')

    await expect(resolvePlugins(['TestPlugin'])).rejects.toThrow('unknown plugin "TestPlugin"')
  })

  it('throws for invalid name', () => {
    expect(() => registerPluginFactory('', () => {})).toThrow('non-empty string')
  })

  it('throws for non-function factory', () => {
    expect(() => registerPluginFactory('TestPlugin', 'not a function')).toThrow('must be a function')
  })
})
