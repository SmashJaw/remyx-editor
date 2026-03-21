import { CrdtEngine, offsetToRange, rangeToOffset } from '../plugins/builtins/collaborationFeatures/CrdtEngine.js'
import { AwarenessProtocol } from '../plugins/builtins/collaborationFeatures/AwarenessProtocol.js'

describe('CrdtEngine', () => {
  let crdt

  beforeEach(() => {
    crdt = new CrdtEngine('user1')
  })

  afterEach(() => {
    crdt.destroy()
  })

  it('should initialize with userId and clock', () => {
    expect(crdt.userId).toBe('user1')
    expect(crdt._clock).toEqual({ user1: 0 })
  })

  it('_tickLocal should increment clock', () => {
    const clock1 = crdt._tickLocal()
    expect(clock1.user1).toBe(1)
    const clock2 = crdt._tickLocal()
    expect(clock2.user1).toBe(2)
  })

  it('_merge should take max of each key', () => {
    crdt._tickLocal() // user1: 1
    crdt._merge({ user1: 3, user2: 5 })
    expect(crdt._clock.user1).toBe(3)
    expect(crdt._clock.user2).toBe(5)
  })

  it('_findInsert should find insert position', () => {
    const result = crdt._findInsert('hello', 'hellXo')
    expect(result.position).toBe(4)
    expect(result.content).toBe('X')
  })

  it('_findInsert at the beginning', () => {
    const result = crdt._findInsert('ello', 'Hello')
    expect(result.position).toBe(0)
    expect(result.content).toBe('H')
  })

  it('_findDelete should find deletion position', () => {
    const result = crdt._findDelete('hello', 'helo')
    expect(result.position).toBe(3)
    expect(result.length).toBe(1)
  })

  it('_findReplace should find replacement', () => {
    const result = crdt._findReplace('hello', 'hXllo')
    expect(result.position).toBe(1)
    expect(result.length).toBe(1)
    expect(result.content).toBe('X')
  })

  it('_findReplace returns empty for identical strings', () => {
    const result = crdt._findReplace('hello', 'hello')
    expect(result).toEqual({})
  })

  it('_transformPosition insert before', () => {
    expect(crdt._transformPosition(5, { type: 'insert', position: 3, content: 'XX' })).toBe(7)
  })

  it('_transformPosition insert at same position', () => {
    expect(crdt._transformPosition(3, { type: 'insert', position: 3, content: 'X' })).toBe(4)
  })

  it('_transformPosition insert after', () => {
    expect(crdt._transformPosition(2, { type: 'insert', position: 5, content: 'X' })).toBe(2)
  })

  it('_transformPosition delete before', () => {
    expect(crdt._transformPosition(5, { type: 'delete', position: 2, length: 2 })).toBe(3)
  })

  it('_transformPosition delete overlapping', () => {
    expect(crdt._transformPosition(3, { type: 'delete', position: 2, length: 5 })).toBe(2)
  })

  it('_transformPosition replace before', () => {
    expect(crdt._transformPosition(5, { type: 'replace', position: 1, length: 2, content: 'XXX' })).toBe(6)
  })

  it('_transformPosition replace overlapping', () => {
    expect(crdt._transformPosition(3, { type: 'replace', position: 2, length: 5, content: 'XX' })).toBe(4)
  })

  it('queueOperation and flushQueue', () => {
    const op = { id: 'op1', type: 'insert', position: 0, content: 'hi' }
    crdt.queueOperation(op)
    expect(crdt.hasPendingOps()).toBe(true)
    const flushed = crdt.flushQueue()
    expect(flushed).toEqual([op])
    expect(crdt.hasPendingOps()).toBe(false)
  })

  it('initTextContent tracks text', () => {
    const el = document.createElement('div')
    el.textContent = 'hello'
    crdt.initTextContent(el)
    expect(crdt._lastTextContent).toBe('hello')
  })

  it('getState returns state', () => {
    crdt.queueOperation({ id: 'op1' })
    const state = crdt.getState()
    expect(state.clock).toEqual({ user1: 0 })
    expect(state.pendingOps).toBe(1)
    expect(state.seenOps).toBe(0)
  })

  it('captureOperations detects insertion', () => {
    const el = document.createElement('div')
    el.textContent = 'hello'
    crdt.initTextContent(el)
    el.textContent = 'hello world'
    const ops = crdt.captureOperations([], el)
    expect(ops.length).toBe(1)
    expect(ops[0].type).toBe('insert')
    expect(ops[0].content).toBe(' world')
  })

  it('captureOperations detects deletion', () => {
    const el = document.createElement('div')
    el.textContent = 'hello world'
    crdt.initTextContent(el)
    el.textContent = 'hello'
    const ops = crdt.captureOperations([], el)
    expect(ops.length).toBe(1)
    expect(ops[0].type).toBe('delete')
    expect(ops[0].length).toBe(6)
  })

  it('captureOperations detects replacement', () => {
    const el = document.createElement('div')
    el.textContent = 'hello'
    crdt.initTextContent(el)
    el.textContent = 'hXllo'
    const ops = crdt.captureOperations([], el)
    expect(ops.length).toBe(1)
    expect(ops[0].type).toBe('replace')
  })

  it('captureOperations returns empty for no change', () => {
    const el = document.createElement('div')
    el.textContent = 'hello'
    crdt.initTextContent(el)
    const ops = crdt.captureOperations([], el)
    expect(ops).toEqual([])
  })

  it('applyRemoteOperations applies insert', () => {
    const el = document.createElement('div')
    el.textContent = 'hello'
    crdt.initTextContent(el)
    crdt.applyRemoteOperations([{
      id: 'remote-1',
      type: 'insert',
      userId: 'user2',
      clock: { user2: 1 },
      timestamp: Date.now(),
      position: 5,
      content: ' world',
    }], el)
    expect(el.textContent).toBe('hello world')
  })

  it('applyRemoteOperations skips already-seen ops', () => {
    const el = document.createElement('div')
    el.textContent = 'hello'
    crdt.initTextContent(el)
    const op = {
      id: 'seen-1',
      type: 'insert',
      userId: 'user2',
      clock: { user2: 1 },
      timestamp: Date.now(),
      position: 0,
      content: 'X',
    }
    crdt._trackOp('seen-1')
    crdt.applyRemoteOperations([op], el)
    expect(el.textContent).toBe('hello')
  })

  it('_trackOp evicts oldest when exceeding max', () => {
    crdt._maxSeenOps = 5
    for (let i = 0; i < 10; i++) {
      crdt._trackOp(`op-${i}`)
    }
    expect(crdt._seenOps.size).toBe(5)
    // Oldest should be evicted
    expect(crdt._seenOps.has('op-0')).toBe(false)
    expect(crdt._seenOps.has('op-9')).toBe(true)
  })

  it('destroy clears state', () => {
    crdt.queueOperation({ id: 'op1' })
    crdt._trackOp('op1')
    crdt.destroy()
    expect(crdt._pendingOps).toEqual([])
    expect(crdt._seenOps.size).toBe(0)
    expect(crdt._lastTextContent).toBeNull()
  })
})

describe('offsetToRange', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('should create range at offset', () => {
    const el = document.createElement('div')
    el.textContent = 'hello world'
    document.body.appendChild(el)
    const range = offsetToRange(el, 5)
    expect(range).not.toBeNull()
  })

  it('should handle offset beyond content', () => {
    const el = document.createElement('div')
    el.textContent = 'hi'
    document.body.appendChild(el)
    const range = offsetToRange(el, 100)
    expect(range).not.toBeNull()
  })

  it('should create range with length', () => {
    const el = document.createElement('div')
    el.textContent = 'hello world'
    document.body.appendChild(el)
    const range = offsetToRange(el, 0, 5)
    expect(range).not.toBeNull()
    expect(range.toString()).toBe('hello')
  })
})

describe('rangeToOffset', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('should return offset and length', () => {
    const el = document.createElement('div')
    el.textContent = 'hello world'
    document.body.appendChild(el)
    const range = document.createRange()
    const textNode = el.firstChild
    range.setStart(textNode, 6)
    range.setEnd(textNode, 11)
    const result = rangeToOffset(el, range)
    expect(result.offset).toBe(6)
    expect(result.length).toBe(5)
  })
})

describe('AwarenessProtocol', () => {
  let awareness

  beforeEach(() => {
    awareness = new AwarenessProtocol('user1', 'Alice', '#ff0000')
  })

  afterEach(() => {
    awareness.destroy()
  })

  it('should initialize with user info', () => {
    expect(awareness.userId).toBe('user1')
    expect(awareness._localState.userName).toBe('Alice')
    expect(awareness._localState.userColor).toBe('#ff0000')
    expect(awareness._localState.status).toBe('active')
  })

  it('setStatus should update status', () => {
    awareness.setStatus('idle')
    expect(awareness._localState.status).toBe('idle')
  })

  it('applyRemoteAwareness should track remote user', () => {
    awareness.applyRemoteAwareness('user2', {
      userName: 'Bob',
      userColor: '#00ff00',
      cursor: null,
      status: 'active',
      lastActive: Date.now(),
    })
    const collabs = awareness.getCollaborators()
    expect(collabs.length).toBe(1)
    expect(collabs[0].userName).toBe('Bob')
  })

  it('applyRemoteAwareness should ignore own userId', () => {
    awareness.applyRemoteAwareness('user1', { userName: 'Self' })
    expect(awareness.getCollaborators().length).toBe(0)
  })

  it('removeUser should remove remote user', () => {
    awareness.applyRemoteAwareness('user2', { userName: 'Bob', userColor: '#00ff00', status: 'active' })
    awareness.removeUser('user2')
    expect(awareness.getCollaborators().length).toBe(0)
  })

  it('getLocalState should return copy of local state', () => {
    const state = awareness.getLocalState()
    expect(state.userName).toBe('Alice')
    state.userName = 'Modified'
    expect(awareness._localState.userName).toBe('Alice')
  })

  it('startBroadcasting and stopBroadcasting', () => {
    vi.useFakeTimers()
    const sendFn = vi.fn()
    awareness.startBroadcasting(sendFn, 100)
    vi.advanceTimersByTime(300)
    expect(sendFn).toHaveBeenCalledTimes(3)
    awareness.stopBroadcasting()
    vi.advanceTimersByTime(200)
    expect(sendFn).toHaveBeenCalledTimes(3)
    vi.useRealTimers()
  })

  it('resetIdleTimer sets status to active', () => {
    vi.useFakeTimers()
    awareness.setStatus('idle')
    awareness.resetIdleTimer()
    expect(awareness._localState.status).toBe('active')
    vi.useRealTimers()
  })

  it('clearRemoteCursors clears container', () => {
    const el = document.createElement('div')
    document.body.appendChild(el)
    // Manually create cursor container
    awareness._cursorsContainer = document.createElement('div')
    awareness._cursorsContainer.innerHTML = '<div>cursor</div>'
    awareness.clearRemoteCursors(el)
    expect(awareness._cursorsContainer.innerHTML).toBe('')
    el.remove()
  })

  it('destroy cleans up', () => {
    vi.useFakeTimers()
    awareness.startBroadcasting(vi.fn(), 100)
    awareness.destroy()
    expect(awareness._remoteStates.size).toBe(0)
    expect(awareness._broadcastInterval).toBeNull()
    vi.useRealTimers()
  })
})
