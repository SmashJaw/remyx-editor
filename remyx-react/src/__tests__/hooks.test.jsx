import { vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useContextMenu } from '../hooks/useContextMenu.js'
import { useDragDrop } from '../hooks/useDragDrop.js'
import { useSlashCommands } from '../hooks/useSlashCommands.js'
import { usePortalAttachment } from '../hooks/usePortalAttachment.js'

// ── useContextMenu ─────────────────────────────────────────────────────────

describe('useContextMenu', () => {
  it('initializes with contextMenu hidden', () => {
    const { result } = renderHook(() => useContextMenu(null, { current: null }))

    expect(result.current.contextMenu).toEqual({
      visible: false,
      x: 0,
      y: 0,
      items: [],
    })
    expect(typeof result.current.hideContextMenu).toBe('function')
  })

  it('attaches contextmenu listener when editorRef and engine are provided', () => {
    const el = document.createElement('div')
    const addSpy = vi.spyOn(el, 'addEventListener')
    const engine = { executeCommand: vi.fn() }

    renderHook(() => useContextMenu(engine, { current: el }))

    expect(addSpy).toHaveBeenCalledWith('contextmenu', expect.any(Function))
  })

  it('removes event listeners on unmount', () => {
    const el = document.createElement('div')
    const removeSpy = vi.spyOn(el, 'removeEventListener')
    const engine = { executeCommand: vi.fn() }

    const { unmount } = renderHook(() => useContextMenu(engine, { current: el }))
    unmount()

    expect(removeSpy).toHaveBeenCalledWith('contextmenu', expect.any(Function))
  })

  it('hideContextMenu sets visible to false', () => {
    const { result } = renderHook(() => useContextMenu(null, { current: null }))

    act(() => {
      result.current.hideContextMenu()
    })

    expect(result.current.contextMenu.visible).toBe(false)
  })
})

// ── useDragDrop ────────────────────────────────────────────────────────────

describe('useDragDrop', () => {
  function createMockEngine() {
    const listeners = {}
    return {
      eventBus: {
        on(event, cb) {
          listeners[event] = cb
          return () => { delete listeners[event] }
        },
        emit(event, data) {
          listeners[event]?.(data)
        },
      },
      _listeners: listeners,
    }
  }

  it('initializes with isExternalDrag false and empty dragFileTypes', () => {
    const { result } = renderHook(() => useDragDrop(null))

    expect(result.current.isExternalDrag).toBe(false)
    expect(result.current.dragFileTypes).toEqual([])
  })

  it('sets isExternalDrag true on drag:enter with isExternal', () => {
    const engine = createMockEngine()
    const { result } = renderHook(() => useDragDrop(engine))

    act(() => {
      engine.eventBus.emit('drag:enter', { isExternal: true, types: ['image/png'] })
    })

    expect(result.current.isExternalDrag).toBe(true)
    expect(result.current.dragFileTypes).toEqual(['image/png'])
  })

  it('does not set isExternalDrag for internal drags', () => {
    const engine = createMockEngine()
    const { result } = renderHook(() => useDragDrop(engine))

    act(() => {
      engine.eventBus.emit('drag:enter', { isExternal: false, types: [] })
    })

    expect(result.current.isExternalDrag).toBe(false)
  })

  it('resets state on drag:leave', () => {
    const engine = createMockEngine()
    const { result } = renderHook(() => useDragDrop(engine))

    act(() => {
      engine.eventBus.emit('drag:enter', { isExternal: true, types: ['Files'] })
    })
    expect(result.current.isExternalDrag).toBe(true)

    act(() => {
      engine.eventBus.emit('drag:leave')
    })
    expect(result.current.isExternalDrag).toBe(false)
    expect(result.current.dragFileTypes).toEqual([])
  })

  it('resets state on drop', () => {
    const engine = createMockEngine()
    const { result } = renderHook(() => useDragDrop(engine))

    act(() => {
      engine.eventBus.emit('drag:enter', { isExternal: true, types: ['Files'] })
    })
    act(() => {
      engine.eventBus.emit('drop')
    })

    expect(result.current.isExternalDrag).toBe(false)
    expect(result.current.dragFileTypes).toEqual([])
  })

  it('cleans up event subscriptions on unmount', () => {
    const engine = createMockEngine()
    const { unmount } = renderHook(() => useDragDrop(engine))

    unmount()

    // After unmount, all listeners should have been removed
    expect(Object.keys(engine._listeners)).toEqual([])
  })
})

// ── useSlashCommands ───────────────────────────────────────────────────────

describe('useSlashCommands', () => {
  function createMockEngine() {
    const listeners = {}
    return {
      eventBus: {
        on(event, cb) {
          listeners[event] = cb
          return () => { delete listeners[event] }
        },
        emit(event, data) {
          listeners[event]?.(data)
        },
      },
      _listeners: listeners,
    }
  }

  it('initializes with visible false and empty query', () => {
    const { result } = renderHook(() => useSlashCommands(null, { current: null }))

    expect(result.current.visible).toBe(false)
    expect(result.current.query).toBe('')
    expect(result.current.selectedIndex).toBe(0)
    expect(Array.isArray(result.current.filteredItems)).toBe(true)
    expect(typeof result.current.selectItem).toBe('function')
    expect(typeof result.current.setSelectedIndex).toBe('function')
  })

  it('returns filteredItems as an array', () => {
    const { result } = renderHook(() => useSlashCommands(null, { current: null }))

    expect(Array.isArray(result.current.filteredItems)).toBe(true)
  })

  it('cleans up subscriptions on unmount', () => {
    const engine = createMockEngine()
    const { unmount } = renderHook(() =>
      useSlashCommands(engine, { current: document.createElement('div') })
    )

    unmount()

    expect(Object.keys(engine._listeners)).toEqual([])
  })
})

// ── usePortalAttachment ────────────────────────────────────────────────────

describe('usePortalAttachment', () => {
  it('returns null portalContainer when attachTo is not provided', () => {
    const { result } = renderHook(() =>
      usePortalAttachment({ attachTo: null, value: undefined, defaultValue: undefined, onChange: undefined })
    )

    expect(result.current.portalContainer).toBeNull()
  })

  it('returns effectiveValue when value is provided', () => {
    const { result } = renderHook(() =>
      usePortalAttachment({ attachTo: null, value: '<p>hello</p>', defaultValue: undefined, onChange: undefined })
    )

    expect(result.current.effectiveValue).toBe('<p>hello</p>')
  })

  it('returns effectiveOnChange as the passed onChange when no attachTo', () => {
    const onChange = vi.fn()
    const { result } = renderHook(() =>
      usePortalAttachment({ attachTo: null, value: '', defaultValue: undefined, onChange })
    )

    expect(result.current.effectiveOnChange).toBe(onChange)
  })

  it('creates portal container for textarea attachTo', () => {
    const textarea = document.createElement('textarea')
    textarea.value = 'initial content'
    document.body.appendChild(textarea)

    const ref = { current: textarea }
    const { result } = renderHook(() =>
      usePortalAttachment({ attachTo: ref, value: undefined, defaultValue: undefined, onChange: undefined })
    )

    expect(result.current.portalContainer).toBeInstanceOf(HTMLDivElement)
    expect(textarea.style.display).toBe('none')

    document.body.removeChild(textarea.nextSibling) // remove portal container
    document.body.removeChild(textarea)
  })

  it('cleans up portal container on unmount', () => {
    const textarea = document.createElement('textarea')
    document.body.appendChild(textarea)

    const ref = { current: textarea }
    const { unmount } = renderHook(() =>
      usePortalAttachment({ attachTo: ref, value: undefined, defaultValue: undefined, onChange: undefined })
    )

    unmount()

    // After unmount, textarea should be visible again
    expect(textarea.style.display).toBe('')

    document.body.removeChild(textarea)
  })
})
