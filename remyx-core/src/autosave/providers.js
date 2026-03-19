/**
 * Autosave Storage Providers
 *
 * Pluggable adapters for persisting editor content to different backends.
 * Each provider implements: save(key, content, metadata), load(key), clear(key).
 */

const ENVELOPE_VERSION = 1

/** Wraps content in a versioned JSON envelope with timestamp */
function createEnvelope(content, metadata = {}) {
  return JSON.stringify({
    content,
    timestamp: Date.now(),
    version: ENVELOPE_VERSION,
    ...metadata,
  })
}

/** Parses a JSON envelope, returns null on failure */
function parseEnvelope(json) {
  if (!json) return null
  try {
    const data = JSON.parse(json)
    if (!data || typeof data.content !== 'string') return null
    return data
  } catch {
    return null
  }
}

// ── LocalStorageProvider ─────────────────────────────────────────

export class LocalStorageProvider {
  constructor({ prefix = 'rmx-autosave' } = {}) {
    this.prefix = prefix
  }

  _key(key) {
    return `${this.prefix}:${key}`
  }

  async save(key, content, metadata) {
    try {
      localStorage.setItem(this._key(key), createEnvelope(content, metadata))
    } catch (err) {
      throw new Error(`LocalStorage save failed: ${err.message}`)
    }
  }

  async load(key) {
    try {
      const raw = localStorage.getItem(this._key(key))
      return parseEnvelope(raw)
    } catch {
      return null
    }
  }

  async clear(key) {
    try {
      localStorage.removeItem(this._key(key))
    } catch {
      // Ignore removal errors
    }
  }

  /**
   * Synchronous save for beforeunload — localStorage is synchronous.
   * Returns true on success, false on failure.
   */
  saveSync(key, content, metadata) {
    try {
      localStorage.setItem(this._key(key), createEnvelope(content, metadata))
      return true
    } catch {
      return false
    }
  }
}

// ── SessionStorageProvider ───────────────────────────────────────

export class SessionStorageProvider {
  constructor({ prefix = 'rmx-autosave' } = {}) {
    this.prefix = prefix
  }

  _key(key) {
    return `${this.prefix}:${key}`
  }

  async save(key, content, metadata) {
    try {
      sessionStorage.setItem(this._key(key), createEnvelope(content, metadata))
    } catch (err) {
      throw new Error(`SessionStorage save failed: ${err.message}`)
    }
  }

  async load(key) {
    try {
      const raw = sessionStorage.getItem(this._key(key))
      return parseEnvelope(raw)
    } catch {
      return null
    }
  }

  async clear(key) {
    try {
      sessionStorage.removeItem(this._key(key))
    } catch {
      // Ignore removal errors
    }
  }

  saveSync(key, content, metadata) {
    try {
      sessionStorage.setItem(this._key(key), createEnvelope(content, metadata))
      return true
    } catch {
      return false
    }
  }
}

// ── FileSystemProvider ──────────────────────────────────────────

export class FileSystemProvider {
  /**
   * @param {Object} opts
   * @param {(key: string, data: string) => Promise<void>} opts.writeFn
   * @param {(key: string) => Promise<string|null>} opts.readFn
   * @param {(key: string) => Promise<void>} opts.deleteFn
   */
  constructor({ writeFn, readFn, deleteFn }) {
    if (typeof writeFn !== 'function') throw new Error('FileSystemProvider requires a writeFn')
    if (typeof readFn !== 'function') throw new Error('FileSystemProvider requires a readFn')
    if (typeof deleteFn !== 'function') throw new Error('FileSystemProvider requires a deleteFn')
    this.writeFn = writeFn
    this.readFn = readFn
    this.deleteFn = deleteFn
  }

  async save(key, content, metadata) {
    const envelope = createEnvelope(content, metadata)
    await this.writeFn(key, envelope)
  }

  async load(key) {
    const raw = await this.readFn(key)
    return parseEnvelope(raw)
  }

  async clear(key) {
    await this.deleteFn(key)
  }
}

// ── CloudProvider ───────────────────────────────────────────────

export class CloudProvider {
  /**
   * @param {Object} opts
   * @param {string} opts.endpoint - Base URL for the cloud API
   * @param {Record<string, string>} [opts.headers] - Auth/content headers
   * @param {string} [opts.method='PUT'] - HTTP method for save
   * @param {typeof fetch} [opts.fetchFn] - Custom fetch implementation
   * @param {(key: string) => string} [opts.buildUrl] - Custom URL builder (e.g. for S3 presigned URLs)
   * @param {(key: string, content: string) => string|FormData} [opts.buildBody] - Custom body builder
   * @param {(key: string) => string} [opts.buildLoadUrl] - Custom URL for load/GET requests
   * @param {(key: string) => string} [opts.buildDeleteUrl] - Custom URL for delete requests
   */
  constructor({
    endpoint,
    headers = {},
    method = 'PUT',
    fetchFn,
    buildUrl,
    buildBody,
    buildLoadUrl,
    buildDeleteUrl,
  }) {
    if (!endpoint && !buildUrl) throw new Error('CloudProvider requires an endpoint or buildUrl')
    // Validate endpoint URL to prevent injection via user-supplied strings
    if (endpoint) {
      try {
        const parsed = new URL(endpoint)
        if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
          throw new Error('CloudProvider endpoint must use http or https protocol')
        }
      } catch (err) {
        if (err.message.includes('protocol')) throw err
        throw new Error(`CloudProvider endpoint is not a valid URL: ${endpoint}`)
      }
    }
    this.endpoint = endpoint
    this.headers = headers
    this.method = method
    this._fetch = fetchFn || (typeof fetch !== 'undefined' ? fetch.bind(globalThis) : null)
    this.buildUrl = buildUrl
    this.buildBody = buildBody
    this.buildLoadUrl = buildLoadUrl || buildUrl
    this.buildDeleteUrl = buildDeleteUrl || buildUrl
    if (!this._fetch) throw new Error('CloudProvider requires fetch or a custom fetchFn')
  }

  _saveUrl(key) {
    return this.buildUrl ? this.buildUrl(key) : this.endpoint
  }

  _loadUrl(key) {
    if (this.buildLoadUrl) return this.buildLoadUrl(key)
    const sep = this.endpoint.includes('?') ? '&' : '?'
    return `${this.endpoint}${sep}key=${encodeURIComponent(key)}`
  }

  _deleteUrl(key) {
    return this.buildDeleteUrl ? this.buildDeleteUrl(key) : this._loadUrl(key)
  }

  async _fetchWithRetry(url, opts, retries = 1) {
    try {
      const res = await this._fetch(url, opts)
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      return res
    } catch (err) {
      if (retries > 0) {
        await new Promise(r => setTimeout(r, 1000))
        return this._fetchWithRetry(url, opts, retries - 1)
      }
      throw err
    }
  }

  async save(key, content, metadata) {
    const body = this.buildBody
      ? this.buildBody(key, content)
      : createEnvelope(content, metadata)

    const headers = { ...this.headers }
    if (!this.buildBody && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json'
    }

    await this._fetchWithRetry(this._saveUrl(key), {
      method: this.method,
      headers,
      body,
    })
  }

  async load(key) {
    try {
      const res = await this._fetch(this._loadUrl(key), {
        method: 'GET',
        headers: this.headers,
      })
      if (!res.ok) {
        if (res.status === 404) return null
        throw new Error(`HTTP ${res.status}`)
      }
      const text = await res.text()
      return parseEnvelope(text)
    } catch {
      return null
    }
  }

  async clear(key) {
    try {
      await this._fetch(this._deleteUrl(key), {
        method: 'DELETE',
        headers: this.headers,
      })
    } catch {
      // Best-effort delete
    }
  }
}

// ── CustomProvider ──────────────────────────────────────────────

export class CustomProvider {
  /**
   * @param {Object} opts
   * @param {(key: string, content: string, metadata?: object) => Promise<void>} opts.save
   * @param {(key: string) => Promise<{content: string, timestamp: number}|null>} opts.load
   * @param {(key: string) => Promise<void>} opts.clear
   */
  constructor({ save, load, clear }) {
    if (typeof save !== 'function') throw new Error('CustomProvider requires a save function')
    if (typeof load !== 'function') throw new Error('CustomProvider requires a load function')
    if (typeof clear !== 'function') throw new Error('CustomProvider requires a clear function')
    this._save = save
    this._load = load
    this._clear = clear
  }

  async save(key, content, metadata) {
    await this._save(key, content, metadata)
  }

  async load(key) {
    return this._load(key)
  }

  async clear(key) {
    await this._clear(key)
  }
}

// ── Factory ─────────────────────────────────────────────────────

/**
 * Resolves a provider config shorthand into a StorageProvider instance.
 *
 * @param {string|object|undefined} config
 *   - undefined / 'localStorage' → LocalStorageProvider
 *   - 'sessionStorage' → SessionStorageProvider
 *   - { save, load, clear } → CustomProvider (or already a provider instance)
 *   - { endpoint, ... } → CloudProvider
 *   - { writeFn, readFn, deleteFn } → FileSystemProvider
 * @returns {StorageProvider}
 */
export function createStorageProvider(config) {
  if (!config || config === 'localStorage') {
    return new LocalStorageProvider()
  }
  if (config === 'sessionStorage') {
    return new SessionStorageProvider()
  }
  if (typeof config !== 'object') {
    throw new Error(`Unknown storage provider: ${config}`)
  }

  // Already a provider instance (has save/load/clear methods)
  if (typeof config.save === 'function' && typeof config.load === 'function' && typeof config.clear === 'function') {
    // Check if it's a plain config object (CustomProvider) vs an existing instance
    if (config.constructor === Object) {
      return new CustomProvider(config)
    }
    // Already instantiated provider
    return config
  }

  // Cloud provider (has endpoint or buildUrl)
  if (config.endpoint || config.buildUrl) {
    return new CloudProvider(config)
  }

  // FileSystem provider (has writeFn)
  if (config.writeFn) {
    return new FileSystemProvider(config)
  }

  // LocalStorageProvider with custom prefix
  if (config.prefix) {
    return new LocalStorageProvider(config)
  }

  throw new Error('Unable to resolve storage provider from config')
}
