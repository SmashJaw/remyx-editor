import { registerAttachmentCommands } from '../commands/attachments.js'

describe('registerAttachmentCommands', () => {
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
        insertNode: jest.fn(),
        wrapWith: jest.fn(),
        unwrap: jest.fn(),
        setRange: jest.fn(),
      },
      sanitizer: { sanitize: jest.fn(html => html) },
      getHTML: jest.fn().mockReturnValue('<p>test</p>'),
      setHTML: jest.fn(),
      options: { baseHeadingLevel: 0 },
      isMarkdownMode: false,
      isSourceMode: false,
    }

    // Make insertNode actually append to DOM so parentNode checks work
    mockEngine.selection.insertNode.mockImplementation((node) => {
      mockEngine.element.appendChild(node)
    })

    registerAttachmentCommands(mockEngine)
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('should register insertAttachment and removeAttachment', () => {
    expect(mockEngine.commands.register).toHaveBeenCalledTimes(2)
    expect(commands.insertAttachment).toBeDefined()
    expect(commands.removeAttachment).toBeDefined()
  })

  it('should not insert attachment when no URL', () => {
    commands.insertAttachment.execute(mockEngine, { url: '' })
    expect(mockEngine.selection.insertNode).not.toHaveBeenCalled()
  })

  it('should insert attachment with correct attributes', () => {
    mockEngine.selection.getRange.mockReturnValue(document.createRange())

    commands.insertAttachment.execute(mockEngine, {
      url: 'https://example.com/file.pdf',
      filename: 'report.pdf',
      filesize: 1024,
    })

    expect(mockEngine.selection.insertNode).toHaveBeenCalled()
    const a = mockEngine.selection.insertNode.mock.calls[0][0]
    expect(a.tagName).toBe('A')
    expect(a.href).toContain('file.pdf')
    expect(a.className).toBe('rmx-attachment')
    expect(a.getAttribute('data-attachment')).toBe('true')
    expect(a.getAttribute('data-filename')).toBe('report.pdf')
    expect(a.getAttribute('data-filesize')).toBe('1024')
    expect(a.target).toBe('_blank')
    expect(a.rel).toBe('noopener noreferrer')
  })

  it('should use default filename when not provided', () => {
    mockEngine.selection.getRange.mockReturnValue(document.createRange())

    commands.insertAttachment.execute(mockEngine, { url: 'https://example.com/file.pdf' })
    const a = mockEngine.selection.insertNode.mock.calls[0][0]
    expect(a.getAttribute('data-filename')).toBe('file')
  })

  it('should display file size in text content', () => {
    mockEngine.selection.getRange.mockReturnValue(document.createRange())

    commands.insertAttachment.execute(mockEngine, {
      url: 'https://example.com/file.pdf',
      filename: 'doc.pdf',
      filesize: 2048,
    })
    const a = mockEngine.selection.insertNode.mock.calls[0][0]
    expect(a.textContent).toContain('doc.pdf')
    expect(a.textContent).toContain('2 KB')
  })

  it('should format MB file sizes', () => {
    mockEngine.selection.getRange.mockReturnValue(document.createRange())

    commands.insertAttachment.execute(mockEngine, {
      url: 'https://example.com/file.zip',
      filename: 'archive.zip',
      filesize: 5242880, // 5 MB
    })
    const a = mockEngine.selection.insertNode.mock.calls[0][0]
    expect(a.textContent).toContain('5 MB')
  })

  it('should not show file size when not provided', () => {
    mockEngine.selection.getRange.mockReturnValue(document.createRange())

    commands.insertAttachment.execute(mockEngine, {
      url: 'https://example.com/file.pdf',
      filename: 'doc.pdf',
    })
    const a = mockEngine.selection.insertNode.mock.calls[0][0]
    expect(a.textContent).not.toContain('(')
  })

  it('should create range at end when no selection range', () => {
    mockEngine.selection.getRange.mockReturnValue(null)
    commands.insertAttachment.execute(mockEngine, { url: 'https://example.com/file.pdf' })
    expect(mockEngine.selection.setRange).toHaveBeenCalled()
    expect(mockEngine.selection.insertNode).toHaveBeenCalled()
  })

  it('should remove attachment element', () => {
    const a = document.createElement('a')
    a.className = 'rmx-attachment'
    mockEngine.element.appendChild(a)

    commands.removeAttachment.execute(mockEngine, { element: a })
    expect(mockEngine.element.contains(a)).toBe(false)
  })

  it('should not remove non-attachment element', () => {
    const a = document.createElement('a')
    mockEngine.element.appendChild(a)

    commands.removeAttachment.execute(mockEngine, { element: a })
    expect(mockEngine.element.contains(a)).toBe(true)
  })

  it('should not throw when removing with null element', () => {
    expect(() => commands.removeAttachment.execute(mockEngine, { element: null })).not.toThrow()
  })

  it('should have correct meta', () => {
    expect(commands.insertAttachment.meta).toEqual({ icon: 'attachment', tooltip: 'Insert Attachment' })
    expect(commands.removeAttachment.meta).toEqual({ tooltip: 'Remove Attachment' })
  })
})
