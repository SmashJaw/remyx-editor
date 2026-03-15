import { THEME_VARIABLES, createTheme } from '../utils/themeConfig.js'

describe('THEME_VARIABLES', () => {
  it('should export a non-empty object', () => {
    expect(Object.keys(THEME_VARIABLES).length).toBeGreaterThan(0)
  })

  it('should have var and description for each entry', () => {
    for (const [key, meta] of Object.entries(THEME_VARIABLES)) {
      expect(meta.var).toBeDefined()
      expect(meta.var).toMatch(/^--rmx-/)
      expect(meta.description).toBeDefined()
      expect(typeof meta.description).toBe('string')
    }
  })

  it('should include core theme variables', () => {
    expect(THEME_VARIABLES.bg).toBeDefined()
    expect(THEME_VARIABLES.text).toBeDefined()
    expect(THEME_VARIABLES.primary).toBeDefined()
    expect(THEME_VARIABLES.toolbarBg).toBeDefined()
    expect(THEME_VARIABLES.fontFamily).toBeDefined()
    expect(THEME_VARIABLES.radius).toBeDefined()
  })
})

describe('createTheme', () => {
  it('should convert camelCase keys to CSS variables', () => {
    const theme = createTheme({ bg: '#000', primary: '#f00' })
    expect(theme['--rmx-bg']).toBe('#000')
    expect(theme['--rmx-primary']).toBe('#f00')
  })

  it('should pass through raw CSS variable names', () => {
    const theme = createTheme({ '--rmx-bg': '#111' })
    expect(theme['--rmx-bg']).toBe('#111')
  })

  it('should handle mixed camelCase and CSS variable keys', () => {
    const theme = createTheme({
      bg: '#000',
      '--rmx-text': '#fff',
    })
    expect(theme['--rmx-bg']).toBe('#000')
    expect(theme['--rmx-text']).toBe('#fff')
  })

  it('should convert unknown camelCase keys to CSS variables', () => {
    const theme = createTheme({ myCustomColor: 'blue' })
    expect(theme['--rmx-my-custom-color']).toBe('blue')
  })

  it('should return an empty object for empty input', () => {
    const theme = createTheme({})
    expect(Object.keys(theme)).toHaveLength(0)
  })

  it('should handle typography variables', () => {
    const theme = createTheme({
      fontFamily: 'Inter, sans-serif',
      fontSize: '14px',
      contentFontSize: '16px',
    })
    expect(theme['--rmx-font-family']).toBe('Inter, sans-serif')
    expect(theme['--rmx-font-size']).toBe('14px')
    expect(theme['--rmx-content-font-size']).toBe('16px')
  })

  it('should handle spacing variables', () => {
    const theme = createTheme({
      radius: '8px',
      spacingSm: '10px',
    })
    expect(theme['--rmx-radius']).toBe('8px')
    expect(theme['--rmx-spacing-sm']).toBe('10px')
  })
})
