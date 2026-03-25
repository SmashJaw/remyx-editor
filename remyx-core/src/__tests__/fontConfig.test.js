import { removeFonts, addFonts, loadGoogleFonts } from '../utils/fontConfig.js'

describe('removeFonts', () => {
  it('removes specified fonts', () => {
    const result = removeFonts(['Arial', 'Verdana', 'Comic Sans'], ['Comic Sans'])
    expect(result).toEqual(['Arial', 'Verdana'])
  })

  it('removes case-insensitively', () => {
    const result = removeFonts(['Arial', 'Verdana'], ['arial'])
    expect(result).toEqual(['Verdana'])
  })

  it('returns unchanged if no matches', () => {
    const result = removeFonts(['Arial'], ['Unknown'])
    expect(result).toEqual(['Arial'])
  })

  it('handles empty remove list', () => {
    const result = removeFonts(['Arial'], [])
    expect(result).toEqual(['Arial'])
  })
})

describe('addFonts', () => {
  it('adds fonts at end by default', () => {
    const result = addFonts(['Arial'], ['Roboto'])
    expect(result).toEqual(['Arial', 'Roboto'])
  })

  it('adds fonts at start when position=start', () => {
    const result = addFonts(['Arial'], ['Roboto'], { position: 'start' })
    expect(result).toEqual(['Roboto', 'Arial'])
  })

  it('deduplicates case-insensitively', () => {
    const result = addFonts(['Arial'], ['arial', 'Roboto'])
    expect(result).toEqual(['Arial', 'Roboto'])
  })

  it('handles empty add list', () => {
    const result = addFonts(['Arial'], [])
    expect(result).toEqual(['Arial'])
  })
})

describe('loadGoogleFonts', () => {
  afterEach(() => {
    document.head.querySelectorAll('link[data-remyx-fonts]').forEach(l => l.remove())
  })

  it('returns null for empty array', () => {
    expect(loadGoogleFonts([])).toBeNull()
  })

  it('returns null for null', () => {
    expect(loadGoogleFonts(null)).toBeNull()
  })

  it('injects stylesheet link for Google Fonts', () => {
    const link = loadGoogleFonts(['Roboto'])
    expect(link).not.toBeNull()
    expect(link.rel).toBe('stylesheet')
    expect(link.href).toContain('fonts.googleapis.com')
    expect(link.dataset.remyxFonts).toBe('true')
  })

  it('does not inject duplicate links', () => {
    const link1 = loadGoogleFonts(['Roboto'])
    const link2 = loadGoogleFonts(['Roboto'])
    expect(link1).toBe(link2)
  })

  it('handles fonts with weights', () => {
    const link = loadGoogleFonts(['Roboto:wght@400;700'])
    expect(link.href).toContain('Roboto')
  })

  it('sets integrity when provided', () => {
    const link = loadGoogleFonts(['Lato'], { integrity: 'sha384-abc123' })
    expect(link.integrity).toBe('sha384-abc123')
    expect(link.crossOrigin).toBe('anonymous')
  })

  it('sets crossOrigin even without integrity', () => {
    const link = loadGoogleFonts(['Inter'])
    expect(link.crossOrigin).toBe('anonymous')
  })

  it('replaces spaces with + in font names', () => {
    const link = loadGoogleFonts(['Open Sans'])
    expect(link.href).toContain('Open+Sans')
  })
})
