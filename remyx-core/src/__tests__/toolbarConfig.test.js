import { TOOLBAR_PRESETS, removeToolbarItems, addToolbarItems, createToolbar } from '../utils/toolbarConfig.js'

describe('TOOLBAR_PRESETS', () => {
  it('should have full, standard, minimal, and bare presets', () => {
    expect(TOOLBAR_PRESETS.full).toBeDefined()
    expect(TOOLBAR_PRESETS.standard).toBeDefined()
    expect(TOOLBAR_PRESETS.minimal).toBeDefined()
    expect(TOOLBAR_PRESETS.bare).toBeDefined()
  })

  it('should have array-of-arrays structure', () => {
    for (const [name, preset] of Object.entries(TOOLBAR_PRESETS)) {
      expect(Array.isArray(preset)).toBe(true)
      for (const group of preset) {
        expect(Array.isArray(group)).toBe(true)
      }
    }
  })

  it('full preset should have the most items', () => {
    const fullCount = TOOLBAR_PRESETS.full.flat().length
    const standardCount = TOOLBAR_PRESETS.standard.flat().length
    const minimalCount = TOOLBAR_PRESETS.minimal.flat().length
    const bareCount = TOOLBAR_PRESETS.bare.flat().length

    expect(fullCount).toBeGreaterThan(standardCount)
    expect(standardCount).toBeGreaterThan(minimalCount)
    expect(minimalCount).toBeGreaterThan(bareCount)
  })

  it('bare preset should only have bold, italic, underline', () => {
    const bareItems = TOOLBAR_PRESETS.bare.flat()
    expect(bareItems).toEqual(['bold', 'italic', 'underline'])
  })
})

describe('removeToolbarItems', () => {
  it('should remove specified items', () => {
    const config = [['bold', 'italic', 'underline'], ['link', 'image']]
    const result = removeToolbarItems(config, ['italic', 'image'])
    expect(result).toEqual([['bold', 'underline'], ['link']])
  })

  it('should remove empty groups', () => {
    const config = [['bold'], ['image']]
    const result = removeToolbarItems(config, ['image'])
    expect(result).toEqual([['bold']])
  })

  it('should handle removing all items', () => {
    const config = [['bold', 'italic']]
    const result = removeToolbarItems(config, ['bold', 'italic'])
    expect(result).toEqual([])
  })

  it('should not mutate original config', () => {
    const config = [['bold', 'italic']]
    removeToolbarItems(config, ['italic'])
    expect(config).toEqual([['bold', 'italic']])
  })
})

describe('addToolbarItems', () => {
  it('should add items as a new group by default', () => {
    const config = [['bold', 'italic']]
    const result = addToolbarItems(config, ['link', 'image'])
    expect(result).toEqual([['bold', 'italic'], ['link', 'image']])
  })

  it('should add single item wrapped in array', () => {
    const config = [['bold']]
    const result = addToolbarItems(config, 'italic')
    expect(result).toEqual([['bold'], ['italic']])
  })

  it('should insert after a specific item', () => {
    const config = [['bold', 'italic', 'underline']]
    const result = addToolbarItems(config, 'strikethrough', { after: 'italic' })
    expect(result).toEqual([['bold', 'italic', 'strikethrough', 'underline']])
  })

  it('should insert before a specific item', () => {
    const config = [['bold', 'italic']]
    const result = addToolbarItems(config, 'underline', { before: 'italic' })
    expect(result).toEqual([['bold', 'underline', 'italic']])
  })

  it('should add to specific group by index', () => {
    const config = [['bold'], ['link']]
    const result = addToolbarItems(config, 'image', { group: 1 })
    expect(result).toEqual([['bold'], ['link', 'image']])
  })

  it('should add to last group with negative index', () => {
    const config = [['bold'], ['link']]
    const result = addToolbarItems(config, 'image', { group: -1 })
    expect(result).toEqual([['bold'], ['link', 'image']])
  })

  it('should not mutate original config', () => {
    const config = [['bold']]
    addToolbarItems(config, 'italic')
    expect(config).toEqual([['bold']])
  })
})

describe('createToolbar', () => {
  it('should group items by category', () => {
    const result = createToolbar(['bold', 'italic', 'link', 'undo'])
    // bold and italic should be in same group, link separate, undo separate
    expect(result.length).toBeGreaterThan(1)
  })

  it('should maintain category order', () => {
    const result = createToolbar(['link', 'bold', 'undo'])
    const flat = result.flat()
    expect(flat.indexOf('undo')).toBeLessThan(flat.indexOf('bold'))
    expect(flat.indexOf('bold')).toBeLessThan(flat.indexOf('link'))
  })

  it('should put uncategorized items in their own group', () => {
    const result = createToolbar(['bold', 'myCustomCommand'])
    const flat = result.flat()
    expect(flat).toContain('myCustomCommand')
  })

  it('should handle empty input', () => {
    const result = createToolbar([])
    expect(result).toEqual([])
  })

  it('should group formatting commands together', () => {
    const result = createToolbar(['bold', 'italic', 'underline', 'strikethrough'])
    // All should be in one group
    expect(result).toEqual([['bold', 'italic', 'underline', 'strikethrough']])
  })
})
