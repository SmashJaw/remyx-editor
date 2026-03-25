import { vi } from 'vitest'
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { ToolbarButton } from '../components/Toolbar/ToolbarButton.jsx'

// Mock Tooltip to pass through children
vi.mock('../components/Tooltip/Tooltip.jsx', () => ({
  Tooltip: ({ text, shortcut, children }) => (
    <span data-tooltip={text} data-shortcut={shortcut}>{children}</span>
  ),
}))

describe('ToolbarButton', () => {
  it('renders a button with the correct aria-label', () => {
    render(<ToolbarButton command="bold" tooltip="Bold" />)
    const btn = screen.getByRole('button', { name: 'Bold' })
    expect(btn).toBeTruthy()
  })

  it('renders an icon for known commands (bold)', () => {
    const { container } = render(<ToolbarButton command="bold" tooltip="Bold" />)
    // Bold icon renders an SVG
    expect(container.querySelector('svg')).toBeTruthy()
  })

  it('renders command text when no icon is available', () => {
    render(<ToolbarButton command="unknownCmd" tooltip="Unknown" />)
    expect(screen.getByRole('button').textContent).toContain('unknownCmd')
  })

  it('renders children instead of icon when children are provided', () => {
    render(
      <ToolbarButton command="bold" tooltip="Bold">
        <span data-testid="custom-child">Custom</span>
      </ToolbarButton>
    )
    expect(screen.getByTestId('custom-child')).toBeTruthy()
  })

  it('applies rmx-active class when active', () => {
    render(<ToolbarButton command="bold" tooltip="Bold" active={true} />)
    const btn = screen.getByRole('button')
    expect(btn.className).toContain('rmx-active')
  })

  it('does not apply rmx-active class when not active', () => {
    render(<ToolbarButton command="bold" tooltip="Bold" active={false} />)
    const btn = screen.getByRole('button')
    expect(btn.className).not.toContain('rmx-active')
  })

  it('applies rmx-disabled class and disabled attribute when disabled', () => {
    render(<ToolbarButton command="bold" tooltip="Bold" disabled={true} />)
    const btn = screen.getByRole('button')
    expect(btn.className).toContain('rmx-disabled')
    expect(btn.disabled).toBe(true)
  })

  it('sets aria-pressed based on active prop', () => {
    const { rerender } = render(
      <ToolbarButton command="bold" tooltip="Bold" active={true} />
    )
    expect(screen.getByRole('button').getAttribute('aria-pressed')).toBe('true')

    rerender(<ToolbarButton command="bold" tooltip="Bold" active={false} />)
    expect(screen.getByRole('button').getAttribute('aria-pressed')).toBe('false')
  })

  it('calls onClick when clicked and not disabled', () => {
    const onClick = vi.fn()
    render(<ToolbarButton command="bold" tooltip="Bold" onClick={onClick} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('does not call onClick when clicked and disabled', () => {
    const onClick = vi.fn()
    render(<ToolbarButton command="bold" tooltip="Bold" onClick={onClick} disabled={true} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('applies custom itemStyle to the button', () => {
    render(
      <ToolbarButton
        command="bold"
        tooltip="Bold"
        itemStyle={{ color: 'red', fontSize: 14 }}
      />
    )
    const btn = screen.getByRole('button')
    expect(btn.style.color).toBe('red')
  })

  it('has type="button" attribute', () => {
    render(<ToolbarButton command="bold" tooltip="Bold" />)
    expect(screen.getByRole('button').getAttribute('type')).toBe('button')
  })

  it('has rmx-toolbar-btn class', () => {
    render(<ToolbarButton command="bold" tooltip="Bold" />)
    expect(screen.getByRole('button').className).toContain('rmx-toolbar-btn')
  })
})
