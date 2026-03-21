import { vi, beforeAll } from 'vitest'
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { SelectionContext } from '../config/SelectionContext.js'

// jsdom does not implement scrollIntoView or ResizeObserver
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn()
  global.ResizeObserver = vi.fn(function () {
    this.observe = vi.fn()
    this.disconnect = vi.fn()
    this.unobserve = vi.fn()
  })
})

// Mock Tooltip
vi.mock('../components/Tooltip/Tooltip.jsx', () => ({
  Tooltip: ({ children }) => <span>{children}</span>,
}))

// Mock sub-components
vi.mock('../components/Toolbar/ToolbarSeparator.jsx', () => ({
  ToolbarSeparator: () => <div className="rmx-toolbar-separator" />,
}))

vi.mock('../components/TypographyDropdown/TypographyDropdown.jsx', () => ({
  TypographyDropdown: () => <div data-testid="typography-dropdown" />,
}))

// Mock @remyxjs/core
vi.mock('@remyxjs/core', () => ({
  DEFAULT_TOOLBAR: [['bold', 'italic'], ['link']],
  DEFAULT_FONTS: ['Arial', 'Verdana'],
  DEFAULT_FONT_SIZES: [
    { label: '12', value: '12px' },
    { label: '14', value: '14px' },
  ],
  HEADING_OPTIONS: [
    { label: 'Normal', value: 'p', tag: 'p' },
    { label: 'Heading 1', value: 'h1', tag: 'h1' },
  ],
  BUTTON_COMMANDS: new Set(['bold', 'italic', 'underline', 'strikethrough', 'undo', 'redo']),
  TOOLTIP_MAP: {
    bold: 'Bold', italic: 'Italic', underline: 'Underline',
    link: 'Insert Link', image: 'Insert Image',
    findReplace: 'Find & Replace', export: 'Export',
    table: 'Insert Table', embedMedia: 'Embed Media',
    commandPalette: 'Command Palette',
    attachment: 'Attach File', importDocument: 'Import Document',
  },
  getShortcutLabel: vi.fn(() => ''),
  getCommandActiveState: vi.fn((cmd, state) => state[cmd] || false),
  DEFAULT_COLORS: ['#000000', '#ff0000'],
  loadColorPresets: vi.fn(() => []),
  saveColorPreset: vi.fn(),
}))

import { Toolbar } from '../components/Toolbar/Toolbar.jsx'

const defaultFormatState = {
  bold: false,
  italic: false,
  underline: false,
  strikethrough: false,
  heading: null,
  fontFamily: null,
  fontSize: null,
  foreColor: null,
  backColor: null,
  link: null,
}

function renderToolbar(props = {}, formatState = defaultFormatState) {
  return render(
    <SelectionContext.Provider value={formatState}>
      <Toolbar {...props} />
    </SelectionContext.Provider>
  )
}

function createMockEngine() {
  return {
    executeCommand: vi.fn(),
    selection: { getSelectedText: vi.fn(() => 'selected text') },
    commands: { has: vi.fn(() => true) },
  }
}

describe('Toolbar', () => {
  it('renders placeholder when engine is null', () => {
    renderToolbar({ engine: null })
    const toolbar = screen.getByRole('toolbar', { name: 'Editor toolbar' })
    expect(toolbar).toBeTruthy()
    expect(toolbar.style.minHeight).toBe('44px')
  })

  it('renders toolbar with buttons when engine is provided', () => {
    const engine = createMockEngine()
    renderToolbar({ engine })
    expect(screen.getByRole('toolbar', { name: 'Editor toolbar' })).toBeTruthy()
    // Default config has bold and italic - rendered with aria-label from TOOLTIP_MAP
    expect(screen.getByLabelText('Bold')).toBeTruthy()
    expect(screen.getByLabelText('Italic')).toBeTruthy()
  })

  it('renders custom toolbar config', () => {
    const engine = createMockEngine()
    renderToolbar({ engine, config: [['bold']] })
    expect(screen.getByLabelText('Bold')).toBeTruthy()
    expect(screen.queryByLabelText('Italic')).toBeNull()
  })

  it('renders separators between groups', () => {
    const engine = createMockEngine()
    const { container } = renderToolbar({ engine, config: [['bold'], ['italic']] })
    expect(container.querySelectorAll('.rmx-toolbar-separator').length).toBeGreaterThan(0)
  })

  it('highlights active format buttons', () => {
    const engine = createMockEngine()
    // getCommandActiveState returns true for 'bold' by default when state.bold is true
    renderToolbar({ engine }, { ...defaultFormatState, bold: true })
    const boldBtn = screen.getByLabelText('Bold')
    // Check active state via aria-pressed
    expect(boldBtn.getAttribute('aria-pressed')).toBe('true')
  })

  it('calls executeCommand when button is clicked', () => {
    const engine = createMockEngine()
    renderToolbar({ engine })
    fireEvent.click(screen.getByLabelText('Bold'))
    expect(engine.executeCommand).toHaveBeenCalledWith('bold')
  })

  it('renders link button that opens modal', () => {
    const engine = createMockEngine()
    const onOpenModal = vi.fn()
    renderToolbar({ engine, onOpenModal, config: [['link']] })
    fireEvent.click(screen.getByLabelText('Insert Link'))
    expect(onOpenModal).toHaveBeenCalledWith('link', expect.any(Object))
  })

  it('renders image button that opens modal', () => {
    const engine = createMockEngine()
    const onOpenModal = vi.fn()
    renderToolbar({ engine, onOpenModal, config: [['image']] })
    fireEvent.click(screen.getByLabelText('Insert Image'))
    expect(onOpenModal).toHaveBeenCalledWith('image')
  })

  it('disables button when command is not registered', () => {
    const engine = createMockEngine()
    engine.commands.has = vi.fn((cmd) => cmd !== 'bold')
    renderToolbar({ engine })
    const boldBtn = screen.getByLabelText('Bold')
    expect(boldBtn.disabled).toBe(true)
  })

  it('renders word count button when provided', () => {
    const engine = createMockEngine()
    const wordCountBtn = <button data-testid="word-count">WC</button>
    renderToolbar({ engine, wordCountButton: wordCountBtn })
    expect(screen.getByTestId('word-count')).toBeTruthy()
  })

  it('adds customizable class when customizableToolbar is true', () => {
    const engine = createMockEngine()
    const { container } = renderToolbar({ engine, customizableToolbar: true })
    expect(container.querySelector('.rmx-toolbar-customizable')).toBeTruthy()
  })

  it('renders draggable items when customizableToolbar is true', () => {
    const engine = createMockEngine()
    const { container } = renderToolbar({ engine, customizableToolbar: true })
    const draggables = container.querySelectorAll('[draggable]')
    expect(draggables.length).toBeGreaterThan(0)
  })

  it('handles inline separator in toolbar config', () => {
    const engine = createMockEngine()
    const { container } = renderToolbar({ engine, config: [['bold', '|', 'italic']] })
    expect(container.querySelectorAll('.rmx-toolbar-separator').length).toBeGreaterThan(0)
  })
})
