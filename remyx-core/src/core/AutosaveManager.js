/**
 * AutosaveManager — framework-agnostic autosave engine.
 *
 * Subscribes to `content:change` events, debounces saves, runs periodic
 * interval saves, and checks for crash-recoverable content on init.
 *
 * Emits via engine.eventBus:
 *   - autosave:saving     — save started
 *   - autosave:saved      — save succeeded, payload: { timestamp }
 *   - autosave:error      — save failed, payload: { error }
 *   - autosave:recovered  — recovery data found, payload: { recoveredContent, timestamp }
 */

import { createStorageProvider } from '../autosave/providers.js'

export class AutosaveManager {
  /**
   * @param {import('./EditorEngine.js').EditorEngine} engine
   * @param {Object} [options]
   * @param {string|object} [options.provider] - Storage provider config (see createStorageProvider)
   * @param {string}  [options.key='rmx-default'] - Storage key for this editor instance
   * @param {number}  [options.interval=30000]    - Periodic save interval in ms
   * @param {number}  [options.debounce=2000]     - Debounce delay after content change in ms
   * @param {boolean} [options.enabled=true]      - Whether autosave is active
   */
  constructor(engine, options = {}) {
    this.engine = engine
    this.provider = createStorageProvider(options.provider)
    this.key = options.key || 'rmx-default'
    this.interval = options.interval ?? 30000
    this.debounceMs = options.debounce ?? 2000
    this.enabled = options.enabled !== false

    this._debounceTimer = null
    this._intervalTimer = null
    this._isSaving = false
    this._pendingSave = false
    this._lastSavedContent = null
    this._contentChangeHandler = null
    this._beforeUnloadHandler = null
    this._destroyed = false
    this._consecutiveErrors = 0
    this._maxRetries = options.maxRetries ?? 5
  }

  /**
   * Start listening for content changes and begin periodic saves.
   * Call this after the engine is fully initialized.
   */
  init() {
    if (!this.enabled || this._destroyed) return

    // Subscribe to content changes
    this._contentChangeHandler = () => {
      this._scheduleDebouncedSave()
    }
    this._unsubContentChange = this.engine.eventBus.on('content:change', this._contentChangeHandler)

    // Start periodic interval saves
    if (this.interval > 0) {
      this._intervalTimer = setInterval(() => {
        this.save()
      }, this.interval)
    }

    // Register beforeunload for last-chance save
    if (typeof window !== 'undefined') {
      this._beforeUnloadHandler = () => {
        this._attemptSyncSave()
      }
      window.addEventListener('beforeunload', this._beforeUnloadHandler)
    }
  }

  /**
   * Stop all timers, remove listeners, and perform a final save.
   */
  destroy() {
    // Clear timers
    if (this._debounceTimer) {
      clearTimeout(this._debounceTimer)
      this._debounceTimer = null
    }
    if (this._intervalTimer) {
      clearInterval(this._intervalTimer)
      this._intervalTimer = null
    }

    // Remove content:change listener
    if (this._unsubContentChange) {
      this._unsubContentChange()
      this._unsubContentChange = null
    }

    // Remove beforeunload
    if (this._beforeUnloadHandler && typeof window !== 'undefined') {
      window.removeEventListener('beforeunload', this._beforeUnloadHandler)
      this._beforeUnloadHandler = null
    }

    // Final save attempt (fire-and-forget), then mark as destroyed
    this.save().catch(() => {}).finally(() => { this._destroyed = true })
  }

  /**
   * Save the current editor content to the storage provider.
   * Deduplicates by comparing against last saved content.
   */
  async save() {
    if (!this.engine || this._destroyed) return

    const content = this.engine.getHTML()

    // Skip if content hasn't changed since last save
    if (content === this._lastSavedContent) return

    // Prevent concurrent saves
    if (this._isSaving) {
      this._pendingSave = true
      return
    }

    this._isSaving = true
    this.engine.eventBus.emit('autosave:saving')

    try {
      await this.provider.save(this.key, content)
      this._lastSavedContent = content
      this._consecutiveErrors = 0

      const timestamp = Date.now()
      this.engine.eventBus.emit('autosave:saved', { timestamp })
    } catch (error) {
      this._consecutiveErrors++
      this.engine.eventBus.emit('autosave:error', { error, retryCount: this._consecutiveErrors })
    } finally {
      this._isSaving = false

      // If a save was requested while we were saving, retry with exponential backoff
      if (this._pendingSave) {
        this._pendingSave = false
        if (this._consecutiveErrors >= this._maxRetries) {
          this.engine.eventBus.emit('autosave:error', {
            error: new Error(`Autosave failed after ${this._maxRetries} consecutive attempts`),
            fatal: true,
          })
        } else if (this._consecutiveErrors > 0) {
          // Exponential backoff: 1s, 2s, 4s, 8s, 16s
          const delay = Math.min(1000 * Math.pow(2, this._consecutiveErrors - 1), 30000)
          setTimeout(() => this.save(), delay)
        } else {
          this.save()
        }
      }
    }
  }

  /**
   * Check if there is recoverable content that differs from the current editor content.
   * @param {string} currentContent - The editor's current HTML content
   * @returns {Promise<{recoveredContent: string, timestamp: number}|null>}
   */
  async checkRecovery(currentContent) {
    try {
      const stored = await this.provider.load(this.key)
      if (!stored || !stored.content) return null

      // Normalize for comparison (trim whitespace)
      const storedNorm = stored.content.trim()
      const currentNorm = (currentContent || '').trim()

      // Only offer recovery if content actually differs and stored content is non-empty
      if (storedNorm && storedNorm !== currentNorm) {
        return {
          recoveredContent: stored.content,
          timestamp: stored.timestamp || Date.now(),
        }
      }

      return null
    } catch {
      return null
    }
  }

  /**
   * Clear the stored recovery content.
   */
  async clearRecovery() {
    try {
      await this.provider.clear(this.key)
    } catch {
      // Best-effort clear
    }
  }

  /**
   * Schedule a debounced save after content changes.
   * @private
   */
  _scheduleDebouncedSave() {
    if (this._debounceTimer) {
      clearTimeout(this._debounceTimer)
    }
    this._debounceTimer = setTimeout(() => {
      this._debounceTimer = null
      this.save()
    }, this.debounceMs)
  }

  /**
   * Attempt a synchronous save for beforeunload.
   * Only works for providers that support saveSync (localStorage/sessionStorage).
   * For async providers, uses navigator.sendBeacon as fallback.
   * @private
   */
  _attemptSyncSave() {
    if (!this.engine || this._destroyed) return

    const content = this.engine.getHTML()
    if (content === this._lastSavedContent) return

    // Try sync save (localStorage/sessionStorage providers)
    if (typeof this.provider.saveSync === 'function') {
      this.provider.saveSync(this.key, content)
      return
    }

    // Fallback: sendBeacon for async providers
    if (typeof navigator !== 'undefined' && navigator.sendBeacon && this.provider.endpoint) {
      try {
        const body = JSON.stringify({
          key: this.key,
          content,
          timestamp: Date.now(),
          version: 1,
        })
        navigator.sendBeacon(this.provider.endpoint, body)
      } catch {
        // Best-effort
      }
    }
  }
}
