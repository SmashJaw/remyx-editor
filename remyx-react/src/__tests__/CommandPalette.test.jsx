import { vi, beforeAll } from 'vitest'
import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'

// jsdom does not implement scrollIntoView
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn()
  // Mock requestAnimationFrame
  global.requestAnimationFrame = vi.fn((cb) => { cb(); return 1 })
})

// Mock @remyxjs/core
vi.mock('@remyxjs/core', () => ({
  SLASH_COMMAND_ITEMS: [
    { id: 'bold', label: 'Bold', description: 'Bold text', category: 'Formatting', icon: 'B', keywords: ['bold'], action: vi.fn() },
    { id: 'italic', label: 'Italic', description: 'Italic text', category: 'Formatting', icon: 'I', keywords: ['italic'], action: vi.fn() },
    { id: 'heading1', label: 'Heading 1', description: 'Large heading', category: 'Blocks', icon: 'H1', keywords: ['heading', 'h1'], action: vi.fn() },
  ],
  filterSlashItems: vi.fn((items, query) => {
    if (!query) return items
    return items.filter(i =>
      i.label.toLowerCase().includes(query.toLowerCase()) ||
      i.keywords.some(k => k.includes(query.toLowerCase()))
    )
  }),
  recordRecentCommand: vi.fn(),
  getCustomCommandItems: vi.fn(() => []),
  TOOLTIP_MAP: { bold: 'Bold', italic: 'Italic' },
  SHORTCUT_MAP: { bold: 'mod+b' },
  MODAL_COMMANDS: {},
  getShortcutLabel: vi.fn((cmd) => cmd === 'bold' ? 'Ctrl+B' : ''),
}))

// Manually import after mock
import { CommandPalette } from '../components/CommandPalette/CommandPalette.jsx'

function createMockEngine() {
  return {
    commands: {
      getAll: vi.fn(() => []),
    },
    executeCommand: vi.fn(),
  }
}

describe('CommandPalette', () => {
  it('renders nothing when not open', () => {
    const { container } = render(
      <CommandPalette open={false} onClose={vi.fn()} engine={createMockEngine()} />
    )
    expect(container.innerHTML).toBe('')
  })

  it('renders dialog when open', () => {
    render(
      <CommandPalette open={true} onClose={vi.fn()} engine={createMockEngine()} />
    )
    expect(screen.getByRole('dialog', { name: 'Command palette' })).toBeTruthy()
  })

  it('renders search input', () => {
    render(
      <CommandPalette open={true} onClose={vi.fn()} engine={createMockEngine()} />
    )
    expect(screen.getByPlaceholderText('Type a command...')).toBeTruthy()
  })

  it('renders all items when no query', () => {
    render(
      <CommandPalette open={true} onClose={vi.fn()} engine={createMockEngine()} />
    )
    expect(screen.getByText('Bold')).toBeTruthy()
    expect(screen.getByText('Italic')).toBeTruthy()
    expect(screen.getByText('Heading 1')).toBeTruthy()
  })

  it('renders category headers', () => {
    render(
      <CommandPalette open={true} onClose={vi.fn()} engine={createMockEngine()} />
    )
    expect(screen.getByText('Formatting')).toBeTruthy()
    expect(screen.getByText('Blocks')).toBeTruthy()
  })

  it('filters items based on query', () => {
    render(
      <CommandPalette open={true} onClose={vi.fn()} engine={createMockEngine()} />
    )
    const input = screen.getByPlaceholderText('Type a command...')
    fireEvent.change(input, { target: { value: 'bold' } })

    expect(screen.getByText('Bold')).toBeTruthy()
    expect(screen.queryByText('Heading 1')).toBeNull()
  })

  it('shows "No matching commands" when no results', () => {
    render(
      <CommandPalette open={true} onClose={vi.fn()} engine={createMockEngine()} />
    )
    const input = screen.getByPlaceholderText('Type a command...')
    fireEvent.change(input, { target: { value: 'zzzzzzzzz' } })
    expect(screen.getByText('No matching commands')).toBeTruthy()
  })

  it('closes on Escape', () => {
    const onClose = vi.fn()
    render(
      <CommandPalette open={true} onClose={onClose} engine={createMockEngine()} />
    )
    const input = screen.getByPlaceholderText('Type a command...')
    fireEvent.keyDown(input, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('closes on overlay click', () => {
    const onClose = vi.fn()
    render(
      <CommandPalette open={true} onClose={onClose} engine={createMockEngine()} />
    )
    const overlay = document.querySelector('.rmx-command-palette-overlay')
    fireEvent.mouseDown(overlay, { target: overlay })
    expect(onClose).toHaveBeenCalled()
  })

  it('navigates with ArrowDown', () => {
    render(
      <CommandPalette open={true} onClose={vi.fn()} engine={createMockEngine()} />
    )
    const input = screen.getByPlaceholderText('Type a command...')
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    // Second item should become active
    const items = document.querySelectorAll('.rmx-command-palette-item')
    expect(items[1].className).toContain('rmx-active')
  })

  it('navigates with ArrowUp', () => {
    render(
      <CommandPalette open={true} onClose={vi.fn()} engine={createMockEngine()} />
    )
    const input = screen.getByPlaceholderText('Type a command...')
    // Arrow up from 0 should wrap to last
    fireEvent.keyDown(input, { key: 'ArrowUp' })
    const items = document.querySelectorAll('.rmx-command-palette-item')
    expect(items[items.length - 1].className).toContain('rmx-active')
  })

  it('executes item on Enter', () => {
    const onClose = vi.fn()
    render(
      <CommandPalette open={true} onClose={onClose} engine={createMockEngine()} />
    )
    const input = screen.getByPlaceholderText('Type a command...')
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onClose).toHaveBeenCalled()
  })

  it('executes item on click', () => {
    const onClose = vi.fn()
    render(
      <CommandPalette open={true} onClose={onClose} engine={createMockEngine()} />
    )
    fireEvent.click(screen.getByText('Bold'))
    expect(onClose).toHaveBeenCalled()
  })

  it('updates selectedIndex on mouseEnter', () => {
    render(
      <CommandPalette open={true} onClose={vi.fn()} engine={createMockEngine()} />
    )
    const italicItem = screen.getByText('Italic').closest('.rmx-command-palette-item')
    fireEvent.mouseEnter(italicItem)
    expect(italicItem.className).toContain('rmx-active')
  })

  it('renders keyboard navigation hints', () => {
    render(
      <CommandPalette open={true} onClose={vi.fn()} engine={createMockEngine()} />
    )
    expect(screen.getByText('navigate')).toBeTruthy()
    expect(screen.getByText('select')).toBeTruthy()
    expect(screen.getByText('close')).toBeTruthy()
  })

  it('traps Tab key focus', () => {
    render(
      <CommandPalette open={true} onClose={vi.fn()} engine={createMockEngine()} />
    )
    const overlay = document.querySelector('.rmx-command-palette-overlay')
    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true })
    const preventSpy = vi.spyOn(event, 'preventDefault')
    overlay.dispatchEvent(event)
    expect(preventSpy).toHaveBeenCalled()
  })

  it('renders shortcut labels', () => {
    render(
      <CommandPalette open={true} onClose={vi.fn()} engine={createMockEngine()} />
    )
    // Bold has a shortcut label
    const shortcut = document.querySelector('.rmx-command-palette-shortcut')
    expect(shortcut).toBeTruthy()
  })

  it('has combobox role on input', () => {
    render(
      <CommandPalette open={true} onClose={vi.fn()} engine={createMockEngine()} />
    )
    const input = screen.getByRole('combobox')
    expect(input.getAttribute('aria-expanded')).toBe('true')
    expect(input.getAttribute('aria-autocomplete')).toBe('list')
  })
})
