import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { loadConfig } from '../config/loadConfig.js'

describe('loadConfig', () => {
  let originalFetch

  beforeEach(() => {
    originalFetch = globalThis.fetch
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  function mockFetch(text, opts = {}) {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: opts.ok !== undefined ? opts.ok : true,
        status: opts.status || 200,
        text: () => Promise.resolve(text),
      })
    )
  }

  it('loads and parses a JSON config', async () => {
    const config = { theme: 'dark', toolbar: ['bold', 'italic'] }
    mockFetch(JSON.stringify(config))

    const result = await loadConfig('https://example.com/config.json')
    expect(result).toEqual(config)
  })

  it('throws on HTTP error', async () => {
    mockFetch('Not Found', { ok: false, status: 404 })

    await expect(loadConfig('https://example.com/config.json')).rejects.toThrow('HTTP 404')
  })

  it('throws on non-object config', async () => {
    mockFetch('"just a string"')

    await expect(loadConfig('https://example.com/config.json')).rejects.toThrow('must be a JSON/YAML object')
  })

  it('parses YAML files by extension', async () => {
    mockFetch(`theme: ocean\nheight: 500\nreadOnly: true`)

    const result = await loadConfig('https://example.com/config.yaml')
    expect(result).toEqual({ theme: 'ocean', height: 500, readOnly: true })
  })

  it('parses .yml extension', async () => {
    mockFetch(`theme: dark\nplaceholder: "Type here..."`)

    const result = await loadConfig('https://example.com/config.yml')
    expect(result).toEqual({ theme: 'dark', placeholder: 'Type here...' })
  })

  it('handles YAML booleans and null', async () => {
    mockFetch(`readOnly: true\nautosave: false\nvalue: null`)

    const result = await loadConfig('https://example.com/config.yaml')
    expect(result).toEqual({ readOnly: true, autosave: false, value: null })
  })

  it('handles inline YAML arrays', async () => {
    mockFetch(`toolbar: [bold, italic, underline]`)

    const result = await loadConfig('https://example.com/config.yaml')
    expect(result.toolbar).toEqual(['bold', 'italic', 'underline'])
  })

  it('merges environment-specific config', async () => {
    const config = {
      theme: 'light',
      height: 300,
      env: {
        production: { height: 600, readOnly: true },
        development: { height: 400 },
      },
    }
    mockFetch(JSON.stringify(config))

    const result = await loadConfig('https://example.com/config.json', { env: 'production' })
    expect(result).toEqual({ theme: 'light', height: 600, readOnly: true })
    expect(result.env).toBeUndefined()
  })

  it('strips env key when no env option is provided', async () => {
    const config = {
      theme: 'light',
      env: { production: { theme: 'dark' } },
    }
    mockFetch(JSON.stringify(config))

    const result = await loadConfig('https://example.com/config.json')
    expect(result).toEqual({ theme: 'light' })
    expect(result.env).toBeUndefined()
  })

  it('uses base config when env name not found in env overrides', async () => {
    const config = {
      theme: 'light',
      env: { production: { theme: 'dark' } },
    }
    mockFetch(JSON.stringify(config))

    const result = await loadConfig('https://example.com/config.json', { env: 'staging' })
    expect(result).toEqual({ theme: 'light' })
  })

  it('deep merges nested objects in env overrides', async () => {
    const config = {
      theme: 'light',
      autosave: { enabled: true, interval: 5000 },
      env: {
        production: {
          autosave: { interval: 30000 },
        },
      },
    }
    mockFetch(JSON.stringify(config))

    const result = await loadConfig('https://example.com/config.json', { env: 'production' })
    expect(result.autosave).toEqual({ enabled: true, interval: 30000 })
  })

  it('passes custom headers to fetch', async () => {
    mockFetch('{}')

    await loadConfig('https://example.com/config.json', {
      headers: { Authorization: 'Bearer token123' },
    })

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://example.com/config.json',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer token123' }),
      })
    )
  })

  it('passes abort signal to fetch', async () => {
    const controller = new AbortController()
    mockFetch('{}')

    await loadConfig('https://example.com/config.json', { signal: controller.signal })

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://example.com/config.json',
      expect.objectContaining({ signal: controller.signal })
    )
  })

  it('falls back to YAML parse when JSON parse fails', async () => {
    // Non-YAML extension but YAML content
    mockFetch(`theme: forest\nheight: 400`)

    const result = await loadConfig('https://example.com/config')
    expect(result).toEqual({ theme: 'forest', height: 400 })
  })

  it('handles YAML nested objects', async () => {
    mockFetch(`theme: dark\nautosave:\n  enabled: true\n  interval: 5000`)

    const result = await loadConfig('https://example.com/config.yaml')
    expect(result.theme).toBe('dark')
    expect(result.autosave).toEqual({ enabled: true, interval: 5000 })
  })
})
