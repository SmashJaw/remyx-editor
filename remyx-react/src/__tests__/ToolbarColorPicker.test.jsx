import { vi } from 'vitest'
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { ToolbarColorPicker } from '../components/Toolbar/ToolbarColorPicker.jsx'

// Mock @remyxjs/core color functions
vi.mock('@remyxjs/core', () => ({
  DEFAULT_COLORS: ['#000000', '#ff0000', '#00ff00', '#0000ff', '#ffffff'],
  loadColorPresets: vi.fn(() => []),
  saveColorPreset: vi.fn(),
}))

describe('ToolbarColorPicker', () => {
  it('renders the trigger button with tooltip', () => {
    render(
      <ToolbarColorPicker
        command="foreColor"
        tooltip="Text Color"
        currentColor="#000000"
        onColorSelect={vi.fn()}
      />
    )
    const btn = screen.getByRole('button', { name: 'Text Color' })
    expect(btn).toBeTruthy()
  })

  it('opens color palette on click', () => {
    render(
      <ToolbarColorPicker
        command="foreColor"
        tooltip="Text Color"
        currentColor="#000000"
        onColorSelect={vi.fn()}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Text Color' }))
    expect(screen.getByText('Default')).toBeTruthy()
    expect(screen.getByRole('grid')).toBeTruthy()
  })

  it('closes palette on toggle click', () => {
    render(
      <ToolbarColorPicker
        command="foreColor"
        tooltip="Text Color"
        currentColor="#000000"
        onColorSelect={vi.fn()}
      />
    )
    const btn = screen.getByRole('button', { name: 'Text Color' })
    fireEvent.click(btn)
    expect(screen.getByRole('grid')).toBeTruthy()
    fireEvent.click(btn)
    expect(screen.queryByRole('grid')).toBeNull()
  })

  it('calls onColorSelect when a swatch is clicked', () => {
    const onColorSelect = vi.fn()
    render(
      <ToolbarColorPicker
        command="foreColor"
        tooltip="Text Color"
        currentColor="#000000"
        onColorSelect={onColorSelect}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Text Color' }))
    // Click the red swatch
    const redSwatch = screen.getByLabelText('Color Red')
    fireEvent.click(redSwatch)
    expect(onColorSelect).toHaveBeenCalledWith('#ff0000')
  })

  it('closes palette after swatch selection', () => {
    render(
      <ToolbarColorPicker
        command="foreColor"
        tooltip="Text Color"
        currentColor="#000000"
        onColorSelect={vi.fn()}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Text Color' }))
    fireEvent.click(screen.getByLabelText('Color Red'))
    expect(screen.queryByRole('grid')).toBeNull()
  })

  it('marks current color as active', () => {
    render(
      <ToolbarColorPicker
        command="foreColor"
        tooltip="Text Color"
        currentColor="#ff0000"
        onColorSelect={vi.fn()}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Text Color' }))
    const redSwatch = screen.getByLabelText('Color Red')
    expect(redSwatch.className).toContain('rmx-active')
  })

  it('Default button calls onColorSelect with empty string', () => {
    const onColorSelect = vi.fn()
    render(
      <ToolbarColorPicker
        command="foreColor"
        tooltip="Text Color"
        currentColor="#ff0000"
        onColorSelect={onColorSelect}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Text Color' }))
    fireEvent.click(screen.getByText('Default'))
    expect(onColorSelect).toHaveBeenCalledWith('')
  })

  it('closes palette when Escape is pressed', () => {
    render(
      <ToolbarColorPicker
        command="foreColor"
        tooltip="Text Color"
        currentColor="#000000"
        onColorSelect={vi.fn()}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Text Color' }))
    expect(screen.getByRole('grid')).toBeTruthy()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('grid')).toBeNull()
  })

  it('closes palette on outside click', () => {
    render(
      <div>
        <ToolbarColorPicker
          command="foreColor"
          tooltip="Text Color"
          currentColor="#000000"
          onColorSelect={vi.fn()}
        />
        <div data-testid="outside">Outside</div>
      </div>
    )
    fireEvent.click(screen.getByRole('button', { name: 'Text Color' }))
    expect(screen.getByRole('grid')).toBeTruthy()
    fireEvent.mouseDown(screen.getByTestId('outside'))
    expect(screen.queryByRole('grid')).toBeNull()
  })

  it('sets aria-haspopup and aria-expanded', () => {
    render(
      <ToolbarColorPicker
        command="foreColor"
        tooltip="Text Color"
        currentColor="#000000"
        onColorSelect={vi.fn()}
      />
    )
    const btn = screen.getByRole('button', { name: 'Text Color' })
    expect(btn.getAttribute('aria-haspopup')).toBe('true')
    expect(btn.getAttribute('aria-expanded')).toBe('false')
    fireEvent.click(btn)
    expect(btn.getAttribute('aria-expanded')).toBe('true')
  })

  it('keyboard Space selects color and closes', () => {
    const onColorSelect = vi.fn()
    render(
      <ToolbarColorPicker
        command="foreColor"
        tooltip="Text Color"
        currentColor="#000000"
        onColorSelect={onColorSelect}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Text Color' }))
    const swatch = screen.getByLabelText('Color Black')
    fireEvent.keyDown(swatch, { key: ' ' })
    expect(onColorSelect).toHaveBeenCalledWith('#000000')
  })

  it('renders custom color input', () => {
    render(
      <ToolbarColorPicker
        command="foreColor"
        tooltip="Text Color"
        currentColor="#000000"
        onColorSelect={vi.fn()}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Text Color' }))
    expect(screen.getByText('Custom:')).toBeTruthy()
  })

  it('custom color input triggers onColorSelect', () => {
    const onColorSelect = vi.fn()
    render(
      <ToolbarColorPicker
        command="foreColor"
        tooltip="Text Color"
        currentColor="#000000"
        onColorSelect={onColorSelect}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Text Color' }))
    const colorInput = document.querySelector('input[type="color"]')
    fireEvent.change(colorInput, { target: { value: '#abcdef' } })
    expect(onColorSelect).toHaveBeenCalledWith('#abcdef')
  })

  it('renders Save Preset button', () => {
    render(
      <ToolbarColorPicker
        command="foreColor"
        tooltip="Text Color"
        currentColor="#000000"
        onColorSelect={vi.fn()}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Text Color' }))
    expect(screen.getByText('+ Save Preset')).toBeTruthy()
  })

  it('renders roving tabindex on swatches', () => {
    render(
      <ToolbarColorPicker
        command="foreColor"
        tooltip="Text Color"
        currentColor="#000000"
        onColorSelect={vi.fn()}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Text Color' }))
    const focusedSwatch = screen.getByLabelText('Color Black')
    expect(focusedSwatch.getAttribute('tabindex')).toBe('0')
    const otherSwatch = screen.getByLabelText('Color Red')
    expect(otherSwatch.getAttribute('tabindex')).toBe('-1')
  })

  it('keyboard ArrowRight moves focus', () => {
    const onColorSelect = vi.fn()
    render(
      <ToolbarColorPicker
        command="foreColor"
        tooltip="Text Color"
        currentColor="#000000"
        onColorSelect={onColorSelect}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Text Color' }))
    const firstSwatch = screen.getByLabelText('Color Black')
    fireEvent.keyDown(firstSwatch, { key: 'ArrowRight' })
    // Enter to select the next swatch
    const nextSwatch = screen.getByLabelText('Color Red')
    fireEvent.keyDown(nextSwatch, { key: 'Enter' })
    expect(onColorSelect).toHaveBeenCalledWith('#ff0000')
  })
})
