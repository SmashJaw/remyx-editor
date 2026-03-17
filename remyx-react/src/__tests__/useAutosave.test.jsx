import { renderHook, act } from '@testing-library/react'
import { useAutosave } from '../hooks/useAutosave.js'

// Mock the AutosaveManager — avoid importing all of @remyxjs/core which pulls in CSS
jest.mock('@remyxjs/core', () => ({
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

  it('does not change saveStatus to unsaved while saving', () => {
    const engine = createMockEngine()
    const { result } = renderHook(() => useAutosave(engine, { enabled: true }))

    act(() => {
      engine.eventBus.emit('autosave:saving')
    })
    expect(result.current.saveStatus).toBe('saving')

    act(() => {
      engine.eventBus.emit('content:change')
    })
    // Should remain 'saving', not flip to 'unsaved'
    expect(result.current.saveStatus).toBe('saving')
  })

  it('sets recoveryData, emits autosave:recovered, and calls onRecover when recovery data exists', async () => {
    const { AutosaveManager } = require('@remyxjs/core')
    const recoveryPayload = { recoveredContent: '<p>Recovered</p>', timestamp: 12345 }
    AutosaveManager.mockImplementationOnce(() => ({
      init: jest.fn(),
      destroy: jest.fn(),
      save: jest.fn(),
      checkRecovery: jest.fn().mockResolvedValue(recoveryPayload),
      clearRecovery: jest.fn(),
    }))

    const onRecover = jest.fn()
    const engine = createMockEngine()
    const { result } = renderHook(() =>
      useAutosave(engine, { enabled: true, onRecover })
    )

    // Wait for the async checkRecovery promise to resolve
    await act(async () => {
      await Promise.resolve()
    })

    expect(result.current.recoveryData).toEqual(recoveryPayload)
    expect(engine.eventBus.emit).toHaveBeenCalledWith('autosave:recovered', recoveryPayload)
    expect(onRecover).toHaveBeenCalledWith(recoveryPayload)
  })

  it('recoverContent calls engine.setHTML, emits content:change, clears recoveryData, and calls clearRecovery', async () => {
    const { AutosaveManager } = require('@remyxjs/core')
    const recoveryPayload = { recoveredContent: '<p>Recovered</p>', timestamp: 12345 }
    const mockClearRecovery = jest.fn()
    AutosaveManager.mockImplementationOnce(() => ({
      init: jest.fn(),
      destroy: jest.fn(),
      save: jest.fn(),
      checkRecovery: jest.fn().mockResolvedValue(recoveryPayload),
      clearRecovery: mockClearRecovery,
    }))

    const engine = createMockEngine()
    const { result } = renderHook(() =>
      useAutosave(engine, { enabled: true })
    )

    // Wait for recovery data to be set
    await act(async () => {
      await Promise.resolve()
    })

    expect(result.current.recoveryData).toEqual(recoveryPayload)

    // Now call recoverContent
    act(() => {
      result.current.recoverContent()
    })

    expect(engine.setHTML).toHaveBeenCalledWith('<p>Recovered</p>')
    expect(engine.eventBus.emit).toHaveBeenCalledWith('content:change')
    expect(result.current.recoveryData).toBeNull()
    expect(mockClearRecovery).toHaveBeenCalled()
  })

  it('dismissRecovery clears recoveryData and calls clearRecovery', async () => {
    const { AutosaveManager } = require('@remyxjs/core')
    const recoveryPayload = { recoveredContent: '<p>Recovered</p>', timestamp: 12345 }
    const mockClearRecovery = jest.fn()
    AutosaveManager.mockImplementationOnce(() => ({
      init: jest.fn(),
      destroy: jest.fn(),
      save: jest.fn(),
      checkRecovery: jest.fn().mockResolvedValue(recoveryPayload),
      clearRecovery: mockClearRecovery,
    }))

    const engine = createMockEngine()
    const { result } = renderHook(() =>
      useAutosave(engine, { enabled: true })
    )

    // Wait for recovery data to be set
    await act(async () => {
      await Promise.resolve()
    })

    expect(result.current.recoveryData).toEqual(recoveryPayload)

    // Now call dismissRecovery
    act(() => {
      result.current.dismissRecovery()
    })

    expect(result.current.recoveryData).toBeNull()
    expect(mockClearRecovery).toHaveBeenCalled()
  })

  it('transitions saveStatus through saving → saved with timestamp', () => {
    const engine = createMockEngine()
    const { result } = renderHook(() => useAutosave(engine, { enabled: true }))

    act(() => {
      engine.eventBus.emit('autosave:saving')
    })
    expect(result.current.saveStatus).toBe('saving')

    const now = Date.now()
    act(() => {
      engine.eventBus.emit('autosave:saved', { timestamp: now })
    })
    expect(result.current.saveStatus).toBe('saved')
    expect(result.current.lastSaved).toBe(now)
  })

  it('transitions saveStatus to error on autosave:error after saving', () => {
    const engine = createMockEngine()
    const { result } = renderHook(() => useAutosave(engine, { enabled: true }))

    act(() => {
      engine.eventBus.emit('autosave:saving')
    })
    expect(result.current.saveStatus).toBe('saving')

    act(() => {
      engine.eventBus.emit('autosave:error')
    })
    expect(result.current.saveStatus).toBe('error')
  })
})
