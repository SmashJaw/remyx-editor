import { vi } from 'vitest'
import { WebSocketTransport } from '../plugins/builtins/collaborationFeatures/transports/WebSocketTransport.js'

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0
  static OPEN = 1
  static CLOSING = 2
  static CLOSED = 3

  constructor(url) {
    this.url = url
    this.readyState = MockWebSocket.CONNECTING
    this.onopen = null
    this.onclose = null
    this.onerror = null
    this.onmessage = null
    this.send = vi.fn()
    this.close = vi.fn()
  }
}

describe('WebSocketTransport', () => {
  let originalWebSocket

  beforeEach(() => {
    originalWebSocket = globalThis.WebSocket
    globalThis.WebSocket = MockWebSocket
  })

  afterEach(() => {
    globalThis.WebSocket = originalWebSocket
  })

  it('should construct with defaults', () => {
    const transport = new WebSocketTransport('wss://test.com')
    expect(transport._url).toBe('wss://test.com')
    expect(transport._reconnect).toBe(true)
    expect(transport._maxAttempts).toBe(10)
  })

  it('should construct with custom options', () => {
    const transport = new WebSocketTransport('wss://test.com', {
      reconnect: false,
      reconnectInterval: 5000,
      maxReconnectAttempts: 3,
      maxReconnectDelay: 10000,
    })
    expect(transport._reconnect).toBe(false)
    expect(transport._reconnectInterval).toBe(5000)
    expect(transport._maxAttempts).toBe(3)
    expect(transport._maxDelay).toBe(10000)
  })

  it('connect should create WebSocket', () => {
    const transport = new WebSocketTransport('wss://test.com')
    transport.connect()
    expect(transport._ws).not.toBeNull()
  })

  it('connect should not create new WS if already open', () => {
    const transport = new WebSocketTransport('wss://test.com')
    transport.connect()
    transport._ws.readyState = MockWebSocket.OPEN
    const firstWs = transport._ws
    transport.connect()
    expect(transport._ws).toBe(firstWs)
  })

  it('onopen should call connect handler', () => {
    const transport = new WebSocketTransport('wss://test.com')
    const handler = vi.fn()
    transport.onConnect(handler)
    transport.connect()
    transport._ws.onopen()
    expect(handler).toHaveBeenCalled()
  })

  it('onmessage should parse JSON and call message handler', () => {
    const transport = new WebSocketTransport('wss://test.com')
    const handler = vi.fn()
    transport.onMessage(handler)
    transport.connect()
    transport._ws.onmessage({ data: '{"type":"test"}' })
    expect(handler).toHaveBeenCalledWith({ type: 'test' })
  })

  it('onmessage handles invalid JSON gracefully', () => {
    const transport = new WebSocketTransport('wss://test.com')
    transport.onMessage(vi.fn())
    transport.connect()
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    transport._ws.onmessage({ data: 'not json' })
    spy.mockRestore()
  })

  it('onclose should call disconnect handler', () => {
    const transport = new WebSocketTransport('wss://test.com')
    const handler = vi.fn()
    transport.onDisconnect(handler)
    transport.connect()
    transport._ws.onclose()
    expect(handler).toHaveBeenCalled()
  })

  it('send should send JSON when connected', () => {
    const transport = new WebSocketTransport('wss://test.com')
    transport.connect()
    transport._ws.readyState = MockWebSocket.OPEN
    transport.send({ type: 'msg' })
    expect(transport._ws.send).toHaveBeenCalledWith('{"type":"msg"}')
  })

  it('send should drop message when not connected', () => {
    const transport = new WebSocketTransport('wss://test.com')
    transport.connect()
    transport._ws.readyState = MockWebSocket.CLOSED
    transport.send({ type: 'msg' })
    expect(transport._ws.send).not.toHaveBeenCalled()
  })

  it('isConnected returns true when open', () => {
    const transport = new WebSocketTransport('wss://test.com')
    transport.connect()
    transport._ws.readyState = MockWebSocket.OPEN
    expect(transport.isConnected()).toBe(true)
  })

  it('isConnected returns false when not open', () => {
    const transport = new WebSocketTransport('wss://test.com')
    expect(transport.isConnected()).toBe(false)
  })

  it('disconnect should close WebSocket and clean up', () => {
    const transport = new WebSocketTransport('wss://test.com')
    transport.connect()
    transport._ws.readyState = MockWebSocket.OPEN
    transport.disconnect()
    expect(transport._ws).toBeNull()
    expect(transport._intentionalClose).toBe(true)
  })

  it('disconnect should handle connecting state', () => {
    const transport = new WebSocketTransport('wss://test.com')
    transport.connect()
    transport._ws.readyState = MockWebSocket.CONNECTING
    transport.disconnect()
    expect(transport._ws).toBeNull()
  })

  it('destroy should disconnect and clear handlers', () => {
    const transport = new WebSocketTransport('wss://test.com')
    transport.onMessage(vi.fn())
    transport.onConnect(vi.fn())
    transport.onDisconnect(vi.fn())
    transport.connect()
    transport.destroy()
    expect(transport._messageHandler).toBeNull()
    expect(transport._connectHandler).toBeNull()
    expect(transport._disconnectHandler).toBeNull()
  })

  it('should schedule reconnect on unintentional close', () => {
    vi.useFakeTimers()
    const transport = new WebSocketTransport('wss://test.com', { reconnect: true })
    transport.connect()
    transport._ws.onclose()
    expect(transport._reconnectTimer).not.toBeNull()
    vi.useRealTimers()
  })

  it('should not reconnect on intentional close', () => {
    const transport = new WebSocketTransport('wss://test.com')
    transport.connect()
    transport._intentionalClose = true
    transport._ws.onclose()
    expect(transport._reconnectTimer).toBeNull()
  })

  it('should not reconnect when reconnect=false', () => {
    const transport = new WebSocketTransport('wss://test.com', { reconnect: false })
    transport.connect()
    transport._ws.onclose()
    expect(transport._reconnectTimer).toBeNull()
  })

  it('should stop reconnecting after max attempts', () => {
    vi.useFakeTimers()
    const transport = new WebSocketTransport('wss://test.com', {
      maxReconnectAttempts: 2,
    })
    transport._reconnectAttempts = 2
    transport._scheduleReconnect()
    expect(transport._reconnectTimer).toBeNull()
    vi.useRealTimers()
  })

  it('connect handles WebSocket constructor failure', () => {
    vi.useFakeTimers()
    globalThis.WebSocket = class { constructor() { throw new Error('fail') } }
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const transport = new WebSocketTransport('wss://bad.com')
    transport.connect()
    expect(transport._ws).toBeNull()
    spy.mockRestore()
    vi.useRealTimers()
  })
})
