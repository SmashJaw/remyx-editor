import { vi } from 'vitest'
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { EmptyState } from '../components/EmptyState/EmptyState.jsx'

describe('EmptyState', () => {
  it('renders default illustration when custom is true', () => {
    render(<EmptyState custom={true} onClick={vi.fn()} />)
    expect(screen.getByText('Start typing...')).toBeTruthy()
    expect(screen.getByText('or paste content, drag a file, or use the toolbar above')).toBeTruthy()
  })

  it('renders default icon SVG', () => {
    const { container } = render(<EmptyState custom={true} onClick={vi.fn()} />)
    expect(container.querySelector('.rmx-empty-state-icon svg')).toBeTruthy()
  })

  it('renders custom content when custom is a React node', () => {
    render(
      <EmptyState custom={<p>Custom empty state</p>} onClick={vi.fn()} />
    )
    expect(screen.getByText('Custom empty state')).toBeTruthy()
    expect(screen.queryByText('Start typing...')).toBeNull()
  })

  it('calls onClick when clicked', () => {
    const onClick = vi.fn()
    render(<EmptyState custom={true} onClick={onClick} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('calls onClick when custom content area is clicked', () => {
    const onClick = vi.fn()
    render(
      <EmptyState custom={<span>Custom</span>} onClick={onClick} />
    )
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('has the rmx-empty-state class', () => {
    const { container } = render(<EmptyState custom={true} onClick={vi.fn()} />)
    expect(container.querySelector('.rmx-empty-state')).toBeTruthy()
  })

  it('has role="button" and tabIndex=0 for keyboard accessibility', () => {
    render(<EmptyState custom={true} onClick={vi.fn()} />)
    const el = screen.getByRole('button')
    expect(el.getAttribute('tabindex')).toBe('0')
  })
})
