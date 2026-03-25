import {
  TOOLBAR_ITEM_STYLE_KEYS,
  resolveToolbarItemStyle,
  resolveSeparatorStyle,
  createToolbarItemTheme,
} from '../utils/toolbarItemTheme.js'

describe('toolbarItemTheme', () => {
  describe('TOOLBAR_ITEM_STYLE_KEYS', () => {
    it('should be a non-empty object', () => {
      expect(typeof TOOLBAR_ITEM_STYLE_KEYS).toBe('object')
      expect(Object.keys(TOOLBAR_ITEM_STYLE_KEYS).length).toBeGreaterThan(0)
    })

    it('should contain color key', () => {
      expect(TOOLBAR_ITEM_STYLE_KEYS.color).toBeDefined()
      expect(TOOLBAR_ITEM_STYLE_KEYS.color.var).toBe('--rmx-tb-color')
    })

    it('should contain background key', () => {
      expect(TOOLBAR_ITEM_STYLE_KEYS.background).toBeDefined()
      expect(TOOLBAR_ITEM_STYLE_KEYS.background.var).toBe('--rmx-tb-bg')
    })

    it('should contain hoverColor key', () => {
      expect(TOOLBAR_ITEM_STYLE_KEYS.hoverColor.var).toBe('--rmx-tb-hover-color')
    })

    it('should contain hoverBackground key', () => {
      expect(TOOLBAR_ITEM_STYLE_KEYS.hoverBackground.var).toBe('--rmx-tb-hover-bg')
    })

    it('should contain activeColor key', () => {
      expect(TOOLBAR_ITEM_STYLE_KEYS.activeColor.var).toBe('--rmx-tb-active-color')
    })

    it('should contain activeBackground key', () => {
      expect(TOOLBAR_ITEM_STYLE_KEYS.activeBackground.var).toBe('--rmx-tb-active-bg')
    })

    it('should contain size and iconSize keys', () => {
      expect(TOOLBAR_ITEM_STYLE_KEYS.size.var).toBe('--rmx-tb-size')
      expect(TOOLBAR_ITEM_STYLE_KEYS.iconSize.var).toBe('--rmx-tb-icon-size')
    })

    it('should have description for each key', () => {
      for (const [, meta] of Object.entries(TOOLBAR_ITEM_STYLE_KEYS)) {
        expect(typeof meta.description).toBe('string')
        expect(meta.description.length).toBeGreaterThan(0)
      }
    })

    it('should have all expected keys', () => {
      const expectedKeys = [
        'color', 'background', 'hoverColor', 'hoverBackground',
        'activeColor', 'activeBackground', 'border', 'borderRadius',
        'size', 'iconSize', 'padding', 'opacity',
      ]
      expectedKeys.forEach(key => {
        expect(TOOLBAR_ITEM_STYLE_KEYS[key]).toBeDefined()
      })
    })
  })

  describe('resolveToolbarItemStyle', () => {
    it('should return null for null input', () => {
      expect(resolveToolbarItemStyle(null)).toBeNull()
    })

    it('should return null for undefined input', () => {
      expect(resolveToolbarItemStyle(undefined)).toBeNull()
    })

    it('should return null for non-object input', () => {
      expect(resolveToolbarItemStyle('string')).toBeNull()
      expect(resolveToolbarItemStyle(42)).toBeNull()
    })

    it('should return null for empty overrides object', () => {
      expect(resolveToolbarItemStyle({})).toBeNull()
    })

    it('should return null for unknown keys', () => {
      expect(resolveToolbarItemStyle({ unknownKey: 'value' })).toBeNull()
    })

    it('should convert friendly keys to CSS variables', () => {
      const result = resolveToolbarItemStyle({ color: '#e11d48' })
      expect(result).toEqual({ '--rmx-tb-color': '#e11d48' })
    })

    it('should convert multiple friendly keys', () => {
      const result = resolveToolbarItemStyle({
        color: '#e11d48',
        borderRadius: '50%',
        background: '#fff',
      })
      expect(result).toEqual({
        '--rmx-tb-color': '#e11d48',
        '--rmx-tb-radius': '50%',
        '--rmx-tb-bg': '#fff',
      })
    })

    it('should pass through raw CSS variables', () => {
      const result = resolveToolbarItemStyle({ '--rmx-custom': '#123' })
      expect(result).toEqual({ '--rmx-custom': '#123' })
    })

    it('should handle mix of friendly keys and raw CSS variables', () => {
      const result = resolveToolbarItemStyle({
        color: 'red',
        '--rmx-custom-prop': 'blue',
      })
      expect(result).toEqual({
        '--rmx-tb-color': 'red',
        '--rmx-custom-prop': 'blue',
      })
    })

    it('should ignore keys that are not in the mapping and not CSS vars', () => {
      const result = resolveToolbarItemStyle({ color: 'red', bogus: 'ignored' })
      expect(result).toEqual({ '--rmx-tb-color': 'red' })
    })
  })

  describe('resolveSeparatorStyle', () => {
    it('should return null for null input', () => {
      expect(resolveSeparatorStyle(null)).toBeNull()
    })

    it('should return null for undefined input', () => {
      expect(resolveSeparatorStyle(undefined)).toBeNull()
    })

    it('should return null for empty overrides', () => {
      expect(resolveSeparatorStyle({})).toBeNull()
    })

    it('should convert separator color key', () => {
      const result = resolveSeparatorStyle({ color: '#ccc' })
      expect(result).toEqual({ '--rmx-tb-sep-color': '#ccc' })
    })

    it('should convert separator width key', () => {
      const result = resolveSeparatorStyle({ width: '2px' })
      expect(result).toEqual({ '--rmx-tb-sep-width': '2px' })
    })

    it('should convert separator height key', () => {
      const result = resolveSeparatorStyle({ height: '20px' })
      expect(result).toEqual({ '--rmx-tb-sep-height': '20px' })
    })

    it('should convert separator margin key', () => {
      const result = resolveSeparatorStyle({ margin: '4px' })
      expect(result).toEqual({ '--rmx-tb-sep-margin': '4px' })
    })

    it('should handle multiple separator keys', () => {
      const result = resolveSeparatorStyle({ color: '#e2e8f0', width: '2px' })
      expect(result).toEqual({
        '--rmx-tb-sep-color': '#e2e8f0',
        '--rmx-tb-sep-width': '2px',
      })
    })

    it('should pass through raw CSS variables', () => {
      const result = resolveSeparatorStyle({ '--rmx-custom': 'val' })
      expect(result).toEqual({ '--rmx-custom': 'val' })
    })

    it('should return null for unknown keys only', () => {
      expect(resolveSeparatorStyle({ bogus: 'value' })).toBeNull()
    })
  })

  describe('createToolbarItemTheme', () => {
    it('should return empty object for null input', () => {
      expect(createToolbarItemTheme(null)).toEqual({})
    })

    it('should return empty object for undefined input', () => {
      expect(createToolbarItemTheme(undefined)).toEqual({})
    })

    it('should return empty object for non-object input', () => {
      expect(createToolbarItemTheme('string')).toEqual({})
    })

    it('should resolve item styles for command keys', () => {
      const result = createToolbarItemTheme({
        bold: { color: '#e11d48' },
      })
      expect(result.bold).toEqual({ '--rmx-tb-color': '#e11d48' })
    })

    it('should resolve separator styles for _separator key', () => {
      const result = createToolbarItemTheme({
        _separator: { color: '#e2e8f0', width: '2px' },
      })
      expect(result._separator).toEqual({
        '--rmx-tb-sep-color': '#e2e8f0',
        '--rmx-tb-sep-width': '2px',
      })
    })

    it('should handle multiple commands', () => {
      const result = createToolbarItemTheme({
        bold: { color: 'red' },
        italic: { color: 'blue' },
      })
      expect(result.bold).toEqual({ '--rmx-tb-color': 'red' })
      expect(result.italic).toEqual({ '--rmx-tb-color': 'blue' })
    })

    it('should skip commands with empty style results', () => {
      const result = createToolbarItemTheme({
        bold: { unknownKey: 'value' },
        italic: { color: 'blue' },
      })
      expect(result.bold).toBeUndefined()
      expect(result.italic).toEqual({ '--rmx-tb-color': 'blue' })
    })

    it('should handle combined items and separator', () => {
      const result = createToolbarItemTheme({
        bold: { color: '#e11d48', activeColor: '#be123c', borderRadius: '50%' },
        italic: { background: '#f0f9ff', hoverBackground: '#e0f2fe' },
        _separator: { color: '#e2e8f0', width: '2px' },
      })
      expect(result.bold).toBeDefined()
      expect(result.italic).toBeDefined()
      expect(result._separator).toBeDefined()
      expect(result.bold['--rmx-tb-color']).toBe('#e11d48')
      expect(result.italic['--rmx-tb-bg']).toBe('#f0f9ff')
      expect(result._separator['--rmx-tb-sep-color']).toBe('#e2e8f0')
    })

    it('should return empty object for empty config', () => {
      expect(createToolbarItemTheme({})).toEqual({})
    })
  })
})
