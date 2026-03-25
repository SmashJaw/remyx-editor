/**
 * A simple publish/subscribe event system.
 */
export class EventBus {
  /**
   * Creates a new EventBus instance with an empty listener map.
   */
  constructor() {
    this._listeners = new Map()
    this._keyedHandlers = new Map() // Maps "event:key" to handler for keyed subscriptions
    // Task 275: Emit depth counter to prevent infinite recursion
    this._emitDepth = 0
  }

  /**
   * Subscribes a handler to an event.
   * @param {string} event - The event name to listen for
   * @param {Function} handler - The callback function to invoke when the event fires
   * @param {Object} [options] - Optional configuration
   * @param {string} [options.key] - If provided, replaces any existing handler with the same key
   * @returns {Function} An unsubscribe function that removes this listener when called
   */
  on(event, handler, options) {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set())
    }

    // Keyed handler: replace existing handler with same key
    if (options?.key) {
      const compositeKey = `${event}:${options.key}`
      const existing = this._keyedHandlers.get(compositeKey)
      if (existing) {
        this.off(event, existing)
      }
      this._keyedHandlers.set(compositeKey, handler)
    }

    this._listeners.get(event).add(handler)
    return () => this.off(event, handler)
  }

  /**
   * Removes a specific handler from an event.
   * @param {string} event - The event name to unsubscribe from
   * @param {Function} handler - The handler function to remove
   * @returns {void}
   */
  off(event, handler) {
    const handlers = this._listeners.get(event)
    if (handlers) {
      handlers.delete(handler)
      if (handlers.size === 0) {
        this._listeners.delete(event)
      }
    }
  }

  /**
   * Subscribes a handler that will be called at most once, then automatically removed.
   * @param {string} event - The event name to listen for
   * @param {Function} handler - The callback function to invoke once
   * @returns {Function} An unsubscribe function that removes this listener when called
   */
  once(event, handler) {
    const wrapper = (...args) => {
      this.off(event, wrapper)
      handler(...args)
    }
    return this.on(event, wrapper)
  }

  /**
   * Emits an event, invoking all registered handlers with the given data.
   * Errors in individual handlers are caught and logged without interrupting other handlers.
   * @param {string} event - The event name to emit
   * @param {*} [data] - Optional data to pass to each handler
   * @returns {void}
   */
  emit(event, data) {
    const handlers = this._listeners.get(event)
    if (handlers) {
      // Task 275: Track emit depth to prevent infinite recursion
      this._emitDepth++
      try {
        handlers.forEach((handler) => {
          try {
            handler(data)
          } catch (err) {
            console.error(`EventBus error in "${event}" handler:`, err)
            // Forward handler errors to 'error' event (with recursion guard)
            if (event !== 'error' && this._emitDepth < 2) {
              this.emit('error', { event, error: err, data })
            }
          }
        })
      } finally {
        this._emitDepth--
      }
    }
  }

  /**
   * Removes all listeners for a specific event, or all listeners entirely.
   * @param {string} [event] - The event name to clear. If omitted, all listeners are removed.
   * @returns {void}
   */
  removeAllListeners(event) {
    if (event) {
      this._listeners.delete(event)
    } else {
      this._listeners.clear()
    }
  }
}
