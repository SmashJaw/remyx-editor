import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('../utils/markdownConverter.js', () => ({
  htmlToMarkdown: vi.fn((html) => `# Markdown from ${html}`),
  markdownToHtml: vi.fn((md) => `<h1>${md}</h1>`),
}))

import { registerMarkdownToggleCommands } from '../commands/markdownToggle.js'
import { htmlToMarkdown, markdownToHtml } from '../utils/markdownConverter.js'

describe('registerMarkdownToggleCommands', () => {
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
      },
      sanitizer: { sanitize: vi.fn(html => html) },
      getHTML: vi.fn().mockReturnValue('<p>test</p>'),
      setHTML: vi.fn(),
      options: { baseHeadingLevel: 0 },
      isMarkdownMode: false,
      isSourceMode: false,
    }

    registerMarkdownToggleCommands(mockEngine)
  })

  afterEach(() => {
    document.body.innerHTML = ''
    vi.clearAllMocks()
  })

  it('should register toggleMarkdown command', () => {
    expect(mockEngine.commands.register).toHaveBeenCalledTimes(1)
    expect(commands.toggleMarkdown).toBeDefined()
  })

  it('should take a history snapshot before toggling', () => {
    commands.toggleMarkdown.execute(mockEngine)
    expect(mockEngine.history.snapshot).toHaveBeenCalled()
  })

  it('should convert HTML to markdown when toggling on', () => {
    mockEngine.isMarkdownMode = false
    commands.toggleMarkdown.execute(mockEngine)

    expect(mockEngine.getHTML).toHaveBeenCalled()
    expect(htmlToMarkdown).toHaveBeenCalled()
    expect(mockEngine.isMarkdownMode).toBe(true)
  })

  it('should set element textContent with markdown', () => {
    mockEngine.isMarkdownMode = false
    commands.toggleMarkdown.execute(mockEngine)

    expect(mockEngine.element.textContent).toContain('Markdown')
  })

  it('should convert markdown to HTML when toggling off', () => {
    mockEngine.isMarkdownMode = true
    mockEngine.element.textContent = '# Hello'

    commands.toggleMarkdown.execute(mockEngine)

    expect(markdownToHtml).toHaveBeenCalledWith('# Hello')
    expect(mockEngine.setHTML).toHaveBeenCalled()
    expect(mockEngine.isMarkdownMode).toBe(false)
  })

  it('should toggle rmx-markdown-mode class on element', () => {
    mockEngine.isMarkdownMode = false
    commands.toggleMarkdown.execute(mockEngine)
    expect(mockEngine.element.classList.contains('rmx-markdown-mode')).toBe(true)

    commands.toggleMarkdown.execute(mockEngine)
    expect(mockEngine.element.classList.contains('rmx-markdown-mode')).toBe(false)
  })

  it('should emit mode:change:markdown event', () => {
    commands.toggleMarkdown.execute(mockEngine)
    expect(mockEngine.eventBus.emit).toHaveBeenCalledWith('mode:change:markdown', { markdownMode: true })
  })

  it('should emit content:change event', () => {
    commands.toggleMarkdown.execute(mockEngine)
    expect(mockEngine.eventBus.emit).toHaveBeenCalledWith('content:change')
  })

  it('should return true for isActive when in markdown mode', () => {
    mockEngine.isMarkdownMode = true
    expect(commands.toggleMarkdown.isActive(mockEngine)).toBe(true)
  })

  it('should return false for isActive when not in markdown mode', () => {
    mockEngine.isMarkdownMode = false
    expect(commands.toggleMarkdown.isActive(mockEngine)).toBe(false)
  })

  it('should have correct meta', () => {
    expect(commands.toggleMarkdown.meta).toEqual({ icon: 'toggleMarkdown', tooltip: 'Toggle Markdown' })
  })
})
