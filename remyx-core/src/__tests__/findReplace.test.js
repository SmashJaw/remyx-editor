import { registerFindReplaceCommands } from '../commands/findReplace.js'

describe('registerFindReplaceCommands', () => {
  let commands
  let mockEngine

  beforeEach(() => {
    commands = {}
    // jsdom doesn't implement scrollIntoView
    Element.prototype.scrollIntoView = jest.fn()

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

    registerFindReplaceCommands(mockEngine)
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('should register all 6 find/replace commands', () => {
    expect(commands.find).toBeDefined()
    expect(commands.findNext).toBeDefined()
    expect(commands.findPrev).toBeDefined()
    expect(commands.replace).toBeDefined()
    expect(commands.replaceAll).toBeDefined()
    expect(commands.clearFind).toBeDefined()
  })

  it('should have mod+f shortcut for find', () => {
    expect(commands.find.shortcut).toBe('mod+f')
  })

  it('should find text and return match count', () => {
    mockEngine.element.textContent = 'hello world hello'
    const result = commands.find.execute(mockEngine, { text: 'hello' })
    expect(result.total).toBe(2)
    expect(result.current).toBe(1)
  })

  it('should emit find:results event', () => {
    mockEngine.element.textContent = 'hello world'
    commands.find.execute(mockEngine, { text: 'hello' })
    expect(mockEngine.eventBus.emit).toHaveBeenCalledWith('find:results', {
      total: 1,
      current: 1,
    })
  })

  it('should return zero matches for non-existing text', () => {
    mockEngine.element.textContent = 'hello world'
    const result = commands.find.execute(mockEngine, { text: 'xyz' })
    expect(result.total).toBe(0)
    expect(result.current).toBe(0)
  })

  it('should handle empty search text', () => {
    mockEngine.element.textContent = 'hello world'
    const result = commands.find.execute(mockEngine, { text: '' })
    expect(result.total).toBe(0)
  })

  it('should create highlight marks for matches', () => {
    mockEngine.element.textContent = 'hello world hello'
    commands.find.execute(mockEngine, { text: 'hello' })
    const marks = mockEngine.element.querySelectorAll('mark.rmx-find-highlight')
    expect(marks.length).toBe(2)
  })

  it('should highlight current match with rmx-find-current class', () => {
    mockEngine.element.textContent = 'hello world hello'
    commands.find.execute(mockEngine, { text: 'hello' })
    const current = mockEngine.element.querySelector('mark.rmx-find-current')
    expect(current).not.toBeNull()
  })

  it('should navigate to next match with findNext', () => {
    mockEngine.element.textContent = 'aaa bbb aaa'
    commands.find.execute(mockEngine, { text: 'aaa' })
    commands.findNext.execute(mockEngine)

    expect(mockEngine.eventBus.emit).toHaveBeenCalledWith('find:results', {
      total: 2,
      current: 2,
    })
  })

  it('should wrap around on findNext', () => {
    mockEngine.element.textContent = 'aaa bbb aaa'
    commands.find.execute(mockEngine, { text: 'aaa' })
    commands.findNext.execute(mockEngine) // index 1
    commands.findNext.execute(mockEngine) // index 0 (wrap)

    const lastCall = mockEngine.eventBus.emit.mock.calls[mockEngine.eventBus.emit.mock.calls.length - 1]
    expect(lastCall[1].current).toBe(1) // back to first
  })

  it('should navigate to previous match with findPrev', () => {
    mockEngine.element.textContent = 'aaa bbb aaa'
    commands.find.execute(mockEngine, { text: 'aaa' })
    commands.findPrev.execute(mockEngine) // wraps to last

    const lastCall = mockEngine.eventBus.emit.mock.calls[mockEngine.eventBus.emit.mock.calls.length - 1]
    expect(lastCall[1].current).toBe(2)
  })

  it('should do nothing on findNext with no matches', () => {
    commands.findNext.execute(mockEngine)
    // Should not throw
  })

  it('should replace current match', () => {
    mockEngine.element.textContent = 'hello world hello'
    commands.find.execute(mockEngine, { text: 'hello' })
    commands.replace.execute(mockEngine, { replaceText: 'hi' })

    expect(mockEngine.eventBus.emit).toHaveBeenCalledWith('content:change')
    const marks = mockEngine.element.querySelectorAll('mark.rmx-find-highlight')
    expect(marks.length).toBe(1) // one match left
  })

  it('should replace all matches', () => {
    mockEngine.element.textContent = 'hello world hello'
    commands.find.execute(mockEngine, { text: 'hello' })
    const count = commands.replaceAll.execute(mockEngine, { replaceText: 'hi' })

    expect(count).toBe(2)
    expect(mockEngine.element.querySelectorAll('mark.rmx-find-highlight').length).toBe(0)
    expect(mockEngine.eventBus.emit).toHaveBeenCalledWith('content:change')
  })

  it('should clear highlights', () => {
    mockEngine.element.textContent = 'hello world'
    commands.find.execute(mockEngine, { text: 'hello' })
    expect(mockEngine.element.querySelectorAll('mark').length).toBeGreaterThan(0)

    commands.clearFind.execute(mockEngine)
    expect(mockEngine.element.querySelectorAll('mark').length).toBe(0)
  })

  it('should perform case-sensitive search', () => {
    mockEngine.element.textContent = 'Hello hello'
    const result = commands.find.execute(mockEngine, { text: 'Hello', caseSensitive: true })
    expect(result.total).toBe(1)
  })

  it('should perform case-insensitive search by default', () => {
    mockEngine.element.textContent = 'Hello hello'
    const result = commands.find.execute(mockEngine, { text: 'hello' })
    expect(result.total).toBe(2)
  })

  it('should have correct meta', () => {
    expect(commands.find.meta).toEqual({ icon: 'findReplace', tooltip: 'Find & Replace' })
    expect(commands.replaceAll.meta).toEqual({ tooltip: 'Replace All' })
  })
})
