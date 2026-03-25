import { vi } from 'vitest'
import React from 'react'
import { render, fireEvent, act } from '@testing-library/react'
import { Minimap } from '../components/Minimap/Minimap.jsx'

function createMockEngine(text = 'Hello world') {
  const el = document.createElement('div')
  el.textContent = text
  const handlers = {}
  return {
    element: el,
    eventBus: {
      on: vi.fn((event, handler) => {
        if (!handlers[event]) handlers[event] = []
        handlers[event].push(handler)
        return () => {
          handlers[event] = handlers[event].filter(h => h !== handler)
        }
      }),
      emit(event, data) {
        if (handlers[event]) {
          handlers[event].forEach(h => h(data))
        }
      },
    },
    _handlers: handlers,
  }
}

describe('Minimap', () => {
  beforeEach(() => {
    global.requestAnimationFrame = vi.fn((cb) => { cb(); return 1 })
    global.cancelAnimationFrame = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders the minimap container', () => {
    const engine = createMockEngine()
    const editAreaRef = { current: document.createElement('div') }
    const { container } = render(<Minimap engine={engine} editAreaRef={editAreaRef} />)
    expect(container.querySelector('.rmx-minimap')).toBeTruthy()
  })

  it('renders text content from engine element', () => {
    const engine = createMockEngine('Some editor content here')
    const editAreaRef = { current: document.createElement('div') }
    const { container } = render(<Minimap engine={engine} editAreaRef={editAreaRef} />)
    const content = container.querySelector('.rmx-minimap-content')
    expect(content.textContent).toBe('Some editor content here')
  })

  it('updates content on content:change event', () => {
    const engine = createMockEngine('Initial')
    const editAreaRef = { current: document.createElement('div') }
    const { container } = render(<Minimap engine={engine} editAreaRef={editAreaRef} />)

    // Change the engine element text
    engine.element.textContent = 'Updated content'

    act(() => {
      engine.eventBus.emit('content:change')
    })

    const content = container.querySelector('.rmx-minimap-content')
    expect(content.textContent).toBe('Updated content')
  })

  it('renders viewport indicator', () => {
    const engine = createMockEngine()
    const editAreaRef = { current: document.createElement('div') }
    const { container } = render(<Minimap engine={engine} editAreaRef={editAreaRef} />)
    expect(container.querySelector('.rmx-minimap-viewport')).toBeTruthy()
  })

  it('is aria-hidden', () => {
    const engine = createMockEngine()
    const editAreaRef = { current: document.createElement('div') }
    const { container } = render(<Minimap engine={engine} editAreaRef={editAreaRef} />)
    expect(container.querySelector('.rmx-minimap').getAttribute('aria-hidden')).toBe('true')
  })

  it('handles click to scroll', () => {
    const engine = createMockEngine()
    const area = document.createElement('div')
    Object.defineProperties(area, {
      scrollHeight: { value: 1000 },
      clientHeight: { value: 200 },
    })
    area.scrollTo = vi.fn()
    const editAreaRef = { current: area }

    const { container } = render(<Minimap engine={engine} editAreaRef={editAreaRef} />)
    const minimap = container.querySelector('.rmx-minimap')

    // Mock getBoundingClientRect
    minimap.getBoundingClientRect = vi.fn(() => ({
      top: 0, left: 0, width: 50, height: 100, right: 50, bottom: 100,
    }))

    fireEvent.click(minimap, { clientY: 50 })
    expect(area.scrollTo).toHaveBeenCalled()
  })
})
