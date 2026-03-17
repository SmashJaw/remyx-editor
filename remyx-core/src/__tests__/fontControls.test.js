import { registerFontCommands } from '../commands/fontControls.js'

describe('registerFontCommands', () => {
  let commands
  let mockEngine

  beforeEach(() => {
    commands = {}
    document.execCommand = jest.fn().mockReturnValue(true)
    document.queryCommandValue = jest.fn().mockReturnValue('')
    document.queryCommandState = jest.fn().mockReturnValue(false)

    const element = document.createElement('div')
    element.setAttribute('contenteditable', 'true')
    document.body.appendChild(element)

    mockEngine = {
      element,
      commands: {
        register: jest.fn((name, def) => { commands[name] = def }),
        execute: jest.fn((name, ...args) => commands[name]?.execute(mockEngine, ...args)),
      },
      keyboard: { register: jest.fn() },
      eventBus: { emit: jest.fn(), on: jest.fn() },
      history: { snapshot: jest.fn() },
      selection: {
        getSelection: jest.fn().mockReturnValue(window.getSelection()),
        getRange: jest.fn(),
        save: jest.fn(),
        restore: jest.fn(),
        insertHTML: jest.fn(),
        wrapWith: jest.fn(),
        unwrap: jest.fn(),
        getParentElement: jest.fn(),
      },
      sanitizer: { sanitize: jest.fn(html => html) },
      getHTML: jest.fn().mockReturnValue('<p>test</p>'),
      setHTML: jest.fn(),
      options: { baseHeadingLevel: 0 },
      isMarkdownMode: false,
      isSourceMode: false,
    }

    registerFontCommands(mockEngine)
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('should register all 4 font commands', () => {
    expect(mockEngine.commands.register).toHaveBeenCalledTimes(4)
    expect(commands.fontFamily).toBeDefined()
    expect(commands.fontSize).toBeDefined()
    expect(commands.foreColor).toBeDefined()
    expect(commands.backColor).toBeDefined()
  })

  it('should execute fontFamily with fontName', () => {
    const spy = jest.spyOn(document, 'execCommand').mockReturnValue(true)
    commands.fontFamily.execute(mockEngine, 'Arial')
    expect(spy).toHaveBeenCalledWith('fontName', false, 'Arial')
    spy.mockRestore()
  })

  it('should not execute fontFamily when no family', () => {
    const spy = jest.spyOn(document, 'execCommand').mockReturnValue(true)
    commands.fontFamily.execute(mockEngine, '')
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })

  it('should execute foreColor', () => {
    const spy = jest.spyOn(document, 'execCommand').mockReturnValue(true)
    commands.foreColor.execute(mockEngine, '#ff0000')
    expect(spy).toHaveBeenCalledWith('foreColor', false, '#ff0000')
    spy.mockRestore()
  })

  it('should not execute foreColor when no color', () => {
    const spy = jest.spyOn(document, 'execCommand').mockReturnValue(true)
    commands.foreColor.execute(mockEngine, '')
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })

  it('should execute backColor with hiliteColor', () => {
    const spy = jest.spyOn(document, 'execCommand').mockReturnValue(true)
    commands.backColor.execute(mockEngine, '#00ff00')
    expect(spy).toHaveBeenCalledWith('hiliteColor', false, '#00ff00')
    spy.mockRestore()
  })

  it('should not execute backColor when no color', () => {
    const spy = jest.spyOn(document, 'execCommand').mockReturnValue(true)
    commands.backColor.execute(mockEngine, '')
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })

  it('should fall back to backColor when hiliteColor throws', () => {
    const spy = jest.spyOn(document, 'execCommand').mockImplementation((cmd) => {
      if (cmd === 'hiliteColor') throw new Error('not supported')
      return true
    })
    commands.backColor.execute(mockEngine, '#00ff00')
    expect(spy).toHaveBeenCalledWith('backColor', false, '#00ff00')
    spy.mockRestore()
  })

  it('should use queryCommandValue for fontFamily isActive', () => {
    const spy = jest.spyOn(document, 'queryCommandValue').mockReturnValue('Arial')
    expect(commands.fontFamily.isActive(mockEngine)).toBe('Arial')
    spy.mockRestore()
  })

  it('should return false for fontFamily isActive when no value', () => {
    const spy = jest.spyOn(document, 'queryCommandValue').mockReturnValue('')
    expect(commands.fontFamily.isActive(mockEngine)).toBe(false)
    spy.mockRestore()
  })

  it('should return false for fontFamily isActive when queryCommandValue throws', () => {
    const spy = jest.spyOn(document, 'queryCommandValue').mockImplementation(() => {
      throw new Error('not supported')
    })
    expect(commands.fontFamily.isActive(mockEngine)).toBe(false)
    spy.mockRestore()
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

    const sel = window.getSelection()
    sel.removeAllRanges()

    mockEngine.selection.getSelection.mockReturnValue(sel)
    mockEngine.selection.getParentElement.mockReturnValue(span)

    // Create a non-collapsed range to pass the collapsed check
    Object.defineProperty(sel, 'rangeCount', { value: 1, configurable: true })
    const range = document.createRange()
    range.selectNodeContents(span)
    jest.spyOn(sel, 'getRangeAt').mockReturnValue(range)

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
    range.surroundContents = jest.fn(() => { throw new Error('partial overlap') })

    const sel = window.getSelection()
    sel.removeAllRanges()
    sel.addRange(range)

    // Ensure getRangeAt returns our modified range object
    jest.spyOn(sel, 'getRangeAt').mockReturnValue(range)

    mockEngine.selection.getSelection.mockReturnValue(sel)
    mockEngine.selection.getParentElement.mockReturnValue(null)

    commands.fontSize.execute(mockEngine, '18px')
    expect(range.surroundContents).toHaveBeenCalled()
    const span = mockEngine.element.querySelector('span')
    expect(span).not.toBeNull()
    expect(span.style.fontSize).toBe('18px')
  })

  it('should return a value for foreColor isActive when queryCommandValue returns a color', () => {
    const spy = jest.spyOn(document, 'queryCommandValue').mockReturnValue('rgb(255, 0, 0)')
    expect(commands.foreColor.isActive()).toBe('rgb(255, 0, 0)')
    spy.mockRestore()
  })

  it('should return false for foreColor isActive when queryCommandValue throws', () => {
    const spy = jest.spyOn(document, 'queryCommandValue').mockImplementation(() => {
      throw new Error('not supported')
    })
    expect(commands.foreColor.isActive()).toBe(false)
    spy.mockRestore()
  })

  it('should return a value for backColor isActive when queryCommandValue returns a color', () => {
    const spy = jest.spyOn(document, 'queryCommandValue').mockReturnValue('rgb(0, 255, 0)')
    expect(commands.backColor.isActive()).toBe('rgb(0, 255, 0)')
    spy.mockRestore()
  })

  it('should return false for backColor isActive when queryCommandValue throws', () => {
    const spy = jest.spyOn(document, 'queryCommandValue').mockImplementation(() => {
      throw new Error('not supported')
    })
    expect(commands.backColor.isActive()).toBe(false)
    spy.mockRestore()
  })
})
