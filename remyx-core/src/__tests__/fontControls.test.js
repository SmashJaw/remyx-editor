import { vi } from 'vitest'
import { registerFontCommands } from '../commands/fontControls.js'

describe('registerFontCommands', () => {
  let commands
  let mockEngine

  beforeEach(() => {
    commands = {}

    const element = document.createElement('div')
    element.setAttribute('contenteditable', 'true')
    document.body.appendChild(element)

    mockEngine = {
      element,
      commands: {
        register: vi.fn((name, def) => { commands[name] = def }),
        execute: vi.fn((name, ...args) => commands[name]?.execute(mockEngine, ...args)),
      },
      keyboard: { register: vi.fn() },
      eventBus: { emit: vi.fn(), on: vi.fn() },
      history: { snapshot: vi.fn() },
      selection: {
        getSelection: vi.fn().mockReturnValue(window.getSelection()),
        getRange: vi.fn(),
        save: vi.fn(),
        restore: vi.fn(),
        insertHTML: vi.fn(),
        wrapWith: vi.fn(),
        unwrap: vi.fn(),
        getParentElement: vi.fn(),
      },
      sanitizer: { sanitize: vi.fn(html => html) },
      getHTML: vi.fn().mockReturnValue('<p>test</p>'),
      setHTML: vi.fn(),
      options: { baseHeadingLevel: 0 },
      isMarkdownMode: false,
      isSourceMode: false,
    }

    registerFontCommands(mockEngine)
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('should register all 7 font commands', () => {
    expect(mockEngine.commands.register).toHaveBeenCalledTimes(7)
    expect(commands.fontFamily).toBeDefined()
    expect(commands.fontSize).toBeDefined()
    expect(commands.foreColor).toBeDefined()
    expect(commands.backColor).toBeDefined()
    expect(commands.lineHeight).toBeDefined()
    expect(commands.letterSpacing).toBeDefined()
    expect(commands.paragraphSpacing).toBeDefined()
  })

  it('should wrap selection in span with fontFamily style', () => {
    const p = document.createElement('p')
    p.textContent = 'hello world'
    mockEngine.element.appendChild(p)

    const textNode = p.firstChild
    const range = document.createRange()
    range.setStart(textNode, 0)
    range.setEnd(textNode, 5)

    const sel = window.getSelection()
    sel.removeAllRanges()
    sel.addRange(range)

    mockEngine.selection.getSelection.mockReturnValue(sel)
    mockEngine.selection.getParentElement.mockReturnValue(p)

    commands.fontFamily.execute(mockEngine, 'Arial')
    const span = mockEngine.element.querySelector('span')
    expect(span).not.toBeNull()
    expect(span.style.fontFamily).toBe('Arial')
  })

  it('should not execute fontFamily when no family provided', () => {
    commands.fontFamily.execute(mockEngine, '')
    // No span should be created
    expect(mockEngine.element.querySelector('span')).toBeNull()
  })

  it('should wrap selection in span with color style for foreColor', () => {
    const p = document.createElement('p')
    p.textContent = 'hello world'
    mockEngine.element.appendChild(p)

    const textNode = p.firstChild
    const range = document.createRange()
    range.setStart(textNode, 0)
    range.setEnd(textNode, 5)

    const sel = window.getSelection()
    sel.removeAllRanges()
    sel.addRange(range)

    mockEngine.selection.getSelection.mockReturnValue(sel)
    mockEngine.selection.getParentElement.mockReturnValue(p)

    commands.foreColor.execute(mockEngine, '#ff0000')
    const span = mockEngine.element.querySelector('span')
    expect(span).not.toBeNull()
    expect(span.style.color).toBe('rgb(255, 0, 0)')
  })

  it('should not execute foreColor when no color', () => {
    commands.foreColor.execute(mockEngine, '')
    expect(mockEngine.element.querySelector('span')).toBeNull()
  })

  it('should wrap selection in span with backgroundColor for backColor', () => {
    const p = document.createElement('p')
    p.textContent = 'hello world'
    mockEngine.element.appendChild(p)

    const textNode = p.firstChild
    const range = document.createRange()
    range.setStart(textNode, 0)
    range.setEnd(textNode, 5)

    const sel = window.getSelection()
    sel.removeAllRanges()
    sel.addRange(range)

    mockEngine.selection.getSelection.mockReturnValue(sel)
    mockEngine.selection.getParentElement.mockReturnValue(p)

    commands.backColor.execute(mockEngine, '#00ff00')
    const span = mockEngine.element.querySelector('span')
    expect(span).not.toBeNull()
    expect(span.style.backgroundColor).toBe('rgb(0, 255, 0)')
  })

  it('should not execute backColor when no color', () => {
    commands.backColor.execute(mockEngine, '')
    expect(mockEngine.element.querySelector('span')).toBeNull()
  })

  it('should update existing span style when parent is already a styled span', () => {
    const span = document.createElement('span')
    span.style.fontFamily = 'Courier'
    span.textContent = 'text'
    mockEngine.element.appendChild(span)

    const textNode = span.firstChild
    const range = document.createRange()
    range.setStart(textNode, 0)
    range.setEnd(textNode, 4)

    const sel = window.getSelection()
    sel.removeAllRanges()
    sel.addRange(range)

    mockEngine.selection.getSelection.mockReturnValue(sel)
    mockEngine.selection.getParentElement.mockReturnValue(span)

    commands.fontFamily.execute(mockEngine, 'Arial')
    expect(span.style.fontFamily).toBe('Arial')
  })

  it('should return computed fontFamily for fontFamily isActive', () => {
    const span = document.createElement('span')
    span.style.fontFamily = 'Arial'
    span.textContent = 'text'
    mockEngine.element.appendChild(span)

    mockEngine.selection.getParentElement.mockReturnValue(span)
    const result = commands.fontFamily.isActive(mockEngine)
    expect(result).toBeTruthy()
  })

  it('should return false for fontFamily isActive when no parent element', () => {
    mockEngine.selection.getParentElement.mockReturnValue(null)
    expect(commands.fontFamily.isActive(mockEngine)).toBe(false)
  })

  it('should handle fontSize with range selection', () => {
    const textNode = document.createTextNode('hello world')
    mockEngine.element.appendChild(textNode)

    const range = document.createRange()
    range.selectNodeContents(textNode)

    const sel = window.getSelection()
    sel.removeAllRanges()
    sel.addRange(range)

    mockEngine.selection.getSelection.mockReturnValue(sel)
    mockEngine.selection.getParentElement.mockReturnValue(null)

    commands.fontSize.execute(mockEngine, '20px')
    const span = mockEngine.element.querySelector('span')
    expect(span).not.toBeNull()
    expect(span.style.fontSize).toBe('20px')
  })

  it('should update existing font-size span', () => {
    const span = document.createElement('span')
    span.style.fontSize = '14px'
    span.textContent = 'text'
    mockEngine.element.appendChild(span)

    const textNode = span.firstChild
    const range = document.createRange()
    range.setStart(textNode, 0)
    range.setEnd(textNode, 4)

    const sel = window.getSelection()
    sel.removeAllRanges()
    sel.addRange(range)

    mockEngine.selection.getSelection.mockReturnValue(sel)
    mockEngine.selection.getParentElement.mockReturnValue(span)

    commands.fontSize.execute(mockEngine, '24px')
    expect(span.style.fontSize).toBe('24px')
  })

  it('should not execute fontSize when no size', () => {
    commands.fontSize.execute(mockEngine, '')
    // Nothing should happen, no error
  })

  it('should have correct meta for font commands', () => {
    expect(commands.fontFamily.meta).toEqual({ icon: 'fontFamily', tooltip: 'Font Family' })
    expect(commands.fontSize.meta).toEqual({ icon: 'fontSize', tooltip: 'Font Size' })
    expect(commands.foreColor.meta).toEqual({ icon: 'foreColor', tooltip: 'Text Color' })
    expect(commands.backColor.meta).toEqual({ icon: 'backColor', tooltip: 'Background Color' })
  })

  it('should return early for fontSize with invalid size format', () => {
    const textNode = document.createTextNode('hello')
    mockEngine.element.appendChild(textNode)
    commands.fontSize.execute(mockEngine, 'notasize')
    // No span should be created
    expect(mockEngine.element.querySelector('span')).toBeNull()
  })

  it('should return early for fontSize with collapsed range', () => {
    const textNode = document.createTextNode('hello')
    mockEngine.element.appendChild(textNode)

    const range = document.createRange()
    range.setStart(textNode, 0)
    range.setEnd(textNode, 0) // collapsed

    const sel = window.getSelection()
    sel.removeAllRanges()
    sel.addRange(range)

    mockEngine.selection.getSelection.mockReturnValue(sel)

    commands.fontSize.execute(mockEngine, '16px')
    // No span should be created since range is collapsed
    expect(mockEngine.element.querySelector('span')).toBeNull()
  })

  it('should use extractContents fallback when surroundContents throws', () => {
    const textNode = document.createTextNode('hello world')
    mockEngine.element.appendChild(textNode)

    const range = document.createRange()
    range.selectNodeContents(textNode)

    // Force surroundContents to throw so the catch branch runs
    range.surroundContents = vi.fn(() => { throw new Error('partial overlap') })

    const sel = window.getSelection()
    sel.removeAllRanges()
    sel.addRange(range)

    // Ensure getRangeAt returns our modified range object
    vi.spyOn(sel, 'getRangeAt').mockReturnValue(range)

    mockEngine.selection.getSelection.mockReturnValue(sel)
    mockEngine.selection.getParentElement.mockReturnValue(null)

    commands.fontSize.execute(mockEngine, '18px')
    expect(range.surroundContents).toHaveBeenCalled()
    const span = mockEngine.element.querySelector('span')
    expect(span).not.toBeNull()
    expect(span.style.fontSize).toBe('18px')
  })

  it('should return computed color for foreColor isActive', () => {
    const span = document.createElement('span')
    span.style.color = 'rgb(255, 0, 0)'
    span.textContent = 'text'
    mockEngine.element.appendChild(span)

    mockEngine.selection.getParentElement.mockReturnValue(span)
    const result = commands.foreColor.isActive(mockEngine)
    expect(result).toBeTruthy()
  })

  it('should return false for foreColor isActive when no parent element', () => {
    mockEngine.selection.getParentElement.mockReturnValue(null)
    expect(commands.foreColor.isActive(mockEngine)).toBe(false)
  })

  it('should return computed backgroundColor for backColor isActive', () => {
    const span = document.createElement('span')
    span.style.backgroundColor = 'rgb(0, 255, 0)'
    span.textContent = 'text'
    mockEngine.element.appendChild(span)

    mockEngine.selection.getParentElement.mockReturnValue(span)
    const result = commands.backColor.isActive(mockEngine)
    expect(result).toBeTruthy()
  })

  it('should return false for backColor isActive when no parent element', () => {
    mockEngine.selection.getParentElement.mockReturnValue(null)
    expect(commands.backColor.isActive(mockEngine)).toBe(false)
  })
})
