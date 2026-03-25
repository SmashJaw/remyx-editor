import { t, setLocale, getLocale, registerLocale, unregisterLocale, getRegisteredLocales } from '../i18n/index.js'

describe('i18n', () => {
  afterEach(() => {
    // Reset to English after each test
    try { setLocale('en') } catch { /* ignore */ }
    try { unregisterLocale('fr') } catch { /* ignore */ }
    try { unregisterLocale('ar') } catch { /* ignore */ }
  })

  describe('t()', () => {
    it('returns translated string for known key', () => {
      expect(t('toolbar.bold')).toBe('Bold')
      expect(t('toolbar.italic')).toBe('Italic')
    })

    it('returns key for unknown key', () => {
      expect(t('unknown.key')).toBe('unknown.key')
    })

    it('supports interpolation', () => {
      expect(t('find.results', { current: 3, total: 10 })).toBe('3 of 10')
    })

    it('supports interpolation with status.words', () => {
      expect(t('status.words', { count: 42 })).toBe('42 words')
    })
  })

  describe('setLocale / getLocale', () => {
    it('defaults to "en"', () => {
      expect(getLocale()).toBe('en')
    })

    it('switches locale', () => {
      registerLocale('fr', { 'toolbar.bold': 'Gras' })
      setLocale('fr')
      expect(getLocale()).toBe('fr')
      expect(t('toolbar.bold')).toBe('Gras')
    })

    it('falls back to English for missing keys', () => {
      registerLocale('fr', { 'toolbar.bold': 'Gras' })
      setLocale('fr')
      expect(t('toolbar.italic')).toBe('Italic') // falls back to en
    })

    it('throws for unregistered locale', () => {
      expect(() => setLocale('xx')).toThrow('not registered')
    })
  })

  describe('registerLocale / unregisterLocale', () => {
    it('registers a new locale', () => {
      registerLocale('ar', { 'toolbar.bold': 'عريض' })
      expect(getRegisteredLocales()).toContain('ar')
    })

    it('unregisters a locale', () => {
      registerLocale('fr', { 'toolbar.bold': 'Gras' })
      unregisterLocale('fr')
      expect(getRegisteredLocales()).not.toContain('fr')
    })

    it('cannot unregister "en"', () => {
      unregisterLocale('en')
      expect(getRegisteredLocales()).toContain('en')
    })

    it('resets to "en" if current locale is unregistered', () => {
      registerLocale('fr', { 'toolbar.bold': 'Gras' })
      setLocale('fr')
      unregisterLocale('fr')
      expect(getLocale()).toBe('en')
    })

    it('throws for invalid arguments', () => {
      expect(() => registerLocale('', {})).toThrow()
      expect(() => registerLocale('x', null)).toThrow()
    })
  })

  describe('getRegisteredLocales', () => {
    it('returns array with at least "en"', () => {
      const locales = getRegisteredLocales()
      expect(Array.isArray(locales)).toBe(true)
      expect(locales).toContain('en')
    })
  })
})
