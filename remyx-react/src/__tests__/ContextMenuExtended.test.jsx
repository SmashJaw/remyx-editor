import { vi, beforeAll } from 'vitest'
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { ContextMenu } from '../components/ContextMenu/ContextMenu.jsx'

// jsdom does not implement scrollIntoView
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn()
})

describe('ContextMenu (extended)', () => {
  it('renders nothing when not visible', () => {
    const { container } = render(
      <ContextMenu
        contextMenu={{ visible: false, x: 0, y: 0, items: [] }}
        onHide={vi.fn()}
      />
    )
    expect(container.innerHTML).toBe('')
  })

  it('renders with correct position', () => {
    render(
      <ContextMenu
        contextMenu={{ visible: true, x: 150, y: 250, items: [{ label: 'Cut', command: vi.fn() }] }}
        onHide={vi.fn()}
      />
    )
    const menu = document.querySelector('.rmx-context-menu')
    expect(menu.style.top).toBe('250px')
    expect(menu.style.left).toBe('150px')
  })

  it('has role="menu"', () => {
    render(
      <ContextMenu
        contextMenu={{ visible: true, x: 0, y: 0, items: [{ label: 'Cut', command: vi.fn() }] }}
        onHide={vi.fn()}
      />
    )
    expect(screen.getByRole('menu')).toBeTruthy()
  })

  it('keyboard ArrowDown navigates to next item', () => {
    const items = [
      { label: 'Cut', command: vi.fn() },
      { label: 'Copy', command: vi.fn() },
      { label: 'Paste', command: vi.fn() },
    ]
    render(
      <ContextMenu
        contextMenu={{ visible: true, x: 0, y: 0, items }}
        onHide={vi.fn()}
      />
    )
    const menu = screen.getByRole('menu')
    fireEvent.keyDown(menu, { key: 'ArrowDown' })
    // First item should be focused
    const firstItem = screen.getByText('Cut')
    expect(firstItem.closest('.rmx-context-menu-item').className).toContain('rmx-focused')
  })

  it('keyboard ArrowUp navigates to previous item', () => {
    const items = [
      { label: 'Cut', command: vi.fn() },
      { label: 'Copy', command: vi.fn() },
    ]
    render(
      <ContextMenu
        contextMenu={{ visible: true, x: 0, y: 0, items }}
        onHide={vi.fn()}
      />
    )
    const menu = screen.getByRole('menu')
    // Arrow up should wrap to last item
    fireEvent.keyDown(menu, { key: 'ArrowUp' })
    const lastItem = screen.getByText('Copy')
    expect(lastItem.closest('.rmx-context-menu-item').className).toContain('rmx-focused')
  })

  it('keyboard Escape calls onHide', () => {
    const onHide = vi.fn()
    render(
      <ContextMenu
        contextMenu={{ visible: true, x: 0, y: 0, items: [{ label: 'Cut', command: vi.fn() }] }}
        onHide={onHide}
      />
    )
    fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' })
    expect(onHide).toHaveBeenCalled()
  })

  it('keyboard Tab calls onHide', () => {
    const onHide = vi.fn()
    render(
      <ContextMenu
        contextMenu={{ visible: true, x: 0, y: 0, items: [{ label: 'Cut', command: vi.fn() }] }}
        onHide={onHide}
      />
    )
    fireEvent.keyDown(screen.getByRole('menu'), { key: 'Tab' })
    expect(onHide).toHaveBeenCalled()
  })

  it('keyboard Enter executes focused item', () => {
    const command = vi.fn()
    const onHide = vi.fn()
    render(
      <ContextMenu
        contextMenu={{ visible: true, x: 0, y: 0, items: [{ label: 'Cut', command }] }}
        onHide={onHide}
      />
    )
    const menu = screen.getByRole('menu')
    fireEvent.keyDown(menu, { key: 'ArrowDown' })
    fireEvent.keyDown(menu, { key: 'Enter' })
    expect(command).toHaveBeenCalled()
    expect(onHide).toHaveBeenCalled()
  })

  it('keyboard Home goes to first item', () => {
    const items = [
      { label: 'Cut', command: vi.fn() },
      { label: 'Copy', command: vi.fn() },
      { label: 'Paste', command: vi.fn() },
    ]
    render(
      <ContextMenu
        contextMenu={{ visible: true, x: 0, y: 0, items }}
        onHide={vi.fn()}
      />
    )
    const menu = screen.getByRole('menu')
    fireEvent.keyDown(menu, { key: 'Home' })
    expect(screen.getByText('Cut').closest('.rmx-context-menu-item').className).toContain('rmx-focused')
  })

  it('keyboard End goes to last item', () => {
    const items = [
      { label: 'Cut', command: vi.fn() },
      { label: 'Copy', command: vi.fn() },
      { label: 'Paste', command: vi.fn() },
    ]
    render(
      <ContextMenu
        contextMenu={{ visible: true, x: 0, y: 0, items }}
        onHide={vi.fn()}
      />
    )
    const menu = screen.getByRole('menu')
    fireEvent.keyDown(menu, { key: 'End' })
    expect(screen.getByText('Paste').closest('.rmx-context-menu-item').className).toContain('rmx-focused')
  })

  it('skips separators in keyboard navigation', () => {
    const items = [
      { label: 'Cut', command: vi.fn() },
      { separator: true },
      { label: 'Paste', command: vi.fn() },
    ]
    render(
      <ContextMenu
        contextMenu={{ visible: true, x: 0, y: 0, items }}
        onHide={vi.fn()}
      />
    )
    const menu = screen.getByRole('menu')
    fireEvent.keyDown(menu, { key: 'ArrowDown' })
    fireEvent.keyDown(menu, { key: 'ArrowDown' })
    // Should skip separator and go to Paste
    expect(screen.getByText('Paste').closest('.rmx-context-menu-item').className).toContain('rmx-focused')
  })

  it('mouseEnter sets focused index', () => {
    const items = [
      { label: 'Cut', command: vi.fn() },
      { label: 'Copy', command: vi.fn() },
    ]
    render(
      <ContextMenu
        contextMenu={{ visible: true, x: 0, y: 0, items }}
        onHide={vi.fn()}
      />
    )
    fireEvent.mouseEnter(screen.getByText('Copy'))
    expect(screen.getByText('Copy').closest('.rmx-context-menu-item').className).toContain('rmx-focused')
  })

  it('handles editLinkModal command', () => {
    const onOpenModal = vi.fn()
    const onHide = vi.fn()
    const items = [
      {
        label: 'Edit Link',
        command: 'editLinkModal',
        data: { href: 'https://test.com', textContent: 'Test', target: '_blank' },
      },
    ]
    render(
      <ContextMenu
        contextMenu={{ visible: true, x: 0, y: 0, items }}
        onHide={onHide}
        onOpenModal={onOpenModal}
      />
    )
    fireEvent.click(screen.getByText('Edit Link'))
    expect(onOpenModal).toHaveBeenCalledWith('link', expect.objectContaining({
      href: 'https://test.com',
    }))
    expect(onHide).toHaveBeenCalled()
  })

  it('handles command function errors gracefully', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const command = vi.fn(() => { throw new Error('Command error') })
    render(
      <ContextMenu
        contextMenu={{ visible: true, x: 0, y: 0, items: [{ label: 'Bad', command }] }}
        onHide={vi.fn()}
      />
    )
    fireEvent.click(screen.getByText('Bad'))
    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })
})
