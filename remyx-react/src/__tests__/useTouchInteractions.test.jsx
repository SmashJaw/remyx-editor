import { vi } from 'vitest'
import { renderHook } from '@testing-library/react'

// Mock all sub-hooks
vi.mock('../hooks/useSwipeGesture.js', () => ({
  useSwipeGesture: vi.fn(),
}))

vi.mock('../hooks/useLongPress.js', () => ({
  useLongPress: vi.fn(),
}))

vi.mock('../hooks/usePinchZoom.js', () => ({
  usePinchZoom: vi.fn(() => ({ zoomedElement: null, resetZoom: vi.fn() })),
}))

vi.mock('../hooks/useVirtualKeyboard.js', () => ({
  useVirtualKeyboard: vi.fn(() => ({ keyboardVisible: false, keyboardHeight: 0 })),
}))

import { isTouchDevice, useTouchInteractions } from '../hooks/useTouchInteractions.js'
import { useSwipeGesture } from '../hooks/useSwipeGesture.js'
import { useLongPress } from '../hooks/useLongPress.js'
import { usePinchZoom } from '../hooks/usePinchZoom.js'
import { useVirtualKeyboard } from '../hooks/useVirtualKeyboard.js'

describe('isTouchDevice', () => {
  afterEach(() => {
    // Clean up any touch modifications
    delete window.ontouchstart
  })

  it('returns true when ontouchstart is on window', () => {
    window.ontouchstart = null
    expect(isTouchDevice()).toBe(true)
    delete window.ontouchstart
  })

  it('returns true when maxTouchPoints > 0', () => {
    const original = navigator.maxTouchPoints
    Object.defineProperty(navigator, 'maxTouchPoints', {
      value: 5,
      configurable: true,
    })
    expect(isTouchDevice()).toBe(true)
    Object.defineProperty(navigator, 'maxTouchPoints', {
      value: original,
      configurable: true,
    })
  })

  it('returns false when no touch support', () => {
    // Ensure ontouchstart is not set
    delete window.ontouchstart
    const original = navigator.maxTouchPoints
    Object.defineProperty(navigator, 'maxTouchPoints', {
      value: 0,
      configurable: true,
    })
    expect(isTouchDevice()).toBe(false)
    Object.defineProperty(navigator, 'maxTouchPoints', {
      value: original,
      configurable: true,
    })
  })
})

describe('useTouchInteractions', () => {
  const engine = { executeCommand: vi.fn() }
  const editAreaRef = { current: document.createElement('div') }
  const editorRootRef = { current: document.createElement('div') }

  beforeEach(() => {
    vi.clearAllMocks()
    // Ensure non-touch for default tests
    delete window.ontouchstart
  })

  it('returns default values', () => {
    const { result } = renderHook(() =>
      useTouchInteractions(engine, editAreaRef, editorRootRef)
    )
    expect(result.current.zoomedElement).toBeNull()
    expect(typeof result.current.resetZoom).toBe('function')
    expect(result.current.keyboardVisible).toBe(false)
    expect(result.current.keyboardHeight).toBe(0)
  })

  it('passes engine to sub-hooks when touch device is detected', () => {
    // Simulate touch device
    window.ontouchstart = null

    renderHook(() =>
      useTouchInteractions(engine, editAreaRef, editorRootRef, {
        contextMenuEnabled: true,
        readOnly: false,
      })
    )

    expect(useSwipeGesture).toHaveBeenCalledWith(engine, editAreaRef, expect.anything())
    expect(usePinchZoom).toHaveBeenCalledWith(editAreaRef)
    expect(useVirtualKeyboard).toHaveBeenCalledWith(engine, editorRootRef)

    delete window.ontouchstart
  })

  it('disables long press when readOnly', () => {
    window.ontouchstart = null

    renderHook(() =>
      useTouchInteractions(engine, editAreaRef, editorRootRef, {
        readOnly: true,
      })
    )

    // onLongPress is undefined since not passed in options
    const call = useLongPress.mock.calls[useLongPress.mock.calls.length - 1]
    expect(call[0]).toBe(editAreaRef)
    expect(call[2].enabled).toBe(false)

    delete window.ontouchstart
  })
})
