import { render, screen, fireEvent } from '@testing-library/react'
import { ToolbarButton } from '../components/Toolbar/ToolbarButton.jsx'

describe('ToolbarButton', () => {
  it('should render with tooltip as aria-label', () => {
    render(<ToolbarButton command="bold" tooltip="Bold" onClick={() => {}} />)
    const btn = screen.getByRole('button', { name: 'Bold' })
    expect(btn).toBeTruthy()
  })

  it('should show active state', () => {
    render(<ToolbarButton command="bold" tooltip="Bold" active={true} onClick={() => {}} />)
    const btn = screen.getByRole('button', { name: 'Bold' })
    expect(btn.getAttribute('aria-pressed')).toBe('true')
    expect(btn.className).toContain('rmx-active')
  })

  it('should show inactive state', () => {
    render(<ToolbarButton command="bold" tooltip="Bold" active={false} onClick={() => {}} />)
    const btn = screen.getByRole('button', { name: 'Bold' })
    expect(btn.getAttribute('aria-pressed')).toBe('false')
    expect(btn.className).not.toContain('rmx-active')
  })

  it('should call onClick when clicked', () => {
    const onClick = jest.fn()
    render(<ToolbarButton command="bold" tooltip="Bold" onClick={onClick} />)
    fireEvent.click(screen.getByRole('button', { name: 'Bold' }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('should not call onClick when disabled', () => {
    const onClick = jest.fn()
    render(<ToolbarButton command="bold" tooltip="Bold" onClick={onClick} disabled={true} />)
    fireEvent.click(screen.getByRole('button', { name: 'Bold' }))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('should show disabled state', () => {
    render(<ToolbarButton command="bold" tooltip="Bold" disabled={true} onClick={() => {}} />)
    const btn = screen.getByRole('button', { name: 'Bold' })
    expect(btn.disabled).toBe(true)
    expect(btn.className).toContain('rmx-disabled')
  })

  it('should include shortcut label in title', () => {
    render(<ToolbarButton command="bold" tooltip="Bold" shortcutLabel="⌘B" onClick={() => {}} />)
    const btn = screen.getByRole('button', { name: 'Bold' })
    expect(btn.title).toBe('Bold (⌘B)')
  })

  it('should render children when provided', () => {
    render(
      <ToolbarButton command="custom" tooltip="Custom" onClick={() => {}}>
        <span data-testid="custom-child">Custom</span>
      </ToolbarButton>
    )
    expect(screen.getByTestId('custom-child')).toBeTruthy()
  })

  it('should have type="button"', () => {
    render(<ToolbarButton command="bold" tooltip="Bold" onClick={() => {}} />)
    const btn = screen.getByRole('button', { name: 'Bold' })
    expect(btn.type).toBe('button')
  })

  it('should apply itemStyle', () => {
    render(<ToolbarButton command="bold" tooltip="Bold" onClick={() => {}} itemStyle={{ color: 'red' }} />)
    const btn = screen.getByRole('button', { name: 'Bold' })
    expect(btn.style.color).toBe('red')
  })
})
