import { defineConfig } from '../config/defineConfig.js'

describe('defineConfig', () => {
  it('should return the config object as-is when valid', () => {
    const config = { toolbar: ['bold', 'italic'] }
    expect(defineConfig(config)).toBe(config)
  })

  it('should throw for null input', () => {
    expect(() => defineConfig(null)).toThrow('defineConfig expects a configuration object')
  })

  it('should throw for undefined input', () => {
    expect(() => defineConfig(undefined)).toThrow('defineConfig expects a configuration object')
  })

  it('should throw for non-object input (string)', () => {
    expect(() => defineConfig('bad')).toThrow('defineConfig expects a configuration object')
  })

  it('should throw for non-object input (number)', () => {
    expect(() => defineConfig(42)).toThrow('defineConfig expects a configuration object')
  })

  it('should throw for boolean input', () => {
    expect(() => defineConfig(true)).toThrow('defineConfig expects a configuration object')
  })

  it('should throw if editors is not an object', () => {
    expect(() => defineConfig({ editors: 'invalid' })).toThrow('"editors" must be an object')
  })

  it('should throw if editors is a number', () => {
    expect(() => defineConfig({ editors: 123 })).toThrow('"editors" must be an object')
  })

  it('should throw if editors is a boolean', () => {
    expect(() => defineConfig({ editors: true })).toThrow('"editors" must be an object')
  })

  it('should accept config with valid editors object', () => {
    const config = { editors: { main: { toolbar: ['bold'] } } }
    expect(defineConfig(config)).toBe(config)
  })

  it('should accept config with no editors key', () => {
    const config = { theme: 'dark' }
    expect(defineConfig(config)).toBe(config)
  })

  it('should accept empty object', () => {
    const config = {}
    expect(defineConfig(config)).toBe(config)
  })

  it('should accept config with editors set to null (falsy passes check)', () => {
    const config = { editors: null }
    expect(defineConfig(config)).toBe(config)
  })

  it('should preserve all config properties', () => {
    const config = {
      toolbar: ['bold'],
      plugins: [],
      theme: 'dark',
      editors: { main: {} },
    }
    const result = defineConfig(config)
    expect(result.toolbar).toEqual(['bold'])
    expect(result.theme).toBe('dark')
    expect(result.editors.main).toEqual({})
  })
})
