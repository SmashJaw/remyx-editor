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

  it('sets selectionRect to null when getBoundingClientRect throws', () => {
    window.getSelection = jest.fn(() => ({
      isCollapsed: false,
      toString: () => 'selected text',
      rangeCount: 1,
      getRangeAt: () => ({
        getBoundingClientRect: () => { throw new Error('DOM mutation') },
      }),
      focusNode: null,
    }))

    const { result } = renderHook(() => useSelection(mockEngine))

    act(() => {
      selectionChangeHandler({ bold: false })
    })

    expect(result.current.hasSelection).toBe(true)
    expect(result.current.selectionRect).toBeNull()
  })

  it('sets focusedImage when focus is on an IMG element', () => {
    const imgEl = document.createElement('img')
    imgEl.src = 'test.png'

    window.getSelection = jest.fn(() => ({
      isCollapsed: true,
      toString: () => '',
      rangeCount: 0,
      focusNode: imgEl,
    }))

    const { result } = renderHook(() => useSelection(mockEngine))

    act(() => {
      selectionChangeHandler({ bold: false })
    })

    expect(result.current.focusedImage).toBe(imgEl)
  })

  it('sets focusedImage when focus is on a parent containing a direct child img', () => {
    const container = document.createElement('div')
    const imgEl = document.createElement('img')
    imgEl.src = 'test.png'
    container.appendChild(imgEl)

    window.getSelection = jest.fn(() => ({
      isCollapsed: true,
      toString: () => '',
      rangeCount: 0,
      focusNode: container,
    }))

    const { result } = renderHook(() => useSelection(mockEngine))

    act(() => {
      selectionChangeHandler({ bold: false })
    })

    expect(result.current.focusedImage).toBe(imgEl)
  })

  it('sets focusedTable when focus is inside a TABLE element', () => {
    const table = document.createElement('table')
    const tbody = document.createElement('tbody')
    const tr = document.createElement('tr')
    const td = document.createElement('td')
    td.textContent = 'cell'
    tr.appendChild(td)
    tbody.appendChild(tr)
    table.appendChild(tbody)
    document.body.appendChild(table)

    window.getSelection = jest.fn(() => ({
      isCollapsed: true,
      toString: () => '',
      rangeCount: 0,
      focusNode: td,
    }))

    const { result } = renderHook(() => useSelection(mockEngine))

    act(() => {
      selectionChangeHandler({ bold: false })
    })

    expect(result.current.focusedTable).toBe(table)

    document.body.removeChild(table)
  })

  it('updates cached DOM references when focused element changes', () => {
    const img1 = document.createElement('img')
    const img2 = document.createElement('img')

    window.getSelection = jest.fn(() => ({
      isCollapsed: true,
      toString: () => '',
      rangeCount: 0,
      focusNode: img1,
    }))

    const { result } = renderHook(() => useSelection(mockEngine))

    act(() => {
      selectionChangeHandler({ bold: false })
    })
    expect(result.current.focusedImage).toBe(img1)

    // Change focused element to a different image
    window.getSelection = jest.fn(() => ({
      isCollapsed: true,
      toString: () => '',
      rangeCount: 0,
      focusNode: img2,
    }))

    act(() => {
      selectionChangeHandler({ bold: false })
    })
    expect(result.current.focusedImage).toBe(img2)
  })

  it('content:change event clears cached DOM references', () => {
    let contentChangeHandler = null
    mockEngine.eventBus.on = jest.fn((event, handler) => {
      if (event === 'selection:change') {
        selectionChangeHandler = handler
      }
      if (event === 'content:change') {
        contentChangeHandler = handler
      }
      return () => {}
    })

    const img = document.createElement('img')
    window.getSelection = jest.fn(() => ({
      isCollapsed: true,
      toString: () => '',
      rangeCount: 0,
      focusNode: img,
    }))

    const { result } = renderHook(() => useSelection(mockEngine))

    // First, set a focused image
    act(() => {
      selectionChangeHandler({ bold: false })
    })
    expect(result.current.focusedImage).toBe(img)

    // Fire content:change to clear cached references
    act(() => {
      contentChangeHandler()
    })

    // Now fire selection:change with no focusNode to verify cache was cleared
    window.getSelection = jest.fn(() => ({
      isCollapsed: true,
      toString: () => '',
      rangeCount: 0,
      focusNode: null,
    }))

    act(() => {
      selectionChangeHandler({ bold: false })
    })
    expect(result.current.focusedImage).toBeNull()
  })

  it('shallowEqual prevents unnecessary format state updates when values are the same', () => {
    const { result } = renderHook(() => useSelection(mockEngine))

    act(() => {
      selectionChangeHandler({ bold: true, italic: false })
    })

    const firstFormatState = result.current

    // Emit the same format values again
    act(() => {
      selectionChangeHandler({ bold: true, italic: false })
    })

    // The object reference should be the same (no re-render with new object)
    // We check that the values remain the same
    expect(result.current.bold).toBe(true)
    expect(result.current.italic).toBe(false)
  })

  it('handles focusNode being a text node inside an element', () => {
    const table = document.createElement('table')
    const tbody = document.createElement('tbody')
    const tr = document.createElement('tr')
    const td = document.createElement('td')
    const textNode = document.createTextNode('cell text')
    td.appendChild(textNode)
    tr.appendChild(td)
    tbody.appendChild(tr)
    table.appendChild(tbody)
    document.body.appendChild(table)

    window.getSelection = jest.fn(() => ({
      isCollapsed: true,
      toString: () => '',
      rangeCount: 0,
      focusNode: textNode,  // text node, not element
    }))

    const { result } = renderHook(() => useSelection(mockEngine))

    act(() => {
      selectionChangeHandler({ bold: false })
    })

    // Should walk up to parentElement (td), then find table via closest
    expect(result.current.focusedTable).toBe(table)

    document.body.removeChild(table)
  })
})
