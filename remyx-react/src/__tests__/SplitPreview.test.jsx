import { vi } from 'vitest'
import React from 'react'
import { render, screen, act } from '@testing-library/react'
import { SplitPreview } from '../components/SplitPreview/SplitPreview.jsx'

// Mock @remyxjs/core
vi.mock('@remyxjs/core', () => ({
  htmlToMarkdown: vi.fn((html) => `# Markdown from: ${html}`),
}))

function createMockEngine(html = '<p>Hello</p>') {
  const handlers = {}
  return {
    getHTML: vi.fn(() => html),
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

describe('SplitPreview', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders HTML preview by default', () => {
    const engine = createMockEngine('<p>Hello</p>')
    render(<SplitPreview engine={engine} />)
    expect(screen.getByText('HTML Preview')).toBeTruthy()
    expect(screen.getByText('<p>Hello</p>')).toBeTruthy()
  })

  it('renders Markdown preview when format is markdown', () => {
    const engine = createMockEngine('<p>Hello</p>')
    render(<SplitPreview engine={engine} format="markdown" />)
    expect(screen.getByText('Markdown Preview')).toBeTruthy()
  })

  it('updates content on content:change with debounce', () => {
    const engine = createMockEngine('<p>Initial</p>')
    render(<SplitPreview engine={engine} />)
    expect(screen.getByText('<p>Initial</p>')).toBeTruthy()

    // Change engine HTML
    engine.getHTML.mockReturnValue('<p>Updated</p>')

    act(() => {
      engine.eventBus.emit('content:change')
    })

    // Content should not update immediately (debounced)
    expect(screen.queryByText('<p>Updated</p>')).toBeNull()

    // Advance timer past debounce
    act(() => {
      vi.advanceTimersByTime(200)
    })

    expect(screen.getByText('<p>Updated</p>')).toBeTruthy()
  })

  it('has the correct CSS classes', () => {
    const engine = createMockEngine()
    const { container } = render(<SplitPreview engine={engine} />)
    expect(container.querySelector('.rmx-split-preview-container')).toBeTruthy()
    expect(container.querySelector('.rmx-split-preview')).toBeTruthy()
    expect(container.querySelector('.rmx-split-preview-label')).toBeTruthy()
  })

  it('cleans up timer on unmount', () => {
    const engine = createMockEngine()
    const { unmount } = render(<SplitPreview engine={engine} />)
    unmount()
    // Should not throw when timers fire after unmount
    act(() => {
      vi.advanceTimersByTime(500)
    })
  })
})
