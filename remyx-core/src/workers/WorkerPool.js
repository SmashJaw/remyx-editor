/**
 * Optional Web Worker pool for offloading expensive operations.
 * Falls back to synchronous execution when workers are unavailable.
 *
 * @example
 * const pool = new WorkerPool({ maxWorkers: 4 })
 * const html = await pool.execute('sanitize', dirtyHtml)
 * pool.destroy()
 */
export class WorkerPool {
  /**
   * @param {Object} [options]
   * @param {number} [options.maxWorkers] - Maximum number of workers (defaults to hardwareConcurrency or 2)
   * @param {boolean} [options.enabled] - Set false to force synchronous fallback
   * @param {string} [options.workerURL] - URL to the worker script (defaults to editorWorker.js)
   */
  constructor(options = {}) {
    this._maxWorkers = options.maxWorkers || (typeof navigator !== 'undefined' ? navigator.hardwareConcurrency : 2) || 2
    this._workers = []
    this._queue = []
    this._nextId = 1
    this._pending = new Map() // id -> { resolve, reject }
    this._roundRobin = 0
    this._enabled = typeof Worker !== 'undefined' && options.enabled !== false
    this._workerURL = options.workerURL || null
  }

  /**
   * Execute a task in a worker (or synchronously if workers are unavailable).
   *
   * @param {string} taskType - One of: 'sanitize', 'markdown', 'convert'
   * @param {*} data - The data to send to the worker
   * @returns {Promise<*>} The result from the worker
   */
  async execute(taskType, data) {
    if (!this._enabled) {
      return this._executeFallback(taskType, data)
    }

    // Lazily spawn workers
    if (this._workers.length < this._maxWorkers) {
      this._spawnWorker()
    }

    const id = this._nextId++
    const worker = this._workers[this._roundRobin % this._workers.length]
    this._roundRobin++

    return new Promise((resolve, reject) => {
      this._pending.set(id, { resolve, reject })
      worker.postMessage({ id, type: taskType, data })
    })
  }

  /**
   * Synchronous fallback for environments without Worker support.
   *
   * @private
   * @param {string} taskType
   * @param {*} data
   * @returns {*}
   */
  _executeFallback(taskType, data) {
    switch (taskType) {
      case 'sanitize':
        // Minimal strip for fallback — main-thread sanitizer handles the rest
        return data
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
      case 'markdown':
        // Return as-is; caller should use markdownToHtml from utils
        return data
      case 'convert':
        return { format: data.format, html: null, fallback: true }
      default:
        throw new Error(`Unknown task type: ${taskType}`)
    }
  }

  /**
   * Spawn a new worker and wire up the message handler.
   *
   * @private
   */
  _spawnWorker() {
    try {
      const workerURL = this._workerURL || new URL('./editorWorker.js', import.meta.url).href
      const worker = new Worker(workerURL, { type: 'module' })

      worker.onmessage = (e) => {
        const { id, result, error } = e.data
        const handler = this._pending.get(id)
        if (handler) {
          this._pending.delete(id)
          if (error) {
            handler.reject(new Error(error))
          } else {
            handler.resolve(result)
          }
        }
      }

      worker.onerror = (err) => {
        console.error('[WorkerPool] Worker error:', err)
      }

      this._workers.push(worker)
    } catch (err) {
      // Worker creation failed — disable pool and use fallback
      console.warn('[WorkerPool] Failed to spawn worker, falling back to sync:', err.message)
      this._enabled = false
    }
  }

  /**
   * Returns whether the pool is using real workers.
   * @returns {boolean}
   */
  get isEnabled() {
    return this._enabled
  }

  /**
   * Returns the number of currently active workers.
   * @returns {number}
   */
  get workerCount() {
    return this._workers.length
  }

  /**
   * Terminates all workers and rejects any pending tasks.
   */
  destroy() {
    this._workers.forEach(w => w.terminate())
    this._workers = []

    // Reject any pending tasks
    this._pending.forEach(({ reject }) => {
      reject(new Error('WorkerPool destroyed'))
    })
    this._pending.clear()
    this._queue = []
  }
}
