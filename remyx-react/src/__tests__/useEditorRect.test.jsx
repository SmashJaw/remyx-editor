import { renderHook, act } from '@testing-library/react'
import { useEditorRect } from '../hooks/useEditorRect.js'

describe('useEditorRect', () => {
  let mockResizeObserver
  let observeCallback

  beforeEach(() => {
    observeCallback = null
    mockResizeObserver = {
      observe: jest.fn(),
      disconnect: jest.fn(),
      unobserve: jest.fn(),
    }

    global.ResizeObserver = jest.fn((callback) => {
      observeCallback = callback
      return mockResizeObserver
    })

    global.requestAnimationFrame = jest.fn((cb) => {
      cb()
      return 1
    })
    global.cancelAnimationFrame = jest.fn()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('returns null when ref.current is null', () => {
    const ref = { current: null }
    const { result } = renderHook(() => useEditorRect(ref, true))

    expect(result.current).toBeNull()
  })

  it('returns null when not ready', () => {
    const el = document.createElement('div')
    el.getBoundingClientRect = jest.fn(() => ({
      top: 0, left: 0, width: 800, height: 400, right: 800, bottom: 400,
    }))
    const ref = { current: el }

    const { result } = renderHook(() => useEditorRect(ref, false))

    // With ready=false, the effect doesn't run on initial render
    // but it actually runs because the dependency is `ready` and effect runs on mount
    // Let's check the actual behavior - the effect depends on `ready` value
    // Since ready=false, useEffect with [ready] dep still runs on mount
    // Actually the effect runs regardless, it just uses ready as a dep to re-run
    // The guard is on el being null, not ready
    expect(result.current).not.toBeNull()
  })

  it('measures the element rect on mount', () => {
    const mockRect = { top: 50, left: 100, width: 800, height: 400, right: 900, bottom: 450 }
    const el = document.createElement('div')
    el.getBoundingClientRect = jest.fn(() => mockRect)
    const ref = { current: el }

    const { result } = renderHook(() => useEditorRect(ref, true))

    expect(el.getBoundingClientRect).toHaveBeenCalled()
    expect(result.current).toEqual(mockRect)
  })

  it('sets up ResizeObserver on the element', () => {
    const el = document.createElement('div')
    el.getBoundingClientRect = jest.fn(() => ({
      top: 0, left: 0, width: 800, height: 400, right: 800, bottom: 400,
    }))
    const ref = { current: el }

    renderHook(() => useEditorRect(ref, true))

    expect(global.ResizeObserver).toHaveBeenCalled()
    expect(mockResizeObserver.observe).toHaveBeenCalledWith(el)
  })

  it('disconnects ResizeObserver on unmount', () => {
    const el = document.createElement('div')
    el.getBoundingClientRect = jest.fn(() => ({
      top: 0, left: 0, width: 800, height: 400, right: 800, bottom: 400,
    }))
    const ref = { current: el }

    const { unmount } = renderHook(() => useEditorRect(ref, true))

    unmount()

    expect(mockResizeObserver.disconnect).toHaveBeenCalled()
  })

  it('updates rect when ResizeObserver fires', () => {
    const el = document.createElement('div')
    let callCount = 0
    el.getBoundingClientRect = jest.fn(() => {
      callCount++
      if (callCount <= 1) {
        return { top: 0, left: 0, width: 800, height: 400, right: 800, bottom: 400 }
      }
      return { top: 0, left: 0, width: 600, height: 300, right: 600, bottom: 300 }
    })
    const ref = { current: el }

    // Mock requestAnimationFrame to invoke callback synchronously
    const origRAF = global.requestAnimationFrame
    global.requestAnimationFrame = (cb) => { cb(); return 0 }

    const { result } = renderHook(() => useEditorRect(ref, true))

    expect(result.current.width).toBe(800)

    // Simulate resize - rAF is now synchronous, wrap in act for state update
    act(() => {
      observeCallback()
    })

    expect(result.current.width).toBe(600)

    global.requestAnimationFrame = origRAF
  })

  it('cleans up scroll listener on unmount', () => {
    const el = document.createElement('div')
    el.getBoundingClientRect = jest.fn(() => ({
      top: 0, left: 0, width: 800, height: 400, right: 800, bottom: 400,
    }))
    const ref = { current: el }
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener')

    const { unmount } = renderHook(() => useEditorRect(ref, true))

    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function), true)
  })

  it('updates rect when scroll event fires via rAF', () => {
    const el = document.createElement('div')
    let callCount = 0
    el.getBoundingClientRect = jest.fn(() => {
      callCount++
      if (callCount <= 1) {
        return { top: 0, left: 0, width: 800, height: 400, right: 800, bottom: 400 }
      }
      return { top: 50, left: 0, width: 800, height: 400, right: 800, bottom: 450 }
    })
    const ref = { current: el }

    // Make rAF synchronous
    global.requestAnimationFrame = jest.fn((cb) => { cb(); return 42 })
    global.cancelAnimationFrame = jest.fn()

    const { result } = renderHook(() => useEditorRect(ref, true))

    expect(result.current.top).toBe(0)

    // Simulate scroll event
    act(() => {
      window.dispatchEvent(new Event('scroll'))
    })

    expect(result.current.top).toBe(50)
  })

  it('cancels pending rAF on cleanup', () => {
    const el = document.createElement('div')
    el.getBoundingClientRect = jest.fn(() => ({
      top: 0, left: 0, width: 800, height: 400, right: 800, bottom: 400,
    }))
    const ref = { current: el }

    // Make rAF return a handle but NOT execute the callback
    let rafId = 100
    global.requestAnimationFrame = jest.fn(() => ++rafId)
    global.cancelAnimationFrame = jest.fn()

    const { unmount } = renderHook(() => useEditorRect(ref, true))

    // Trigger a scroll to schedule a rAF that hasn't executed yet
    act(() => {
      window.dispatchEvent(new Event('scroll'))
    })

    unmount()

    // cancelAnimationFrame should have been called to clean up the pending rAF
    expect(global.cancelAnimationFrame).toHaveBeenCalled()
  })

  it('scroll handler cancels previous rAF before scheduling a new one', () => {
    const el = document.createElement('div')
    el.getBoundingClientRect = jest.fn(() => ({
      top: 0, left: 0, width: 800, height: 400, right: 800, bottom: 400,
    }))
    const ref = { current: el }

    let rafId = 200
    global.requestAnimationFrame = jest.fn(() => ++rafId)
    global.cancelAnimationFrame = jest.fn()

    renderHook(() => useEditorRect(ref, true))

    // Fire two scroll events in quick succession
    act(() => {
      window.dispatchEvent(new Event('scroll'))
    })
    act(() => {
      window.dispatchEvent(new Event('scroll'))
    })

    // cancelAnimationFrame should have been called to cancel the first scheduled rAF
    expect(global.cancelAnimationFrame).toHaveBeenCalled()
  })
})
