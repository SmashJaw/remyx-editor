/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  SLASH_COMMAND_ITEMS,
  filterSlashItems,
  getRecentCommands,
  recordRecentCommand,
  clearRecentCommands,
  registerCommandItems,
  unregisterCommandItem,
  getCustomCommandItems,
} from '../commands/slashCommands.js'

describe('SLASH_COMMAND_ITEMS', () => {
  it('exports a non-empty array of command items', () => {
    expect(Array.isArray(SLASH_COMMAND_ITEMS)).toBe(true)
    expect(SLASH_COMMAND_ITEMS.length).toBeGreaterThan(0)
  })

  it('each item has required fields', () => {
    for (const item of SLASH_COMMAND_ITEMS) {
      expect(item).toHaveProperty('id')
      expect(item).toHaveProperty('label')
      expect(item).toHaveProperty('description')
      expect(item).toHaveProperty('icon')
      expect(item).toHaveProperty('keywords')
      expect(item).toHaveProperty('category')
      expect(item).toHaveProperty('action')
      expect(typeof item.action).toBe('function')
    }
  })

  it('has unique ids', () => {
    const ids = SLASH_COMMAND_ITEMS.map(i => i.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('covers all 5 categories', () => {
    const categories = new Set(SLASH_COMMAND_ITEMS.map(i => i.category))
    expect(categories).toContain('Text')
    expect(categories).toContain('Lists')
    expect(categories).toContain('Media')
    expect(categories).toContain('Layout')
    expect(categories).toContain('Advanced')
  })
})

describe('filterSlashItems', () => {
  it('returns all items when query is empty', () => {
    const result = filterSlashItems(SLASH_COMMAND_ITEMS, '', { pinRecent: false })
    expect(result).toEqual(SLASH_COMMAND_ITEMS)
  })

  it('filters by label', () => {
    const result = filterSlashItems(SLASH_COMMAND_ITEMS, 'heading')
    expect(result.length).toBeGreaterThanOrEqual(3)
    expect(result.every(i => i.label.toLowerCase().includes('heading'))).toBe(true)
  })

  it('filters by keyword', () => {
    const result = filterSlashItems(SLASH_COMMAND_ITEMS, 'todo')
    expect(result.length).toBeGreaterThanOrEqual(1)
    expect(result[0].id).toBe('taskList')
  })

  it('filters by description', () => {
    const result = filterSlashItems(SLASH_COMMAND_ITEMS, 'divider')
    expect(result.length).toBeGreaterThanOrEqual(1)
    expect(result[0].id).toBe('horizontalRule')
  })

  it('prioritizes label matches over keyword/description matches', () => {
    const items = [
      { id: 'a', label: 'Find', description: 'search stuff', icon: '', keywords: [], category: 'A', action: () => {} },
      { id: 'b', label: 'Replace', description: 'find and replace', icon: '', keywords: ['find'], category: 'A', action: () => {} },
    ]
    const result = filterSlashItems(items, 'find', { pinRecent: false })
    expect(result[0].id).toBe('a') // label match first
    expect(result[1].id).toBe('b') // keyword/description match second
  })

  it('returns empty array for non-matching query', () => {
    const result = filterSlashItems(SLASH_COMMAND_ITEMS, 'zzzznotacommand')
    expect(result).toEqual([])
  })
})

describe('Recently-used commands', () => {
  beforeEach(() => {
    clearRecentCommands()
  })

  it('returns empty array initially', () => {
    expect(getRecentCommands()).toEqual([])
  })

  it('records and retrieves commands', () => {
    recordRecentCommand('heading1')
    recordRecentCommand('bold')
    expect(getRecentCommands()).toEqual(['bold', 'heading1'])
  })

  it('deduplicates — reusing a command moves it to the front', () => {
    recordRecentCommand('a')
    recordRecentCommand('b')
    recordRecentCommand('c')
    recordRecentCommand('a') // re-used
    expect(getRecentCommands()[0]).toBe('a')
    expect(getRecentCommands()).toEqual(['a', 'c', 'b'])
  })

  it('limits to 5 recent commands', () => {
    for (let i = 0; i < 10; i++) {
      recordRecentCommand(`cmd${i}`)
    }
    expect(getRecentCommands().length).toBe(5)
  })

  it('clearRecentCommands empties the list', () => {
    recordRecentCommand('x')
    clearRecentCommands()
    expect(getRecentCommands()).toEqual([])
  })

  it('filterSlashItems pins recent items when no query', () => {
    recordRecentCommand('heading1')
    recordRecentCommand('blockquote')
    const result = filterSlashItems(SLASH_COMMAND_ITEMS, '')
    // First items should be from "Recent" category
    expect(result[0].category).toBe('Recent')
    expect(result[0].id).toBe('blockquote')
    expect(result[1].category).toBe('Recent')
    expect(result[1].id).toBe('heading1')
  })

  it('filterSlashItems does not pin recent when query is present', () => {
    recordRecentCommand('heading1')
    const result = filterSlashItems(SLASH_COMMAND_ITEMS, 'table')
    const recentItems = result.filter(i => i.category === 'Recent')
    expect(recentItems.length).toBe(0)
  })

  it('filterSlashItems does not pin recent when pinRecent is false', () => {
    recordRecentCommand('heading1')
    const result = filterSlashItems(SLASH_COMMAND_ITEMS, '', { pinRecent: false })
    const recentItems = result.filter(i => i.category === 'Recent')
    expect(recentItems.length).toBe(0)
  })
})

describe('Custom command items', () => {
  beforeEach(() => {
    // Clear any custom items from previous tests
    for (const item of getCustomCommandItems()) {
      unregisterCommandItem(item.id)
    }
  })

  it('starts with no custom items', () => {
    expect(getCustomCommandItems()).toEqual([])
  })

  it('registerCommandItems adds a single item', () => {
    const item = { id: 'test1', label: 'Test', description: '', icon: '🧪', keywords: [], category: 'Custom', action: () => {} }
    registerCommandItems(item)
    expect(getCustomCommandItems()).toEqual([item])
  })

  it('registerCommandItems adds multiple items', () => {
    const items = [
      { id: 'a', label: 'A', description: '', icon: '', keywords: [], category: 'C', action: () => {} },
      { id: 'b', label: 'B', description: '', icon: '', keywords: [], category: 'C', action: () => {} },
    ]
    registerCommandItems(items)
    expect(getCustomCommandItems().length).toBe(2)
  })

  it('re-registering same id replaces the item', () => {
    registerCommandItems({ id: 'x', label: 'V1', description: '', icon: '', keywords: [], category: 'C', action: () => {} })
    registerCommandItems({ id: 'x', label: 'V2', description: '', icon: '', keywords: [], category: 'C', action: () => {} })
    expect(getCustomCommandItems().length).toBe(1)
    expect(getCustomCommandItems()[0].label).toBe('V2')
  })

  it('unregisterCommandItem removes an item by id', () => {
    registerCommandItems({ id: 'rm', label: 'Remove Me', description: '', icon: '', keywords: [], category: 'C', action: () => {} })
    expect(unregisterCommandItem('rm')).toBe(true)
    expect(getCustomCommandItems()).toEqual([])
  })

  it('unregisterCommandItem returns false for unknown id', () => {
    expect(unregisterCommandItem('nonexistent')).toBe(false)
  })

  it('getCustomCommandItems returns a copy (not the internal array)', () => {
    registerCommandItems({ id: 'c', label: 'C', description: '', icon: '', keywords: [], category: 'C', action: () => {} })
    const copy = getCustomCommandItems()
    copy.push({ id: 'fake', label: '', description: '', icon: '', keywords: [], category: '', action: () => {} })
    expect(getCustomCommandItems().length).toBe(1) // original unchanged
  })
})
