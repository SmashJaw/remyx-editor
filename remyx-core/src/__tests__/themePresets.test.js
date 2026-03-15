import { THEME_PRESETS } from '../utils/themePresets.js'

describe('THEME_PRESETS', () => {
  it('should export preset objects', () => {
    expect(THEME_PRESETS).toBeDefined()
    expect(typeof THEME_PRESETS).toBe('object')
  })

  it('should have ocean, forest, sunset, and rose presets', () => {
    expect(THEME_PRESETS.ocean).toBeDefined()
    expect(THEME_PRESETS.forest).toBeDefined()
    expect(THEME_PRESETS.sunset).toBeDefined()
    expect(THEME_PRESETS.rose).toBeDefined()
  })

  it('each preset should have CSS custom properties', () => {
    for (const [name, preset] of Object.entries(THEME_PRESETS)) {
      expect(typeof preset).toBe('object')
      const keys = Object.keys(preset)
      expect(keys.length).toBeGreaterThan(0)
      // All keys should be CSS custom properties
      for (const key of keys) {
        expect(key).toMatch(/^--rmx-/)
      }
    }
  })

  it('each preset should have --rmx-bg and --rmx-primary', () => {
    for (const [name, preset] of Object.entries(THEME_PRESETS)) {
      expect(preset['--rmx-bg']).toBeDefined()
      expect(preset['--rmx-primary']).toBeDefined()
    }
  })

  it('presets should have different bg values', () => {
    const bgs = Object.values(THEME_PRESETS).map(p => p['--rmx-bg'])
    const unique = new Set(bgs)
    expect(unique.size).toBe(bgs.length)
  })
})
