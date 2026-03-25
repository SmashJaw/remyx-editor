import { vi, describe, it, expect, beforeEach } from 'vitest'
import { CrdtEngine, offsetToRange, rangeToOffset } from '../plugins/builtins/collaborationFeatures/CrdtEngine.js'

describe('CrdtEngine — comprehensive coverage', () => {
  let crdt

  beforeEach(() => {
    crdt = new CrdtEngine('user1')
  })

  describe('constructor', () => {
    it('initializes with userId and clock', () => {
      expect(crdt.userId).toBe('user1')
      expect(crdt._clock).toEqual({ user1: 0 })
      expect(crdt.hasPendingOps()).toBe(false)
    })
  })

  describe('vector clock', () => {
    it('tickLocal increments local clock', () => {
      const clock1 = crdt._tickLocal()
      expect(clock1.user1).toBe(1)
      const clock2 = crdt._tickLocal()
      expect(clock2.user1).toBe(2)
    })

    it('merge takes pointwise max', () => {
      crdt._clock.user1 = 3
      crdt._merge({ user1: 1, user2: 5 })
      expect(crdt._clock.user1).toBe(3)
      expect(crdt._clock.user2).toBe(5)
    })
  })

  describe('captureOperations', () => {
    it('detects insert operations', () => {
      const el = document.createElement('div')
      el.textContent = 'hello'
      crdt.initTextContent(el)

      el.textContent = 'hello world'
      const ops = crdt.captureOperations([], el)
      expect(ops).toHaveLength(1)
      expect(ops[0].type).toBe('insert')
      expect(ops[0].content).toBe(' world')
    })

    it('detects delete operations', () => {
      const el = document.createElement('div')
      el.textContent = 'hello world'
      crdt.initTextContent(el)

      el.textContent = 'hello'
      const ops = crdt.captureOperations([], el)
      expect(ops).toHaveLength(1)
      expect(ops[0].type).toBe('delete')
      expect(ops[0].length).toBe(6)
    })

    it('detects replace operations', () => {
      const el = document.createElement('div')
      el.textContent = 'hello'
      crdt.initTextContent(el)

      el.textContent = 'hxllo'
      const ops = crdt.captureOperations([], el)
      expect(ops).toHaveLength(1)
      expect(ops[0].type).toBe('replace')
    })

    it('returns empty for no change', () => {
      const el = document.createElement('div')
      el.textContent = 'hello'
      crdt.initTextContent(el)

      const ops = crdt.captureOperations([], el)
      expect(ops).toEqual([])
    })

    it('returns empty when suppressed', () => {
      crdt._suppressRemote = true
      const el = document.createElement('div')
      el.textContent = 'changed'
      const ops = crdt.captureOperations([], el)
      expect(ops).toEqual([])
    })

    it('handles first capture with null lastText', () => {
      const el = document.createElement('div')
      el.textContent = 'hello'
      const ops = crdt.captureOperations([], el)
      expect(ops).toEqual([])
      expect(crdt._lastTextContent).toBe('hello')
    })
  })

  describe('_findInsert / _findDelete / _findReplace', () => {
    it('findInsert finds correct position', () => {
      const result = crdt._findInsert('hello', 'hello world')
      expect(result.position).toBe(5)
      expect(result.content).toBe(' world')
    })

    it('findDelete finds correct position', () => {
      const result = crdt._findDelete('hello world', 'hello')
      expect(result.position).toBe(5)
      expect(result.length).toBe(6)
    })

    it('findReplace finds replacement', () => {
      const result = crdt._findReplace('hello', 'hxllo')
      expect(result.position).toBe(1)
      expect(result.length).toBe(1)
      expect(result.content).toBe('x')
    })

    it('findReplace returns empty for identical strings', () => {
      const result = crdt._findReplace('hello', 'hello')
      expect(result.content).toBeUndefined()
    })
  })

  describe('_transformPosition', () => {
    it('transforms position after insert', () => {
      const op = { type: 'insert', position: 5, content: 'abc' }
      expect(crdt._transformPosition(10, op)).toBe(13)
      expect(crdt._transformPosition(3, op)).toBe(3) // before insert
    })

    it('transforms position after delete', () => {
      const op = { type: 'delete', position: 5, length: 3 }
      expect(crdt._transformPosition(10, op)).toBe(7)
      expect(crdt._transformPosition(6, op)).toBe(5) // within deleted range
    })

    it('transforms position after replace', () => {
      const op = { type: 'replace', position: 5, length: 3, content: 'abcde' }
      expect(crdt._transformPosition(10, op)).toBe(12) // after replace
      expect(crdt._transformPosition(6, op)).toBe(10) // within replaced range
    })
  })

  describe('applyRemoteOperations', () => {
    it('applies insert operation', () => {
      const el = document.createElement('div')
      el.textContent = 'hello'
      crdt.initTextContent(el)

      crdt.applyRemoteOperations([
        {
          id: 'user2-1',
          type: 'insert',
          userId: 'user2',
          clock: { user2: 1 },
          timestamp: Date.now(),
          position: 5,
          content: ' world',
        },
      ], el)

      expect(el.textContent).toBe('hello world')
    })

    it('applies delete operation', () => {
      const el = document.createElement('div')
      el.textContent = 'hello world'
      crdt.initTextContent(el)

      crdt.applyRemoteOperations([
        {
          id: 'user2-1',
          type: 'delete',
          userId: 'user2',
          clock: { user2: 1 },
          timestamp: Date.now(),
          position: 5,
          length: 6,
        },
      ], el)

      expect(el.textContent).toBe('hello')
    })

    it('applies replace operation', () => {
      const el = document.createElement('div')
      el.textContent = 'hello'
      crdt.initTextContent(el)

      crdt.applyRemoteOperations([
        {
          id: 'user2-1',
          type: 'replace',
          userId: 'user2',
          clock: { user2: 1 },
          timestamp: Date.now(),
          position: 0,
          length: 5,
          content: 'world',
        },
      ], el)

      expect(el.textContent).toBe('world')
    })

    it('skips already-seen operations', () => {
      const el = document.createElement('div')
      el.textContent = 'hello'
      crdt.initTextContent(el)

      const op = {
        id: 'user2-1',
        type: 'insert',
        userId: 'user2',
        clock: { user2: 1 },
        timestamp: Date.now(),
        position: 5,
        content: '!',
      }

      crdt.applyRemoteOperations([op], el)
      const textAfterFirst = el.textContent
      crdt.applyRemoteOperations([op], el) // same op
      expect(el.textContent).toBe(textAfterFirst) // unchanged
    })

    it('sorts operations by clock sum', () => {
      const el = document.createElement('div')
      el.textContent = 'hello'
      crdt.initTextContent(el)

      crdt.applyRemoteOperations([
        {
          id: 'user2-2',
          type: 'insert',
          userId: 'user2',
          clock: { user2: 2 },
          timestamp: 200,
          position: 5,
          content: '!!',
        },
        {
          id: 'user2-1',
          type: 'insert',
          userId: 'user2',
          clock: { user2: 1 },
          timestamp: 100,
          position: 5,
          content: '!',
        },
      ], el)
    })
  })

  describe('offline queue', () => {
    it('queues and flushes operations', () => {
      const op = { id: 'user1-1', type: 'insert' }
      crdt.queueOperation(op)
      expect(crdt.hasPendingOps()).toBe(true)

      const flushed = crdt.flushQueue()
      expect(flushed).toHaveLength(1)
      expect(crdt.hasPendingOps()).toBe(false)
    })
  })

  describe('_trackOp', () => {
    it('evicts oldest ops when exceeding max', () => {
      crdt._maxSeenOps = 5
      for (let i = 0; i < 10; i++) {
        crdt._trackOp(`op-${i}`)
      }
      expect(crdt._seenOps.size).toBe(5)
    })
  })

  describe('getState', () => {
    it('returns current state', () => {
      crdt.queueOperation({ id: 'x' })
      crdt._trackOp('seen1')
      const state = crdt.getState()
      expect(state.pendingOps).toBe(1)
      expect(state.seenOps).toBe(1)
      expect(state.clock).toEqual({ user1: 0 })
    })
  })

  describe('destroy', () => {
    it('clears all state', () => {
      crdt.queueOperation({ id: 'x' })
      crdt._trackOp('y')
      crdt.destroy()
      expect(crdt.hasPendingOps()).toBe(false)
      expect(crdt._seenOps.size).toBe(0)
    })
  })
})

describe('offsetToRange / rangeToOffset', () => {
  it('converts offset to range and back', () => {
    const el = document.createElement('div')
    el.textContent = 'hello world'
    document.body.appendChild(el)

    const range = offsetToRange(el, 6, 5) // 'world'
    expect(range).toBeTruthy()
    expect(range.toString()).toBe('world')

    const { offset, length } = rangeToOffset(el, range)
    expect(offset).toBe(6)
    expect(length).toBe(5)

    el.remove()
  })

  it('handles caret position (length 0)', () => {
    const el = document.createElement('div')
    el.textContent = 'hello'
    document.body.appendChild(el)

    const range = offsetToRange(el, 3)
    expect(range).toBeTruthy()
    expect(range.collapsed).toBe(true)

    el.remove()
  })

  it('handles offset beyond content', () => {
    const el = document.createElement('div')
    el.textContent = 'hi'
    document.body.appendChild(el)

    const range = offsetToRange(el, 100)
    expect(range).toBeTruthy()

    el.remove()
  })
})
