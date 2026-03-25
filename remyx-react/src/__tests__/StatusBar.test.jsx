import { vi } from 'vitest'
import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { StatusBar, WordCountButton } from '../components/StatusBar/StatusBar.jsx'

// Mock icons - path relative to test file
vi.mock('../icons/index.jsx', () => ({
  ICON_MAP: {
    findReplace: () => <span data-testid="icon-findReplace">FR</span>,
  },
}))

// Mock SaveStatus
vi.mock('../components/SaveStatus/SaveStatus.jsx', () => ({
  SaveStatus: ({ saveStatus }) => <span data-testid="save-status">{saveStatus}</span>,
}))

function createMockEngine(initialWordCount) {
  const handlers = {}
  return {
    _wordCount: initialWordCount || null,
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

describe('StatusBar', () => {
  it('renders word and character counts', () => {
    const engine = createMockEngine({ wordCount: 42, charCount: 250 })
    render(<StatusBar engine={engine} />)
    expect(screen.getByText('42 words')).toBeTruthy()
    expect(screen.getByText('250 characters')).toBeTruthy()
  })

  it('renders singular word/character when count is 1', () => {
    const engine = createMockEngine({ wordCount: 1, charCount: 1 })
    render(<StatusBar engine={engine} />)
    expect(screen.getByText('1 word')).toBeTruthy()
    expect(screen.getByText('1 character')).toBeTruthy()
  })

  it('renders zero counts when engine has no initial word count', () => {
    const engine = createMockEngine()
    render(<StatusBar engine={engine} />)
    expect(screen.getByText('0 words')).toBeTruthy()
    expect(screen.getByText('0 characters')).toBeTruthy()
  })

  it('updates counts on wordcount:update event', () => {
    const engine = createMockEngine()
    render(<StatusBar engine={engine} />)
    expect(screen.getByText('0 words')).toBeTruthy()

    act(() => {
      engine.eventBus.emit('wordcount:update', { wordCount: 10, charCount: 50 })
    })

    expect(screen.getByText('10 words')).toBeTruthy()
    expect(screen.getByText('50 characters')).toBeTruthy()
  })

  it('renders save status when showSaveStatus is true', () => {
    const engine = createMockEngine()
    render(<StatusBar engine={engine} showSaveStatus={true} saveStatus="saved" />)
    expect(screen.getByTestId('save-status')).toBeTruthy()
    expect(screen.getByTestId('save-status').textContent).toBe('saved')
  })

  it('does not render save status when showSaveStatus is false', () => {
    const engine = createMockEngine()
    render(<StatusBar engine={engine} showSaveStatus={false} />)
    expect(screen.queryByTestId('save-status')).toBeNull()
  })

  it('adds top class when position is top', () => {
    const engine = createMockEngine()
    const { container } = render(<StatusBar engine={engine} position="top" />)
    expect(container.querySelector('.rmx-statusbar-top')).toBeTruthy()
  })

  it('shows Edited indicator when dirty and no save status', () => {
    const engine = createMockEngine()
    render(<StatusBar engine={engine} showSaveStatus={false} />)

    act(() => {
      engine.eventBus.emit('content:change')
    })

    expect(screen.getByText('Edited')).toBeTruthy()
  })

  it('clears dirty state on save event', () => {
    const engine = createMockEngine()
    render(<StatusBar engine={engine} showSaveStatus={false} />)

    act(() => {
      engine.eventBus.emit('content:change')
    })
    expect(screen.getByText('Edited')).toBeTruthy()

    act(() => {
      engine.eventBus.emit('save')
    })
    expect(screen.queryByText('Edited')).toBeNull()
  })

  it('clears dirty state on autosave:saved event', () => {
    const engine = createMockEngine()
    render(<StatusBar engine={engine} showSaveStatus={false} />)

    act(() => {
      engine.eventBus.emit('content:change')
    })
    expect(screen.getByText('Edited')).toBeTruthy()

    act(() => {
      engine.eventBus.emit('autosave:saved')
    })
    expect(screen.queryByText('Edited')).toBeNull()
  })

  it('does not show Edited when showSaveStatus is true', () => {
    const engine = createMockEngine()
    render(<StatusBar engine={engine} showSaveStatus={true} saveStatus="unsaved" />)

    act(() => {
      engine.eventBus.emit('content:change')
    })

    // Edited should not appear when save status is shown
    expect(screen.queryByText('Edited')).toBeNull()
  })
})

describe('WordCountButton', () => {
  it('renders the button with Word Count label', () => {
    const engine = createMockEngine()
    render(<WordCountButton engine={engine} />)
    expect(screen.getByRole('button', { name: 'Word Count' })).toBeTruthy()
  })

  it('opens popover on click', () => {
    const engine = createMockEngine({ wordCount: 5, charCount: 30 })
    render(<WordCountButton engine={engine} />)
    fireEvent.click(screen.getByRole('button', { name: 'Word Count' }))
    expect(screen.getByText('Words')).toBeTruthy()
    expect(screen.getByText('Characters')).toBeTruthy()
    expect(screen.getByText('5')).toBeTruthy()
    expect(screen.getByText('30')).toBeTruthy()
  })

  it('closes popover on second click', () => {
    const engine = createMockEngine()
    render(<WordCountButton engine={engine} />)
    const btn = screen.getByRole('button', { name: 'Word Count' })
    fireEvent.click(btn)
    expect(screen.getByText('Words')).toBeTruthy()
    fireEvent.click(btn)
    expect(screen.queryByText('Words')).toBeNull()
  })

  it('closes popover on outside click', () => {
    const engine = createMockEngine()
    render(
      <div>
        <WordCountButton engine={engine} />
        <div data-testid="outside">Outside</div>
      </div>
    )
    fireEvent.click(screen.getByRole('button', { name: 'Word Count' }))
    expect(screen.getByText('Words')).toBeTruthy()
    fireEvent.mouseDown(screen.getByTestId('outside'))
    expect(screen.queryByText('Words')).toBeNull()
  })

  it('updates counts on wordcount:update', () => {
    const engine = createMockEngine()
    render(<WordCountButton engine={engine} />)
    fireEvent.click(screen.getByRole('button', { name: 'Word Count' }))

    act(() => {
      engine.eventBus.emit('wordcount:update', { wordCount: 20, charCount: 100 })
    })

    expect(screen.getByText('20')).toBeTruthy()
    expect(screen.getByText('100')).toBeTruthy()
  })

  it('sets aria-expanded correctly', () => {
    const engine = createMockEngine()
    render(<WordCountButton engine={engine} />)
    const btn = screen.getByRole('button', { name: 'Word Count' })
    expect(btn.getAttribute('aria-expanded')).toBe('false')
    fireEvent.click(btn)
    expect(btn.getAttribute('aria-expanded')).toBe('true')
  })
})
