import { registerFormattingCommands } from '../commands/formatting.js'

describe('registerFormattingCommands', () => {
  let commands
  let mockEngine

  beforeEach(() => {
    commands = {}
    document.execCommand = jest.fn().mockReturnValue(true)
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
      },
      sanitizer: { sanitize: jest.fn(html => html) },
      getHTML: jest.fn().mockReturnValue('<p>test</p>'),
      setHTML: jest.fn(),
      options: { baseHeadingLevel: 0 },
      isMarkdownMode: false,
      isSourceMode: false,
    }

    registerFormattingCommands(mockEngine)
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('should register all 7 formatting commands', () => {
    expect(mockEngine.commands.register).toHaveBeenCalledTimes(7)
    expect(commands.bold).toBeDefined()
    expect(commands.italic).toBeDefined()
    expect(commands.underline).toBeDefined()
    expect(commands.strikethrough).toBeDefined()
    expect(commands.subscript).toBeDefined()
    expect(commands.superscript).toBeDefined()
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

  it('should call document.execCommand for bold execute', () => {
    const spy = jest.spyOn(document, 'execCommand').mockReturnValue(true)
    commands.bold.execute()
    expect(spy).toHaveBeenCalledWith('bold', false, null)
    spy.mockRestore()
  })

  it('should call document.execCommand for italic execute', () => {
    const spy = jest.spyOn(document, 'execCommand').mockReturnValue(true)
    commands.italic.execute()
    expect(spy).toHaveBeenCalledWith('italic', false, null)
    spy.mockRestore()
  })

  it('should call document.execCommand for strikethrough execute', () => {
    const spy = jest.spyOn(document, 'execCommand').mockReturnValue(true)
    commands.strikethrough.execute()
    expect(spy).toHaveBeenCalledWith('strikeThrough', false, null)
    spy.mockRestore()
  })

  it('should call document.execCommand for removeFormat execute', () => {
    const spy = jest.spyOn(document, 'execCommand').mockReturnValue(true)
    commands.removeFormat.execute()
    expect(spy).toHaveBeenCalledWith('removeFormat', false, null)
    spy.mockRestore()
  })

  it('should check queryCommandState for bold isActive', () => {
    const spy = jest.spyOn(document, 'queryCommandState').mockReturnValue(true)
    expect(commands.bold.isActive()).toBe(true)
    expect(spy).toHaveBeenCalledWith('bold')
    spy.mockRestore()
  })

  it('should check queryCommandState for italic isActive', () => {
    const spy = jest.spyOn(document, 'queryCommandState').mockReturnValue(false)
    expect(commands.italic.isActive()).toBe(false)
    expect(spy).toHaveBeenCalledWith('italic')
    spy.mockRestore()
  })

  it('should not have isActive on removeFormat', () => {
    expect(commands.removeFormat.isActive).toBeUndefined()
  })

  it('should have correct meta for removeFormat', () => {
    expect(commands.removeFormat.meta).toEqual({ icon: 'removeFormat', tooltip: 'Remove Formatting' })
  })
})
