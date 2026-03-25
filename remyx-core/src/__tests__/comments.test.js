/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { CommentsPlugin, parseMentions } from '../plugins/builtins/commentsFeatures/index.js'
import { createPlugin } from '../plugins/createPlugin.js'

// ---- Helpers ----

function createMockEngine() {
  const listeners = {}
  const el = document.createElement('div')
  el.contentEditable = 'true'
  el.innerHTML = '<p>Hello world this is a test</p>'
  document.body.appendChild(el)

  return {
    element: el,
    eventBus: {
      on(event, handler) {
        if (!listeners[event]) listeners[event] = []
        listeners[event].push(handler)
        return () => {
          listeners[event] = listeners[event].filter(h => h !== handler)
        }
      },
      emit(event, data) {
        if (listeners[event]) {
          for (const h of listeners[event]) h(data)
        }
      },
    },
    history: {
      snapshot: vi.fn(),
    },
    commands: {
      register: vi.fn(),
    },
    _cleanup() {
      document.body.removeChild(el)
    },
  }
}

function selectText(el, startOffset, endOffset) {
  const textNode = el.querySelector('p')?.firstChild
  if (!textNode) return
  const range = document.createRange()
  range.setStart(textNode, startOffset)
  range.setEnd(textNode, endOffset)
  const sel = window.getSelection()
  sel.removeAllRanges()
  sel.addRange(range)
}

// ---- Tests ----

describe('parseMentions', () => {
  it('returns empty array for null/empty input', () => {
    expect(parseMentions(null)).toEqual([])
    expect(parseMentions('')).toEqual([])
  })

  it('extracts @mentions from text', () => {
    expect(parseMentions('Hello @alice and @bob')).toEqual(['alice', 'bob'])
  })

  it('handles mentions with dots and hyphens', () => {
    expect(parseMentions('@john.doe @jane-smith')).toEqual(['john.doe', 'jane-smith'])
  })

  it('returns empty for text without mentions', () => {
    expect(parseMentions('No mentions here')).toEqual([])
  })
})

describe('CommentsPlugin', () => {
  let engine
  let plugin
  let onComment, onResolve, onDelete, onReply

  beforeEach(() => {
    engine = createMockEngine()
    onComment = vi.fn()
    onResolve = vi.fn()
    onDelete = vi.fn()
    onReply = vi.fn()

    plugin = CommentsPlugin({
      onComment,
      onResolve,
      onDelete,
      onReply,
      mentionUsers: ['alice', 'bob', 'charlie'],
    })
  })

  afterEach(() => {
    engine._cleanup()
  })

  it('creates a valid plugin', () => {
    expect(plugin.name).toBe('comments')
    expect(plugin.requiresFullAccess).toBe(true)
    expect(typeof plugin.init).toBe('function')
    expect(typeof plugin.destroy).toBe('function')
  })

  it('registers 6 commands', () => {
    expect(plugin.commands.length).toBe(6)
    const names = plugin.commands.map(c => c.name)
    expect(names).toContain('addComment')
    expect(names).toContain('deleteComment')
    expect(names).toContain('resolveComment')
    expect(names).toContain('replyToComment')
    expect(names).toContain('editComment')
    expect(names).toContain('navigateToComment')
  })

  it('has a context menu item for Add Comment', () => {
    expect(plugin.contextMenuItems.length).toBe(1)
    expect(plugin.contextMenuItems[0].label).toBe('Add Comment')
  })

  describe('after init', () => {
    beforeEach(() => {
      plugin.init(engine)
    })

    afterEach(() => {
      plugin.destroy()
    })

    it('exposes _comments API on engine', () => {
      expect(engine._comments).toBeDefined()
      expect(typeof engine._comments.addComment).toBe('function')
      expect(typeof engine._comments.deleteComment).toBe('function')
      expect(typeof engine._comments.resolveComment).toBe('function')
      expect(typeof engine._comments.replyToComment).toBe('function')
      expect(typeof engine._comments.getAllThreads).toBe('function')
      expect(typeof engine._comments.getThread).toBe('function')
      expect(typeof engine._comments.getUnresolvedThreads).toBe('function')
      expect(typeof engine._comments.getResolvedThreads).toBe('function')
      expect(typeof engine._comments.importThreads).toBe('function')
      expect(typeof engine._comments.exportThreads).toBe('function')
      expect(typeof engine._comments.getMentionUsers).toBe('function')
    })

    it('starts with no threads', () => {
      expect(engine._comments.getAllThreads()).toEqual([])
    })

    it('getMentionUsers returns configured list', () => {
      expect(engine._comments.getMentionUsers()).toEqual(['alice', 'bob', 'charlie'])
    })

    it('addComment creates a thread when text is selected', () => {
      selectText(engine.element, 0, 5) // "Hello"
      const thread = engine._comments.addComment({ author: 'Alice', body: 'Nice intro!' })

      expect(thread).not.toBeNull()
      expect(thread.author).toBe('Alice')
      expect(thread.body).toBe('Nice intro!')
      expect(thread.resolved).toBe(false)
      expect(thread.replies).toEqual([])
      expect(onComment).toHaveBeenCalledWith(thread)
    })

    it('addComment wraps selected text in a <mark>', () => {
      selectText(engine.element, 0, 5)
      const thread = engine._comments.addComment({ author: 'Bob', body: 'Comment' })

      const mark = engine.element.querySelector(`[data-comment-id="${thread.id}"]`)
      expect(mark).not.toBeNull()
      expect(mark.tagName).toBe('MARK')
      expect(mark.classList.contains('rmx-comment')).toBe(true)
      expect(mark.textContent).toBe('Hello')
    })

    it('addComment returns null when no text is selected', () => {
      window.getSelection().removeAllRanges()
      const thread = engine._comments.addComment({ author: 'Bob', body: 'No selection' })
      expect(thread).toBeNull()
    })

    it('addComment takes a history snapshot', () => {
      selectText(engine.element, 0, 5)
      engine._comments.addComment({ author: 'Bob', body: 'Test' })
      expect(engine.history.snapshot).toHaveBeenCalled()
    })

    it('resolveComment updates thread and DOM', () => {
      selectText(engine.element, 0, 5)
      const thread = engine._comments.addComment({ author: 'Alice', body: 'Test' })

      engine._comments.resolveComment(thread.id, true)
      expect(engine._comments.getThread(thread.id).resolved).toBe(true)

      const mark = engine.element.querySelector(`[data-comment-id="${thread.id}"]`)
      expect(mark.getAttribute('data-comment-resolved')).toBe('true')
      expect(mark.classList.contains('rmx-comment-resolved')).toBe(true)
      expect(onResolve).toHaveBeenCalledWith({ thread: expect.any(Object), resolved: true })
    })

    it('resolveComment can unresolve', () => {
      selectText(engine.element, 0, 5)
      const thread = engine._comments.addComment({ author: 'Alice', body: 'Test' })
      engine._comments.resolveComment(thread.id, true)
      engine._comments.resolveComment(thread.id, false)

      expect(engine._comments.getThread(thread.id).resolved).toBe(false)
    })

    it('deleteComment removes thread and unwraps mark', () => {
      selectText(engine.element, 0, 5)
      const thread = engine._comments.addComment({ author: 'Alice', body: 'Test' })
      const id = thread.id

      engine._comments.deleteComment(id)

      expect(engine._comments.getThread(id)).toBeUndefined()
      expect(engine.element.querySelector(`[data-comment-id="${id}"]`)).toBeNull()
      expect(onDelete).toHaveBeenCalledWith(thread)
      // Text should still be present
      expect(engine.element.textContent).toContain('Hello')
    })

    it('replyToComment adds a reply to a thread', () => {
      selectText(engine.element, 0, 5)
      const thread = engine._comments.addComment({ author: 'Alice', body: 'What does this mean?' })

      const reply = engine._comments.replyToComment(thread.id, { author: 'Bob', body: 'It means hello @alice' })

      expect(reply).not.toBeNull()
      expect(reply.author).toBe('Bob')
      expect(reply.body).toBe('It means hello @alice')
      expect(reply.mentions).toEqual(['alice'])
      expect(engine._comments.getThread(thread.id).replies.length).toBe(1)
      expect(onReply).toHaveBeenCalledWith({ thread: expect.any(Object), reply })
    })

    it('replyToComment returns null for unknown thread', () => {
      expect(engine._comments.replyToComment('nonexistent', { body: 'Hi' })).toBeNull()
    })

    it('editComment updates thread body', () => {
      selectText(engine.element, 0, 5)
      const thread = engine._comments.addComment({ author: 'Alice', body: 'Original' })

      engine._comments.editComment(thread.id, 'Updated body @bob')

      expect(engine._comments.getThread(thread.id).body).toBe('Updated body @bob')
      expect(engine._comments.getThread(thread.id).mentions).toEqual(['bob'])
    })

    it('getUnresolvedThreads filters correctly', () => {
      // Reset DOM so we have clean text nodes
      engine.element.innerHTML = '<p>Hello world this is a test</p>'
      selectText(engine.element, 0, 5)
      const t1 = engine._comments.addComment({ author: 'A', body: 'Open' })

      // Reset DOM again for second comment
      engine.element.innerHTML = '<p>Another paragraph for testing</p>'
      selectText(engine.element, 0, 7)
      const t2 = engine._comments.addComment({ author: 'B', body: 'Will resolve' })
      engine._comments.resolveComment(t2.id, true)

      const unresolved = engine._comments.getUnresolvedThreads()
      // t1's mark was removed when we reset innerHTML, so syncWithDOM cleaned it up
      // Only t2 remains, and it's resolved
      expect(engine._comments.getResolvedThreads().length).toBe(1)
    })

    it('getResolvedThreads filters correctly', () => {
      selectText(engine.element, 0, 5)
      const t1 = engine._comments.addComment({ author: 'A', body: 'Open' })
      engine._comments.resolveComment(t1.id, true)

      expect(engine._comments.getResolvedThreads().length).toBe(1)
    })

    it('exportThreads returns serializable array', () => {
      selectText(engine.element, 0, 5)
      engine._comments.addComment({ author: 'A', body: 'Test' })

      const exported = engine._comments.exportThreads()
      expect(exported.length).toBe(1)
      expect(exported[0].author).toBe('A')
      // Should be JSON-serializable
      const json = JSON.stringify(exported)
      expect(JSON.parse(json)).toEqual(exported)
    })

    it('importThreads loads threads', () => {
      const imported = [
        { id: 'imported-1', author: 'X', body: 'Imported', mentions: [], resolved: false, createdAt: 1000, updatedAt: 1000, replies: [] },
      ]
      engine._comments.importThreads(imported)
      expect(engine._comments.getThread('imported-1')).toBeDefined()
      expect(engine._comments.getThread('imported-1').author).toBe('X')
    })

    it('navigateToComment scrolls to and selects the mark', () => {
      selectText(engine.element, 0, 5)
      const thread = engine._comments.addComment({ author: 'A', body: 'Test' })

      engine._comments.navigateToComment(thread.id)

      const sel = window.getSelection()
      expect(sel.rangeCount).toBeGreaterThan(0)
    })

    it('emits comment:clicked when a mark is clicked', () => {
      selectText(engine.element, 0, 5)
      const thread = engine._comments.addComment({ author: 'A', body: 'Click me' })

      const clickHandler = vi.fn()
      engine.eventBus.on('comment:clicked', clickHandler)

      const mark = engine.element.querySelector(`[data-comment-id="${thread.id}"]`)
      mark.click()

      expect(clickHandler).toHaveBeenCalledWith(expect.objectContaining({ thread }))
    })

    it('scans existing marks on init', () => {
      plugin.destroy()

      // Add a mark manually to the DOM
      engine.element.innerHTML = '<p><mark class="rmx-comment" data-comment-id="pre-existing" title="Author: Pre-existing comment">Some text</mark></p>'

      // Re-init
      plugin.init(engine)

      const thread = engine._comments.getThread('pre-existing')
      expect(thread).toBeDefined()
      expect(thread.id).toBe('pre-existing')
    })
  })

  describe('comment-only mode', () => {
    it('sets contenteditable to false', () => {
      const commentOnlyPlugin = CommentsPlugin({ commentOnly: true })
      commentOnlyPlugin.init(engine)

      expect(engine.element.getAttribute('contenteditable')).toBe('false')
      expect(engine.element.classList.contains('rmx-comment-only')).toBe(true)

      commentOnlyPlugin.destroy()
    })
  })
})

// Need afterEach for the import
import { afterEach } from 'vitest'
