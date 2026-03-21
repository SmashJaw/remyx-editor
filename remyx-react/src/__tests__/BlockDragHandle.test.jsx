import { vi } from 'vitest'
import React from 'react'
import { render } from '@testing-library/react'
import { BlockDragHandle } from '../components/EditArea/BlockDragHandle.jsx'

function createMockEngine() {
  const el = document.createElement('div')
  const handlers = {}
  return {
    element: el,
    dragDrop: {
      isDragging: vi.fn(() => false),
      getDraggableBlock: vi.fn(() => null),
      makeBlockDraggable: vi.fn(),
      unmakeBlockDraggable: vi.fn(),
    },
    eventBus: {
      on: vi.fn((event, handler) => {
        if (!handlers[event]) handlers[event] = []
        handlers[event].push(handler)
        return () => {
          handlers[event] = handlers[event].filter(h => h !== handler)
        }
      }),
    },
    _el: el,
    _handlers: handlers,
  }
}

describe('BlockDragHandle', () => {
  beforeEach(() => {
    global.requestAnimationFrame = vi.fn((cb) => { cb(); return 1 })
    global.cancelAnimationFrame = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders nothing when no block is hovered', () => {
    const engine = createMockEngine()
    const editorRect = { top: 0, left: 0, width: 800, height: 400 }
    const editAreaRef = { current: document.createElement('div') }

    const { container } = render(
      <BlockDragHandle engine={engine} editorRect={editorRect} editAreaRef={editAreaRef} />
    )
    expect(container.querySelector('.rmx-block-drag-handle')).toBeNull()
  })

  it('attaches pointermove listener to engine element', () => {
    const engine = createMockEngine()
    const spy = vi.spyOn(engine._el, 'addEventListener')
    const editorRect = { top: 0, left: 0, width: 800, height: 400 }
    const editAreaRef = { current: document.createElement('div') }

    render(
      <BlockDragHandle engine={engine} editorRect={editorRect} editAreaRef={editAreaRef} />
    )

    expect(spy).toHaveBeenCalledWith('pointermove', expect.any(Function))
  })

  it('attaches pointerleave listener to engine element', () => {
    const engine = createMockEngine()
    const spy = vi.spyOn(engine._el, 'addEventListener')
    const editorRect = { top: 0, left: 0, width: 800, height: 400 }
    const editAreaRef = { current: document.createElement('div') }

    render(
      <BlockDragHandle engine={engine} editorRect={editorRect} editAreaRef={editAreaRef} />
    )

    expect(spy).toHaveBeenCalledWith('pointerleave', expect.any(Function))
  })

  it('cleans up event listeners on unmount', () => {
    const engine = createMockEngine()
    const removeSpy = vi.spyOn(engine._el, 'removeEventListener')
    const editorRect = { top: 0, left: 0, width: 800, height: 400 }
    const editAreaRef = { current: document.createElement('div') }

    const { unmount } = render(
      <BlockDragHandle engine={engine} editorRect={editorRect} editAreaRef={editAreaRef} />
    )

    unmount()

    expect(removeSpy).toHaveBeenCalledWith('pointermove', expect.any(Function))
    expect(removeSpy).toHaveBeenCalledWith('pointerleave', expect.any(Function))
  })

  it('does not show handle when engine is dragging', () => {
    const engine = createMockEngine()
    engine.dragDrop.isDragging.mockReturnValue(true)
    const editorRect = { top: 0, left: 0, width: 800, height: 400 }
    const editAreaRef = { current: document.createElement('div') }

    const { container } = render(
      <BlockDragHandle engine={engine} editorRect={editorRect} editAreaRef={editAreaRef} />
    )

    expect(container.querySelector('.rmx-block-drag-handle')).toBeNull()
  })
})
