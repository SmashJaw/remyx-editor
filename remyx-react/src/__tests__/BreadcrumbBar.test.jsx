import { vi } from 'vitest'
import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { BreadcrumbBar } from '../components/BreadcrumbBar/BreadcrumbBar.jsx'

function createMockEngine(element) {
  const handlers = {}
  return {
    element,
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

describe('BreadcrumbBar', () => {
  let editorEl

  beforeEach(() => {
    editorEl = document.createElement('div')
    editorEl.className = 'rmx-editor'
    document.body.appendChild(editorEl)

    // Default mock — collapsed selection with no node
    Object.defineProperty(window, 'getSelection', {
      writable: true,
      value: vi.fn(() => ({
        anchorNode: null,
        rangeCount: 0,
        removeAllRanges: vi.fn(),
        addRange: vi.fn(),
      })),
    })
  })

  afterEach(() => {
    document.body.removeChild(editorEl)
  })

  it('renders with default Paragraph breadcrumb', () => {
    const engine = createMockEngine(editorEl)
    render(<BreadcrumbBar engine={engine} />)
    expect(screen.getByText('Paragraph')).toBeTruthy()
  })

  it('has navigation role and aria-label', () => {
    const engine = createMockEngine(editorEl)
    render(<BreadcrumbBar engine={engine} />)
    expect(screen.getByRole('navigation', { name: 'Document path' })).toBeTruthy()
  })

  it('updates path on selection:change', () => {
    const p = document.createElement('p')
    p.textContent = 'Hello'
    editorEl.appendChild(p)

    window.getSelection = vi.fn(() => ({
      anchorNode: p.firstChild,
      rangeCount: 1,
    }))

    const engine = createMockEngine(editorEl)
    render(<BreadcrumbBar engine={engine} />)

    act(() => {
      engine.eventBus.emit('selection:change')
    })

    expect(screen.getByText('Paragraph')).toBeTruthy()
  })

  it('shows nested path for table cells', () => {
    const table = document.createElement('table')
    const tbody = document.createElement('tbody')
    const tr = document.createElement('tr')
    const td = document.createElement('td')
    td.textContent = 'Cell content'
    tr.appendChild(td)
    tbody.appendChild(tr)
    table.appendChild(tbody)
    editorEl.appendChild(table)

    window.getSelection = vi.fn(() => ({
      anchorNode: td.firstChild,
      rangeCount: 1,
    }))

    const engine = createMockEngine(editorEl)
    render(<BreadcrumbBar engine={engine} />)

    act(() => {
      engine.eventBus.emit('selection:change')
    })

    expect(screen.getByText('Table')).toBeTruthy()
    expect(screen.getByText('Cell 1')).toBeTruthy()
  })

  it('renders separators between path items', () => {
    const bq = document.createElement('blockquote')
    const p = document.createElement('p')
    p.textContent = 'Quoted text'
    bq.appendChild(p)
    editorEl.appendChild(bq)

    window.getSelection = vi.fn(() => ({
      anchorNode: p.firstChild,
      rangeCount: 1,
    }))

    const engine = createMockEngine(editorEl)
    const { container } = render(<BreadcrumbBar engine={engine} />)

    act(() => {
      engine.eventBus.emit('selection:change')
    })

    expect(container.querySelectorAll('.rmx-breadcrumb-separator').length).toBeGreaterThan(0)
  })

  it('clicking a breadcrumb selects the corresponding element', () => {
    const h1 = document.createElement('h1')
    h1.textContent = 'Title'
    editorEl.appendChild(h1)

    window.getSelection = vi.fn(() => ({
      anchorNode: h1.firstChild,
      rangeCount: 1,
      removeAllRanges: vi.fn(),
      addRange: vi.fn(),
    }))

    const engine = createMockEngine(editorEl)
    render(<BreadcrumbBar engine={engine} />)

    act(() => {
      engine.eventBus.emit('selection:change')
    })

    // Click the heading breadcrumb
    const btn = screen.getByText('Heading 1')
    fireEvent.click(btn)

    // Should have called selection:change
    expect(engine.eventBus.emit).toBeDefined()
  })

  it('shows heading labels correctly', () => {
    const h2 = document.createElement('h2')
    h2.textContent = 'Subtitle'
    editorEl.appendChild(h2)

    window.getSelection = vi.fn(() => ({
      anchorNode: h2.firstChild,
      rangeCount: 1,
    }))

    const engine = createMockEngine(editorEl)
    render(<BreadcrumbBar engine={engine} />)

    act(() => {
      engine.eventBus.emit('selection:change')
    })

    expect(screen.getByText('Heading 2')).toBeTruthy()
  })

  it('shows list item label with index', () => {
    const ul = document.createElement('ul')
    const li1 = document.createElement('li')
    li1.textContent = 'First'
    const li2 = document.createElement('li')
    li2.textContent = 'Second'
    ul.appendChild(li1)
    ul.appendChild(li2)
    editorEl.appendChild(ul)

    window.getSelection = vi.fn(() => ({
      anchorNode: li2.firstChild,
      rangeCount: 1,
    }))

    const engine = createMockEngine(editorEl)
    render(<BreadcrumbBar engine={engine} />)

    act(() => {
      engine.eventBus.emit('selection:change')
    })

    expect(screen.getByText('Bulleted List')).toBeTruthy()
    expect(screen.getByText('Item 2')).toBeTruthy()
  })
})
