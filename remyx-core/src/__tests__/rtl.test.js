import { detectTextDirection, applyAutoDirection } from '../utils/rtl.js'

describe('RTL Utilities', () => {
  describe('detectTextDirection', () => {
    it('returns "auto" for empty/null input', () => {
      expect(detectTextDirection('')).toBe('auto')
      expect(detectTextDirection(null)).toBe('auto')
      expect(detectTextDirection(undefined)).toBe('auto')
    })

    it('returns "ltr" for Latin text', () => {
      expect(detectTextDirection('Hello world')).toBe('ltr')
    })

    it('returns "rtl" for Arabic text', () => {
      expect(detectTextDirection('مرحبا بالعالم')).toBe('rtl')
    })

    it('returns "rtl" for Hebrew text', () => {
      expect(detectTextDirection('שלום עולם')).toBe('rtl')
    })

    it('returns "auto" for numbers only', () => {
      expect(detectTextDirection('12345')).toBe('auto')
    })

    it('returns dominant direction for mixed text', () => {
      // Mostly Arabic with a few Latin characters
      expect(detectTextDirection('مرحبا hello بالعالم كيف حالك')).toBe('rtl')
      // Mostly English with a few Arabic characters
      expect(detectTextDirection('Hello world this is English مرحبا')).toBe('ltr')
    })
  })

  describe('applyAutoDirection', () => {
    it('sets dir="rtl" on element with Arabic text', () => {
      const el = document.createElement('p')
      el.textContent = 'مرحبا بالعالم'
      applyAutoDirection(el)
      expect(el.getAttribute('dir')).toBe('rtl')
    })

    it('sets dir="ltr" on element with Latin text', () => {
      const el = document.createElement('p')
      el.textContent = 'Hello world'
      applyAutoDirection(el)
      expect(el.getAttribute('dir')).toBe('ltr')
    })

    it('removes dir attribute for numbers only', () => {
      const el = document.createElement('p')
      el.setAttribute('dir', 'rtl')
      el.textContent = '12345'
      applyAutoDirection(el)
      expect(el.hasAttribute('dir')).toBe(false)
    })

    it('handles null/undefined element', () => {
      expect(() => applyAutoDirection(null)).not.toThrow()
      expect(() => applyAutoDirection(undefined)).not.toThrow()
    })
  })
})
