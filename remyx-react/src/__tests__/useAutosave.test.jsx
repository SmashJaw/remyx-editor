import { renderHook, act } from '@testing-library/react'
import { useAutosave } from '../hooks/useAutosave.js'

// Mock the AutosaveManager — avoid importing all of @remyx/core which pulls in CSS
jest.mock('@remyx/core', () => ({
  AutosaveManager: jest.fn().mockImplementation(() => ({
    init: jest.fn(),
    destroy: jest.fn(),
    save: jest.fn(),
    checkRecovery: jest.fn().mockResolvedValue(null),
    clearRecovery: jest.fn(),
  })),
}))

function createMockEngine() {
  const handlers = {}
  return {
    eventBus: {
      on: jest.fn((event, handler) => {
        if (!handlers[event]) handlers[event] = []
        handlers[event].push(handler)
        return () => {
          handlers[event] = handlers[event].filter(h => h !== handler)
        }
      }),
      emit: jest.fn((event, data) => {
        if (handlers[event]) {
          handlers[event].forEach(h => h(data))
        }
      }),
    },
    getHTML: jest.fn(() => '<p>Test</p>'),
    setHTML: jest.fn(),
    _handlers: handlers,
  }
}

describe('useAutosave', () => {
  it('returns default state when engine is null', () => {
    const { result } = renderHook(() => useAutosave(null, { enabled: true }))

    expect(result.current.saveStatus).toBe('saved')
    expect(result.current.lastSaved).toBeNull()
    expect(result.current.recoveryData).toBeNull()
  })

  it('returns default state when not enabled', () => {
    const engine = createMockEngine()
    const { result } = renderHook(() => useAutosave(engine, { enabled: false }))

    expect(result.current.saveStatus).toBe('saved')
    expect(engine.eventBus.on).not.toHaveBeenCalled()
  })

  it('subscribes to autosave events when enabled', () => {
    const engine = createMockEngine()
    renderHook(() => useAutosave(engine, { enabled: true }))

    // Should subscribe to autosave:saving, autosave:saved, autosave:error, content:change
    const eventNames = engine.eventBus.on.mock.calls.map(c => c[0])
    expect(eventNames).toContain('autosave:saving')
    expect(eventNames).toContain('autosave:saved')
    expect(eventNames).toContain('autosave:error')
    expect(eventNames).toContain('content:change')
  })

  it('updates saveStatus on autosave:saving', () => {
    const engine = createMockEngine()
    const { result } = renderHook(() => useAutosave(engine, { enabled: true }))

    act(() => {
      engine.eventBus.emit('autosave:saving')
    })

    expect(result.current.saveStatus).toBe('saving')
  })

  it('updates saveStatus and lastSaved on autosave:saved', () => {
    const engine = createMockEngine()
    const { result } = renderHook(() => useAutosave(engine, { enabled: true }))

    const timestamp = Date.now()
    act(() => {
      engine.eventBus.emit('autosave:saved', { timestamp })
    })

    expect(result.current.saveStatus).toBe('saved')
    expect(result.current.lastSaved).toBe(timestamp)
  })

  it('updates saveStatus on autosave:error', () => {
    const engine = createMockEngine()
    const { result } = renderHook(() => useAutosave(engine, { enabled: true }))

    act(() => {
      engine.eventBus.emit('autosave:error')
    })

    expect(result.current.saveStatus).toBe('error')
  })

  it('updates saveStatus to unsaved on content:change', () => {
    const engine = createMockEngine()
    const { result } = renderHook(() => useAutosave(engine, { enabled: true }))

    act(() => {
      engine.eventBus.emit('content:change')
    })

    expect(result.current.saveStatus).toBe('unsaved')
  })

  it('provides recoverContent callback', () => {
    const engine = createMockEngine()
    const { result } = renderHook(() => useAutosave(engine, { enabled: true }))

    expect(typeof result.current.recoverContent).toBe('function')
  })

  it('provides dismissRecovery callback', () => {
    const engine = createMockEngine()
    const { result } = renderHook(() => useAutosave(engine, { enabled: true }))

    expect(typeof result.current.dismissRecovery).toBe('function')
  })

  it('cleans up on unmount', () => {
    const engine = createMockEngine()
    const { unmount } = renderHook(() => useAutosave(engine, { enabled: true }))

    unmount()

    // After unmount, emitting events should not cause errors
    engine.eventBus.emit('autosave:saving')
    engine.eventBus.emit('content:change')
  })
})
