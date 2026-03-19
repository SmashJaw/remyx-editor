import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { registerFormattingCommands } from '../commands/formatting.js'

describe('registerFormattingCommands', () => {
  let commands
  let mockEngine

  beforeEach(() => {
    commands = {}
    document.execCommand = vi.fn().mockReturnValue(true)
    document.queryCommandState = vi.fn().mockReturnValue(false)

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
    const spy = vi.spyOn(document, 'execCommand').mockReturnValue(true)
    commands.bold.execute()
    expect(spy).toHaveBeenCalledWith('bold', false, null)
    spy.mockRestore()
  })

  it('should call document.execCommand for italic execute', () => {
    const spy = vi.spyOn(document, 'execCommand').mockReturnValue(true)
    commands.italic.execute()
    expect(spy).toHaveBeenCalledWith('italic', false, null)
    spy.mockRestore()
  })

  it('should call document.execCommand for strikethrough execute', () => {
    const spy = vi.spyOn(document, 'execCommand').mockReturnValue(true)
    commands.strikethrough.execute()
    expect(spy).toHaveBeenCalledWith('strikeThrough', false, null)
    spy.mockRestore()
  })

  it('should call document.execCommand for removeFormat execute', () => {
    const spy = vi.spyOn(document, 'execCommand').mockReturnValue(true)
    commands.removeFormat.execute()
    expect(spy).toHaveBeenCalledWith('removeFormat', false, null)
    spy.mockRestore()
  })

  it('should check queryCommandState for bold isActive', () => {
    const spy = vi.spyOn(document, 'queryCommandState').mockReturnValue(true)
    expect(commands.bold.isActive()).toBe(true)
    expect(spy).toHaveBeenCalledWith('bold')
    spy.mockRestore()
  })

  it('should check queryCommandState for italic isActive', () => {
    const spy = vi.spyOn(document, 'queryCommandState').mockReturnValue(false)
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

  it('should call document.execCommand for underline execute', () => {
    const spy = vi.spyOn(document, 'execCommand').mockReturnValue(true)
    commands.underline.execute()
    expect(spy).toHaveBeenCalledWith('underline', false, null)
    spy.mockRestore()
  })

  it('should check queryCommandState for underline isActive', () => {
    const spy = vi.spyOn(document, 'queryCommandState').mockReturnValue(true)
    expect(commands.underline.isActive()).toBe(true)
    expect(spy).toHaveBeenCalledWith('underline')
    spy.mockRestore()
  })

  it('should call document.execCommand for subscript execute', () => {
    const spy = vi.spyOn(document, 'execCommand').mockReturnValue(true)
    commands.subscript.execute()
    expect(spy).toHaveBeenCalledWith('subscript', false, null)
    spy.mockRestore()
  })

  it('should check queryCommandState for subscript isActive', () => {
    const spy = vi.spyOn(document, 'queryCommandState').mockReturnValue(true)
    expect(commands.subscript.isActive()).toBe(true)
    expect(spy).toHaveBeenCalledWith('subscript')
    spy.mockRestore()
  })

  it('should call document.execCommand for superscript execute', () => {
    const spy = vi.spyOn(document, 'execCommand').mockReturnValue(true)
    commands.superscript.execute()
    expect(spy).toHaveBeenCalledWith('superscript', false, null)
    spy.mockRestore()
  })

  it('should check queryCommandState for superscript isActive', () => {
    const spy = vi.spyOn(document, 'queryCommandState').mockReturnValue(false)
    expect(commands.superscript.isActive()).toBe(false)
    expect(spy).toHaveBeenCalledWith('superscript')
    spy.mockRestore()
  })

  it('should check queryCommandState for strikethrough isActive', () => {
    const spy = vi.spyOn(document, 'queryCommandState').mockReturnValue(true)
    expect(commands.strikethrough.isActive()).toBe(true)
    expect(spy).toHaveBeenCalledWith('strikeThrough')
    spy.mockRestore()
  })
})
