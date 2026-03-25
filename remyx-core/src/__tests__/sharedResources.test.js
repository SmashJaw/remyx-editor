import { SharedResources } from '../core/SharedResources.js'

describe('SharedResources', () => {
  // ── Sanitizer Schema ──────────────────────────────────────────────

  describe('sanitizerSchema', () => {
    it('provides frozen allowedTags', () => {
      const schema = SharedResources.sanitizerSchema
      expect(schema.allowedTags).toBeDefined()
      expect(Object.isFrozen(schema.allowedTags)).toBe(true)
      expect(schema.allowedTags.p).toBeDefined()
      expect(schema.allowedTags.script).toBeUndefined()
    })

    it('provides frozen allowedStyles', () => {
      const schema = SharedResources.sanitizerSchema
      expect(Array.isArray(schema.allowedStyles)).toBe(true)
      expect(Object.isFrozen(schema.allowedStyles)).toBe(true)
      expect(schema.allowedStyles).toContain('color')
    })

    it('returns the same object on repeated access', () => {
      const a = SharedResources.sanitizerSchema
      const b = SharedResources.sanitizerSchema
      expect(a).toBe(b)
    })
  })

  // ── Toolbar Presets ───────────────────────────────────────────────

  describe('toolbarPresets', () => {
    it('provides frozen toolbar presets', () => {
      const presets = SharedResources.toolbarPresets
      expect(Object.isFrozen(presets)).toBe(true)
      expect(presets.full).toBeDefined()
      expect(presets.standard).toBeDefined()
      expect(presets.minimal).toBeDefined()
      expect(presets.bare).toBeDefined()
    })

    it('preset groups are frozen arrays', () => {
      const full = SharedResources.toolbarPresets.full
      expect(Array.isArray(full)).toBe(true)
      expect(Object.isFrozen(full)).toBe(true)
      expect(Object.isFrozen(full[0])).toBe(true)
    })
  })

  // ── Defaults ──────────────────────────────────────────────────────

  describe('defaults', () => {
    it('provides frozen default toolbar', () => {
      const defaults = SharedResources.defaults
      expect(Object.isFrozen(defaults)).toBe(true)
      expect(defaults.toolbar).toBeDefined()
      expect(defaults.fonts).toBeDefined()
      expect(defaults.fontSizes).toBeDefined()
      expect(defaults.colors).toBeDefined()
    })

    it('provides frozen heading options', () => {
      expect(Object.isFrozen(SharedResources.defaults.headingOptions)).toBe(true)
    })
  })

  // ── Keybindings ───────────────────────────────────────────────────

  describe('keybindings', () => {
    it('provides frozen keybinding table', () => {
      const kb = SharedResources.keybindings
      expect(Object.isFrozen(kb)).toBe(true)
      expect(typeof kb).toBe('object')
    })
  })

  // ── Commands ──────────────────────────────────────────────────────

  describe('commands', () => {
    it('provides frozen command metadata', () => {
      const cmds = SharedResources.commands
      expect(Object.isFrozen(cmds)).toBe(true)
      expect(cmds.buttons).toBeDefined()
      expect(cmds.tooltips).toBeDefined()
      expect(cmds.shortcuts).toBeDefined()
      expect(cmds.modals).toBeDefined()
    })
  })

  // ── Icon Registry ─────────────────────────────────────────────────

  describe('icon registry', () => {
    afterEach(() => {
      // Clean up any registered icons
      for (const name of SharedResources.getIconNames()) {
        SharedResources.unregisterIcon(name)
      }
    })

    it('registers and retrieves an icon', () => {
      SharedResources.registerIcon('myIcon', '<svg>test</svg>')
      expect(SharedResources.getIcon('myIcon')).toBe('<svg>test</svg>')
    })

    it('returns undefined for unregistered icons', () => {
      expect(SharedResources.getIcon('nonexistent')).toBeUndefined()
    })

    it('unregisters an icon', () => {
      SharedResources.registerIcon('temp', '<svg/>')
      SharedResources.unregisterIcon('temp')
      expect(SharedResources.getIcon('temp')).toBeUndefined()
    })

    it('lists all registered icon names', () => {
      SharedResources.registerIcon('alpha', '<svg>a</svg>')
      SharedResources.registerIcon('beta', '<svg>b</svg>')
      expect(SharedResources.getIconNames()).toEqual(['alpha', 'beta'])
    })
  })

  // ── Stats ─────────────────────────────────────────────────────────

  describe('stats', () => {
    it('reports stats', () => {
      const stats = SharedResources.stats
      expect(stats.frozenSchemas).toBe(true)
      expect(typeof stats.registeredIcons).toBe('number')
    })
  })
})
