/**
 * WebSocketTransport — Built-in WebSocket transport with auto-reconnect.
 *
 * Implements the Transport interface:
 *   connect(), disconnect(), send(msg), onMessage(cb),
 *   onConnect(cb), onDisconnect(cb), isConnected()
 *
 * @param {string} url - WebSocket URL (wss://...)
 * @param {Object} [options]
 * @param {boolean} [options.reconnect=true] - auto-reconnect on disconnect
 * @param {number} [options.reconnectInterval=2000] - base interval (ms)
 * @param {number} [options.maxReconnectAttempts=10] - max retries
 * @param {number} [options.maxReconnectDelay=30000] - max backoff delay (ms)
 */
export class WebSocketTransport {
  constructor(url, options = {}) {
    this._url = url
    this._reconnect = options.reconnect !== false
    this._reconnectInterval = options.reconnectInterval || 2000
    this._maxAttempts = options.maxReconnectAttempts || 10
    this._maxDelay = options.maxReconnectDelay || 30000

    /** @type {WebSocket|null} */
    this._ws = null
    this._messageHandler = null
    this._connectHandler = null
    this._disconnectHandler = null
    this._reconnectTimer = null
    this._reconnectAttempts = 0
    this._intentionalClose = false
  }

  /**
   * Open a WebSocket connection.
   */
  connect() {
    if (this._ws && this._ws.readyState === WebSocket.OPEN) return

    this._intentionalClose = false
    this._reconnectAttempts = 0

    try {
      this._ws = new WebSocket(this._url)
    } catch (e) {
      console.warn('[WebSocketTransport] Failed to create WebSocket:', e.message)
      this._scheduleReconnect()
      return
    }

    this._ws.onopen = () => {
      this._reconnectAttempts = 0
      this._connectHandler?.()
    }

    this._ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        this._messageHandler?.(msg)
      } catch (e) {
        console.warn('[WebSocketTransport] Invalid message:', e.message)
      }
    }

    this._ws.onclose = () => {
      this._disconnectHandler?.()
      if (!this._intentionalClose && this._reconnect) {
        this._scheduleReconnect()
      }
    }

    this._ws.onerror = () => {
      // onclose will fire after onerror
    }
  }

  /**
   * Close the connection (no auto-reconnect).
   */
  disconnect() {
    this._intentionalClose = true
    clearTimeout(this._reconnectTimer)
    this._reconnectTimer = null
    if (this._ws) {
      this._ws.onclose = null
      this._ws.onerror = null
      this._ws.onmessage = null
      this._ws.onopen = null
      if (this._ws.readyState === WebSocket.OPEN || this._ws.readyState === WebSocket.CONNECTING) {
        this._ws.close()
      }
      this._ws = null
    }
  }

  /**
   * Send a JSON message. Silently drops if disconnected (CrdtEngine queues ops).
   * @param {Object} msg
   */
  send(msg) {
    if (this._ws && this._ws.readyState === WebSocket.OPEN) {
      this._ws.send(JSON.stringify(msg))
    }
  }

  /**
   * Register message handler.
   * @param {function(Object): void} cb
   */
  onMessage(cb) {
    this._messageHandler = cb
  }

  /**
   * Register connect handler.
   * @param {function(): void} cb
   */
  onConnect(cb) {
    this._connectHandler = cb
  }

  /**
   * Register disconnect handler.
   * @param {function(): void} cb
   */
  onDisconnect(cb) {
    this._disconnectHandler = cb
  }

  /**
   * @returns {boolean}
   */
  isConnected() {
    return this._ws?.readyState === WebSocket.OPEN
  }

  /**
   * Schedule a reconnect with exponential backoff.
   * @private
   */
  _scheduleReconnect() {
    if (this._reconnectAttempts >= this._maxAttempts) {
      console.warn(`[WebSocketTransport] Max reconnect attempts (${this._maxAttempts}) reached`)
      return
    }

    const delay = Math.min(
      this._reconnectInterval * Math.pow(2, this._reconnectAttempts),
      this._maxDelay
    )
    this._reconnectAttempts++

    this._reconnectTimer = setTimeout(() => {
      this.connect()
    }, delay)
  }

  /**
   * Clean up all resources.
   */
  destroy() {
    this.disconnect()
    this._messageHandler = null
    this._connectHandler = null
    this._disconnectHandler = null
  }
}
