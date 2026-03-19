import { vi } from 'vitest'
import { registerListCommands } from '../commands/lists.js'

describe('registerListCommands', () => {
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
        getClosestElement: vi.fn(),
        getParentBlock: vi.fn(),
        setRange: vi.fn(),
      },
      sanitizer: { sanitize: vi.fn(html => html) },
      getHTML: vi.fn().mockReturnValue('<p>test</p>'),
      setHTML: vi.fn(),
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

  it('should wrap block in <ol><li> when executing orderedList on a paragraph', () => {
    const p = document.createElement('p')
    p.textContent = 'Item text'
    mockEngine.element.appendChild(p)

    mockEngine.selection.getClosestElement.mockReturnValue(null)
    mockEngine.selection.getParentBlock.mockReturnValue(p)

    commands.orderedList.execute(mockEngine)
    const ol = mockEngine.element.querySelector('ol')
    expect(ol).not.toBeNull()
    expect(ol.querySelector('li').textContent).toBe('Item text')
  })

  it('should unwrap list when executing orderedList on existing ol', () => {
    const ol = document.createElement('ol')
    const li = document.createElement('li')
    li.textContent = 'Item'
    ol.appendChild(li)
    mockEngine.element.appendChild(ol)

    mockEngine.selection.getClosestElement.mockImplementation((tag) => {
      if (tag === 'ol') return ol
      return null
    })

    commands.orderedList.execute(mockEngine)
    expect(mockEngine.element.querySelector('ol')).toBeNull()
    expect(mockEngine.element.querySelector('p')).not.toBeNull()
  })

  it('should wrap block in <ul><li> when executing unorderedList on a paragraph', () => {
    const p = document.createElement('p')
    p.textContent = 'Item text'
    mockEngine.element.appendChild(p)

    mockEngine.selection.getClosestElement.mockReturnValue(null)
    mockEngine.selection.getParentBlock.mockReturnValue(p)

    commands.unorderedList.execute(mockEngine)
    const ul = mockEngine.element.querySelector('ul')
    expect(ul).not.toBeNull()
    expect(ul.querySelector('li').textContent).toBe('Item text')
  })

  it('should convert ul to ol when executing orderedList on existing ul', () => {
    const ul = document.createElement('ul')
    const li = document.createElement('li')
    li.textContent = 'Item'
    ul.appendChild(li)
    mockEngine.element.appendChild(ul)

    mockEngine.selection.getClosestElement.mockImplementation((tag) => {
      if (tag === 'ol') return null
      if (tag === 'ul') return ul
      return null
    })

    commands.orderedList.execute(mockEngine)
    expect(mockEngine.element.querySelector('ul')).toBeNull()
    expect(mockEngine.element.querySelector('ol')).not.toBeNull()
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

  it('should indent a list item into previous sibling', () => {
    const ul = document.createElement('ul')
    const li1 = document.createElement('li')
    li1.textContent = 'First'
    const li2 = document.createElement('li')
    li2.textContent = 'Second'
    ul.appendChild(li1)
    ul.appendChild(li2)
    mockEngine.element.appendChild(ul)

    mockEngine.selection.getClosestElement.mockImplementation((tag) => {
      if (tag === 'li') return li2
      return null
    })

    commands.indent.execute(mockEngine)
    const subList = li1.querySelector('ul')
    expect(subList).not.toBeNull()
    expect(subList.contains(li2)).toBe(true)
  })

  it('should outdent a nested list item', () => {
    const ul = document.createElement('ul')
    const li1 = document.createElement('li')
    li1.textContent = 'First'
    const subUl = document.createElement('ul')
    const li2 = document.createElement('li')
    li2.textContent = 'Nested'
    subUl.appendChild(li2)
    li1.appendChild(subUl)
    ul.appendChild(li1)
    mockEngine.element.appendChild(ul)

    mockEngine.selection.getClosestElement.mockImplementation((tag) => {
      if (tag === 'li') return li2
      return null
    })

    commands.outdent.execute(mockEngine)
    // li2 should now be a direct child of ul, after li1
    expect(ul.contains(li2)).toBe(true)
    expect(li2.parentElement).toBe(ul)
  })
})
