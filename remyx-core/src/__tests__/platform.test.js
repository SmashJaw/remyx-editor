import { isMac, getModKey } from '../utils/platform.js'

describe('platform utilities', () => {
  describe('isMac', () => {
    it('returns a boolean', () => {
      expect(typeof isMac()).toBe('boolean')
    })

    it('returns false in jsdom (non-Mac environment)', () => {
      // jsdom navigator.platform is typically empty or non-Mac
      expect(isMac()).toBe(false)
    })
  })

  describe('getModKey', () => {
    it('returns Ctrl in non-Mac environment', () => {
      expect(getModKey()).toBe('Ctrl')
    })

    it('returns either "⌘" or "Ctrl"', () => {
      expect(['⌘', 'Ctrl']).toContain(getModKey())
    })
  })

  describe('isMac with mocked navigator.platform', () => {
    it('detects Mac platform', () => {
      jest.resetModules()
      Object.defineProperty(navigator, 'platform', { value: 'MacIntel', configurable: true })
      const { isMac: isMacFresh } = require('../utils/platform.js')
      expect(isMacFresh()).toBe(true)
    })

    it('detects iPad platform', () => {
      jest.resetModules()
      Object.defineProperty(navigator, 'platform', { value: 'iPad', configurable: true })
      const { isMac: isMacFresh } = require('../utils/platform.js')
      expect(isMacFresh()).toBe(true)
    })

    it('detects iPhone platform', () => {
      jest.resetModules()
      Object.defineProperty(navigator, 'platform', { value: 'iPhone', configurable: true })
      const { isMac: isMacFresh } = require('../utils/platform.js')
      expect(isMacFresh()).toBe(true)
    })

    it('returns false for Windows platform', () => {
      jest.resetModules()
      Object.defineProperty(navigator, 'platform', { value: 'Win32', configurable: true })
      const { isMac: isMacFresh } = require('../utils/platform.js')
      expect(isMacFresh()).toBe(false)
    })

    it('returns false for Linux platform', () => {
      jest.resetModules()
      Object.defineProperty(navigator, 'platform', { value: 'Linux x86_64', configurable: true })
      const { isMac: isMacFresh } = require('../utils/platform.js')
      expect(isMacFresh()).toBe(false)
    })

    it('getModKey returns ⌘ on Mac', () => {
      jest.resetModules()
      Object.defineProperty(navigator, 'platform', { value: 'MacIntel', configurable: true })
      const { getModKey: getModKeyFresh } = require('../utils/platform.js')
      expect(getModKeyFresh()).toBe('⌘')
    })

    it('getModKey returns Ctrl on Windows', () => {
      jest.resetModules()
      Object.defineProperty(navigator, 'platform', { value: 'Win32', configurable: true })
      const { getModKey: getModKeyFresh } = require('../utils/platform.js')
      expect(getModKeyFresh()).toBe('Ctrl')
    })
  })
})
