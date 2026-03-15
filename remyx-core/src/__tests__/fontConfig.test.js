import { removeFonts, addFonts } from '../utils/fontConfig.js'

describe('removeFonts', () => {
  it('should remove specified fonts', () => {
    const fonts = ['Arial', 'Georgia', 'Impact', 'Times New Roman']
    const result = removeFonts(fonts, ['Impact', 'Georgia'])
    expect(result).toEqual(['Arial', 'Times New Roman'])
  })

  it('should be case-insensitive', () => {
    const fonts = ['Arial', 'Georgia']
    const result = removeFonts(fonts, ['arial'])
    expect(result).toEqual(['Georgia'])
  })

  it('should not mutate original array', () => {
    const fonts = ['Arial', 'Georgia']
    removeFonts(fonts, ['Georgia'])
    expect(fonts).toEqual(['Arial', 'Georgia'])
  })

  it('should handle removing non-existent fonts', () => {
    const fonts = ['Arial']
    const result = removeFonts(fonts, ['NotAFont'])
    expect(result).toEqual(['Arial'])
  })

  it('should handle empty font list', () => {
    const result = removeFonts([], ['Arial'])
    expect(result).toEqual([])
  })
})

describe('addFonts', () => {
  it('should add fonts to end by default', () => {
    const fonts = ['Arial', 'Georgia']
    const result = addFonts(fonts, ['Lato', 'Poppins'])
    expect(result).toEqual(['Arial', 'Georgia', 'Lato', 'Poppins'])
  })

  it('should add fonts to start when position is start', () => {
    const fonts = ['Arial', 'Georgia']
    const result = addFonts(fonts, ['Lato'], { position: 'start' })
    expect(result).toEqual(['Lato', 'Arial', 'Georgia'])
  })

  it('should skip duplicate fonts (case-insensitive)', () => {
    const fonts = ['Arial', 'Georgia']
    const result = addFonts(fonts, ['arial', 'Lato'])
    expect(result).toEqual(['Arial', 'Georgia', 'Lato'])
  })

  it('should not mutate original array', () => {
    const fonts = ['Arial']
    addFonts(fonts, ['Georgia'])
    expect(fonts).toEqual(['Arial'])
  })

  it('should handle empty additions', () => {
    const fonts = ['Arial']
    const result = addFonts(fonts, [])
    expect(result).toEqual(['Arial'])
  })
})
