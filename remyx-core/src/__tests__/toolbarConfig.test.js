import {
  TOOLBAR_PRESETS,
  removeToolbarItems,
  addToolbarItems,
  createToolbar,
} from '../utils/toolbarConfig.js'

describe('TOOLBAR_PRESETS', () => {
  it('has full, standard, minimal, bare, and rich presets', () => {
    expect(TOOLBAR_PRESETS.full).toBeDefined()
    expect(TOOLBAR_PRESETS.standard).toBeDefined()
    expect(TOOLBAR_PRESETS.minimal).toBeDefined()
    expect(TOOLBAR_PRESETS.bare).toBeDefined()
    expect(TOOLBAR_PRESETS.rich).toBeDefined()
  })

  it('each preset is an array of arrays', () => {
    for (const [name, preset] of Object.entries(TOOLBAR_PRESETS)) {
      expect(Array.isArray(preset)).toBe(true)
      for (const group of preset) {
        expect(Array.isArray(group)).toBe(true)
      }
    }
  })
})

describe('removeToolbarItems', () => {
  it('removes items from groups', () => {
    const config = [['bold', 'italic'], ['link', 'image']]
    const result = removeToolbarItems(config, ['italic', 'image'])
    expect(result).toEqual([['bold'], ['link']])
  })

  it('removes empty groups', () => {
    const config = [['bold'], ['italic']]
    const result = removeToolbarItems(config, ['italic'])
    expect(result).toEqual([['bold']])
  })

  it('handles empty remove list', () => {
    const config = [['bold']]
    expect(removeToolbarItems(config, [])).toEqual([['bold']])
  })
})

describe('addToolbarItems', () => {
  it('appends new group by default', () => {
    const config = [['bold']]
    const result = addToolbarItems(config, 'link')
    expect(result).toEqual([['bold'], ['link']])
  })

  it('adds array of items as new group', () => {
    const config = [['bold']]
    const result = addToolbarItems(config, ['sub', 'sup'])
    expect(result).toEqual([['bold'], ['sub', 'sup']])
  })

  it('adds to specific group by index', () => {
    const config = [['bold', 'italic']]
    const result = addToolbarItems(config, 'underline', { group: 0 })
    expect(result).toEqual([['bold', 'italic', 'underline']])
  })

  it('adds to group with negative index', () => {
    const config = [['a'], ['b']]
    const result = addToolbarItems(config, 'c', { group: -1 })
    expect(result).toEqual([['a'], ['b', 'c']])
  })

  it('inserts after specific item', () => {
    const config = [['bold', 'underline']]
    const result = addToolbarItems(config, 'italic', { after: 'bold' })
    expect(result).toEqual([['bold', 'italic', 'underline']])
  })

  it('inserts before specific item', () => {
    const config = [['bold', 'underline']]
    const result = addToolbarItems(config, 'italic', { before: 'underline' })
    expect(result).toEqual([['bold', 'italic', 'underline']])
  })

  it('appends as new group when target not found', () => {
    const config = [['bold']]
    const result = addToolbarItems(config, 'link', { after: 'nonexistent' })
    expect(result).toEqual([['bold'], ['link']])
  })

  it('does not mutate original config', () => {
    const config = [['bold']]
    addToolbarItems(config, 'italic')
    expect(config).toEqual([['bold']])
  })
})

describe('createToolbar', () => {
  it('groups items by category', () => {
    const result = createToolbar(['bold', 'italic', 'link', 'undo'])
    expect(result.length).toBeGreaterThan(1)
    // undo should be in its own group
    expect(result[0]).toEqual(['undo'])
    // bold, italic should be together
    const formatGroup = result.find(g => g.includes('bold'))
    expect(formatGroup).toContain('italic')
  })

  it('puts uncategorized items in their own group', () => {
    const result = createToolbar(['bold', 'customCommand'])
    const lastGroup = result[result.length - 1]
    expect(lastGroup).toContain('customCommand')
  })

  it('handles empty list', () => {
    const result = createToolbar([])
    expect(result).toEqual([])
  })

  it('handles all items from one category', () => {
    const result = createToolbar(['bold', 'italic', 'underline'])
    expect(result.length).toBe(1)
    expect(result[0]).toEqual(['bold', 'italic', 'underline'])
  })
})
