import { registerLinkCommands } from '../commands/links.js'

describe('registerLinkCommands', () => {
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
        wrapWith: jest.fn(),
        unwrap: jest.fn(),
        getClosestElement: jest.fn(),
        getSelectedText: jest.fn(),
      },
      sanitizer: { sanitize: jest.fn(html => html) },
      getHTML: jest.fn().mockReturnValue('<p>test</p>'),
      setHTML: jest.fn(),
      options: { baseHeadingLevel: 0 },
      isMarkdownMode: false,
      isSourceMode: false,
    }

    registerLinkCommands(mockEngine)
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('should register insertLink, editLink, and removeLink', () => {
    expect(mockEngine.commands.register).toHaveBeenCalledTimes(3)
    expect(commands.insertLink).toBeDefined()
    expect(commands.editLink).toBeDefined()
    expect(commands.removeLink).toBeDefined()
  })

  it('should have mod+k shortcut for insertLink', () => {
    expect(commands.insertLink.shortcut).toBe('mod+k')
  })

  it('should not insert link when no href', () => {
    commands.insertLink.execute(mockEngine, { href: '' })
    expect(mockEngine.selection.wrapWith).not.toHaveBeenCalled()
    expect(mockEngine.selection.insertHTML).not.toHaveBeenCalled()
  })

  it('should wrap selected text with link when text is selected', () => {
    mockEngine.selection.getSelectedText.mockReturnValue('click here')
    mockEngine.selection.wrapWith.mockReturnValue(document.createElement('a'))

    commands.insertLink.execute(mockEngine, { href: 'https://example.com' })
    expect(mockEngine.selection.wrapWith).toHaveBeenCalledWith('a', {
      href: 'https://example.com',
      target: '_blank',
      rel: 'noopener noreferrer',
    })
  })

  it('should update link text when different text is provided', () => {
    mockEngine.selection.getSelectedText.mockReturnValue('old text')
    const link = document.createElement('a')
    mockEngine.selection.wrapWith.mockReturnValue(link)

    commands.insertLink.execute(mockEngine, { href: 'https://example.com', text: 'new text' })
    expect(link.textContent).toBe('new text')
  })

  it('should insert HTML when no text is selected', () => {
    mockEngine.selection.getSelectedText.mockReturnValue('')
    commands.insertLink.execute(mockEngine, { href: 'https://example.com', text: 'my link' })
    expect(mockEngine.selection.insertHTML).toHaveBeenCalled()
    const html = mockEngine.selection.insertHTML.mock.calls[0][0]
    expect(html).toContain('href="https://example.com"')
    expect(html).toContain('my link')
  })

  it('should use href as display text when no text provided and no selection', () => {
    mockEngine.selection.getSelectedText.mockReturnValue('')
    commands.insertLink.execute(mockEngine, { href: 'https://example.com' })
    const html = mockEngine.selection.insertHTML.mock.calls[0][0]
    expect(html).toContain('https://example.com')
  })

  it('should not add rel attribute when target is not _blank', () => {
    mockEngine.selection.getSelectedText.mockReturnValue('')
    commands.insertLink.execute(mockEngine, { href: 'https://example.com', target: '_self' })
    const html = mockEngine.selection.insertHTML.mock.calls[0][0]
    expect(html).not.toContain('noopener')
  })

  it('should edit link href', () => {
    const linkEl = document.createElement('a')
    linkEl.href = 'https://old.com'
    mockEngine.selection.getClosestElement.mockReturnValue(linkEl)

    commands.editLink.execute(mockEngine, { href: 'https://new.com' })
    expect(linkEl.href).toBe('https://new.com/')
  })

  it('should edit link text content', () => {
    const linkEl = document.createElement('a')
    linkEl.textContent = 'old'
    mockEngine.selection.getClosestElement.mockReturnValue(linkEl)

    commands.editLink.execute(mockEngine, { text: 'new text' })
    expect(linkEl.textContent).toBe('new text')
  })

  it('should set rel on editLink when target is _blank', () => {
    const linkEl = document.createElement('a')
    mockEngine.selection.getClosestElement.mockReturnValue(linkEl)

    commands.editLink.execute(mockEngine, { target: '_blank' })
    expect(linkEl.target).toBe('_blank')
    expect(linkEl.rel).toBe('noopener noreferrer')
  })

  it('should remove rel on editLink when target is not _blank', () => {
    const linkEl = document.createElement('a')
    linkEl.rel = 'noopener noreferrer'
    mockEngine.selection.getClosestElement.mockReturnValue(linkEl)

    commands.editLink.execute(mockEngine, { target: '_self' })
    expect(linkEl.target).toBe('_self')
    expect(linkEl.hasAttribute('rel')).toBe(false)
  })

  it('should do nothing on editLink when no link element found', () => {
    mockEngine.selection.getClosestElement.mockReturnValue(null)
    expect(() => commands.editLink.execute(mockEngine, { href: 'test' })).not.toThrow()
  })

  it('should call unwrap on removeLink', () => {
    commands.removeLink.execute(mockEngine)
    expect(mockEngine.selection.unwrap).toHaveBeenCalledWith('a')
  })

  it('should have correct meta', () => {
    expect(commands.insertLink.meta).toEqual({ icon: 'link', tooltip: 'Insert Link' })
    expect(commands.removeLink.meta).toEqual({ icon: 'unlink', tooltip: 'Remove Link' })
  })
})
