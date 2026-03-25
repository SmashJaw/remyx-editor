import { EventBus } from './EventBus.js'

/**
 * A global inter-editor communication bus.
 *
 * EditorBus is a process-wide singleton that lets multiple EditorEngine
 * instances on the same page communicate without direct references to
 * each other.
 *
 * Typical use-cases:
 * - Source + preview linked editors (content sync)
 * - Master/detail layouts where selecting in one editor loads content in another
 * - Broadcasting "save" or "theme change" to all editors at once
 *
 * @example
 * import { EditorBus } from '@remyxjs/core';
 *
 * // In editor A — broadcast content on every change
 * engineA.on('content:change', () => {
 *   EditorBus.emit('sync:content', { id: 'editor-a', html: engineA.getHTML() });
 * });
 *
 * // In editor B — listen for updates from A
 * EditorBus.on('sync:content', ({ id, html }) => {
 *   if (id !== 'editor-b') engineB.setHTML(html);
 * });
 */
class EditorBusImpl {
  constructor() {
    /** @private */
    this._bus = new EventBus()
    /** @private @type {Map<string, import('./EditorEngine.js').EditorEngine>} */
    this._registry = new Map()
  }

  // ── Registry ──────────────────────────────────────────────────────

  /**
   * Register an editor instance so other editors can look it up by ID.
   * @param {string} id - A unique identifier for the editor
   * @param {import('./EditorEngine.js').EditorEngine} engine - The editor engine instance
   * @returns {void}
   */
  register(id, engine) {
    this._registry.set(id, engine)
    this._bus.emit('editor:registered', { id, engine })
  }

  /**
   * Unregister an editor (typically called during destroy).
   * @param {string} id - The identifier of the editor to remove
   * @returns {void}
   */
  unregister(id) {
    this._registry.delete(id)
    this._bus.emit('editor:unregistered', { id })
  }

  /**
   * Get a registered editor by ID.
   * @param {string} id - The editor identifier
   * @returns {import('./EditorEngine.js').EditorEngine | undefined}
   */
  getEditor(id) {
    return this._registry.get(id)
  }

  /**
   * Get all registered editor IDs.
   * @returns {string[]}
   */
  getEditorIds() {
    return [...this._registry.keys()]
  }

  /**
   * Get the count of currently registered editors.
   * @returns {number}
   */
  get editorCount() {
    return this._registry.size
  }

  // ── Pub/Sub (delegates to EventBus) ───────────────────────────────

  /**
   * Subscribe to an inter-editor event.
   * @param {string} event - Event name (e.g. 'sync:content', 'theme:change')
   * @param {Function} handler - Callback
   * @param {Object} [options] - Options forwarded to EventBus.on
   * @returns {Function} Unsubscribe function
   */
  on(event, handler, options) {
    return this._bus.on(event, handler, options)
  }

  /**
   * Unsubscribe from an inter-editor event.
   * @param {string} event
   * @param {Function} handler
   */
  off(event, handler) {
    this._bus.off(event, handler)
  }

  /**
   * Subscribe to an event that fires at most once.
   * @param {string} event
   * @param {Function} handler
   * @returns {Function} Unsubscribe function
   */
  once(event, handler) {
    return this._bus.once(event, handler)
  }

  /**
   * Emit an event to all subscribers.
   * @param {string} event
   * @param {*} [data]
   */
  emit(event, data) {
    this._bus.emit(event, data)
  }

  /**
   * Broadcast an event to all registered editors by calling engine.eventBus.emit
   * on each one. Useful for pushing a global event (e.g. theme change) into every
   * editor's local event loop.
   *
   * @param {string} event - Event name to emit on each editor's eventBus
   * @param {*} [data] - Data to pass
   * @param {Object} [options]
   * @param {string} [options.exclude] - Editor ID to skip (e.g. the sender)
   */
  broadcast(event, data, options) {
    for (const [id, engine] of this._registry) {
      if (options?.exclude && id === options.exclude) continue
      engine.eventBus.emit(event, data)
    }
  }

  /**
   * Remove all listeners and clear the registry.
   * Primarily useful for test teardown.
   */
  reset() {
    this._bus.removeAllListeners()
    this._registry.clear()
  }
}

/**
 * Singleton inter-editor communication bus.
 * Import this directly — all editors on the page share the same instance.
 *
 * @type {EditorBusImpl}
 */
export const EditorBus = new EditorBusImpl()
