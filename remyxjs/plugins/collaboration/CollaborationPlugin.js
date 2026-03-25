/**
 * CollaborationPlugin — Real-time collaborative editing.
 *
 * CRDT-inspired conflict resolution with vector clocks, live cursors via the
 * awareness protocol, and configurable transport (built-in WebSocket or custom).
 *
 * @param {Object} [options]
 * @param {string} [options.signalingServer] - WebSocket URL for built-in transport
 * @param {Object} [options.transport] - Custom transport: { connect, disconnect, send, onMessage, onConnect, onDisconnect, isConnected }
 * @param {string} [options.userId] - Unique user ID
 * @param {string} [options.userName='Anonymous'] - Display name
 * @param {string} [options.userColor='#6366f1'] - Cursor/avatar color
 * @param {string} [options.roomId='default'] - Document/room identifier
 * @param {boolean} [options.autoConnect=true] - Connect on plugin init
 * @param {number} [options.broadcastInterval=1000] - Awareness broadcast interval (ms)
 * @param {Function} [options.onUserJoin] - ({ userId, userName }) => void
 * @param {Function} [options.onUserLeave] - ({ userId }) => void
 * @param {Function} [options.onSync] - ({ userId, operations }) => void
 * @param {Function} [options.onConflict] - ({ localOp, remoteOp, resolution }) => void
 */

import { createPlugin } from '@remyxjs/core'
import { CrdtEngine } from './CrdtEngine.js'
import { AwarenessProtocol } from './AwarenessProtocol.js'
import { WebSocketTransport } from './transports/WebSocketTransport.js'

export function CollaborationPlugin(options = {}) {
  const {
    signalingServer,
    transport: customTransport,
    userId = `user-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    userName = 'Anonymous',
    userColor = '#6366f1',
    roomId = 'default',
    autoConnect = true,
    broadcastInterval = 1000,
    onUserJoin,
    onUserLeave,
    onSync,
    onConflict,
  } = options

  let engine = null
  let transport = null
  let crdtEngine = null
  let awareness = null
  let mutationObserver = null
  let unsubs = []
  let connected = false

  // -----------------------------------------------------------------------
  // Message handling
  // -----------------------------------------------------------------------

  function handleMessage(msg) {
    if (!engine) return

    switch (msg.type) {
      case 'op': {
        if (msg.userId === userId) return // ignore own echoed ops
        // Save selection, apply remote ops, restore selection
        const sel = window.getSelection()
        let bookmark = null
        if (sel && sel.rangeCount > 0 && engine.element.contains(sel.anchorNode)) {
          try {
            const range = sel.getRangeAt(0)
            bookmark = { startOffset: range.startOffset, startContainer: range.startContainer }
          } catch { /* noop */ }
        }

        engine._isRemoteOperation = true
        crdtEngine.applyRemoteOperations(msg.operations, engine.element)
        crdtEngine._merge(msg.clock)
        engine._isRemoteOperation = false

        // Restore selection
        if (bookmark) {
          try {
            const range = document.createRange()
            range.setStart(bookmark.startContainer, Math.min(bookmark.startOffset, bookmark.startContainer.length || 0))
            range.collapse(true)
            sel.removeAllRanges()
            sel.addRange(range)
          } catch { /* noop */ }
        }

        engine.eventBus.emit('collab:sync', { userId: msg.userId, opCount: msg.operations.length })
        engine.eventBus.emit('content:change')
        onSync?.({ userId: msg.userId, operations: msg.operations })
        break
      }

      case 'awareness':
        if (msg.userId === userId) return
        awareness.applyRemoteAwareness(msg.userId, msg.state)
        awareness.renderRemoteCursors(engine.element)
        break

      case 'join':
        if (msg.userId === userId) return
        awareness.applyRemoteAwareness(msg.userId, {
          userName: msg.userName,
          userColor: msg.userColor,
          status: 'active',
          cursor: null,
          lastActive: Date.now(),
        })
        engine.eventBus.emit('collab:userJoin', { userId: msg.userId, userName: msg.userName })
        onUserJoin?.({ userId: msg.userId, userName: msg.userName })
        break

      case 'leave':
        if (msg.userId === userId) return
        awareness.removeUser(msg.userId)
        awareness.renderRemoteCursors(engine.element)
        engine.eventBus.emit('collab:userLeave', { userId: msg.userId })
        onUserLeave?.({ userId: msg.userId })
        break

      case 'sync-request':
        if (msg.userId === userId) return
        // Respond with full document state
        transport?.send({
          type: 'sync-response',
          roomId,
          userId,
          html: engine.getHTML(),
          clock: crdtEngine._clock,
        })
        break

      case 'sync-response': {
        if (msg.userId === userId) return
        // Apply if remote clock is ahead
        const shouldApply = Object.entries(msg.clock).some(
          ([uid, seq]) => (crdtEngine._clock[uid] || 0) < seq
        )
        if (shouldApply) {
          engine._isRemoteOperation = true
          engine.setHTML(msg.html)
          crdtEngine._merge(msg.clock)
          crdtEngine.initTextContent(engine.element)
          engine._isRemoteOperation = false
          engine.eventBus.emit('content:change')
        }
        break
      }
    }
  }

  // -----------------------------------------------------------------------
  // Connection management
  // -----------------------------------------------------------------------

  function startCollaboration() {
    if (!transport || connected) return

    transport.onMessage(handleMessage)

    transport.onConnect(() => {
      connected = true
      // Send join
      transport.send({ type: 'join', roomId, userId, userName, userColor })
      // Request sync
      transport.send({ type: 'sync-request', roomId, userId, clock: crdtEngine._clock })
      // Flush offline queue
      const pending = crdtEngine.flushQueue()
      if (pending.length > 0) {
        transport.send({
          type: 'op', roomId, userId,
          clock: crdtEngine._clock,
          operations: pending,
          timestamp: Date.now(),
        })
      }
      // Start awareness
      awareness.setStatus('active')
      awareness.startBroadcasting((state) => {
        transport.send({ type: 'awareness', roomId, userId, state })
      }, broadcastInterval)

      engine?.eventBus.emit('collab:connected')
    })

    transport.onDisconnect(() => {
      connected = false
      awareness.setStatus('offline')
      awareness.stopBroadcasting()
      if (engine) {
        awareness.clearRemoteCursors(engine.element)
        engine.eventBus.emit('collab:disconnected')
      }
    })

    transport.connect()
  }

  function stopCollaboration() {
    if (!transport) return

    if (connected) {
      transport.send({ type: 'leave', roomId, userId })
    }
    awareness.stopBroadcasting()
    if (engine) {
      awareness.clearRemoteCursors(engine.element)
    }
    transport.disconnect()
    connected = false
  }

  function getConnectionStatus() {
    if (!transport) return 'unconfigured'
    return transport.isConnected() ? 'connected' : 'disconnected'
  }

  function setUserInfo(info) {
    if (info.userName) awareness._localState.userName = info.userName
    if (info.userColor) awareness._localState.userColor = info.userColor
  }

  // -----------------------------------------------------------------------
  // Plugin definition
  // -----------------------------------------------------------------------

  return createPlugin({
    name: 'collaboration',
    version: '1.0.0',
    description: 'Real-time collaborative editing with CRDT-inspired conflict resolution, live cursors, and configurable transport',
    requiresFullAccess: true,

    commands: [
      {
        name: 'startCollaboration',
        execute() { startCollaboration() },
        meta: { icon: 'collaboration', tooltip: 'Start Collaboration' },
      },
      {
        name: 'stopCollaboration',
        execute() { stopCollaboration() },
        meta: { icon: 'collaboration', tooltip: 'Stop Collaboration' },
      },
      {
        name: 'getCollaborators',
        execute() { return awareness?.getCollaborators() ?? [] },
        meta: { tooltip: 'Get Collaborators' },
      },
      {
        name: 'setUserInfo',
        execute(_eng, info) { setUserInfo(info) },
        meta: { tooltip: 'Set User Info' },
      },
    ],

    init(eng) {
      engine = eng

      // Create subsystems
      crdtEngine = new CrdtEngine(userId)
      awareness = new AwarenessProtocol(userId, userName, userColor)

      // Create transport
      if (customTransport) {
        transport = customTransport
      } else if (signalingServer) {
        transport = new WebSocketTransport(signalingServer)
      }

      // Initialize text tracking
      crdtEngine.initTextContent(engine.element)

      // Expose API on engine (like CommentsPlugin does with engine._comments)
      engine._collaboration = {
        startCollaboration,
        stopCollaboration,
        getCollaborators: () => awareness.getCollaborators(),
        isConnected: () => transport?.isConnected() ?? false,
        getConnectionStatus,
        setUserInfo,
        getCrdtState: () => crdtEngine.getState(),
        userId,
        userName,
        userColor,
      }

      // MutationObserver for local edit capture
      mutationObserver = new MutationObserver((mutations) => {
        if (crdtEngine._suppressRemote || engine._isRemoteOperation) return
        const ops = crdtEngine.captureOperations(mutations, engine.element)
        if (ops.length > 0) {
          if (transport?.isConnected()) {
            transport.send({
              type: 'op',
              roomId,
              userId,
              clock: { ...crdtEngine._clock },
              operations: ops,
              timestamp: Date.now(),
            })
          } else {
            // Queue for later
            ops.forEach(op => crdtEngine.queueOperation(op))
          }
        }
      })
      mutationObserver.observe(engine.element, {
        childList: true,
        subtree: true,
        characterData: true,
        characterDataOldValue: true,
      })

      // Track local selection for awareness
      const unsubSelection = engine.eventBus.on('selection:change', () => {
        awareness.updateLocalCursor(engine.element, engine.selection)
        awareness.resetIdleTimer()
      })
      unsubs.push(unsubSelection)

      // Re-render remote cursors on content change and scroll
      const unsubContent = engine.eventBus.on('content:change', () => {
        awareness.renderRemoteCursors(engine.element)
      })
      unsubs.push(unsubContent)

      // Auto-connect
      if (autoConnect && transport) {
        startCollaboration()
      }
    },

    destroy() {
      mutationObserver?.disconnect()
      mutationObserver = null
      stopCollaboration()
      for (const unsub of unsubs) unsub?.()
      unsubs = []
      crdtEngine?.destroy()
      awareness?.destroy()
      if (transport && !customTransport) {
        transport.destroy?.()
      }
      engine = null
      transport = null
      crdtEngine = null
      awareness = null
    },
  })
}
