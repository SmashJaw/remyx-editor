import { vi } from 'vitest'
import { registerFormattingCommands } from '../commands/formatting.js'

describe('registerFormattingCommands', () => {
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
        setRange: vi.fn(),
      },
      sanitizer: { sanitize: vi.fn(html => html) },
      getHTML: vi.fn().mockReturnValue('<p>test</p>'),
      setHTML: vi.fn(),
      options: { baseHeadingLevel: 0 },
      isMarkdownMode: false,
      isSourceMode: false,
    }

    registerFormattingCommands(mockEngine)
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('should register all 8 formatting commands', () => {
    expect(mockEngine.commands.register).toHaveBeenCalledTimes(8)
    expect(commands.bold).toBeDefined()
    expect(commands.italic).toBeDefined()
    expect(commands.underline).toBeDefined()
    expect(commands.strikethrough).toBeDefined()
    expect(commands.subscript).toBeDefined()
    expect(commands.superscript).toBeDefined()
    expect(commands.highlight).toBeDefined()
    expect(commands.removeFormat).toBeDefined()
  })

  it('should register bold with correct shortcut and meta', () => {
    expect(commands.bold.shortcut).toBe('mod+b')
    expect(commands.bold.meta).toEqual({ icon: 'bold', tooltip: 'Bold' })
  })

  it('should register italic with correct shortcut and meta', () => {
    expect(commands.italic.shortcut).toBe('mod+i')
    expect(commands.italic.meta).toEqual({ icon: 'italic', tooltip: 'Italic' })
  })

  it('should register underline with correct shortcut and meta', () => {
    expect(commands.underline.shortcut).toBe('mod+u')
    expect(commands.underline.meta).toEqual({ icon: 'underline', tooltip: 'Underline' })
  })

  it('should register strikethrough with correct shortcut', () => {
    expect(commands.strikethrough.shortcut).toBe('mod+shift+x')
  })

  it('should register subscript and superscript with correct shortcuts', () => {
    expect(commands.subscript.shortcut).toBe('mod+,')
    expect(commands.superscript.shortcut).toBe('mod+.')
  })

  it('should wrap selection in <strong> when executing bold', () => {
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

    commands.bold.execute(mockEngine)
    expect(mockEngine.element.querySelector('strong')).not.toBeNull()
    expect(mockEngine.element.querySelector('strong').textContent).toBe('hello')
  })

  it('should wrap selection in <em> when executing italic', () => {
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

    commands.italic.execute(mockEngine)
    expect(mockEngine.element.querySelector('em')).not.toBeNull()
  })

  it('should wrap selection in <s> when executing strikethrough', () => {
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

    commands.strikethrough.execute(mockEngine)
    expect(mockEngine.element.querySelector('s')).not.toBeNull()
  })

  it('should wrap selection in <u> when executing underline', () => {
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

    commands.underline.execute(mockEngine)
    expect(mockEngine.element.querySelector('u')).not.toBeNull()
  })

  it('should wrap selection in <sub> when executing subscript', () => {
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

    commands.subscript.execute(mockEngine)
    expect(mockEngine.element.querySelector('sub')).not.toBeNull()
  })

  it('should wrap selection in <sup> when executing superscript', () => {
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

    commands.superscript.execute(mockEngine)
    expect(mockEngine.element.querySelector('sup')).not.toBeNull()
  })

  it('should remove inline tags when executing removeFormat', () => {
    const p = document.createElement('p')
    const strong = document.createElement('strong')
    strong.textContent = 'bold text'
    p.appendChild(strong)
    p.appendChild(document.createTextNode(' normal'))
    mockEngine.element.appendChild(p)

    // Select across the entire p content so commonAncestorContainer is p
    const range = document.createRange()
    range.setStart(strong.firstChild, 0)
    range.setEnd(p.lastChild, 7)

    const sel = window.getSelection()
    sel.removeAllRanges()
    sel.addRange(range)

    mockEngine.selection.getSelection.mockReturnValue(sel)

    commands.removeFormat.execute(mockEngine)
    expect(mockEngine.element.querySelector('strong')).toBeNull()
    expect(p.textContent).toBe('bold text normal')
  })

  it('should return true for bold isActive when inside <strong>', () => {
    const strong = document.createElement('strong')
    strong.textContent = 'bold'
    mockEngine.element.appendChild(strong)

    mockEngine.selection.getParentElement.mockReturnValue(strong)
    expect(commands.bold.isActive(mockEngine)).toBe(true)
  })

  it('should return false for bold isActive when not inside <strong> or <b>', () => {
    const p = document.createElement('p')
    p.textContent = 'normal'
    mockEngine.element.appendChild(p)

    mockEngine.selection.getParentElement.mockReturnValue(p)
    expect(commands.bold.isActive(mockEngine)).toBe(false)
  })

  it('should return true for italic isActive when inside <em>', () => {
    const em = document.createElement('em')
    em.textContent = 'italic'
    mockEngine.element.appendChild(em)

    mockEngine.selection.getParentElement.mockReturnValue(em)
    expect(commands.italic.isActive(mockEngine)).toBe(true)
  })

  it('should return false for italic isActive when not inside <em> or <i>', () => {
    const p = document.createElement('p')
    mockEngine.element.appendChild(p)

    mockEngine.selection.getParentElement.mockReturnValue(p)
    expect(commands.italic.isActive(mockEngine)).toBe(false)
  })

  it('should return true for underline isActive when inside <u>', () => {
    const u = document.createElement('u')
    u.textContent = 'underlined'
    mockEngine.element.appendChild(u)

    mockEngine.selection.getParentElement.mockReturnValue(u)
    expect(commands.underline.isActive(mockEngine)).toBe(true)
  })

  it('should return true for strikethrough isActive when inside <s>', () => {
    const s = document.createElement('s')
    s.textContent = 'struck'
    mockEngine.element.appendChild(s)

    mockEngine.selection.getParentElement.mockReturnValue(s)
    expect(commands.strikethrough.isActive(mockEngine)).toBe(true)
  })

  it('should return true for subscript isActive when inside <sub>', () => {
    const sub = document.createElement('sub')
    sub.textContent = 'sub'
    mockEngine.element.appendChild(sub)

    mockEngine.selection.getParentElement.mockReturnValue(sub)
    expect(commands.subscript.isActive(mockEngine)).toBe(true)
  })

  it('should return false for subscript isActive when not inside <sub>', () => {
    const p = document.createElement('p')
    mockEngine.element.appendChild(p)

    mockEngine.selection.getParentElement.mockReturnValue(p)
    expect(commands.subscript.isActive(mockEngine)).toBe(false)
  })

  it('should return true for superscript isActive when inside <sup>', () => {
    const sup = document.createElement('sup')
    sup.textContent = 'sup'
    mockEngine.element.appendChild(sup)

    mockEngine.selection.getParentElement.mockReturnValue(sup)
    expect(commands.superscript.isActive(mockEngine)).toBe(true)
  })

  it('should return false for superscript isActive when not inside <sup>', () => {
    const p = document.createElement('p')
    mockEngine.element.appendChild(p)

    mockEngine.selection.getParentElement.mockReturnValue(p)
    expect(commands.superscript.isActive(mockEngine)).toBe(false)
  })

  it('should not have isActive on removeFormat', () => {
    expect(commands.removeFormat.isActive).toBeUndefined()
  })

  it('should have correct meta for removeFormat', () => {
    expect(commands.removeFormat.meta).toEqual({ icon: 'removeFormat', tooltip: 'Remove Formatting' })
  })

  it('should return false for isActive when getParentElement returns null', () => {
    mockEngine.selection.getParentElement.mockReturnValue(null)
    expect(commands.bold.isActive(mockEngine)).toBe(false)
    expect(commands.italic.isActive(mockEngine)).toBe(false)
    expect(commands.underline.isActive(mockEngine)).toBe(false)
    expect(commands.strikethrough.isActive(mockEngine)).toBe(false)
    expect(commands.subscript.isActive(mockEngine)).toBe(false)
    expect(commands.superscript.isActive(mockEngine)).toBe(false)
  })

  it('should unwrap existing <strong> tag when toggling bold off', () => {
    const p = document.createElement('p')
    const strong = document.createElement('strong')
    strong.textContent = 'bold'
    p.appendChild(strong)
    mockEngine.element.appendChild(p)

    const textNode = strong.firstChild
    const range = document.createRange()
    range.setStart(textNode, 0)
    range.setEnd(textNode, 4)

    const sel = window.getSelection()
    sel.removeAllRanges()
    sel.addRange(range)

    mockEngine.selection.getSelection.mockReturnValue(sel)
    mockEngine.selection.getParentElement.mockReturnValue(strong)

    commands.bold.execute(mockEngine)
    expect(mockEngine.element.querySelector('strong')).toBeNull()
    expect(p.textContent).toBe('bold')
  })
})
