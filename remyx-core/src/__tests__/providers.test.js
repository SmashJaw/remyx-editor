import { vi } from 'vitest'
import {
  LocalStorageProvider,
  SessionStorageProvider,
  FileSystemProvider,
  CloudProvider,
  CustomProvider,
  createStorageProvider,
} from '../autosave/providers.js'

// ── LocalStorageProvider ─────────────────────────────────────────

describe('LocalStorageProvider', () => {
  let provider

  beforeEach(() => {
    localStorage.clear()
    provider = new LocalStorageProvider()
  })

  it('saves and loads content', async () => {
    await provider.save('doc-1', '<p>Hello</p>')
    const result = await provider.load('doc-1')
    expect(result).not.toBeNull()
    expect(result.content).toBe('<p>Hello</p>')
    expect(result.timestamp).toBeGreaterThan(0)
    expect(result.version).toBe(1)
  })

  it('returns null for missing key', async () => {
    const result = await provider.load('nonexistent')
    expect(result).toBeNull()
  })

  it('clears stored content', async () => {
    await provider.save('doc-1', '<p>Hello</p>')
    await provider.clear('doc-1')
    const result = await provider.load('doc-1')
    expect(result).toBeNull()
  })

  it('uses custom prefix', async () => {
    const custom = new LocalStorageProvider({ prefix: 'myapp' })
    await custom.save('doc-1', '<p>Test</p>')
    expect(localStorage.getItem('myapp:doc-1')).toBeTruthy()
  })

  it('saveSync stores content synchronously', () => {
    const ok = provider.saveSync('doc-1', '<p>Sync</p>')
    expect(ok).toBe(true)
    const raw = localStorage.getItem('rmx-autosave:doc-1')
    expect(JSON.parse(raw).content).toBe('<p>Sync</p>')
  })

  it('handles corrupted data gracefully', async () => {
    localStorage.setItem('rmx-autosave:doc-1', 'not json')
    const result = await provider.load('doc-1')
    expect(result).toBeNull()
  })

  it('throws on quota exceeded', async () => {
    // Mock localStorage.setItem to throw
    const orig = Storage.prototype.setItem
    Storage.prototype.setItem = () => { throw new DOMException('QuotaExceededError') }
    await expect(provider.save('doc-1', 'content')).rejects.toThrow('LocalStorage save failed')
    Storage.prototype.setItem = orig
  })

  it('load returns null when localStorage.getItem throws', async () => {
    const orig = Storage.prototype.getItem
    Storage.prototype.getItem = () => { throw new Error('Access denied') }
    const result = await provider.load('doc-1')
    expect(result).toBeNull()
    Storage.prototype.getItem = orig
  })

  it('saveSync returns false on error', () => {
    const orig = Storage.prototype.setItem
    Storage.prototype.setItem = () => { throw new DOMException('QuotaExceededError') }
    const ok = provider.saveSync('doc-1', 'content')
    expect(ok).toBe(false)
    Storage.prototype.setItem = orig
  })
})

// ── SessionStorageProvider ───────────────────────────────────────

describe('SessionStorageProvider', () => {
  let provider

  beforeEach(() => {
    sessionStorage.clear()
    provider = new SessionStorageProvider()
  })

  it('saves and loads content', async () => {
    await provider.save('doc-1', '<p>Session</p>')
    const result = await provider.load('doc-1')
    expect(result.content).toBe('<p>Session</p>')
  })

  it('clears stored content', async () => {
    await provider.save('doc-1', '<p>Test</p>')
    await provider.clear('doc-1')
    expect(await provider.load('doc-1')).toBeNull()
  })

  it('throws on save error (quota exceeded)', async () => {
    const orig = Storage.prototype.setItem
    Storage.prototype.setItem = () => { throw new DOMException('QuotaExceededError') }
    await expect(provider.save('doc-1', 'content')).rejects.toThrow('SessionStorage save failed')
    Storage.prototype.setItem = orig
  })

  it('returns null for missing key on load', async () => {
    const result = await provider.load('nonexistent')
    expect(result).toBeNull()
  })

  it('returns null when sessionStorage.getItem throws on load', async () => {
    const orig = Storage.prototype.getItem
    Storage.prototype.getItem = () => { throw new Error('Access denied') }
    const result = await provider.load('doc-1')
    expect(result).toBeNull()
    Storage.prototype.getItem = orig
  })

  it('saveSync stores content synchronously and returns true', () => {
    const ok = provider.saveSync('doc-1', '<p>Sync</p>')
    expect(ok).toBe(true)
    const raw = sessionStorage.getItem('rmx-autosave:doc-1')
    expect(JSON.parse(raw).content).toBe('<p>Sync</p>')
  })

  it('saveSync returns false on error', () => {
    const orig = Storage.prototype.setItem
    Storage.prototype.setItem = () => { throw new DOMException('QuotaExceededError') }
    const ok = provider.saveSync('doc-1', 'content')
    expect(ok).toBe(false)
    Storage.prototype.setItem = orig
  })
})

// ── FileSystemProvider ──────────────────────────────────────────

describe('FileSystemProvider', () => {
  it('delegates to writeFn/readFn/deleteFn', async () => {
    const store = {}
    const provider = new FileSystemProvider({
      writeFn: async (key, data) => { store[key] = data },
      readFn: async (key) => store[key] || null,
      deleteFn: async (key) => { delete store[key] },
    })

    await provider.save('doc-1', '<p>FS</p>')
    const result = await provider.load('doc-1')
    expect(result.content).toBe('<p>FS</p>')

    await provider.clear('doc-1')
    expect(await provider.load('doc-1')).toBeNull()
  })

  it('throws if required functions are missing', () => {
    expect(() => new FileSystemProvider({})).toThrow('writeFn')
    expect(() => new FileSystemProvider({ writeFn: vi.fn() })).toThrow('readFn')
    expect(() => new FileSystemProvider({ writeFn: vi.fn(), readFn: vi.fn() })).toThrow('deleteFn')
  })
})

// ── CloudProvider ───────────────────────────────────────────────

describe('CloudProvider', () => {
  it('sends PUT request on save', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true })
    const provider = new CloudProvider({
      endpoint: 'https://api.example.com/autosave',
      headers: { Authorization: 'Bearer token123' },
      fetchFn: mockFetch,
    })

    await provider.save('doc-1', '<p>Cloud</p>')
    expect(mockFetch).toHaveBeenCalledTimes(1)
    const [url, opts] = mockFetch.mock.calls[0]
    expect(url).toBe('https://api.example.com/autosave')
    expect(opts.method).toBe('PUT')
    expect(opts.headers.Authorization).toBe('Bearer token123')
    expect(JSON.parse(opts.body).content).toBe('<p>Cloud</p>')
  })

  it('sends GET request on load', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ content: '<p>Loaded</p>', timestamp: 123, version: 1 }),
    })
    const provider = new CloudProvider({
      endpoint: 'https://api.example.com/autosave',
      fetchFn: mockFetch,
    })

    const result = await provider.load('doc-1')
    expect(result.content).toBe('<p>Loaded</p>')
  })

  it('returns null on 404', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: false, status: 404 })
    const provider = new CloudProvider({
      endpoint: 'https://api.example.com/autosave',
      fetchFn: mockFetch,
    })

    expect(await provider.load('missing')).toBeNull()
  })

  it('retries on network error', async () => {
    const mockFetch = vi.fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({ ok: true })
    const provider = new CloudProvider({
      endpoint: 'https://api.example.com/autosave',
      fetchFn: mockFetch,
    })

    await provider.save('doc-1', 'content')
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('uses buildUrl for custom URL patterns (e.g. S3 presigned)', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true })
    const provider = new CloudProvider({
      endpoint: 'https://bucket.s3.amazonaws.com',
      buildUrl: (key) => `https://bucket.s3.amazonaws.com/${key}?X-Amz-Signature=abc`,
      fetchFn: mockFetch,
    })

    await provider.save('doc-1', 'content')
    expect(mockFetch.mock.calls[0][0]).toContain('X-Amz-Signature')
  })

  it('throws without endpoint or buildUrl', () => {
    expect(() => new CloudProvider({ fetchFn: vi.fn() })).toThrow('endpoint or buildUrl')
  })

  it('_loadUrl appends with & when endpoint already has query params', () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ content: '<p>Test</p>', timestamp: 1, version: 1 }),
    })
    const provider = new CloudProvider({
      endpoint: 'https://api.example.com/autosave?token=abc',
      fetchFn: mockFetch,
    })

    // Access internal _loadUrl to verify separator logic
    const url = provider._loadUrl('doc-1')
    expect(url).toBe('https://api.example.com/autosave?token=abc&key=doc-1')
  })

  it('load returns null on non-404 error status', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: false, status: 500 })
    const provider = new CloudProvider({
      endpoint: 'https://api.example.com/autosave',
      fetchFn: mockFetch,
    })

    const result = await provider.load('doc-1')
    // The non-404 error throws, which is caught, returning null
    expect(result).toBeNull()
  })

  it('load returns null on fetch network error', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('Network failure'))
    const provider = new CloudProvider({
      endpoint: 'https://api.example.com/autosave',
      fetchFn: mockFetch,
    })

    const result = await provider.load('doc-1')
    expect(result).toBeNull()
  })

  it('clear catches errors silently', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('Network failure'))
    const provider = new CloudProvider({
      endpoint: 'https://api.example.com/autosave',
      fetchFn: mockFetch,
    })

    // Should not throw
    await expect(provider.clear('doc-1')).resolves.toBeUndefined()
  })

  it('_deleteUrl falls back to _loadUrl when no buildDeleteUrl is provided', () => {
    const mockFetch = vi.fn()
    const provider = new CloudProvider({
      endpoint: 'https://api.example.com/autosave',
      fetchFn: mockFetch,
      // No buildDeleteUrl, no buildUrl — so buildDeleteUrl defaults to buildUrl which is undefined
    })

    // When buildDeleteUrl is falsy (derived from buildUrl which is undefined),
    // _deleteUrl falls back to _loadUrl
    const deleteUrl = provider._deleteUrl('doc-1')
    const loadUrl = provider._loadUrl('doc-1')
    expect(deleteUrl).toBe(loadUrl)
  })
})

// ── CustomProvider ──────────────────────────────────────────────

describe('CustomProvider', () => {
  it('delegates to custom save/load/clear', async () => {
    const store = {}
    const provider = new CustomProvider({
      save: async (key, content) => { store[key] = { content, timestamp: Date.now() } },
      load: async (key) => store[key] || null,
      clear: async (key) => { delete store[key] },
    })

    await provider.save('doc-1', '<p>Custom</p>')
    const result = await provider.load('doc-1')
    expect(result.content).toBe('<p>Custom</p>')

    await provider.clear('doc-1')
    expect(await provider.load('doc-1')).toBeNull()
  })

  it('throws if functions are missing', () => {
    expect(() => new CustomProvider({})).toThrow('save function')
  })
})

// ── createStorageProvider factory ────────────────────────────────

describe('createStorageProvider', () => {
  it('defaults to LocalStorageProvider', () => {
    const p = createStorageProvider()
    expect(p).toBeInstanceOf(LocalStorageProvider)
  })

  it('resolves "localStorage" string', () => {
    expect(createStorageProvider('localStorage')).toBeInstanceOf(LocalStorageProvider)
  })

  it('resolves "sessionStorage" string', () => {
    expect(createStorageProvider('sessionStorage')).toBeInstanceOf(SessionStorageProvider)
  })

  it('resolves cloud config', () => {
    const p = createStorageProvider({ endpoint: 'https://api.example.com', fetchFn: vi.fn() })
    expect(p).toBeInstanceOf(CloudProvider)
  })

  it('resolves filesystem config', () => {
    const p = createStorageProvider({ writeFn: vi.fn(), readFn: vi.fn(), deleteFn: vi.fn() })
    expect(p).toBeInstanceOf(FileSystemProvider)
  })

  it('resolves custom provider from plain object with save/load/clear', () => {
    const p = createStorageProvider({ save: vi.fn(), load: vi.fn(), clear: vi.fn() })
    expect(p).toBeInstanceOf(CustomProvider)
  })

  it('passes through already-instantiated providers', () => {
    const existing = new LocalStorageProvider()
    expect(createStorageProvider(existing)).toBe(existing)
  })

  it('resolves prefix-only config to LocalStorageProvider', () => {
    const p = createStorageProvider({ prefix: 'myapp' })
    expect(p).toBeInstanceOf(LocalStorageProvider)
  })

  it('throws for unknown config', () => {
    expect(() => createStorageProvider(42)).toThrow('Unknown storage provider')
  })

  it('throws for unknown string config', () => {
    expect(() => createStorageProvider('indexedDB')).toThrow('Unknown storage provider')
  })

  it('resolves FileSystemProvider from config with writeFn/readFn/deleteFn', () => {
    const p = createStorageProvider({
      writeFn: vi.fn(),
      readFn: vi.fn(),
      deleteFn: vi.fn(),
    })
    expect(p).toBeInstanceOf(FileSystemProvider)
  })

  it('resolves LocalStorageProvider with custom prefix', () => {
    const p = createStorageProvider({ prefix: 'custom-app' })
    expect(p).toBeInstanceOf(LocalStorageProvider)
    expect(p.prefix).toBe('custom-app')
  })

  it('passes through an already-instantiated SessionStorageProvider', () => {
    const existing = new SessionStorageProvider()
    const result = createStorageProvider(existing)
    expect(result).toBe(existing)
  })

  it('throws for unresolvable object config', () => {
    expect(() => createStorageProvider({ foo: 'bar' })).toThrow('Unable to resolve storage provider')
  })
})
