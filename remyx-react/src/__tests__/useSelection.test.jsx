import { renderHook, act } from '@testing-library/react'
import { useSelection } from '../hooks/useSelection.js'

describe('useSelection', () => {
  let mockEngine
  let selectionChangeHandler

  beforeEach(() => {
    selectionChangeHandler = null
    mockEngine = {
      eventBus: {
        on: jest.fn((event, handler) => {
          if (event === 'selection:change') {
            selectionChangeHandler = handler
          }
          // Return unsubscribe function
          return () => {
            if (event === 'selection:change') selectionChangeHandler = null
          }
        }),
        off: jest.fn(),
      },
    }

    // Mock window.getSelection
    Object.defineProperty(window, 'getSelection', {
      writable: true,
      value: jest.fn(() => ({
        isCollapsed: true,
        toString: () => '',
        rangeCount: 0,
        focusNode: null,
      })),
    })
  })

  it('returns default format state when no engine is provided', () => {
    const { result } = renderHook(() => useSelection(null))

    expect(result.current.bold).toBe(false)
    expect(result.current.italic).toBe(false)
    expect(result.current.underline).toBe(false)
    expect(result.current.strikethrough).toBe(false)
    expect(result.current.heading).toBeNull()
    expect(result.current.alignment).toBe('left')
    expect(result.current.orderedList).toBe(false)
    expect(result.current.unorderedList).toBe(false)
    expect(result.current.blockquote).toBe(false)
    expect(result.current.link).toBeNull()
    expect(result.current.fontFamily).toBeNull()
    expect(result.current.fontSize).toBeNull()
  })

  it('returns default UI state initially', () => {
    const { result } = renderHook(() => useSelection(null))

    expect(result.current.hasSelection).toBe(false)
    expect(result.current.selectionRect).toBeNull()
    expect(result.current.focusedImage).toBeNull()
    expect(result.current.focusedTable).toBeNull()
  })

  it('subscribes to selection:change on engine eventBus', () => {
    renderHook(() => useSelection(mockEngine))

    expect(mockEngine.eventBus.on).toHaveBeenCalledWith(
      'selection:change',
      expect.any(Function)
    )
  })

  it('subscribes to content:change on engine eventBus', () => {
    renderHook(() => useSelection(mockEngine))

    expect(mockEngine.eventBus.on).toHaveBeenCalledWith(
      'content:change',
      expect.any(Function)
    )
  })

  it('updates format state when selection:change fires', () => {
    const { result } = renderHook(() => useSelection(mockEngine))

    act(() => {
      selectionChangeHandler({
        bold: true,
        italic: true,
        heading: 'h2',
      })
    })

    expect(result.current.bold).toBe(true)
    expect(result.current.italic).toBe(true)
    expect(result.current.heading).toBe('h2')
    // Others should remain default
    expect(result.current.underline).toBe(false)
    expect(result.current.strikethrough).toBe(false)
  })

  it('detects hasSelection from window.getSelection', () => {
    window.getSelection = jest.fn(() => ({
      isCollapsed: false,
      toString: () => 'selected text',
      rangeCount: 1,
      getRangeAt: () => ({
        getBoundingClientRect: () => ({ top: 10, left: 20, width: 100, height: 20 }),
      }),
      focusNode: null,
    }))

    const { result } = renderHook(() => useSelection(mockEngine))

    act(() => {
      selectionChangeHandler({ bold: false })
    })

    expect(result.current.hasSelection).toBe(true)
    expect(result.current.selectionRect).toBeTruthy()
  })

  it('unsubscribes on unmount', () => {
    const unsubSelection = jest.fn()
    const unsubContent = jest.fn()
    let callCount = 0
    mockEngine.eventBus.on = jest.fn((event, handler) => {
      if (event === 'selection:change') {
        selectionChangeHandler = handler
        return unsubSelection
      }
      if (event === 'content:change') {
        return unsubContent
      }
      return () => {}
    })

    const { unmount } = renderHook(() => useSelection(mockEngine))

    unmount()

    expect(unsubSelection).toHaveBeenCalled()
    expect(unsubContent).toHaveBeenCalled()
  })

  it('does not subscribe when engine is null', () => {
    renderHook(() => useSelection(null))

    // No calls should be made since engine is null
    expect(mockEngine.eventBus.on).not.toHaveBeenCalled()
  })
})
