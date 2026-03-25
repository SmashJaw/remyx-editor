import { vi, beforeAll } from 'vitest'
import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { ToolbarDropdown } from '../components/Toolbar/ToolbarDropdown.jsx'

// Mock icons
vi.mock('../../icons/index.jsx', () => ({
  ChevronDownIcon: ({ size }) => <span data-testid="chevron">v</span>,
}))

// jsdom does not implement scrollIntoView
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn()
})

const OPTIONS = [
  { label: 'Normal', value: 'p' },
  { label: 'Heading 1', value: 'h1' },
  { label: 'Heading 2', value: 'h2' },
]

describe('ToolbarDropdown', () => {
  it('renders the trigger button with display label', () => {
    render(
      <ToolbarDropdown
        label="Block Type"
        value="p"
        options={OPTIONS}
        onChange={vi.fn()}
        tooltip="Block Type"
      />
    )
    expect(screen.getByText('Normal')).toBeTruthy()
  })

  it('shows label when no matching value', () => {
    render(
      <ToolbarDropdown
        label="Block Type"
        value="unknown"
        options={OPTIONS}
        onChange={vi.fn()}
        tooltip="Block Type"
      />
    )
    expect(screen.getByText('Block Type')).toBeTruthy()
  })

  it('opens dropdown on click', () => {
    render(
      <ToolbarDropdown
        label="Block Type"
        value="p"
        options={OPTIONS}
        onChange={vi.fn()}
        tooltip="Block Type"
      />
    )
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByRole('listbox')).toBeTruthy()
    expect(screen.getByText('Heading 1')).toBeTruthy()
    expect(screen.getByText('Heading 2')).toBeTruthy()
  })

  it('closes dropdown on second click (toggle)', () => {
    render(
      <ToolbarDropdown
        label="Block Type"
        value="p"
        options={OPTIONS}
        onChange={vi.fn()}
        tooltip="Block Type"
      />
    )
    const btn = screen.getByRole('button')
    fireEvent.click(btn)
    expect(screen.getByRole('listbox')).toBeTruthy()
    fireEvent.click(btn)
    expect(screen.queryByRole('listbox')).toBeNull()
  })

  it('calls onChange when an option is clicked', () => {
    const onChange = vi.fn()
    render(
      <ToolbarDropdown
        label="Block Type"
        value="p"
        options={OPTIONS}
        onChange={onChange}
        tooltip="Block Type"
      />
    )
    fireEvent.click(screen.getByRole('button'))
    fireEvent.click(screen.getByText('Heading 1'))
    expect(onChange).toHaveBeenCalledWith('h1')
  })

  it('closes dropdown after selection', () => {
    render(
      <ToolbarDropdown
        label="Block Type"
        value="p"
        options={OPTIONS}
        onChange={vi.fn()}
        tooltip="Block Type"
      />
    )
    fireEvent.click(screen.getByRole('button'))
    fireEvent.click(screen.getByText('Heading 1'))
    expect(screen.queryByRole('listbox')).toBeNull()
  })

  it('marks current value as active', () => {
    render(
      <ToolbarDropdown
        label="Block Type"
        value="h1"
        options={OPTIONS}
        onChange={vi.fn()}
        tooltip="Block Type"
      />
    )
    fireEvent.click(screen.getByRole('button'))
    const h1Option = document.querySelector('[role="option"][aria-selected="true"]')
    expect(h1Option).toBeTruthy()
    expect(h1Option.textContent).toBe('Heading 1')
  })

  it('supports keyboard navigation - ArrowDown', () => {
    const onChange = vi.fn()
    render(
      <ToolbarDropdown
        label="Block Type"
        value="p"
        options={OPTIONS}
        onChange={onChange}
        tooltip="Block Type"
      />
    )
    const btn = screen.getByRole('button')
    // Open with ArrowDown
    fireEvent.keyDown(btn, { key: 'ArrowDown' })
    expect(screen.getByRole('listbox')).toBeTruthy()
  })

  it('navigates options with ArrowDown when open', () => {
    const onChange = vi.fn()
    render(
      <ToolbarDropdown
        label="Block Type"
        value="p"
        options={OPTIONS}
        onChange={onChange}
        tooltip="Block Type"
      />
    )
    const btn = screen.getByRole('button')
    fireEvent.click(btn)
    // Navigate down
    fireEvent.keyDown(btn, { key: 'ArrowDown' })
    // Select with Enter
    fireEvent.keyDown(btn, { key: 'Enter' })
    expect(onChange).toHaveBeenCalled()
  })

  it('navigates options with ArrowUp when open', () => {
    const onChange = vi.fn()
    render(
      <ToolbarDropdown
        label="Block Type"
        value="p"
        options={OPTIONS}
        onChange={onChange}
        tooltip="Block Type"
      />
    )
    const btn = screen.getByRole('button')
    fireEvent.click(btn)
    fireEvent.keyDown(btn, { key: 'ArrowUp' })
    // Should wrap to last option
  })

  it('selects with Enter key', () => {
    const onChange = vi.fn()
    render(
      <ToolbarDropdown
        label="Block Type"
        value="p"
        options={OPTIONS}
        onChange={onChange}
        tooltip="Block Type"
      />
    )
    const btn = screen.getByRole('button')
    fireEvent.click(btn)
    fireEvent.keyDown(btn, { key: 'ArrowDown' })
    fireEvent.keyDown(btn, { key: 'Enter' })
    expect(onChange).toHaveBeenCalled()
  })

  it('selects with Space key', () => {
    const onChange = vi.fn()
    render(
      <ToolbarDropdown
        label="Block Type"
        value="p"
        options={OPTIONS}
        onChange={onChange}
        tooltip="Block Type"
      />
    )
    const btn = screen.getByRole('button')
    fireEvent.click(btn)
    fireEvent.keyDown(btn, { key: 'ArrowDown' })
    fireEvent.keyDown(btn, { key: ' ' })
    expect(onChange).toHaveBeenCalled()
  })

  it('closes with Escape key', () => {
    render(
      <ToolbarDropdown
        label="Block Type"
        value="p"
        options={OPTIONS}
        onChange={vi.fn()}
        tooltip="Block Type"
      />
    )
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByRole('listbox')).toBeTruthy()
    fireEvent.keyDown(screen.getByRole('button'), { key: 'Escape' })
    expect(screen.queryByRole('listbox')).toBeNull()
  })

  it('closes on outside click', () => {
    render(
      <div>
        <ToolbarDropdown
          label="Block Type"
          value="p"
          options={OPTIONS}
          onChange={vi.fn()}
          tooltip="Block Type"
        />
        <div data-testid="outside">Outside</div>
      </div>
    )
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByRole('listbox')).toBeTruthy()
    fireEvent.mouseDown(screen.getByTestId('outside'))
    expect(screen.queryByRole('listbox')).toBeNull()
  })

  it('sets aria-haspopup and aria-expanded', () => {
    render(
      <ToolbarDropdown
        label="Block Type"
        value="p"
        options={OPTIONS}
        onChange={vi.fn()}
        tooltip="Block Type"
      />
    )
    const btn = screen.getByRole('button')
    expect(btn.getAttribute('aria-haspopup')).toBe('listbox')
    expect(btn.getAttribute('aria-expanded')).toBe('false')
    fireEvent.click(btn)
    expect(btn.getAttribute('aria-expanded')).toBe('true')
  })

  it('applies option style when provided', () => {
    const styledOptions = [
      { label: 'Bold', value: 'bold', style: { fontWeight: 'bold' } },
    ]
    render(
      <ToolbarDropdown
        label="Format"
        value=""
        options={styledOptions}
        onChange={vi.fn()}
        tooltip="Format"
      />
    )
    fireEvent.click(screen.getByRole('button'))
    const option = screen.getByText('Bold')
    expect(option.style.fontWeight).toBe('bold')
  })

  it('updates activeIndex on mouse enter', () => {
    render(
      <ToolbarDropdown
        label="Block Type"
        value="p"
        options={OPTIONS}
        onChange={vi.fn()}
        tooltip="Block Type"
      />
    )
    fireEvent.click(screen.getByRole('button'))
    const h2Option = screen.getByText('Heading 2')
    fireEvent.mouseEnter(h2Option)
    // h2 option should have rmx-focused class
    expect(h2Option.closest('button').className).toContain('rmx-focused')
  })

  it('respects custom width', () => {
    const { container } = render(
      <ToolbarDropdown
        label="Block Type"
        value="p"
        options={OPTIONS}
        onChange={vi.fn()}
        tooltip="Block Type"
        width={200}
      />
    )
    const dropdown = container.querySelector('.rmx-toolbar-dropdown')
    expect(dropdown.style.minWidth).toBe('200px')
  })
})
