import { render, screen, fireEvent } from '@testing-library/react'
import { ToolbarDropdown } from '../components/Toolbar/ToolbarDropdown.jsx'

const options = [
  { value: 'p', label: 'Paragraph' },
  { value: 'h1', label: 'Heading 1' },
  { value: 'h2', label: 'Heading 2' },
  { value: 'h3', label: 'Heading 3' },
]

describe('ToolbarDropdown', () => {
  it('should render dropdown button', () => {
    render(<ToolbarDropdown label="Heading" value="p" options={options} onChange={() => {}} tooltip="Heading" />)
    const btn = screen.getByRole('button', { name: /paragraph/i })
    expect(btn).toBeTruthy()
  })

  it('should show current value label', () => {
    render(<ToolbarDropdown label="Heading" value="h1" options={options} onChange={() => {}} tooltip="Heading" />)
    expect(screen.getByText('Heading 1')).toBeTruthy()
  })

  it('should open dropdown on click', () => {
    render(<ToolbarDropdown label="Heading" value="p" options={options} onChange={() => {}} tooltip="Heading" />)
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByRole('listbox')).toBeTruthy()
  })

  it('should show all options when open', () => {
    render(<ToolbarDropdown label="Heading" value="p" options={options} onChange={() => {}} tooltip="Heading" />)
    fireEvent.click(screen.getByRole('button'))
    const items = screen.getAllByRole('option')
    expect(items).toHaveLength(4)
  })

  it('should mark active option', () => {
    render(<ToolbarDropdown label="Heading" value="h2" options={options} onChange={() => {}} tooltip="Heading" />)
    fireEvent.click(screen.getByRole('button'))
    const activeOption = screen.getByRole('option', { name: 'Heading 2' })
    expect(activeOption.getAttribute('aria-selected')).toBe('true')
    expect(activeOption.className).toContain('rmx-active')
  })

  it('should call onChange when option is clicked', () => {
    const onChange = jest.fn()
    render(<ToolbarDropdown label="Heading" value="p" options={options} onChange={onChange} tooltip="Heading" />)
    fireEvent.click(screen.getByRole('button'))
    fireEvent.click(screen.getByRole('option', { name: 'Heading 1' }))
    expect(onChange).toHaveBeenCalledWith('h1')
  })

  it('should close dropdown after selecting option', () => {
    render(<ToolbarDropdown label="Heading" value="p" options={options} onChange={() => {}} tooltip="Heading" />)
    fireEvent.click(screen.getByRole('button'))
    expect(screen.queryByRole('listbox')).toBeTruthy()

    fireEvent.click(screen.getByRole('option', { name: 'Heading 1' }))
    expect(screen.queryByRole('listbox')).toBeNull()
  })

  it('should toggle dropdown on button click', () => {
    render(<ToolbarDropdown label="Heading" value="p" options={options} onChange={() => {}} tooltip="Heading" />)
    const btn = screen.getByRole('button')

    fireEvent.click(btn)
    expect(screen.queryByRole('listbox')).toBeTruthy()

    fireEvent.click(btn)
    expect(screen.queryByRole('listbox')).toBeNull()
  })

  it('should have aria-haspopup and aria-expanded attributes', () => {
    render(<ToolbarDropdown label="Heading" value="p" options={options} onChange={() => {}} tooltip="Heading" />)
    const btn = screen.getByRole('button')
    expect(btn.getAttribute('aria-haspopup')).toBe('listbox')
    expect(btn.getAttribute('aria-expanded')).toBe('false')

    fireEvent.click(btn)
    expect(btn.getAttribute('aria-expanded')).toBe('true')
  })

  it('should have type="button"', () => {
    render(<ToolbarDropdown label="Heading" value="p" options={options} onChange={() => {}} tooltip="Heading" />)
    const buttons = screen.getAllByRole('button')
    buttons.forEach(btn => expect(btn.type).toBe('button'))
  })
})
