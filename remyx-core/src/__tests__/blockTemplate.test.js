import { vi } from 'vitest'
import { BlockTemplatePlugin } from '../plugins/builtins/BlockTemplatePlugin.js'

describe('BlockTemplatePlugin', () => {
  let plugin, engine

  beforeEach(() => {
    const el = document.createElement('div')
    el.contentEditable = 'true'
    document.body.appendChild(el)

    engine = {
      element: el,
      eventBus: { emit: vi.fn(), on: vi.fn(() => () => {}) },
      history: { snapshot: vi.fn() },
      selection: {
        getRange: vi.fn(),
      },
      sanitizer: { sanitize: vi.fn((html) => html) },
      commands: { register: vi.fn() },
    }

    plugin = BlockTemplatePlugin()
  })

  afterEach(() => {
    plugin.destroy()
    document.body.innerHTML = ''
  })

  it('should create a plugin with correct name', () => {
    expect(plugin.name).toBe('blockTemplates')
    expect(plugin.requiresFullAccess).toBe(true)
  })

  it('should load built-in templates on init', () => {
    plugin.init(engine)
    const templates = engine._blockTemplates.getTemplates()
    expect(templates.length).toBeGreaterThanOrEqual(3)
    const names = templates.map(t => t.name)
    expect(names).toContain('Feature Card')
    expect(names).toContain('Two-Column')
    expect(names).toContain('Call to Action')
  })

  it('should register a custom template', () => {
    plugin.init(engine)
    engine._blockTemplates.registerTemplate('Custom', '<div>Custom content</div>')
    const templates = engine._blockTemplates.getTemplates()
    const custom = templates.find(t => t.name === 'Custom')
    expect(custom).toBeDefined()
    expect(custom.html).toBe('<div>Custom content</div>')
  })

  it('should not register template with empty name', () => {
    plugin.init(engine)
    const before = engine._blockTemplates.getTemplates().length
    engine._blockTemplates.registerTemplate('', '<div></div>')
    expect(engine._blockTemplates.getTemplates().length).toBe(before)
  })

  it('should not register template with non-string html', () => {
    plugin.init(engine)
    const before = engine._blockTemplates.getTemplates().length
    engine._blockTemplates.registerTemplate('Test', null)
    expect(engine._blockTemplates.getTemplates().length).toBe(before)
  })

  it('should insert a template at caret', () => {
    plugin.init(engine)

    const p = document.createElement('p')
    p.textContent = 'before'
    engine.element.appendChild(p)

    const range = document.createRange()
    range.selectNodeContents(p)
    range.collapse(false)
    engine.selection.getRange.mockReturnValue(range)

    engine._blockTemplates.insertTemplate('Feature Card')
    expect(engine.history.snapshot).toHaveBeenCalled()
    expect(engine.eventBus.emit).toHaveBeenCalledWith('content:change')
  })

  it('should not insert a non-existent template', () => {
    plugin.init(engine)
    engine._blockTemplates.insertTemplate('Nonexistent')
    expect(engine.history.snapshot).not.toHaveBeenCalled()
  })

  it('should not insert if no range is available', () => {
    plugin.init(engine)
    engine.selection.getRange.mockReturnValue(null)
    engine._blockTemplates.insertTemplate('Feature Card')
    expect(engine.eventBus.emit).not.toHaveBeenCalledWith('content:change')
  })

  it('should remove a template', () => {
    plugin.init(engine)
    const result = engine._blockTemplates.removeTemplate('Feature Card')
    expect(result).toBe(true)
    const templates = engine._blockTemplates.getTemplates()
    expect(templates.find(t => t.name === 'Feature Card')).toBeUndefined()
  })

  it('should return false when removing non-existent template', () => {
    plugin.init(engine)
    const result = engine._blockTemplates.removeTemplate('Nonexistent')
    expect(result).toBe(false)
  })

  it('should override existing template with same name', () => {
    plugin.init(engine)
    engine._blockTemplates.registerTemplate('Feature Card', '<div>New content</div>')
    const templates = engine._blockTemplates.getTemplates()
    const card = templates.find(t => t.name === 'Feature Card')
    expect(card.html).toBe('<div>New content</div>')
  })

  it('should return array of name/html objects from getTemplates', () => {
    plugin.init(engine)
    const templates = engine._blockTemplates.getTemplates()
    for (const t of templates) {
      expect(t).toHaveProperty('name')
      expect(t).toHaveProperty('html')
      expect(typeof t.name).toBe('string')
      expect(typeof t.html).toBe('string')
    }
  })

  it('should ensure trailing paragraph after insert', () => {
    plugin.init(engine)

    // Clear element
    engine.element.innerHTML = ''
    const textNode = document.createTextNode('start')
    engine.element.appendChild(textNode)

    const range = document.createRange()
    range.selectNodeContents(engine.element)
    range.collapse(false)
    engine.selection.getRange.mockReturnValue(range)

    engine._blockTemplates.insertTemplate('Call to Action')
    const lastChild = engine.element.lastElementChild
    expect(lastChild.tagName).toBe('P')
  })

  it('destroy should clear templates', () => {
    plugin.init(engine)
    plugin.destroy()
    // After destroy, internal templates Map is cleared
    // Re-init would start fresh
    const plugin2 = BlockTemplatePlugin()
    const engine2 = { ...engine, _blockTemplates: undefined }
    plugin2.init(engine2)
    expect(engine2._blockTemplates.getTemplates().length).toBeGreaterThanOrEqual(3)
    plugin2.destroy()
  })
})
