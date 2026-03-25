import { vi } from 'vitest'
import { registerBlockConvertCommands } from '../commands/blockConvert.js'

describe('registerBlockConvertCommands', () => {
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
      },
      eventBus: { emit: vi.fn() },
      history: { snapshot: vi.fn() },
      selection: {
        getParentBlock: vi.fn(),
        setRange: vi.fn(),
      },
    }

    registerBlockConvertCommands(mockEngine)
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('should register the convertBlock command', () => {
    expect(mockEngine.commands.register).toHaveBeenCalledTimes(1)
    expect(commands.convertBlock).toBeDefined()
    expect(commands.convertBlock.meta.tooltip).toBe('Convert Block Type')
  })

  it('should return early if no "to" param is provided', () => {
    commands.convertBlock.execute(mockEngine)
    expect(mockEngine.history.snapshot).not.toHaveBeenCalled()
  })

  it('should return early if "to" is an unknown type', () => {
    commands.convertBlock.execute(mockEngine, { to: 'nonexistent' })
    expect(mockEngine.history.snapshot).not.toHaveBeenCalled()
  })

  it('should return early if no focused block is found', () => {
    mockEngine.selection.getParentBlock.mockReturnValue(null)
    commands.convertBlock.execute(mockEngine, { to: 'heading1' })
    expect(mockEngine.history.snapshot).not.toHaveBeenCalled()
  })

  it('should return early if block is already the target type', () => {
    const p = document.createElement('p')
    p.textContent = 'hello'
    mockEngine.element.appendChild(p)
    mockEngine.selection.getParentBlock.mockReturnValue(p)

    commands.convertBlock.execute(mockEngine, { to: 'paragraph' })
    expect(mockEngine.history.snapshot).not.toHaveBeenCalled()
  })

  it('should convert paragraph to heading1', () => {
    const p = document.createElement('p')
    p.innerHTML = 'Hello World'
    mockEngine.element.appendChild(p)
    mockEngine.selection.getParentBlock.mockReturnValue(p)

    commands.convertBlock.execute(mockEngine, { to: 'heading1' })

    expect(mockEngine.history.snapshot).toHaveBeenCalled()
    expect(mockEngine.element.querySelector('h1')).not.toBeNull()
    expect(mockEngine.element.querySelector('h1').textContent).toBe('Hello World')
    expect(mockEngine.eventBus.emit).toHaveBeenCalledWith('content:change')
  })

  it('should convert paragraph to heading2', () => {
    const p = document.createElement('p')
    p.innerHTML = 'Sub title'
    mockEngine.element.appendChild(p)
    mockEngine.selection.getParentBlock.mockReturnValue(p)

    commands.convertBlock.execute(mockEngine, { to: 'heading2' })
    expect(mockEngine.element.querySelector('h2').textContent).toBe('Sub title')
  })

  it('should convert paragraph to blockquote', () => {
    const p = document.createElement('p')
    p.innerHTML = 'Quote me'
    mockEngine.element.appendChild(p)
    mockEngine.selection.getParentBlock.mockReturnValue(p)

    commands.convertBlock.execute(mockEngine, { to: 'blockquote' })

    const bq = mockEngine.element.querySelector('blockquote')
    expect(bq).not.toBeNull()
    expect(bq.querySelector('p').textContent).toBe('Quote me')
  })

  it('should convert paragraph to code block', () => {
    const p = document.createElement('p')
    p.innerHTML = 'const x = 1'
    mockEngine.element.appendChild(p)
    mockEngine.selection.getParentBlock.mockReturnValue(p)

    commands.convertBlock.execute(mockEngine, { to: 'codeBlock' })

    const pre = mockEngine.element.querySelector('pre')
    expect(pre).not.toBeNull()
    expect(pre.querySelector('code').textContent).toBe('const x = 1')
  })

  it('should convert paragraph to unordered list', () => {
    const p = document.createElement('p')
    p.innerHTML = 'List item'
    mockEngine.element.appendChild(p)
    mockEngine.selection.getParentBlock.mockReturnValue(p)

    commands.convertBlock.execute(mockEngine, { to: 'unorderedList' })

    const ul = mockEngine.element.querySelector('ul')
    expect(ul).not.toBeNull()
    expect(ul.querySelector('li').textContent).toBe('List item')
  })

  it('should convert paragraph to ordered list', () => {
    const p = document.createElement('p')
    p.innerHTML = 'Numbered'
    mockEngine.element.appendChild(p)
    mockEngine.selection.getParentBlock.mockReturnValue(p)

    commands.convertBlock.execute(mockEngine, { to: 'orderedList' })

    const ol = mockEngine.element.querySelector('ol')
    expect(ol).not.toBeNull()
    expect(ol.querySelector('li').textContent).toBe('Numbered')
  })

  it('should extract content from a list (single item)', () => {
    const ul = document.createElement('ul')
    const li = document.createElement('li')
    li.innerHTML = 'item one'
    ul.appendChild(li)
    mockEngine.element.appendChild(ul)
    mockEngine.selection.getParentBlock.mockReturnValue(li)

    commands.convertBlock.execute(mockEngine, { to: 'paragraph' })

    const p = mockEngine.element.querySelector('p')
    expect(p).not.toBeNull()
    expect(p.textContent).toBe('item one')
  })

  it('should extract content from a list (multiple items)', () => {
    const ul = document.createElement('ul')
    const li1 = document.createElement('li')
    li1.innerHTML = 'item one'
    const li2 = document.createElement('li')
    li2.innerHTML = 'item two'
    ul.appendChild(li1)
    ul.appendChild(li2)
    mockEngine.element.appendChild(ul)
    mockEngine.selection.getParentBlock.mockReturnValue(li1)

    commands.convertBlock.execute(mockEngine, { to: 'paragraph' })

    const p = mockEngine.element.querySelector('p')
    expect(p).not.toBeNull()
    expect(p.innerHTML).toContain('item one')
    expect(p.innerHTML).toContain('item two')
  })

  it('should extract content from a code block (pre>code)', () => {
    const pre = document.createElement('pre')
    const code = document.createElement('code')
    code.textContent = 'let x = 1'
    pre.appendChild(code)
    mockEngine.element.appendChild(pre)
    mockEngine.selection.getParentBlock.mockReturnValue(code)

    commands.convertBlock.execute(mockEngine, { to: 'paragraph' })

    const p = mockEngine.element.querySelector('p')
    expect(p).not.toBeNull()
    expect(p.textContent).toBe('let x = 1')
  })

  it('should extract content from a blockquote with single child', () => {
    const bq = document.createElement('blockquote')
    const p = document.createElement('p')
    p.innerHTML = 'quoted text'
    bq.appendChild(p)
    mockEngine.element.appendChild(bq)
    mockEngine.selection.getParentBlock.mockReturnValue(p)

    commands.convertBlock.execute(mockEngine, { to: 'heading3' })

    const h3 = mockEngine.element.querySelector('h3')
    expect(h3).not.toBeNull()
    expect(h3.textContent).toBe('quoted text')
  })

  it('should extract content from a blockquote with multiple children', () => {
    const bq = document.createElement('blockquote')
    const p1 = document.createElement('p')
    p1.innerHTML = 'line1'
    const p2 = document.createElement('p')
    p2.innerHTML = 'line2'
    bq.appendChild(p1)
    bq.appendChild(p2)
    mockEngine.element.appendChild(bq)
    mockEngine.selection.getParentBlock.mockReturnValue(p1)

    commands.convertBlock.execute(mockEngine, { to: 'paragraph' })

    const para = mockEngine.element.querySelector('p')
    expect(para).not.toBeNull()
  })

  it('should handle conversion with empty content gracefully', () => {
    const p = document.createElement('p')
    p.innerHTML = ''
    mockEngine.element.appendChild(p)
    mockEngine.selection.getParentBlock.mockReturnValue(p)

    commands.convertBlock.execute(mockEngine, { to: 'heading1' })

    const h1 = mockEngine.element.querySelector('h1')
    expect(h1).not.toBeNull()
  })

  it('should walk up to find the direct child of editor element', () => {
    const div = document.createElement('div')
    const p = document.createElement('p')
    const span = document.createElement('span')
    span.textContent = 'nested'
    p.appendChild(span)
    div.appendChild(p)
    mockEngine.element.appendChild(div)
    // getParentBlock returns the deep nested element
    mockEngine.selection.getParentBlock.mockReturnValue(span)

    commands.convertBlock.execute(mockEngine, { to: 'heading1' })

    // The div (direct child of editor) should be replaced
    expect(mockEngine.element.querySelector('h1')).not.toBeNull()
  })

  it('should convert to heading4, heading5, heading6', () => {
    for (const [to, tag] of [['heading4', 'h4'], ['heading5', 'h5'], ['heading6', 'h6']]) {
      const p = document.createElement('p')
      p.innerHTML = 'text'
      mockEngine.element.appendChild(p)
      mockEngine.selection.getParentBlock.mockReturnValue(p)
      commands.convertBlock.execute(mockEngine, { to })
      expect(mockEngine.element.querySelector(tag)).not.toBeNull()
      mockEngine.element.innerHTML = ''
    }
  })

  it('should extract text from pre without code child', () => {
    const pre = document.createElement('pre')
    pre.textContent = 'raw text'
    mockEngine.element.appendChild(pre)
    mockEngine.selection.getParentBlock.mockReturnValue(pre)

    commands.convertBlock.execute(mockEngine, { to: 'paragraph' })

    const p = mockEngine.element.querySelector('p')
    expect(p.textContent).toBe('raw text')
  })
})
