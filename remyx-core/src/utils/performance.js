/**
 * Performance utilities for the Remyx Editor.
 *
 * Provides DOM mutation batching, idle-time processing, and
 * performance measurement helpers for large-document optimization.
 */

/**
 * Batch multiple DOM mutations into a single requestAnimationFrame callback
 * to prevent layout thrash from rapid sequential changes.
 *
 * @param {Function[]} mutations - Array of functions that perform DOM mutations
 * @returns {Promise<void>} Resolves after all mutations are applied
 *
 * @example
 * batchDOMMutations([
 *   () => el.style.width = '100px',
 *   () => el.style.height = '200px',
 *   () => el.classList.add('active'),
 * ])
 */
export function batchDOMMutations(mutations) {
  return new Promise(resolve => {
    requestAnimationFrame(() => {
      for (const fn of mutations) {
        fn()
      }
      resolve()
    })
  })
}

/**
 * Schedule a non-critical task to run during browser idle time.
 * Falls back to setTimeout(fn, 16) if requestIdleCallback is not available.
 *
 * @param {Function} fn - The task to run during idle time
 * @param {Object} [options]
 * @param {number} [options.timeout=2000] - Maximum wait time in ms before forcing execution
 * @returns {number} The idle callback ID (can be passed to cancelIdleCallback)
 *
 * @example
 * scheduleIdleTask(() => {
 *   // Non-critical work: word count, readability, analytics
 *   updateWordCount(engine)
 * })
 */
export function scheduleIdleTask(fn, options = {}) {
  const timeout = options.timeout || 2000
  if (typeof requestIdleCallback === 'function') {
    return requestIdleCallback(fn, { timeout })
  }
  // Fallback for Safari (no requestIdleCallback)
  return setTimeout(fn, 16)
}

/**
 * Cancel a previously scheduled idle task.
 *
 * @param {number} id - The ID returned by scheduleIdleTask
 */
export function cancelIdleTask(id) {
  if (typeof cancelIdleCallback === 'function') {
    cancelIdleCallback(id)
  } else {
    clearTimeout(id)
  }
}

/**
 * Create a throttled version of a function that fires at most once per
 * animation frame. Useful for scroll and resize handlers.
 *
 * @param {Function} fn - The function to throttle
 * @returns {Function} The throttled function
 */
export function rafThrottle(fn) {
  let frameId = null
  return function throttled(...args) {
    if (frameId !== null) return
    frameId = requestAnimationFrame(() => {
      fn.apply(this, args)
      frameId = null
    })
  }
}

/**
 * Measure the execution time of a function in milliseconds.
 * Uses performance.now() for high-resolution timing.
 *
 * @param {string} label - A label for the measurement (logged to console)
 * @param {Function} fn - The function to measure
 * @returns {*} The return value of the measured function
 *
 * @example
 * const html = measurePerformance('getHTML', () => engine.getHTML())
 */
export function measurePerformance(label, fn) {
  const start = performance.now()
  const result = fn()
  const duration = performance.now() - start
  if (typeof console !== 'undefined' && console.debug) {
    console.debug(`[Remyx perf] ${label}: ${duration.toFixed(2)}ms`)
  }
  return result
}

/**
 * Benchmark a function by running it multiple times and reporting stats.
 *
 * @param {string} label - Label for the benchmark
 * @param {Function} fn - The function to benchmark
 * @param {number} [iterations=100] - Number of iterations
 * @returns {{ label: string, mean: number, median: number, min: number, max: number, p95: number }}
 */
export function benchmark(label, fn, iterations = 100) {
  const times = []
  for (let i = 0; i < iterations; i++) {
    const start = performance.now()
    fn()
    times.push(performance.now() - start)
  }

  times.sort((a, b) => a - b)
  const sum = times.reduce((a, b) => a + b, 0)
  const mean = sum / times.length
  const median = times[Math.floor(times.length / 2)]
  const min = times[0]
  const max = times[times.length - 1]
  const p95 = times[Math.floor(times.length * 0.95)]

  return { label, mean, median, min, max, p95 }
}

/**
 * Creates an input batcher that coalesces rapid DOM updates.
 * Collects mutations during a frame and applies them in a single rAF.
 *
 * @param {Function} applyFn - Function that receives an array of batched mutations
 * @param {Object} [options]
 * @param {number} [options.flushMs=16] - Flush interval (one frame by default)
 * @returns {{ queue: Function, flush: Function, destroy: Function }}
 *
 * @example
 * const batcher = createInputBatcher((mutations) => {
 *   mutations.forEach(m => applyMutation(m))
 * })
 * batcher.queue({ type: 'insert', text: 'a' })
 * batcher.queue({ type: 'insert', text: 'b' })
 * // Both applied in a single rAF
 */
export function createInputBatcher(applyFn, options = {}) {
  const flushMs = options.flushMs || 16 // one frame
  let pending = []
  let timer = null

  return {
    /**
     * Queue a mutation to be applied in the next batch.
     * @param {*} mutation - The mutation data to queue
     */
    queue(mutation) {
      pending.push(mutation)
      if (!timer) {
        timer = (typeof requestAnimationFrame === 'function')
          ? requestAnimationFrame(() => {
              const batch = pending
              pending = []
              timer = null
              applyFn(batch)
            })
          : setTimeout(() => {
              const batch = pending
              pending = []
              timer = null
              applyFn(batch)
            }, flushMs)
      }
    },

    /**
     * Immediately flush any pending mutations without waiting for rAF.
     */
    flush() {
      if (timer) {
        if (typeof cancelAnimationFrame === 'function') {
          cancelAnimationFrame(timer)
        } else {
          clearTimeout(timer)
        }
        timer = null
      }
      if (pending.length) {
        const batch = pending
        pending = []
        applyFn(batch)
      }
    },

    /**
     * Destroy the batcher, cancelling any pending flush.
     */
    destroy() {
      if (timer) {
        if (typeof cancelAnimationFrame === 'function') {
          cancelAnimationFrame(timer)
        } else {
          clearTimeout(timer)
        }
      }
      pending = []
      timer = null
    }
  }
}
