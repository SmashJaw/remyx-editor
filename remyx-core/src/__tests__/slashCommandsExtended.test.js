import { vi } from 'vitest'
import {
  SLASH_COMMAND_ITEMS,
  registerSlashCommands,
  getRecentCommands,
  clearRecentCommands,
} from '../commands/slashCommands.js'

describe('SLASH_COMMAND_ITEMS actions', () => {
  it('heading1 action calls executeCommand', () => {
    const engine = { executeCommand: vi.fn(), commands: { has: vi.fn(() => true) } }
    const item = SLASH_COMMAND_ITEMS.find(i => i.id === 'heading1')
    item.action(engine)
    expect(engine.executeCommand).toHaveBeenCalledWith('heading', 1)
  })

  it('heading2 action calls executeCommand', () => {
    const engine = { executeCommand: vi.fn(), commands: { has: vi.fn(() => true) } }
    const item = SLASH_COMMAND_ITEMS.find(i => i.id === 'heading2')
    item.action(engine)
    expect(engine.executeCommand).toHaveBeenCalledWith('heading', 2)
  })

  it('heading3 action calls executeCommand', () => {
    const engine = { executeCommand: vi.fn(), commands: { has: vi.fn(() => true) } }
    const item = SLASH_COMMAND_ITEMS.find(i => i.id === 'heading3')
    item.action(engine)
    expect(engine.executeCommand).toHaveBeenCalledWith('heading', 3)
  })

  it('paragraph action calls executeCommand with p', () => {
    const engine = { executeCommand: vi.fn(), commands: { has: vi.fn(() => true) } }
    const item = SLASH_COMMAND_ITEMS.find(i => i.id === 'paragraph')
    item.action(engine)
    expect(engine.executeCommand).toHaveBeenCalledWith('heading', 'p')
  })

  it('blockquote action calls executeCommand', () => {
    const engine = { executeCommand: vi.fn(), commands: { has: vi.fn(() => true) } }
    const item = SLASH_COMMAND_ITEMS.find(i => i.id === 'blockquote')
    item.action(engine)
    expect(engine.executeCommand).toHaveBeenCalledWith('blockquote')
  })

  it('codeBlock action calls executeCommand', () => {
    const engine = { executeCommand: vi.fn(), commands: { has: vi.fn(() => true) } }
    const item = SLASH_COMMAND_ITEMS.find(i => i.id === 'codeBlock')
    item.action(engine)
    expect(engine.executeCommand).toHaveBeenCalledWith('codeBlock')
  })

  it('image action calls openModal', () => {
    const openModal = vi.fn()
    const item = SLASH_COMMAND_ITEMS.find(i => i.id === 'image')
    item.action({}, openModal)
    expect(openModal).toHaveBeenCalledWith('image')
  })

  it('table action calls openModal', () => {
    const openModal = vi.fn()
    const item = SLASH_COMMAND_ITEMS.find(i => i.id === 'table')
    item.action({}, openModal)
    expect(openModal).toHaveBeenCalledWith('table')
  })

  it('horizontalRule action calls executeCommand', () => {
    const engine = { executeCommand: vi.fn(), commands: { has: vi.fn(() => true) } }
    const item = SLASH_COMMAND_ITEMS.find(i => i.id === 'horizontalRule')
    item.action(engine)
    expect(engine.executeCommand).toHaveBeenCalledWith('horizontalRule')
  })

  it('insertCallout checks has() before executing', () => {
    const engine = { executeCommand: vi.fn(), commands: { has: vi.fn(() => false) } }
    const item = SLASH_COMMAND_ITEMS.find(i => i.id === 'insertCallout')
    item.action(engine)
    expect(engine.executeCommand).not.toHaveBeenCalled()
  })

  it('insertCallout executes when command exists', () => {
    const engine = { executeCommand: vi.fn(), commands: { has: vi.fn(() => true) } }
    const item = SLASH_COMMAND_ITEMS.find(i => i.id === 'insertCallout')
    item.action(engine)
    expect(engine.executeCommand).toHaveBeenCalledWith('insertCallout')
  })

  it('insertMath checks has() and calls with params', () => {
    const engine = { executeCommand: vi.fn(), commands: { has: vi.fn(() => true) } }
    const item = SLASH_COMMAND_ITEMS.find(i => i.id === 'insertMath')
    item.action(engine)
    expect(engine.executeCommand).toHaveBeenCalledWith('insertMath', { latex: '', displayMode: true })
  })

  it('findReplace opens modal', () => {
    const openModal = vi.fn()
    const item = SLASH_COMMAND_ITEMS.find(i => i.id === 'findReplace')
    item.action({}, openModal)
    expect(openModal).toHaveBeenCalledWith('findReplace')
  })

  it('sourceMode calls executeCommand', () => {
    const engine = { executeCommand: vi.fn() }
    const item = SLASH_COMMAND_ITEMS.find(i => i.id === 'sourceMode')
    item.action(engine)
    expect(engine.executeCommand).toHaveBeenCalledWith('sourceMode')
  })

  it('fullscreen calls executeCommand', () => {
    const engine = { executeCommand: vi.fn() }
    const item = SLASH_COMMAND_ITEMS.find(i => i.id === 'fullscreen')
    item.action(engine)
    expect(engine.executeCommand).toHaveBeenCalledWith('fullscreen')
  })

  it('removeFormat calls executeCommand', () => {
    const engine = { executeCommand: vi.fn() }
    const item = SLASH_COMMAND_ITEMS.find(i => i.id === 'removeFormat')
    item.action(engine)
    expect(engine.executeCommand).toHaveBeenCalledWith('removeFormat')
  })

  it('toggleMarkdown calls executeCommand', () => {
    const engine = { executeCommand: vi.fn() }
    const item = SLASH_COMMAND_ITEMS.find(i => i.id === 'toggleMarkdown')
    item.action(engine)
    expect(engine.executeCommand).toHaveBeenCalledWith('toggleMarkdown')
  })

  it('distractionFree calls executeCommand', () => {
    const engine = { executeCommand: vi.fn() }
    const item = SLASH_COMMAND_ITEMS.find(i => i.id === 'distractionFree')
    item.action(engine)
    expect(engine.executeCommand).toHaveBeenCalledWith('distractionFree')
  })

  it('toggleSplitView calls executeCommand', () => {
    const engine = { executeCommand: vi.fn() }
    const item = SLASH_COMMAND_ITEMS.find(i => i.id === 'toggleSplitView')
    item.action(engine)
    expect(engine.executeCommand).toHaveBeenCalledWith('toggleSplitView')
  })
})

describe('registerSlashCommands', () => {
  let engine

  beforeEach(() => {
    const el = document.createElement('div')
    el.contentEditable = 'true'
    document.body.appendChild(el)
    engine = {
      element: el,
      eventBus: {
        emit: vi.fn(),
        on: vi.fn(() => () => {}),
      },
    }
    clearRecentCommands()
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('should register keydown listener and slash:execute listener', () => {
    registerSlashCommands(engine)
    expect(engine.eventBus.on).toHaveBeenCalledWith('slash:execute', expect.any(Function))
    expect(engine.eventBus.on).toHaveBeenCalledWith('destroy', expect.any(Function))
  })

  it('should handle keydown with Escape when not active', () => {
    registerSlashCommands(engine)
    const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
    engine.element.dispatchEvent(event)
    // Should not emit slash:close since slash is not active
    expect(engine.eventBus.emit).not.toHaveBeenCalledWith('slash:close')
  })
})
