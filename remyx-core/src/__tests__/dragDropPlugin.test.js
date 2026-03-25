/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { DragDropPlugin } from '../plugins/builtins/dragDropFeatures/index.js'

describe('DragDropPlugin', () => {
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
      _el: el,
    }
  })

  afterEach(() => {
    plugin?.destroy()
    engine._el.remove()
  })

  it('creates a valid plugin', () => {
    plugin = DragDropPlugin()
    expect(plugin.name).toBe('dragDrop')
    expect(plugin.requiresFullAccess).toBe(true)
    expect(plugin.commands.length).toBe(2)
  })

  it('has moveBlockUp and moveBlockDown commands', () => {
    plugin = DragDropPlugin()
    const names = plugin.commands.map(c => c.name)
    expect(names).toContain('moveBlockUp')
    expect(names).toContain('moveBlockDown')
  })

  it('adds drop zone class after init', () => {
    plugin = DragDropPlugin({ showDropZone: true })
    plugin.init(engine)
    expect(engine.element.classList.contains('rmx-drop-zone')).toBe(true)
  })

  it('creates drop indicator after init', () => {
    plugin = DragDropPlugin({ enableReorder: true })
    plugin.init(engine)
    const indicator = engine.element.querySelector('.rmx-drop-indicator')
    expect(indicator).not.toBeNull()
  })

  it('exposes _dragDrop API', () => {
    plugin = DragDropPlugin()
    plugin.init(engine)
    expect(engine._dragDrop).toBeDefined()
    expect(typeof engine._dragDrop.getDropTarget).toBe('function')
  })

  it('getDropTarget returns nearest block', () => {
    plugin = DragDropPlugin()
    plugin.init(engine)
    // Since getBoundingClientRect returns zeros in jsdom, just test it doesn't crash
    const result = engine._dragDrop.getDropTarget(50)
    expect(result).toHaveProperty('element')
    expect(result).toHaveProperty('position')
  })

  it('destroy removes drop zone class and indicator', () => {
    plugin = DragDropPlugin({ showDropZone: true })
    plugin.init(engine)
    plugin.destroy()
    expect(engine.element.classList.contains('rmx-drop-zone')).toBe(false)
    expect(engine.element.querySelector('.rmx-drop-indicator')).toBeNull()
  })

  it('showDropZone=false does not add class', () => {
    plugin = DragDropPlugin({ showDropZone: false })
    plugin.init(engine)
    expect(engine.element.classList.contains('rmx-drop-zone')).toBe(false)
  })
})
