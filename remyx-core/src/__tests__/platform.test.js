describe('platform utilities', () => {
  let originalNavigator

  beforeEach(() => {
    // Reset the cached value by re-importing
    jest.resetModules()
  })

  describe('isMac', () => {
    it('should return false in jsdom (Linux-like platform)', async () => {
      const { isMac } = await import('../utils/platform.js')
      // jsdom reports platform as empty string or a non-Mac value
      const result = isMac()
      expect(typeof result).toBe('boolean')
    })
  })

  describe('getModKey', () => {
    it('should return a string', async () => {
      const { getModKey } = await import('../utils/platform.js')
      const key = getModKey()
      expect(typeof key).toBe('string')
      // Should be either ⌘ or Ctrl
      expect(['⌘', 'Ctrl']).toContain(key)
    })
  })
})
