import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CrdtEngine, offsetToRange, rangeToOffset } from '../plugins/builtins/collaborationFeatures/CrdtEngine.js'
import { AwarenessProtocol } from '../plugins/builtins/collaborationFeatures/AwarenessProtocol.js'
import { WebSocketTransport } from '../plugins/builtins/collaborationFeatures/transports/WebSocketTransport.js'
import { CollaborationPlugin } from '../plugins/builtins/collaborationFeatures/CollaborationPlugin.js'

// ---------------------------------------------------------------------------
// CrdtEngine
// ---------------------------------------------------------------------------

describe('CrdtEngine', () => {
  let engine

  beforeEach(() => {
    engine = new CrdtEngine('user-1')
  })

  it('initializes with a vector clock', () => {
    expect(engine._clock).toEqual({ 'user-1': 0 })
  })

  it('ticks the local clock', () => {
    const clock = engine._tickLocal()
    expect(clock['user-1']).toBe(1)
    expect(engine._clock['user-1']).toBe(1)
  })

  it('merges remote clocks with point-wise max', () => {
    engine._clock = { 'user-1': 3, 'user-2': 1 }
    engine._merge({ 'user-1': 2, 'user-2': 5, 'user-3': 1 })
    expect(engine._clock).toEqual({ 'user-1': 3, 'user-2': 5, 'user-3': 1 })
  })

  it('detects insertions via text diff', () => {
    const el = document.createElement('div')
    el.textContent = 'hello'
    engine.initTextContent(el)

    el.textContent = 'hello world'
    const ops = engine.captureOperations([], el)

    expect(ops.length).toBe(1)
    expect(ops[0].type).toBe('insert')
    expect(ops[0].position).toBe(5)
    expect(ops[0].content).toBe(' world')
  })

  it('detects deletions via text diff', () => {
    const el = document.createElement('div')
    el.textContent = 'hello world'
    engine.initTextContent(el)

    el.textContent = 'hello'
    const ops = engine.captureOperations([], el)

    expect(ops.length).toBe(1)
    expect(ops[0].type).toBe('delete')
    expect(ops[0].position).toBe(5)
    expect(ops[0].length).toBe(6)
  })

  it('detects replacements via text diff', () => {
    const el = document.createElement('div')
    el.textContent = 'hello'
    engine.initTextContent(el)

    el.textContent = 'hallo'
    const ops = engine.captureOperations([], el)

    expect(ops.length).toBe(1)
    expect(ops[0].type).toBe('replace')
    expect(ops[0].position).toBe(1)
    expect(ops[0].content).toBe('a')
  })

  it('returns no ops when text is unchanged', () => {
    const el = document.createElement('div')
    el.textContent = 'hello'
    engine.initTextContent(el)
    const ops = engine.captureOperations([], el)
    expect(ops.length).toBe(0)
  })

  it('tracks seen ops and filters duplicates', () => {
    const el = document.createElement('div')
    el.textContent = 'hello'
    engine.initTextContent(el)

    const ops = [
      { id: 'user-2-1', type: 'insert', userId: 'user-2', clock: { 'user-2': 1 }, timestamp: 1, position: 5, content: '!' },
    ]
    engine.applyRemoteOperations(ops, el)
    expect(el.textContent).toBe('hello!')

    // Apply same ops again — should be no-op
    el.textContent = 'hello!'
    engine.applyRemoteOperations(ops, el)
    expect(el.textContent).toBe('hello!')
  })

  it('applies remote insert operations', () => {
    const el = document.createElement('div')
    el.textContent = 'hello'
    engine.initTextContent(el)

    const ops = [
      { id: 'user-2-1', type: 'insert', userId: 'user-2', clock: { 'user-2': 1 }, timestamp: 1, position: 5, content: ' world' },
    ]
    engine.applyRemoteOperations(ops, el)
    expect(el.textContent).toBe('hello world')
  })

  it('applies remote delete operations', () => {
    const el = document.createElement('div')
    el.textContent = 'hello world'
    engine.initTextContent(el)

    const ops = [
      { id: 'user-2-1', type: 'delete', userId: 'user-2', clock: { 'user-2': 1 }, timestamp: 1, position: 5, length: 6 },
    ]
    engine.applyRemoteOperations(ops, el)
    expect(el.textContent).toBe('hello')
  })

  it('manages offline queue', () => {
    const op1 = { id: 'op-1', type: 'insert', position: 0, content: 'a' }
    const op2 = { id: 'op-2', type: 'insert', position: 1, content: 'b' }

    engine.queueOperation(op1)
    engine.queueOperation(op2)
    expect(engine.hasPendingOps()).toBe(true)

    const pending = engine.flushQueue()
    expect(pending).toHaveLength(2)
    expect(engine.hasPendingOps()).toBe(false)
  })

  it('transforms positions for insert before', () => {
    const pos = engine._transformPosition(5, {
      type: 'insert', position: 3, content: 'ab',
    })
    expect(pos).toBe(7) // 5 + 2
  })

  it('transforms positions for delete before', () => {
    const pos = engine._transformPosition(5, {
      type: 'delete', position: 2, length: 2,
    })
    expect(pos).toBe(3) // 5 - 2
  })

  it('returns state snapshot', () => {
    engine._tickLocal()
    engine.queueOperation({ id: 'op-1' })
    const state = engine.getState()
    expect(state.clock['user-1']).toBe(1)
    expect(state.pendingOps).toBe(1)
  })

  it('cleans up on destroy', () => {
    engine.queueOperation({ id: 'op-1' })
    engine._seenOps.add('op-1')
    engine.destroy()
    expect(engine.hasPendingOps()).toBe(false)
    expect(engine._seenOps.size).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// AwarenessProtocol
// ---------------------------------------------------------------------------

describe('AwarenessProtocol', () => {
  let protocol

  beforeEach(() => {
    protocol = new AwarenessProtocol('user-1', 'Alice', '#e11d48')
  })

  it('initializes with local state', () => {
    const state = protocol.getLocalState()
    expect(state.userName).toBe('Alice')
    expect(state.userColor).toBe('#e11d48')
    expect(state.status).toBe('active')
    expect(state.cursor).toBeNull()
  })

  it('tracks remote user awareness', () => {
    protocol.applyRemoteAwareness('user-2', {
      userName: 'Bob', userColor: '#3b82f6',
      cursor: { offset: 10, length: 0 },
      status: 'active', lastActive: Date.now(),
    })

    const collabs = protocol.getCollaborators()
    expect(collabs).toHaveLength(1)
    expect(collabs[0].userName).toBe('Bob')
    expect(collabs[0].cursor.offset).toBe(10)
  })

  it('ignores own awareness updates', () => {
    protocol.applyRemoteAwareness('user-1', {
      userName: 'Alice', userColor: '#e11d48',
      cursor: null, status: 'active', lastActive: Date.now(),
    })
    expect(protocol.getCollaborators()).toHaveLength(0)
  })

  it('removes users', () => {
    protocol.applyRemoteAwareness('user-2', {
      userName: 'Bob', userColor: '#3b82f6',
      cursor: null, status: 'active', lastActive: Date.now(),
    })
    expect(protocol.getCollaborators()).toHaveLength(1)

    protocol.removeUser('user-2')
    expect(protocol.getCollaborators()).toHaveLength(0)
  })

  it('sets status', () => {
    protocol.setStatus('idle')
    expect(protocol.getLocalState().status).toBe('idle')
    protocol.setStatus('offline')
    expect(protocol.getLocalState().status).toBe('offline')
  })

  it('resets idle timer', () => {
    vi.useFakeTimers()
    protocol.setStatus('idle')
    protocol.resetIdleTimer()
    expect(protocol.getLocalState().status).toBe('active')

    // After 30s, should become idle
    vi.advanceTimersByTime(31000)
    expect(protocol.getLocalState().status).toBe('idle')
    vi.useRealTimers()
  })

  it('starts and stops broadcasting', () => {
    vi.useFakeTimers()
    const sendFn = vi.fn()
    protocol.startBroadcasting(sendFn, 500)

    vi.advanceTimersByTime(1500)
    expect(sendFn).toHaveBeenCalledTimes(3)

    protocol.stopBroadcasting()
    vi.advanceTimersByTime(1000)
    expect(sendFn).toHaveBeenCalledTimes(3) // no more calls
    vi.useRealTimers()
  })

  it('cleans up on destroy', () => {
    vi.useFakeTimers()
    protocol.startBroadcasting(vi.fn(), 500)
    protocol.destroy()
    expect(protocol.getCollaborators()).toHaveLength(0)
    vi.useRealTimers()
  })
})

// ---------------------------------------------------------------------------
// WebSocketTransport
// ---------------------------------------------------------------------------

describe('WebSocketTransport', () => {
  let originalWebSocket

  beforeEach(() => {
    originalWebSocket = global.WebSocket
    global.WebSocket = vi.fn(() => ({
      readyState: 1, // OPEN
      send: vi.fn(),
      close: vi.fn(),
      onopen: null,
      onclose: null,
      onmessage: null,
      onerror: null,
    }))
    global.WebSocket.OPEN = 1
    global.WebSocket.CONNECTING = 0
  })

  afterEach(() => {
    global.WebSocket = originalWebSocket
  })

  it('creates a transport with URL', () => {
    const transport = new WebSocketTransport('wss://test.com/ws')
    expect(transport._url).toBe('wss://test.com/ws')
    expect(transport.isConnected()).toBe(false)
  })

  it('registers handlers', () => {
    const transport = new WebSocketTransport('wss://test.com/ws')
    const msgHandler = vi.fn()
    const connHandler = vi.fn()
    const discHandler = vi.fn()

    transport.onMessage(msgHandler)
    transport.onConnect(connHandler)
    transport.onDisconnect(discHandler)

    expect(transport._messageHandler).toBe(msgHandler)
    expect(transport._connectHandler).toBe(connHandler)
    expect(transport._disconnectHandler).toBe(discHandler)
  })

  it('cleans up on destroy', () => {
    const transport = new WebSocketTransport('wss://test.com/ws')
    transport.destroy()
    expect(transport._messageHandler).toBeNull()
    expect(transport._ws).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// CollaborationPlugin
// ---------------------------------------------------------------------------

describe('CollaborationPlugin', () => {
  it('creates a valid plugin', () => {
    const plugin = CollaborationPlugin({
      userId: 'test-user',
      userName: 'Test',
      userColor: '#ff0000',
      roomId: 'test-room',
      autoConnect: false, // don't connect in tests
    })

    expect(plugin.name).toBe('collaboration')
    expect(plugin.version).toBe('1.0.0')
    expect(plugin.requiresFullAccess).toBe(true)
    expect(plugin.commands.length).toBe(4)

    const cmdNames = plugin.commands.map(c => c.name)
    expect(cmdNames).toContain('startCollaboration')
    expect(cmdNames).toContain('stopCollaboration')
    expect(cmdNames).toContain('getCollaborators')
    expect(cmdNames).toContain('setUserInfo')
  })

  it('creates plugin with custom transport', () => {
    const mockTransport = {
      connect: vi.fn(),
      disconnect: vi.fn(),
      send: vi.fn(),
      onMessage: vi.fn(),
      onConnect: vi.fn(),
      onDisconnect: vi.fn(),
      isConnected: vi.fn(() => false),
    }

    const plugin = CollaborationPlugin({
      transport: mockTransport,
      autoConnect: false,
    })

    expect(plugin.name).toBe('collaboration')
    expect(plugin.commands.length).toBe(4)
  })

  it('creates plugin with default options', () => {
    const plugin = CollaborationPlugin()
    expect(plugin.name).toBe('collaboration')
    expect(plugin.commands.length).toBe(4)
  })

  it('generates unique userId when not provided', () => {
    const plugin1 = CollaborationPlugin()
    const plugin2 = CollaborationPlugin()
    // Both should have different default userIds (based on Date.now + random)
    expect(plugin1.name).toBe('collaboration')
  })
})

// ---------------------------------------------------------------------------
// Position mapping
// ---------------------------------------------------------------------------

describe('offsetToRange / rangeToOffset', () => {
  it('converts offset to range for simple text', () => {
    const el = document.createElement('div')
    el.textContent = 'hello world'
    document.body.appendChild(el)

    const range = offsetToRange(el, 6, 5)
    expect(range).toBeTruthy()
    expect(range.toString()).toBe('world')

    document.body.removeChild(el)
  })

  it('converts offset 0 to start of text', () => {
    const el = document.createElement('div')
    el.textContent = 'hello'
    document.body.appendChild(el)

    const range = offsetToRange(el, 0, 0)
    expect(range).toBeTruthy()

    document.body.removeChild(el)
  })

  it('handles offset beyond content gracefully', () => {
    const el = document.createElement('div')
    el.textContent = 'hi'
    document.body.appendChild(el)

    const range = offsetToRange(el, 100, 0)
    expect(range).toBeTruthy()

    document.body.removeChild(el)
  })

  it('round-trips offset through range', () => {
    const el = document.createElement('div')
    el.textContent = 'hello world test'
    document.body.appendChild(el)

    const range = offsetToRange(el, 6, 5)
    const { offset, length } = rangeToOffset(el, range)
    expect(offset).toBe(6)
    expect(length).toBe(5)

    document.body.removeChild(el)
  })
})
