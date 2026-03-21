import { vi } from 'vitest'
import { DragDropPlugin } from '../plugins/builtins/dragDropFeatures/index.js'

describe('DragDropPlugin - extended coverage', () => {
  let engine, plugin

  beforeEach(() => {
    const el = document.createElement('div')
    el.contentEditable = 'true'
    el.innerHTML = '<p>Block 1</p><p>Block 2</p><p>Block 3</p>'
    document.body.appendChild(el)
    engine = {
      element: el,
      eventBus: {
        on: vi.fn(() => () => {}),
        emit: vi.fn(),
      },
      history: { snapshot: vi.fn() },
      selection: { getParentBlock: vi.fn() },
      commands: { register: vi.fn() },
    }
  })

  afterEach(() => {
    plugin?.destroy()
    engine.element.remove()
  })

  it('enableReorder=false does not create drop indicator', () => {
    plugin = DragDropPlugin({ enableReorder: false })
    plugin.init(engine)
    expect(engine.element.querySelector('.rmx-drop-indicator')).toBeNull()
  })

  it('moveBlockUp command moves block before previous', () => {
    plugin = DragDropPlugin()
    const cmd = plugin.commands.find(c => c.name === 'moveBlockUp')
    const p2 = engine.element.children[1]
    engine.selection.getParentBlock.mockReturnValue(p2)
    cmd.execute(engine)
    expect(engine.element.children[0].textContent).toBe('Block 2')
  })

  it('moveBlockUp does nothing when no previous sibling', () => {
    plugin = DragDropPlugin()
    const cmd = plugin.commands.find(c => c.name === 'moveBlockUp')
    const p1 = engine.element.children[0]
    engine.selection.getParentBlock.mockReturnValue(p1)
    cmd.execute(engine)
    expect(engine.element.children[0].textContent).toBe('Block 1')
  })

  it('moveBlockDown command moves block after next', () => {
    plugin = DragDropPlugin()
    const cmd = plugin.commands.find(c => c.name === 'moveBlockDown')
    const p1 = engine.element.children[0]
    engine.selection.getParentBlock.mockReturnValue(p1)
    cmd.execute(engine)
    expect(engine.element.children[0].textContent).toBe('Block 2')
    expect(engine.element.children[1].textContent).toBe('Block 1')
  })

  it('moveBlockDown does nothing when no next sibling', () => {
    plugin = DragDropPlugin()
    const cmd = plugin.commands.find(c => c.name === 'moveBlockDown')
    const p3 = engine.element.children[2]
    engine.selection.getParentBlock.mockReturnValue(p3)
    cmd.execute(engine)
    expect(engine.element.children[2].textContent).toBe('Block 3')
  })

  it('moveBlockUp/Down returns if no parent block', () => {
    plugin = DragDropPlugin()
    engine.selection.getParentBlock.mockReturnValue(null)
    const up = plugin.commands.find(c => c.name === 'moveBlockUp')
    const down = plugin.commands.find(c => c.name === 'moveBlockDown')
    up.execute(engine)
    down.execute(engine)
    expect(engine.history.snapshot).not.toHaveBeenCalled()
  })

  it('destroy when plugin not initialized does not throw', () => {
    plugin = DragDropPlugin()
    // destroy without init
    plugin.destroy()
  })

  it('handles dragover event by preventing default', () => {
    plugin = DragDropPlugin({ showDropZone: true })
    plugin.init(engine)

    const event = new Event('dragover', { bubbles: true })
    event.preventDefault = vi.fn()
    Object.defineProperty(event, 'dataTransfer', {
      value: { dropEffect: '' },
    })
    Object.defineProperty(event, 'clientY', { value: 50 })

    engine.element.dispatchEvent(event)
    expect(event.preventDefault).toHaveBeenCalled()
    expect(engine.element.classList.contains('rmx-drop-zone-active')).toBe(true)
  })

  it('handles dragleave event', () => {
    plugin = DragDropPlugin({ showDropZone: true })
    plugin.init(engine)

    engine.element.classList.add('rmx-drop-zone-active')

    const event = new Event('dragleave', { bubbles: true })
    Object.defineProperty(event, 'relatedTarget', { value: document.body })
    engine.element.dispatchEvent(event)

    expect(engine.element.classList.contains('rmx-drop-zone-active')).toBe(false)
  })

  it('handles dragend event', () => {
    plugin = DragDropPlugin()
    plugin.init(engine)

    const event = new Event('dragend', { bubbles: true })
    engine.element.dispatchEvent(event)
    // Should not throw
  })

  it('callbacks onDrop and onFileDrop are optional', () => {
    plugin = DragDropPlugin({ onDrop: undefined, onFileDrop: undefined })
    plugin.init(engine)
    // Should not throw during operation
  })

  it('version and description are set', () => {
    plugin = DragDropPlugin()
    expect(plugin.version).toBe('1.0.0')
    expect(plugin.description).toBeTruthy()
  })
})
