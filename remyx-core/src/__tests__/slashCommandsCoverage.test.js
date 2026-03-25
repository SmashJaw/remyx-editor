import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  filterSlashItems,
  getRecentCommands,
  recordRecentCommand,
  clearRecentCommands,
  registerCommandItems,
  unregisterCommandItem,
  getCustomCommandItems,
  SLASH_COMMAND_ITEMS,
  registerSlashCommands,
} from '../commands/slashCommands.js'

vi.mock('../utils/platform.js', () => ({
  isMac: vi.fn(() => false),
}))

import { isMac } from '../utils/platform.js'

describe('slashCommands — extended coverage', () => {
  beforeEach(() => {
    localStorage.clear()
    // Clear custom items between tests
    while (getCustomCommandItems().length > 0) {
      unregisterCommandItem(getCustomCommandItems()[0].id)
    }
  })

  describe('getRecentCommands', () => {
    it('returns empty array when nothing stored', () => {
      expect(getRecentCommands()).toEqual([])
    })

    it('returns stored commands', () => {
      localStorage.setItem('rmx-recent-commands', JSON.stringify(['heading1', 'heading2']))
      expect(getRecentCommands()).toEqual(['heading1', 'heading2'])
    })

    it('limits to MAX_RECENT (5)', () => {
      localStorage.setItem('rmx-recent-commands', JSON.stringify(['a', 'b', 'c', 'd', 'e', 'f', 'g']))
      expect(getRecentCommands()).toHaveLength(5)
    })

    it('returns empty array for invalid JSON', () => {
      localStorage.setItem('rmx-recent-commands', 'not json')
      expect(getRecentCommands()).toEqual([])
    })

    it('returns empty array for non-array JSON', () => {
      localStorage.setItem('rmx-recent-commands', '{"key":"val"}')
      expect(getRecentCommands()).toEqual([])
    })
  })

  describe('recordRecentCommand', () => {
    it('adds command to top of list', () => {
      recordRecentCommand('heading1')
      expect(getRecentCommands()).toEqual(['heading1'])
    })

    it('deduplicates and moves to top', () => {
      recordRecentCommand('heading1')
      recordRecentCommand('heading2')
      recordRecentCommand('heading1')
      expect(getRecentCommands()[0]).toBe('heading1')
      expect(getRecentCommands()[1]).toBe('heading2')
    })

    it('limits to 5 items', () => {
      for (let i = 0; i < 10; i++) {
        recordRecentCommand(`cmd${i}`)
      }
      expect(getRecentCommands()).toHaveLength(5)
    })
  })

  describe('clearRecentCommands', () => {
    it('removes recent commands from localStorage', () => {
      recordRecentCommand('heading1')
      clearRecentCommands()
      expect(getRecentCommands()).toEqual([])
    })
  })

  describe('registerCommandItems / unregisterCommandItem / getCustomCommandItems', () => {
    it('registers a single item', () => {
      registerCommandItems({ id: 'custom1', label: 'Custom 1', description: '', icon: '', keywords: [], category: 'Custom', action: () => {} })
      expect(getCustomCommandItems()).toHaveLength(1)
      expect(getCustomCommandItems()[0].id).toBe('custom1')
    })

    it('registers an array of items', () => {
      registerCommandItems([
        { id: 'c1', label: 'C1', description: '', icon: '', keywords: [], category: 'Custom', action: () => {} },
        { id: 'c2', label: 'C2', description: '', icon: '', keywords: [], category: 'Custom', action: () => {} },
      ])
      expect(getCustomCommandItems()).toHaveLength(2)
    })

    it('replaces item with same id', () => {
      registerCommandItems({ id: 'c1', label: 'Old', description: '', icon: '', keywords: [], category: 'Custom', action: () => {} })
      registerCommandItems({ id: 'c1', label: 'New', description: '', icon: '', keywords: [], category: 'Custom', action: () => {} })
      expect(getCustomCommandItems()).toHaveLength(1)
      expect(getCustomCommandItems()[0].label).toBe('New')
    })

    it('unregisters an item and returns true', () => {
      registerCommandItems({ id: 'c1', label: 'C1', description: '', icon: '', keywords: [], category: 'Custom', action: () => {} })
      expect(unregisterCommandItem('c1')).toBe(true)
      expect(getCustomCommandItems()).toHaveLength(0)
    })

    it('returns false when unregistering non-existent item', () => {
      expect(unregisterCommandItem('nonexistent')).toBe(false)
    })

    it('returns a copy of items array', () => {
      registerCommandItems({ id: 'c1', label: 'C1', description: '', icon: '', keywords: [], category: 'Custom', action: () => {} })
      const items = getCustomCommandItems()
      items.push({ id: 'hack' })
      expect(getCustomCommandItems()).toHaveLength(1)
    })
  })

  describe('filterSlashItems', () => {
    const items = [
      { id: 'heading1', label: 'Heading 1', description: 'Large heading', icon: 'H1', keywords: ['h1', 'title'], category: 'Text' },
      { id: 'blockquote', label: 'Blockquote', description: 'Indented quote', icon: '"', keywords: ['quote'], category: 'Text' },
      { id: 'image', label: 'Image', description: 'Insert image', icon: 'I', keywords: ['img', 'photo'], category: 'Media' },
    ]

    it('returns all items when query is empty', () => {
      expect(filterSlashItems(items, '')).toEqual(items)
    })

    it('filters by label (case-insensitive)', () => {
      const result = filterSlashItems(items, 'head')
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('heading1')
    })

    it('filters by description', () => {
      const result = filterSlashItems(items, 'indent')
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('blockquote')
    })

    it('filters by keyword', () => {
      const result = filterSlashItems(items, 'photo')
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('image')
    })

    it('prioritizes label matches over keyword/description matches', () => {
      const result = filterSlashItems(items, 'image')
      expect(result[0].id).toBe('image')
    })

    it('returns empty array when nothing matches', () => {
      expect(filterSlashItems(items, 'zzzzz')).toEqual([])
    })

    it('pins recent commands when pinRecent is true and no query', () => {
      recordRecentCommand('blockquote')
      const result = filterSlashItems(items, '', { pinRecent: true })
      expect(result[0].category).toBe('Recent')
      expect(result[0].id).toBe('blockquote')
      expect(result.length).toBe(items.length + 1) // recent + all
    })

    it('does not pin recent when pinRecent is false', () => {
      recordRecentCommand('blockquote')
      const result = filterSlashItems(items, '', { pinRecent: false })
      expect(result).toEqual(items)
    })

    it('returns items unchanged when no recent commands and pinRecent is true', () => {
      const result = filterSlashItems(items, '', { pinRecent: true })
      expect(result).toEqual(items)
    })
  })

  describe('SLASH_COMMAND_ITEMS actions', () => {
    it('heading1 calls executeCommand heading 1', () => {
      const engine = { executeCommand: vi.fn(), commands: { has: vi.fn(() => true) } }
      const item = SLASH_COMMAND_ITEMS.find(i => i.id === 'heading1')
      item.action(engine)
      expect(engine.executeCommand).toHaveBeenCalledWith('heading', 1)
    })

    it('heading2 calls executeCommand heading 2', () => {
      const engine = { executeCommand: vi.fn(), commands: { has: vi.fn(() => true) } }
      const item = SLASH_COMMAND_ITEMS.find(i => i.id === 'heading2')
      item.action(engine)
      expect(engine.executeCommand).toHaveBeenCalledWith('heading', 2)
    })

    it('heading3 calls executeCommand heading 3', () => {
      const engine = { executeCommand: vi.fn(), commands: { has: vi.fn(() => true) } }
      const item = SLASH_COMMAND_ITEMS.find(i => i.id === 'heading3')
      item.action(engine)
      expect(engine.executeCommand).toHaveBeenCalledWith('heading', 3)
    })

    it('paragraph calls heading with p', () => {
      const engine = { executeCommand: vi.fn() }
      SLASH_COMMAND_ITEMS.find(i => i.id === 'paragraph').action(engine)
      expect(engine.executeCommand).toHaveBeenCalledWith('heading', 'p')
    })

    it('blockquote calls executeCommand blockquote', () => {
      const engine = { executeCommand: vi.fn() }
      SLASH_COMMAND_ITEMS.find(i => i.id === 'blockquote').action(engine)
      expect(engine.executeCommand).toHaveBeenCalledWith('blockquote')
    })

    it('codeBlock calls executeCommand codeBlock', () => {
      const engine = { executeCommand: vi.fn() }
      SLASH_COMMAND_ITEMS.find(i => i.id === 'codeBlock').action(engine)
      expect(engine.executeCommand).toHaveBeenCalledWith('codeBlock')
    })

    it('image calls openModal', () => {
      const openModal = vi.fn()
      SLASH_COMMAND_ITEMS.find(i => i.id === 'image').action({}, openModal)
      expect(openModal).toHaveBeenCalledWith('image')
    })

    it('table calls openModal', () => {
      const openModal = vi.fn()
      SLASH_COMMAND_ITEMS.find(i => i.id === 'table').action({}, openModal)
      expect(openModal).toHaveBeenCalledWith('table')
    })

    it('horizontalRule calls executeCommand horizontalRule', () => {
      const engine = { executeCommand: vi.fn() }
      SLASH_COMMAND_ITEMS.find(i => i.id === 'horizontalRule').action(engine)
      expect(engine.executeCommand).toHaveBeenCalledWith('horizontalRule')
    })

    it('insertCallout checks has before executing', () => {
      const engine = { executeCommand: vi.fn(), commands: { has: vi.fn(() => false) } }
      SLASH_COMMAND_ITEMS.find(i => i.id === 'insertCallout').action(engine)
      expect(engine.executeCommand).not.toHaveBeenCalled()

      engine.commands.has.mockReturnValue(true)
      SLASH_COMMAND_ITEMS.find(i => i.id === 'insertCallout').action(engine)
      expect(engine.executeCommand).toHaveBeenCalledWith('insertCallout')
    })

    it('insertMath checks has before executing', () => {
      const engine = { executeCommand: vi.fn(), commands: { has: vi.fn(() => true) } }
      SLASH_COMMAND_ITEMS.find(i => i.id === 'insertMath').action(engine)
      expect(engine.executeCommand).toHaveBeenCalledWith('insertMath', { latex: '', displayMode: true })
    })

    it('findReplace opens modal', () => {
      const openModal = vi.fn()
      SLASH_COMMAND_ITEMS.find(i => i.id === 'findReplace').action({}, openModal)
      expect(openModal).toHaveBeenCalledWith('findReplace')
    })

    it('sourceMode calls executeCommand', () => {
      const engine = { executeCommand: vi.fn() }
      SLASH_COMMAND_ITEMS.find(i => i.id === 'sourceMode').action(engine)
      expect(engine.executeCommand).toHaveBeenCalledWith('sourceMode')
    })

    it('removeFormat calls executeCommand', () => {
      const engine = { executeCommand: vi.fn() }
      SLASH_COMMAND_ITEMS.find(i => i.id === 'removeFormat').action(engine)
      expect(engine.executeCommand).toHaveBeenCalledWith('removeFormat')
    })

    it('fullscreen calls executeCommand', () => {
      const engine = { executeCommand: vi.fn() }
      SLASH_COMMAND_ITEMS.find(i => i.id === 'fullscreen').action(engine)
      expect(engine.executeCommand).toHaveBeenCalledWith('fullscreen')
    })

    it('toggleMarkdown calls executeCommand', () => {
      const engine = { executeCommand: vi.fn() }
      SLASH_COMMAND_ITEMS.find(i => i.id === 'toggleMarkdown').action(engine)
      expect(engine.executeCommand).toHaveBeenCalledWith('toggleMarkdown')
    })

    it('distractionFree calls executeCommand', () => {
      const engine = { executeCommand: vi.fn() }
      SLASH_COMMAND_ITEMS.find(i => i.id === 'distractionFree').action(engine)
      expect(engine.executeCommand).toHaveBeenCalledWith('distractionFree')
    })

    it('toggleSplitView calls executeCommand', () => {
      const engine = { executeCommand: vi.fn() }
      SLASH_COMMAND_ITEMS.find(i => i.id === 'toggleSplitView').action(engine)
      expect(engine.executeCommand).toHaveBeenCalledWith('toggleSplitView')
    })

    it('unorderedList calls executeCommand', () => {
      const engine = { executeCommand: vi.fn() }
      SLASH_COMMAND_ITEMS.find(i => i.id === 'unorderedList').action(engine)
      expect(engine.executeCommand).toHaveBeenCalledWith('unorderedList')
    })

    it('orderedList calls executeCommand', () => {
      const engine = { executeCommand: vi.fn() }
      SLASH_COMMAND_ITEMS.find(i => i.id === 'orderedList').action(engine)
      expect(engine.executeCommand).toHaveBeenCalledWith('orderedList')
    })

    it('taskList calls executeCommand', () => {
      const engine = { executeCommand: vi.fn() }
      SLASH_COMMAND_ITEMS.find(i => i.id === 'taskList').action(engine)
      expect(engine.executeCommand).toHaveBeenCalledWith('taskList')
    })

    it('export opens modal', () => {
      const openModal = vi.fn()
      SLASH_COMMAND_ITEMS.find(i => i.id === 'export').action({}, openModal)
      expect(openModal).toHaveBeenCalledWith('export')
    })

    it('importDocument opens modal', () => {
      const openModal = vi.fn()
      SLASH_COMMAND_ITEMS.find(i => i.id === 'importDocument').action({}, openModal)
      expect(openModal).toHaveBeenCalledWith('importDocument')
    })

    it('attachment opens modal', () => {
      const openModal = vi.fn()
      SLASH_COMMAND_ITEMS.find(i => i.id === 'attachment').action({}, openModal)
      expect(openModal).toHaveBeenCalledWith('attachment')
    })

    it('embedMedia opens modal', () => {
      const openModal = vi.fn()
      SLASH_COMMAND_ITEMS.find(i => i.id === 'embedMedia').action({}, openModal)
      expect(openModal).toHaveBeenCalledWith('embed')
    })

    it('insertToc checks has and executes', () => {
      const engine = { executeCommand: vi.fn(), commands: { has: vi.fn(() => true) } }
      SLASH_COMMAND_ITEMS.find(i => i.id === 'insertToc').action(engine)
      expect(engine.executeCommand).toHaveBeenCalledWith('insertToc')
    })

    it('insertBookmark checks has and executes', () => {
      const engine = { executeCommand: vi.fn(), commands: { has: vi.fn(() => true) } }
      SLASH_COMMAND_ITEMS.find(i => i.id === 'insertBookmark').action(engine)
      expect(engine.executeCommand).toHaveBeenCalledWith('insertBookmark', { name: 'bookmark' })
    })

    it('insertMergeTag checks has and executes', () => {
      const engine = { executeCommand: vi.fn(), commands: { has: vi.fn(() => true) } }
      SLASH_COMMAND_ITEMS.find(i => i.id === 'insertMergeTag').action(engine)
      expect(engine.executeCommand).toHaveBeenCalledWith('insertMergeTag', { tag: 'name' })
    })

    it('addComment checks has and executes', () => {
      const engine = { executeCommand: vi.fn(), commands: { has: vi.fn(() => true) } }
      SLASH_COMMAND_ITEMS.find(i => i.id === 'addComment').action(engine)
      expect(engine.executeCommand).toHaveBeenCalledWith('addComment')
    })

    it('toggleAnalytics checks has and executes', () => {
      const engine = { executeCommand: vi.fn(), commands: { has: vi.fn(() => true) } }
      SLASH_COMMAND_ITEMS.find(i => i.id === 'toggleAnalytics').action(engine)
      expect(engine.executeCommand).toHaveBeenCalledWith('toggleAnalytics')
    })

    it('toggleSpellcheck checks has and executes', () => {
      const engine = { executeCommand: vi.fn(), commands: { has: vi.fn(() => true) } }
      SLASH_COMMAND_ITEMS.find(i => i.id === 'toggleSpellcheck').action(engine)
      expect(engine.executeCommand).toHaveBeenCalledWith('toggleSpellcheck')
    })

    it('checkGrammar checks has and executes', () => {
      const engine = { executeCommand: vi.fn(), commands: { has: vi.fn(() => true) } }
      SLASH_COMMAND_ITEMS.find(i => i.id === 'checkGrammar').action(engine)
      expect(engine.executeCommand).toHaveBeenCalledWith('checkGrammar')
    })

    it('startCollaboration checks has and executes', () => {
      const engine = { executeCommand: vi.fn(), commands: { has: vi.fn(() => true) } }
      SLASH_COMMAND_ITEMS.find(i => i.id === 'startCollaboration').action(engine)
      expect(engine.executeCommand).toHaveBeenCalledWith('startCollaboration')
    })

    it('stopCollaboration checks has and executes', () => {
      const engine = { executeCommand: vi.fn(), commands: { has: vi.fn(() => true) } }
      SLASH_COMMAND_ITEMS.find(i => i.id === 'stopCollaboration').action(engine)
      expect(engine.executeCommand).toHaveBeenCalledWith('stopCollaboration')
    })
  })

  describe('registerSlashCommands', () => {
    let engine

    beforeEach(() => {
      const element = document.createElement('div')
      element.contentEditable = 'true'
      element.textContent = 'test'
      document.body.appendChild(element)

      // Place selection inside element for getCaretRect to work
      const range = document.createRange()
      range.setStart(element.firstChild, 0)
      range.collapse(true)
      const sel = window.getSelection()
      sel.removeAllRanges()
      sel.addRange(range)

      // Mock getBoundingClientRect on Range prototype (jsdom doesn't support it)
      Range.prototype.getBoundingClientRect = vi.fn(() => ({
        x: 10, y: 10, width: 0, height: 20, top: 10, right: 10, bottom: 30, left: 10,
      }))

      engine = {
        element,
        eventBus: {
          on: vi.fn(() => vi.fn()),
          emit: vi.fn(),
        },
      }
      isMac.mockReturnValue(false)
    })

    afterEach(() => {
      engine.element.remove()
      delete Range.prototype.getBoundingClientRect
    })

    it('opens slash palette on Ctrl+/', () => {
      registerSlashCommands(engine)
      const event = new KeyboardEvent('keydown', { key: '/', ctrlKey: true, bubbles: true })
      engine.element.dispatchEvent(event)
      expect(engine.eventBus.emit).toHaveBeenCalledWith('slash:open', expect.objectContaining({ query: '' }))
    })

    it('closes slash palette on second Ctrl+/', () => {
      registerSlashCommands(engine)

      const openEvent = new KeyboardEvent('keydown', { key: '/', ctrlKey: true, bubbles: true })
      engine.element.dispatchEvent(openEvent)

      const closeEvent = new KeyboardEvent('keydown', { key: '/', ctrlKey: true, bubbles: true })
      engine.element.dispatchEvent(closeEvent)

      expect(engine.eventBus.emit).toHaveBeenCalledWith('slash:close')
    })

    it('uses metaKey on Mac', () => {
      isMac.mockReturnValue(true)
      registerSlashCommands(engine)
      const event = new KeyboardEvent('keydown', { key: '/', metaKey: true, bubbles: true })
      engine.element.dispatchEvent(event)
      expect(engine.eventBus.emit).toHaveBeenCalledWith('slash:open', expect.any(Object))
    })

    it('typing characters updates query', () => {
      registerSlashCommands(engine)
      engine.element.dispatchEvent(new KeyboardEvent('keydown', { key: '/', ctrlKey: true, bubbles: true }))

      engine.element.dispatchEvent(new KeyboardEvent('keydown', { key: 'h', bubbles: true }))
      expect(engine.eventBus.emit).toHaveBeenCalledWith('slash:query', { query: 'h' })

      engine.element.dispatchEvent(new KeyboardEvent('keydown', { key: 'e', bubbles: true }))
      expect(engine.eventBus.emit).toHaveBeenCalledWith('slash:query', { query: 'he' })
    })

    it('Backspace removes last query character', () => {
      registerSlashCommands(engine)
      engine.element.dispatchEvent(new KeyboardEvent('keydown', { key: '/', ctrlKey: true, bubbles: true }))
      engine.element.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }))
      engine.element.dispatchEvent(new KeyboardEvent('keydown', { key: 'b', bubbles: true }))
      engine.element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true }))
      expect(engine.eventBus.emit).toHaveBeenCalledWith('slash:query', { query: 'a' })
    })

    it('Backspace with empty query closes palette', () => {
      registerSlashCommands(engine)
      engine.element.dispatchEvent(new KeyboardEvent('keydown', { key: '/', ctrlKey: true, bubbles: true }))
      engine.element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true }))
      expect(engine.eventBus.emit).toHaveBeenCalledWith('slash:close')
    })

    it('Escape closes palette', () => {
      registerSlashCommands(engine)
      engine.element.dispatchEvent(new KeyboardEvent('keydown', { key: '/', ctrlKey: true, bubbles: true }))
      engine.element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
      expect(engine.eventBus.emit).toHaveBeenCalledWith('slash:close')
    })

    it('ArrowDown/ArrowUp/Enter/Tab are forwarded as slash:keydown', () => {
      registerSlashCommands(engine)
      engine.element.dispatchEvent(new KeyboardEvent('keydown', { key: '/', ctrlKey: true, bubbles: true }))

      for (const key of ['ArrowDown', 'ArrowUp', 'Enter', 'Tab']) {
        engine.element.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))
        expect(engine.eventBus.emit).toHaveBeenCalledWith('slash:keydown', { key })
      }
    })

    it('handles slash:execute event', () => {
      registerSlashCommands(engine)
      const handler = engine.eventBus.on.mock.calls.find(c => c[0] === 'slash:execute')
      expect(handler).toBeTruthy()

      const mockItem = { id: 'heading1', action: vi.fn() }
      const openModal = vi.fn()
      handler[1]({ item: mockItem, openModal })

      expect(mockItem.action).toHaveBeenCalledWith(engine, openModal)
      expect(engine.eventBus.emit).toHaveBeenCalledWith('content:change')
    })
  })
})
