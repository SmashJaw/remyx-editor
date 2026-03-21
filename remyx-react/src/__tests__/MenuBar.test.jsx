import { vi, beforeAll } from 'vitest'
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { SelectionContext } from '../config/SelectionContext.js'

// jsdom does not implement scrollIntoView
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn()
})

// Mock MenuItem
vi.mock('../components/MenuBar/MenuItem.jsx', () => ({
  MenuItem: ({ item, onClose }) => {
    if (typeof item === 'string' && item === '---') {
      return <div role="separator" />
    }
    const label = typeof item === 'string' ? item : item.label || item.command
    return (
      <button role="menuitem" onClick={onClose}>
        {label}
      </button>
    )
  },
}))

// Mock collectMenuBarCommands
vi.mock('../components/MenuBar/collectMenuBarCommands.js', () => ({
  collectMenuBarCommands: vi.fn(() => new Set()),
}))

import { MenuBar } from '../components/MenuBar/MenuBar.jsx'

const defaultFormatState = {
  bold: false,
  italic: false,
}

function renderWithContext(ui, formatState = defaultFormatState) {
  return render(
    <SelectionContext.Provider value={formatState}>
      {ui}
    </SelectionContext.Provider>
  )
}

const mockConfig = [
  { label: 'Edit', items: ['undo', 'redo'] },
  { label: 'Format', items: ['bold', 'italic'] },
  { label: 'Insert', items: ['link', 'image'] },
]

function createMockEngine() {
  return {
    executeCommand: vi.fn(),
    commands: { has: vi.fn(() => true) },
  }
}

describe('MenuBar', () => {
  it('renders nothing when engine is null', () => {
    const { container } = renderWithContext(
      <MenuBar config={mockConfig} engine={null} />
    )
    expect(container.innerHTML).toBe('')
  })

  it('renders nothing when config is null', () => {
    const { container } = renderWithContext(
      <MenuBar config={null} engine={createMockEngine()} />
    )
    expect(container.innerHTML).toBe('')
  })

  it('renders menu bar with correct role', () => {
    renderWithContext(
      <MenuBar config={mockConfig} engine={createMockEngine()} />
    )
    expect(screen.getByRole('menubar', { name: 'Editor menu' })).toBeTruthy()
  })

  it('renders all menu triggers', () => {
    renderWithContext(
      <MenuBar config={mockConfig} engine={createMockEngine()} />
    )
    expect(screen.getByText('Edit')).toBeTruthy()
    expect(screen.getByText('Format')).toBeTruthy()
    expect(screen.getByText('Insert')).toBeTruthy()
  })

  it('opens menu on click', () => {
    renderWithContext(
      <MenuBar config={mockConfig} engine={createMockEngine()} onOpenModal={vi.fn()} />
    )
    fireEvent.click(screen.getByText('Edit'))
    // Menu items should appear
    expect(screen.getByText('undo')).toBeTruthy()
    expect(screen.getByText('redo')).toBeTruthy()
  })

  it('closes menu on second click', () => {
    renderWithContext(
      <MenuBar config={mockConfig} engine={createMockEngine()} onOpenModal={vi.fn()} />
    )
    fireEvent.click(screen.getByText('Edit'))
    expect(screen.getByText('undo')).toBeTruthy()
    fireEvent.click(screen.getByText('Edit'))
    expect(screen.queryByText('undo')).toBeNull()
  })

  it('switches menus on hover when a menu is open', () => {
    renderWithContext(
      <MenuBar config={mockConfig} engine={createMockEngine()} onOpenModal={vi.fn()} />
    )
    fireEvent.click(screen.getByText('Edit'))
    expect(screen.getByText('undo')).toBeTruthy()

    // Hover over Format trigger
    fireEvent.mouseEnter(screen.getByText('Format'))
    expect(screen.getByText('bold')).toBeTruthy()
    expect(screen.queryByText('undo')).toBeNull()
  })

  it('does not switch menus on hover when no menu is open', () => {
    renderWithContext(
      <MenuBar config={mockConfig} engine={createMockEngine()} onOpenModal={vi.fn()} />
    )
    fireEvent.mouseEnter(screen.getByText('Format'))
    expect(screen.queryByText('bold')).toBeNull()
  })

  it('closes on outside click', () => {
    renderWithContext(
      <div>
        <MenuBar config={mockConfig} engine={createMockEngine()} onOpenModal={vi.fn()} />
        <div data-testid="outside">Outside</div>
      </div>
    )
    fireEvent.click(screen.getByText('Edit'))
    expect(screen.getByText('undo')).toBeTruthy()
    fireEvent.mouseDown(screen.getByTestId('outside'))
    expect(screen.queryByText('undo')).toBeNull()
  })

  it('closes on Escape', () => {
    renderWithContext(
      <MenuBar config={mockConfig} engine={createMockEngine()} onOpenModal={vi.fn()} />
    )
    fireEvent.click(screen.getByText('Edit'))
    expect(screen.getByText('undo')).toBeTruthy()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByText('undo')).toBeNull()
  })

  it('sets aria-expanded on trigger', () => {
    renderWithContext(
      <MenuBar config={mockConfig} engine={createMockEngine()} onOpenModal={vi.fn()} />
    )
    const editBtn = screen.getByText('Edit')
    expect(editBtn.getAttribute('aria-expanded')).toBe('false')
    fireEvent.click(editBtn)
    expect(editBtn.getAttribute('aria-expanded')).toBe('true')
  })

  it('sets aria-haspopup on triggers', () => {
    renderWithContext(
      <MenuBar config={mockConfig} engine={createMockEngine()} onOpenModal={vi.fn()} />
    )
    const editBtn = screen.getByText('Edit')
    expect(editBtn.getAttribute('aria-haspopup')).toBe('true')
  })

  it('navigates triggers with ArrowRight', () => {
    renderWithContext(
      <MenuBar config={mockConfig} engine={createMockEngine()} onOpenModal={vi.fn()} />
    )
    const bar = screen.getByRole('menubar')
    const editBtn = screen.getByText('Edit')
    editBtn.focus()
    fireEvent.keyDown(bar, { key: 'ArrowRight' })
    // Focus should move to Format
    expect(document.activeElement.textContent).toBe('Format')
  })

  it('navigates triggers with ArrowLeft', () => {
    renderWithContext(
      <MenuBar config={mockConfig} engine={createMockEngine()} onOpenModal={vi.fn()} />
    )
    const bar = screen.getByRole('menubar')
    const formatBtn = screen.getByText('Format')
    formatBtn.focus()
    fireEvent.keyDown(bar, { key: 'ArrowLeft' })
    expect(document.activeElement.textContent).toBe('Edit')
  })

  it('opens menu with ArrowDown when focused', () => {
    renderWithContext(
      <MenuBar config={mockConfig} engine={createMockEngine()} onOpenModal={vi.fn()} />
    )
    const bar = screen.getByRole('menubar')
    const editBtn = screen.getByText('Edit')
    editBtn.focus()
    fireEvent.keyDown(bar, { key: 'ArrowDown' })
    // Menu should open
    expect(screen.getByText('undo')).toBeTruthy()
  })

  it('Home key moves focus to first trigger', () => {
    renderWithContext(
      <MenuBar config={mockConfig} engine={createMockEngine()} onOpenModal={vi.fn()} />
    )
    const bar = screen.getByRole('menubar')
    screen.getByText('Insert').focus()
    fireEvent.keyDown(bar, { key: 'Home' })
    expect(document.activeElement.textContent).toBe('Edit')
  })

  it('End key moves focus to last trigger', () => {
    renderWithContext(
      <MenuBar config={mockConfig} engine={createMockEngine()} onOpenModal={vi.fn()} />
    )
    const bar = screen.getByRole('menubar')
    screen.getByText('Edit').focus()
    fireEvent.keyDown(bar, { key: 'End' })
    expect(document.activeElement.textContent).toBe('Insert')
  })

  it('first trigger has tabIndex 0, others have -1', () => {
    renderWithContext(
      <MenuBar config={mockConfig} engine={createMockEngine()} onOpenModal={vi.fn()} />
    )
    expect(screen.getByText('Edit').getAttribute('tabindex')).toBe('0')
    expect(screen.getByText('Format').getAttribute('tabindex')).toBe('-1')
    expect(screen.getByText('Insert').getAttribute('tabindex')).toBe('-1')
  })
})
