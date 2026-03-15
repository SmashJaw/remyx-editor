import { registerListCommands } from '../commands/lists.js'

describe('registerListCommands', () => {
  let commands
  let mockEngine

  beforeEach(() => {
    commands = {}
    document.execCommand = jest.fn().mockReturnValue(true)

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
      },
      sanitizer: { sanitize: jest.fn(html => html) },
      getHTML: jest.fn().mockReturnValue('<p>test</p>'),
      setHTML: jest.fn(),
      options: { baseHeadingLevel: 0 },
      isMarkdownMode: false,
      isSourceMode: false,
    }

    registerListCommands(mockEngine)
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('should register all 5 list commands', () => {
    expect(mockEngine.commands.register).toHaveBeenCalledTimes(5)
    expect(commands.orderedList).toBeDefined()
    expect(commands.unorderedList).toBeDefined()
    expect(commands.taskList).toBeDefined()
    expect(commands.indent).toBeDefined()
    expect(commands.outdent).toBeDefined()
  })

  it('should execute orderedList with insertOrderedList', () => {
    const spy = jest.spyOn(document, 'execCommand').mockReturnValue(true)
    commands.orderedList.execute()
    expect(spy).toHaveBeenCalledWith('insertOrderedList', false, null)
    spy.mockRestore()
  })

  it('should execute unorderedList with insertUnorderedList', () => {
    const spy = jest.spyOn(document, 'execCommand').mockReturnValue(true)
    commands.unorderedList.execute()
    expect(spy).toHaveBeenCalledWith('insertUnorderedList', false, null)
    spy.mockRestore()
  })

  it('should execute indent and outdent', () => {
    const spy = jest.spyOn(document, 'execCommand').mockReturnValue(true)
    commands.indent.execute()
    expect(spy).toHaveBeenCalledWith('indent', false, null)
    commands.outdent.execute()
    expect(spy).toHaveBeenCalledWith('outdent', false, null)
    spy.mockRestore()
  })

  it('should have correct shortcuts for ordered and unordered lists', () => {
    expect(commands.orderedList.shortcut).toBe('mod+shift+7')
    expect(commands.unorderedList.shortcut).toBe('mod+shift+8')
  })

  it('should return true for orderedList isActive when inside ol', () => {
    mockEngine.selection.getClosestElement.mockReturnValue(document.createElement('ol'))
    expect(commands.orderedList.isActive(mockEngine)).toBe(true)
  })

  it('should return false for orderedList isActive when not inside ol', () => {
    mockEngine.selection.getClosestElement.mockReturnValue(null)
    expect(commands.orderedList.isActive(mockEngine)).toBe(false)
  })

  it('should return false for unorderedList isActive when ul has rmx-task-list class', () => {
    const ul = document.createElement('ul')
    ul.classList.add('rmx-task-list')
    mockEngine.selection.getClosestElement.mockReturnValue(ul)
    expect(commands.unorderedList.isActive(mockEngine)).toBe(false)
  })

  it('should return true for unorderedList isActive when ul without task-list class', () => {
    const ul = document.createElement('ul')
    mockEngine.selection.getClosestElement.mockReturnValue(ul)
    expect(commands.unorderedList.isActive(mockEngine)).toBe(true)
  })

  it('should return true for taskList isActive when ul has rmx-task-list class', () => {
    const ul = document.createElement('ul')
    ul.classList.add('rmx-task-list')
    mockEngine.selection.getClosestElement.mockReturnValue(ul)
    expect(commands.taskList.isActive(mockEngine)).toBe(true)
  })

  it('should remove task list class when toggling off existing task list', () => {
    const ul = document.createElement('ul')
    ul.classList.add('rmx-task-list')
    const li = document.createElement('li')
    const checkbox = document.createElement('input')
    checkbox.className = 'rmx-task-checkbox'
    li.appendChild(checkbox)
    ul.appendChild(li)
    mockEngine.element.appendChild(ul)

    mockEngine.selection.getClosestElement.mockImplementation((tag) => {
      if (tag === 'ul') return ul
      return null
    })

    commands.taskList.execute(mockEngine)
    expect(ul.classList.contains('rmx-task-list')).toBe(false)
    expect(ul.querySelector('.rmx-task-checkbox')).toBeNull()
  })

  it('should add checkboxes when creating task list from existing ul', () => {
    const ul = document.createElement('ul')
    const li = document.createElement('li')
    li.textContent = 'Item'
    ul.appendChild(li)
    mockEngine.element.appendChild(ul)

    // First call returns no ul (not a task list yet), second returns the ul
    let callCount = 0
    mockEngine.selection.getClosestElement.mockImplementation((tag) => {
      if (tag === 'ul') {
        callCount++
        return callCount === 1 ? ul : ul
      }
      return null
    })

    // The ul doesn't have rmx-task-list yet, so it should add it
    commands.taskList.execute(mockEngine)
    expect(ul.classList.contains('rmx-task-list')).toBe(true)
    expect(li.querySelector('.rmx-task-checkbox')).not.toBeNull()
  })

  it('should have correct meta for list commands', () => {
    expect(commands.orderedList.meta).toEqual({ icon: 'orderedList', tooltip: 'Numbered List' })
    expect(commands.unorderedList.meta).toEqual({ icon: 'unorderedList', tooltip: 'Bulleted List' })
    expect(commands.taskList.meta).toEqual({ icon: 'taskList', tooltip: 'Task List' })
    expect(commands.indent.meta).toEqual({ icon: 'indent', tooltip: 'Increase Indent' })
    expect(commands.outdent.meta).toEqual({ icon: 'outdent', tooltip: 'Decrease Indent' })
  })
})
