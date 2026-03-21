import { vi, beforeAll } from 'vitest'
import React from 'react'
import { render, screen } from '@testing-library/react'
import { FloatingToolbar } from '../components/EditArea/FloatingToolbar.jsx'
import { SelectionContext } from '../config/SelectionContext.js'

// jsdom does not implement scrollIntoView or ResizeObserver
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn()
  global.ResizeObserver = vi.fn(function () {
    this.observe = vi.fn()
    this.disconnect = vi.fn()
    this.unobserve = vi.fn()
  })
})

// Mock Tooltip
vi.mock('../components/Tooltip/Tooltip.jsx', () => ({
  Tooltip: ({ children }) => <span>{children}</span>,
}))

const defaultFormatState = {
  bold: false,
  italic: false,
  underline: false,
  strikethrough: false,
  link: null,
}

function renderWithContext(ui, formatState = defaultFormatState) {
  return render(
    <SelectionContext.Provider value={formatState}>
      {ui}
    </SelectionContext.Provider>
  )
}

function createMockEngine() {
  const el = document.createElement('div')
  const handlers = {}
  return {
    element: el,
    executeCommand: vi.fn(),
    selection: { getSelectedText: vi.fn(() => 'selected') },
    eventBus: {
      on: vi.fn((event, handler) => {
        if (!handlers[event]) handlers[event] = []
        handlers[event].push(handler)
        return () => {
          handlers[event] = handlers[event].filter(h => h !== handler)
        }
      }),
      emit(event, data) {
        if (handlers[event]) handlers[event].forEach(h => h(data))
      },
    },
  }
}

describe('FloatingToolbar', () => {
  it('renders nothing when not visible and no engine', () => {
    const { container } = renderWithContext(
      <FloatingToolbar
        visible={false}
        selectionRect={null}
        engine={null}
        editorRect={null}
      />
    )
    expect(container.innerHTML).toBe('')
  })

  it('renders nothing when engine is null', () => {
    const { container } = renderWithContext(
      <FloatingToolbar
        visible={true}
        selectionRect={{ top: 10, left: 20, width: 100, height: 20, bottom: 30 }}
        engine={null}
        editorRect={{ top: 0, left: 0, width: 800, height: 400 }}
      />
    )
    expect(container.innerHTML).toBe('')
  })

  it('renders toolbar when visible with engine', () => {
    const engine = createMockEngine()
    renderWithContext(
      <FloatingToolbar
        visible={true}
        selectionRect={{ top: 100, left: 200, width: 100, height: 20, bottom: 120 }}
        engine={engine}
        editorRect={{ top: 0, left: 0, width: 800, height: 400 }}
      />
    )
    expect(screen.getByRole('toolbar', { name: 'Formatting toolbar' })).toBeTruthy()
  })

  it('renders formatting buttons', () => {
    const engine = createMockEngine()
    renderWithContext(
      <FloatingToolbar
        visible={true}
        selectionRect={{ top: 100, left: 200, width: 100, height: 20, bottom: 120 }}
        engine={engine}
        editorRect={{ top: 0, left: 0, width: 800, height: 400 }}
      />
    )
    // Should have bold, italic, underline, strikethrough, link buttons
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThanOrEqual(5)
  })

  it('places toolbar below selection when no space above', () => {
    const engine = createMockEngine()
    const { container } = renderWithContext(
      <FloatingToolbar
        visible={true}
        selectionRect={{ top: 5, left: 200, width: 100, height: 20, bottom: 25 }}
        engine={engine}
        editorRect={{ top: 0, left: 0, width: 800, height: 400 }}
      />
    )
    const toolbar = container.querySelector('.rmx-floating-toolbar')
    expect(toolbar.className).toContain('rmx-floating-below')
  })

  it('renders drag grip handle', () => {
    const engine = createMockEngine()
    renderWithContext(
      <FloatingToolbar
        visible={true}
        selectionRect={{ top: 100, left: 200, width: 100, height: 20, bottom: 120 }}
        engine={engine}
        editorRect={{ top: 0, left: 0, width: 800, height: 400 }}
      />
    )
    const grip = screen.getByLabelText('Drag to reposition toolbar')
    expect(grip).toBeTruthy()
  })
})
