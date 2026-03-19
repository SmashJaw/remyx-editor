import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { registerImportDocumentCommands } from '../commands/importDocument.js'

describe('registerImportDocumentCommands', () => {
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
        setRange: vi.fn(),
      },
      sanitizer: { sanitize: vi.fn(html => html) },
      getHTML: vi.fn().mockReturnValue('<p>test</p>'),
      setHTML: vi.fn(),
      options: { baseHeadingLevel: 0 },
      isMarkdownMode: false,
      isSourceMode: false,
    }

    registerImportDocumentCommands(mockEngine)
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('should register importDocument command', () => {
    expect(mockEngine.commands.register).toHaveBeenCalledTimes(1)
    expect(commands.importDocument).toBeDefined()
  })

  it('should not do anything when no HTML provided', () => {
    commands.importDocument.execute(mockEngine, { html: '' })
    expect(mockEngine.setHTML).not.toHaveBeenCalled()
    expect(mockEngine.selection.insertHTML).not.toHaveBeenCalled()
  })

  it('should replace content in replace mode', () => {
    commands.importDocument.execute(mockEngine, { html: '<p>new content</p>', mode: 'replace' })
    expect(mockEngine.setHTML).toHaveBeenCalledWith('<p>new content</p>')
  })

  it('should insert at cursor in insert mode (default)', () => {
    mockEngine.selection.getRange.mockReturnValue(document.createRange())

    commands.importDocument.execute(mockEngine, { html: '<p>inserted</p>' })
    expect(mockEngine.sanitizer.sanitize).toHaveBeenCalledWith('<p>inserted</p>')
    expect(mockEngine.selection.insertHTML).toHaveBeenCalled()
  })

  it('should create range at end when no selection and inserting', () => {
    mockEngine.selection.getRange.mockReturnValue(null)

    commands.importDocument.execute(mockEngine, { html: '<p>inserted</p>' })
    expect(mockEngine.selection.setRange).toHaveBeenCalled()
    expect(mockEngine.selection.insertHTML).toHaveBeenCalled()
  })

  it('should emit content:change after import', () => {
    commands.importDocument.execute(mockEngine, { html: '<p>content</p>', mode: 'replace' })
    expect(mockEngine.eventBus.emit).toHaveBeenCalledWith('content:change')
  })

  it('should sanitize HTML in insert mode', () => {
    mockEngine.selection.getRange.mockReturnValue(document.createRange())
    mockEngine.sanitizer.sanitize.mockReturnValue('<p>clean</p>')

    commands.importDocument.execute(mockEngine, { html: '<script>alert("xss")</script><p>clean</p>' })
    expect(mockEngine.sanitizer.sanitize).toHaveBeenCalled()
    expect(mockEngine.selection.insertHTML).toHaveBeenCalledWith('<p>clean</p>')
  })

  it('should focus element before importing', () => {
    const focusSpy = vi.spyOn(mockEngine.element, 'focus')
    commands.importDocument.execute(mockEngine, { html: '<p>content</p>', mode: 'replace' })
    expect(focusSpy).toHaveBeenCalled()
  })

  it('should have correct meta', () => {
    expect(commands.importDocument.meta).toEqual({ icon: 'importDocument', tooltip: 'Import Document' })
  })
})
