import { rafThrottle, benchmark, measurePerformance } from '../utils/performance.js'

describe('Performance Utilities', () => {
  describe('benchmark', () => {
    it('returns stats with correct structure', () => {
      const result = benchmark('test', () => Math.random(), 10)
      expect(result).toHaveProperty('label', 'test')
      expect(result).toHaveProperty('mean')
      expect(result).toHaveProperty('median')
      expect(result).toHaveProperty('min')
      expect(result).toHaveProperty('max')
      expect(result).toHaveProperty('p95')
      expect(typeof result.mean).toBe('number')
      expect(result.min).toBeLessThanOrEqual(result.max)
    })

    it('runs the specified number of iterations', () => {
      let count = 0
      benchmark('count', () => count++, 50)
      expect(count).toBe(50)
    })
  })

  describe('measurePerformance', () => {
    it('returns the function result', () => {
      const result = measurePerformance('test', () => 42)
      expect(result).toBe(42)
    })

    it('handles functions that return objects', () => {
      const result = measurePerformance('test', () => ({ a: 1 }))
      expect(result).toEqual({ a: 1 })
    })
  })

  describe('rafThrottle', () => {
    it('returns a function', () => {
      const fn = rafThrottle(() => {})
      expect(typeof fn).toBe('function')
    })
  })
})
