import { vi } from 'vitest'
import {
  batchDOMMutations,
  scheduleIdleTask,
  cancelIdleTask,
  rafThrottle,
  measurePerformance,
  benchmark,
  createInputBatcher,
} from '../utils/performance.js'

describe('batchDOMMutations', () => {
  it('should execute all mutations in a single rAF', async () => {
    const mutations = [vi.fn(), vi.fn(), vi.fn()]
    await batchDOMMutations(mutations)
    for (const fn of mutations) {
      expect(fn).toHaveBeenCalledTimes(1)
    }
  })

  it('should return a promise', () => {
    const result = batchDOMMutations([])
    expect(result).toBeInstanceOf(Promise)
  })

  it('should handle empty mutations array', async () => {
    await expect(batchDOMMutations([])).resolves.toBeUndefined()
  })
})

describe('scheduleIdleTask', () => {
  it('should call the function (uses setTimeout fallback in jsdom)', () => {
    vi.useFakeTimers()
    const fn = vi.fn()
    scheduleIdleTask(fn)
    vi.advanceTimersByTime(50)
    expect(fn).toHaveBeenCalled()
    vi.useRealTimers()
  })

  it('should accept custom timeout option', () => {
    vi.useFakeTimers()
    const fn = vi.fn()
    scheduleIdleTask(fn, { timeout: 5000 })
    vi.advanceTimersByTime(50)
    expect(fn).toHaveBeenCalled()
    vi.useRealTimers()
  })

  it('should return an id', () => {
    vi.useFakeTimers()
    const id = scheduleIdleTask(() => {})
    // In jsdom with fake timers, setTimeout may return an object
    expect(id).toBeDefined()
    vi.useRealTimers()
  })
})

describe('cancelIdleTask', () => {
  it('should cancel a scheduled task', () => {
    vi.useFakeTimers()
    const fn = vi.fn()
    const id = scheduleIdleTask(fn)
    cancelIdleTask(id)
    vi.advanceTimersByTime(50)
    expect(fn).not.toHaveBeenCalled()
    vi.useRealTimers()
  })
})

describe('rafThrottle', () => {
  it('should return a function', () => {
    const fn = rafThrottle(() => {})
    expect(typeof fn).toBe('function')
  })

  it('should call the function via rAF', async () => {
    const fn = vi.fn()
    const throttled = rafThrottle(fn)
    throttled('arg1')
    // rAF resolves in jsdom
    await new Promise(resolve => requestAnimationFrame(resolve))
    expect(fn).toHaveBeenCalledWith('arg1')
  })

  it('should not schedule multiple rAFs for rapid calls', async () => {
    const fn = vi.fn()
    const throttled = rafThrottle(fn)
    throttled()
    throttled()
    throttled()
    await new Promise(resolve => requestAnimationFrame(resolve))
    expect(fn).toHaveBeenCalledTimes(1)
  })
})

describe('measurePerformance', () => {
  it('should return the function result', () => {
    expect(measurePerformance('test', () => 42)).toBe(42)
  })

  it('should handle functions returning undefined', () => {
    expect(measurePerformance('test', () => {})).toBeUndefined()
  })

  it('should log to console.debug', () => {
    const spy = vi.spyOn(console, 'debug').mockImplementation(() => {})
    measurePerformance('myLabel', () => 'result')
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('[Remyx perf] myLabel'))
    spy.mockRestore()
  })
})

describe('benchmark', () => {
  it('should return stats with correct structure', () => {
    const result = benchmark('test', () => Math.random(), 10)
    expect(result.label).toBe('test')
    expect(typeof result.mean).toBe('number')
    expect(typeof result.median).toBe('number')
    expect(typeof result.min).toBe('number')
    expect(typeof result.max).toBe('number')
    expect(typeof result.p95).toBe('number')
  })

  it('should run specified iterations', () => {
    let count = 0
    benchmark('count', () => count++, 25)
    expect(count).toBe(25)
  })

  it('should have min <= median <= max', () => {
    const result = benchmark('check', () => Math.random(), 20)
    expect(result.min).toBeLessThanOrEqual(result.median)
    expect(result.median).toBeLessThanOrEqual(result.max)
  })

  it('should use default 100 iterations', () => {
    let count = 0
    benchmark('default', () => count++)
    expect(count).toBe(100)
  })
})

describe('createInputBatcher', () => {
  it('should create a batcher with queue, flush, destroy methods', () => {
    const batcher = createInputBatcher(vi.fn())
    expect(typeof batcher.queue).toBe('function')
    expect(typeof batcher.flush).toBe('function')
    expect(typeof batcher.destroy).toBe('function')
  })

  it('should batch mutations and call applyFn', async () => {
    const applyFn = vi.fn()
    const batcher = createInputBatcher(applyFn)
    batcher.queue('a')
    batcher.queue('b')

    // Wait for rAF
    await new Promise(resolve => requestAnimationFrame(resolve))
    expect(applyFn).toHaveBeenCalledWith(['a', 'b'])
    batcher.destroy()
  })

  it('flush should immediately apply pending mutations', () => {
    const applyFn = vi.fn()
    const batcher = createInputBatcher(applyFn)
    batcher.queue('x')
    batcher.queue('y')
    batcher.flush()
    expect(applyFn).toHaveBeenCalledWith(['x', 'y'])
    batcher.destroy()
  })

  it('flush with no pending mutations should not call applyFn', () => {
    const applyFn = vi.fn()
    const batcher = createInputBatcher(applyFn)
    batcher.flush()
    expect(applyFn).not.toHaveBeenCalled()
    batcher.destroy()
  })

  it('destroy should cancel pending flush', async () => {
    const applyFn = vi.fn()
    const batcher = createInputBatcher(applyFn)
    batcher.queue('z')
    batcher.destroy()
    await new Promise(resolve => requestAnimationFrame(resolve))
    expect(applyFn).not.toHaveBeenCalled()
  })

  it('destroy should clear pending array', () => {
    const applyFn = vi.fn()
    const batcher = createInputBatcher(applyFn)
    batcher.queue('data')
    batcher.destroy()
    // After destroy, flush does nothing
    batcher.flush()
    expect(applyFn).not.toHaveBeenCalled()
  })

  it('should not schedule multiple timers for rapid queues', async () => {
    const applyFn = vi.fn()
    const batcher = createInputBatcher(applyFn)
    batcher.queue(1)
    batcher.queue(2)
    batcher.queue(3)
    await new Promise(resolve => requestAnimationFrame(resolve))
    expect(applyFn).toHaveBeenCalledTimes(1)
    expect(applyFn).toHaveBeenCalledWith([1, 2, 3])
    batcher.destroy()
  })
})
