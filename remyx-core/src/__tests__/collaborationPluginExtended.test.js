import { vi } from 'vitest'
import { CollaborationPlugin } from '../plugins/builtins/collaborationFeatures/CollaborationPlugin.js'

describe('CollaborationPlugin - extended coverage', () => {
  let plugin, engine

  beforeEach(() => {
    const el = document.createElement('div')
    el.contentEditable = 'true'
    el.textContent = 'Hello World'
    document.body.appendChild(el)

    engine = {
      element: el,
      eventBus: {
        emit: vi.fn(),
        on: vi.fn(() => () => {}),
      },
      history: { snapshot: vi.fn() },
      selection: {
        getSelection: vi.fn(() => window.getSelection()),
        getRange: vi.fn(),
        setRange: vi.fn(),
      },
      getHTML: vi.fn(() => '<p>Hello</p>'),
      setHTML: vi.fn(),
      getText: vi.fn(() => 'Hello World'),
      commands: { register: vi.fn() },
    }
  })

  afterEach(() => {
    plugin?.destroy()
    document.body.innerHTML = ''
  })

  it('creates plugin with correct name', () => {
    plugin = CollaborationPlugin()
    expect(plugin.name).toBe('collaboration')
    expect(plugin.requiresFullAccess).toBe(true)
    expect(plugin.version).toBe('1.0.0')
  })

  it('has expected commands', () => {
    plugin = CollaborationPlugin()
    const names = plugin.commands.map(c => c.name)
    expect(names).toContain('startCollaboration')
    expect(names).toContain('stopCollaboration')
    expect(names).toContain('getCollaborators')
    expect(names).toContain('setUserInfo')
  })

  it('init without transport does not auto-connect', () => {
    plugin = CollaborationPlugin({ autoConnect: true })
    plugin.init(engine)
    expect(engine._collaboration).toBeDefined()
    expect(engine._collaboration.isConnected()).toBe(false)
  })

  it('init with custom transport stores it', () => {
    const transport = {
      connect: vi.fn(),
      disconnect: vi.fn(),
      send: vi.fn(),
      onMessage: vi.fn(),
      onConnect: vi.fn(),
      onDisconnect: vi.fn(),
      isConnected: vi.fn(() => false),
    }
    plugin = CollaborationPlugin({ transport, autoConnect: false })
    plugin.init(engine)
    expect(engine._collaboration).toBeDefined()
    expect(engine._collaboration.getConnectionStatus()).toBe('disconnected')
  })

  it('getConnectionStatus returns unconfigured when no transport', () => {
    plugin = CollaborationPlugin()
    plugin.init(engine)
    expect(engine._collaboration.getConnectionStatus()).toBe('unconfigured')
  })

  it('exposes userId, userName, userColor', () => {
    plugin = CollaborationPlugin({
      userId: 'user1',
      userName: 'Alice',
      userColor: '#ff0000',
    })
    plugin.init(engine)
    expect(engine._collaboration.userId).toBe('user1')
    expect(engine._collaboration.userName).toBe('Alice')
    expect(engine._collaboration.userColor).toBe('#ff0000')
  })

  it('setUserInfo updates awareness state', () => {
    plugin = CollaborationPlugin()
    plugin.init(engine)
    engine._collaboration.setUserInfo({ userName: 'Bob', userColor: '#00ff00' })
    // Check via command
    const cmd = plugin.commands.find(c => c.name === 'setUserInfo')
    cmd.execute(engine, { userName: 'Charlie' })
  })

  it('getCollaborators returns empty initially', () => {
    plugin = CollaborationPlugin()
    plugin.init(engine)
    expect(engine._collaboration.getCollaborators()).toEqual([])
  })

  it('getCrdtState returns state info', () => {
    plugin = CollaborationPlugin()
    plugin.init(engine)
    const state = engine._collaboration.getCrdtState()
    expect(state).toHaveProperty('clock')
    expect(state).toHaveProperty('pendingOps')
    expect(state).toHaveProperty('seenOps')
  })

  it('startCollaboration with custom transport calls connect', () => {
    const transport = {
      connect: vi.fn(),
      disconnect: vi.fn(),
      send: vi.fn(),
      onMessage: vi.fn(),
      onConnect: vi.fn(),
      onDisconnect: vi.fn(),
      isConnected: vi.fn(() => false),
    }
    plugin = CollaborationPlugin({ transport, autoConnect: false })
    plugin.init(engine)
    engine._collaboration.startCollaboration()
    expect(transport.onMessage).toHaveBeenCalled()
    expect(transport.onConnect).toHaveBeenCalled()
    expect(transport.onDisconnect).toHaveBeenCalled()
    expect(transport.connect).toHaveBeenCalled()
  })

  it('stopCollaboration calls disconnect', () => {
    const transport = {
      connect: vi.fn(),
      disconnect: vi.fn(),
      send: vi.fn(),
      onMessage: vi.fn(),
      onConnect: vi.fn(),
      onDisconnect: vi.fn(),
      isConnected: vi.fn(() => false),
    }
    plugin = CollaborationPlugin({ transport, autoConnect: false })
    plugin.init(engine)
    engine._collaboration.stopCollaboration()
    expect(transport.disconnect).toHaveBeenCalled()
  })

  it('destroy cleans up everything', () => {
    const transport = {
      connect: vi.fn(),
      disconnect: vi.fn(),
      send: vi.fn(),
      onMessage: vi.fn(),
      onConnect: vi.fn(),
      onDisconnect: vi.fn(),
      isConnected: vi.fn(() => false),
      destroy: vi.fn(),
    }
    plugin = CollaborationPlugin({ transport, autoConnect: false })
    plugin.init(engine)
    plugin.destroy()
    // Should not throw
  })

  it('auto-connect with transport calls startCollaboration on init', () => {
    const transport = {
      connect: vi.fn(),
      disconnect: vi.fn(),
      send: vi.fn(),
      onMessage: vi.fn(),
      onConnect: vi.fn(),
      onDisconnect: vi.fn(),
      isConnected: vi.fn(() => false),
    }
    plugin = CollaborationPlugin({ transport, autoConnect: true })
    plugin.init(engine)
    expect(transport.connect).toHaveBeenCalled()
  })

  it('onConnect callback triggers proper events', () => {
    const transport = {
      connect: vi.fn(),
      disconnect: vi.fn(),
      send: vi.fn(),
      onMessage: vi.fn(),
      onConnect: vi.fn(),
      onDisconnect: vi.fn(),
      isConnected: vi.fn(() => true),
    }
    plugin = CollaborationPlugin({ transport, autoConnect: false })
    plugin.init(engine)
    engine._collaboration.startCollaboration()

    // Simulate onConnect
    const connectCb = transport.onConnect.mock.calls[0][0]
    connectCb()
    expect(transport.send).toHaveBeenCalled() // join + sync-request
    expect(engine.eventBus.emit).toHaveBeenCalledWith('collab:connected')
  })

  it('onDisconnect callback triggers proper events', () => {
    const transport = {
      connect: vi.fn(),
      disconnect: vi.fn(),
      send: vi.fn(),
      onMessage: vi.fn(),
      onConnect: vi.fn(),
      onDisconnect: vi.fn(),
      isConnected: vi.fn(() => false),
    }
    plugin = CollaborationPlugin({ transport, autoConnect: false })
    plugin.init(engine)
    engine._collaboration.startCollaboration()

    const disconnectCb = transport.onDisconnect.mock.calls[0][0]
    disconnectCb()
    expect(engine.eventBus.emit).toHaveBeenCalledWith('collab:disconnected')
  })

  it('handles join message from remote user', () => {
    const onUserJoin = vi.fn()
    const transport = {
      connect: vi.fn(),
      disconnect: vi.fn(),
      send: vi.fn(),
      onMessage: vi.fn(),
      onConnect: vi.fn(),
      onDisconnect: vi.fn(),
      isConnected: vi.fn(() => true),
    }
    plugin = CollaborationPlugin({ transport, autoConnect: false, userId: 'me', onUserJoin })
    plugin.init(engine)
    engine._collaboration.startCollaboration()

    const messageCb = transport.onMessage.mock.calls[0][0]
    messageCb({ type: 'join', userId: 'other', userName: 'Bob', userColor: '#00f' })
    expect(onUserJoin).toHaveBeenCalledWith({ userId: 'other', userName: 'Bob' })
    expect(engine.eventBus.emit).toHaveBeenCalledWith('collab:userJoin', expect.any(Object))
  })

  it('handles leave message from remote user', () => {
    const onUserLeave = vi.fn()
    const transport = {
      connect: vi.fn(),
      disconnect: vi.fn(),
      send: vi.fn(),
      onMessage: vi.fn(),
      onConnect: vi.fn(),
      onDisconnect: vi.fn(),
      isConnected: vi.fn(() => true),
    }
    plugin = CollaborationPlugin({ transport, autoConnect: false, userId: 'me', onUserLeave })
    plugin.init(engine)
    engine._collaboration.startCollaboration()

    const messageCb = transport.onMessage.mock.calls[0][0]
    messageCb({ type: 'leave', userId: 'other' })
    expect(onUserLeave).toHaveBeenCalledWith({ userId: 'other' })
  })

  it('ignores own join/leave messages', () => {
    const transport = {
      connect: vi.fn(),
      disconnect: vi.fn(),
      send: vi.fn(),
      onMessage: vi.fn(),
      onConnect: vi.fn(),
      onDisconnect: vi.fn(),
      isConnected: vi.fn(() => true),
    }
    plugin = CollaborationPlugin({ transport, autoConnect: false, userId: 'me' })
    plugin.init(engine)
    engine._collaboration.startCollaboration()

    const messageCb = transport.onMessage.mock.calls[0][0]
    engine.eventBus.emit.mockClear()
    messageCb({ type: 'join', userId: 'me', userName: 'Me' })
    expect(engine.eventBus.emit).not.toHaveBeenCalledWith('collab:userJoin', expect.any(Object))
  })

  it('handles sync-request by sending sync-response', () => {
    const transport = {
      connect: vi.fn(),
      disconnect: vi.fn(),
      send: vi.fn(),
      onMessage: vi.fn(),
      onConnect: vi.fn(),
      onDisconnect: vi.fn(),
      isConnected: vi.fn(() => true),
    }
    plugin = CollaborationPlugin({ transport, autoConnect: false, userId: 'me' })
    plugin.init(engine)
    engine._collaboration.startCollaboration()

    const messageCb = transport.onMessage.mock.calls[0][0]
    transport.send.mockClear()
    messageCb({ type: 'sync-request', userId: 'other', clock: {} })
    expect(transport.send).toHaveBeenCalledWith(expect.objectContaining({ type: 'sync-response' }))
  })

  it('handles awareness message from remote user', () => {
    const transport = {
      connect: vi.fn(),
      disconnect: vi.fn(),
      send: vi.fn(),
      onMessage: vi.fn(),
      onConnect: vi.fn(),
      onDisconnect: vi.fn(),
      isConnected: vi.fn(() => true),
    }
    plugin = CollaborationPlugin({ transport, autoConnect: false, userId: 'me' })
    plugin.init(engine)
    engine._collaboration.startCollaboration()

    const messageCb = transport.onMessage.mock.calls[0][0]
    messageCb({ type: 'awareness', userId: 'other', state: { cursor: null, userName: 'Bob', userColor: '#f00', status: 'active' } })
    // Should not crash
    const collabs = engine._collaboration.getCollaborators()
    expect(collabs.length).toBe(1)
  })
})
