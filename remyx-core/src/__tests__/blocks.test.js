import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { registerBlockCommands } from '../commands/blocks.js'

describe('registerBlockCommands', () => {
  let commands
  let mockEngine

  beforeEach(() => {
    commands = {}
    document.execCommand = vi.fn().mockReturnValue(true)

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
        getClosestElement: vi.fn(),
        setRange: vi.fn(),
      },
      sanitizer: { sanitize: vi.fn(html => html) },
      getHTML: vi.fn().mockReturnValue('<p>test</p>'),
      setHTML: vi.fn(),
      options: { baseHeadingLevel: 0 },
      isMarkdownMode: false,
      isSourceMode: false,
    }

    registerBlockCommands(mockEngine)
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('should register blockquote, codeBlock, and horizontalRule', () => {
    expect(mockEngine.commands.register).toHaveBeenCalledTimes(3)
    expect(commands.blockquote).toBeDefined()
    expect(commands.codeBlock).toBeDefined()
    expect(commands.horizontalRule).toBeDefined()
  })

  it('should have correct shortcuts', () => {
    expect(commands.blockquote.shortcut).toBe('mod+shift+9')
    expect(commands.codeBlock.shortcut).toBe('mod+shift+c')
  })

  it('should create blockquote via execCommand when not in one', () => {
    mockEngine.selection.getClosestElement.mockReturnValue(null)
    const spy = vi.spyOn(document, 'execCommand').mockReturnValue(true)

    commands.blockquote.execute(mockEngine)
    expect(spy).toHaveBeenCalledWith('formatBlock', false, '<blockquote>')
    spy.mockRestore()
  })

  it('should unwrap blockquote when already in one', () => {
    const bq = document.createElement('blockquote')
    const p = document.createElement('p')
    p.textContent = 'content'
    bq.appendChild(p)
    mockEngine.element.appendChild(bq)

    mockEngine.selection.getClosestElement.mockReturnValue(bq)

    commands.blockquote.execute(mockEngine)
    expect(mockEngine.element.querySelector('blockquote')).toBeNull()
    expect(mockEngine.element.querySelector('p')).not.toBeNull()
  })

  it('should return true for blockquote isActive when inside blockquote', () => {
    mockEngine.selection.getClosestElement.mockReturnValue(document.createElement('blockquote'))
    expect(commands.blockquote.isActive(mockEngine)).toBe(true)
  })

  it('should return false for blockquote isActive when not inside blockquote', () => {
    mockEngine.selection.getClosestElement.mockReturnValue(null)
    expect(commands.blockquote.isActive(mockEngine)).toBe(false)
  })

  it('should create code block when not in one', () => {
    mockEngine.selection.getClosestElement.mockReturnValue(null)
    const range = document.createRange()
    range.selectNodeContents(mockEngine.element)
    range.collapse(true)
    mockEngine.selection.getRange.mockReturnValue(range)

    commands.codeBlock.execute(mockEngine)
    const pre = mockEngine.element.querySelector('pre')
    expect(pre).not.toBeNull()
    expect(pre.querySelector('code')).not.toBeNull()
  })

  it('should unwrap code block when already in one', () => {
    const pre = document.createElement('pre')
    const code = document.createElement('code')
    code.textContent = 'some code'
    pre.appendChild(code)
    mockEngine.element.appendChild(pre)

    mockEngine.selection.getClosestElement.mockReturnValue(pre)

    commands.codeBlock.execute(mockEngine)
    expect(mockEngine.element.querySelector('pre')).toBeNull()
    const p = mockEngine.element.querySelector('p')
    expect(p).not.toBeNull()
    expect(p.textContent).toBe('some code')
  })

  it('should return true for codeBlock isActive when inside pre', () => {
    mockEngine.selection.getClosestElement.mockReturnValue(document.createElement('pre'))
    expect(commands.codeBlock.isActive(mockEngine)).toBe(true)
  })

  it('should execute horizontalRule with insertHorizontalRule', () => {
    const spy = vi.spyOn(document, 'execCommand').mockReturnValue(true)
    commands.horizontalRule.execute()
    expect(spy).toHaveBeenCalledWith('insertHorizontalRule', false, null)
    spy.mockRestore()
  })

  it('should have correct meta for all block commands', () => {
    expect(commands.blockquote.meta).toEqual({ icon: 'blockquote', tooltip: 'Blockquote' })
    expect(commands.codeBlock.meta).toEqual({ icon: 'codeBlock', tooltip: 'Code Block' })
    expect(commands.horizontalRule.meta).toEqual({ icon: 'horizontalRule', tooltip: 'Horizontal Rule' })
  })
})
