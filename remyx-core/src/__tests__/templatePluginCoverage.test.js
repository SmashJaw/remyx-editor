import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  TemplatePlugin,
  renderTemplate,
  extractTags,
  registerTemplate,
  unregisterTemplate,
  getTemplateLibrary,
  getTemplate,
} from '../plugins/builtins/templateFeatures/TemplatePlugin.js'

function createMockEngine() {
  const element = document.createElement('div')
  element.contentEditable = 'true'
  document.body.appendChild(element)
  return {
    element,
    eventBus: { on: vi.fn(() => vi.fn()), emit: vi.fn() },
    history: { snapshot: vi.fn() },
    getHTML: vi.fn(() => element.innerHTML),
    selection: {
      save: vi.fn(),
      restore: vi.fn(),
    },
  }
}

describe('renderTemplate', () => {
  it('replaces simple variables', () => {
    expect(renderTemplate('Hello {{name}}', { name: 'World' })).toBe('Hello World')
  })

  it('leaves unknown variables as-is', () => {
    expect(renderTemplate('Hello {{unknown}}', { name: 'World' })).toBe('Hello {{unknown}}')
  })

  it('handles {{#if}} conditionals — truthy', () => {
    const result = renderTemplate('{{#if show}}visible{{/if}}', { show: true })
    expect(result).toBe('visible')
  })

  it('handles {{#if}} conditionals — falsy', () => {
    const result = renderTemplate('{{#if show}}visible{{/if}}', { show: false })
    expect(result).toBe('')
  })

  it('handles {{#each}} loops with objects', () => {
    const result = renderTemplate('{{#each items}}{{name}} {{/each}}', {
      items: [{ name: 'A' }, { name: 'B' }],
    })
    expect(result).toBe('A B ')
  })

  it('handles {{#each}} loops with primitives using {{this}}', () => {
    const result = renderTemplate('{{#each colors}}{{this}} {{/each}}', {
      colors: ['red', 'blue'],
    })
    expect(result).toBe('red blue ')
  })

  it('handles {{#each}} with non-array — returns empty', () => {
    const result = renderTemplate('{{#each items}}x{{/each}}', { items: 'notarray' })
    expect(result).toBe('')
  })

  it('returns empty string for null template', () => {
    expect(renderTemplate(null, {})).toBe('')
  })

  it('returns template unchanged for null data', () => {
    expect(renderTemplate('hello', null)).toBe('hello')
  })

  it('handles nested variables in conditionals', () => {
    const result = renderTemplate('{{#if active}}Hi {{name}}{{/if}}', { active: true, name: 'User' })
    expect(result).toBe('Hi User')
  })

  it('trims variable names', () => {
    expect(renderTemplate('{{ name }}', { name: 'trimmed' })).toBe('trimmed')
  })
})

describe('extractTags', () => {
  it('extracts variable names', () => {
    expect(extractTags('{{name}} {{email}}')).toEqual(expect.arrayContaining(['name', 'email']))
  })

  it('extracts tags from conditionals', () => {
    expect(extractTags('{{#if active}}x{{/if}}')).toContain('active')
  })

  it('extracts tags from loops', () => {
    expect(extractTags('{{#each items}}x{{/each}}')).toContain('items')
  })

  it('returns empty for null', () => {
    expect(extractTags(null)).toEqual([])
  })

  it('deduplicates tags', () => {
    const tags = extractTags('{{name}} {{name}}')
    expect(tags.filter(t => t === 'name')).toHaveLength(1)
  })
})

describe('Template library', () => {
  it('has builtin templates', () => {
    const lib = getTemplateLibrary()
    expect(lib.length).toBeGreaterThan(0)
    expect(lib.find(t => t.id === 'email')).toBeTruthy()
    expect(lib.find(t => t.id === 'invoice')).toBeTruthy()
    expect(lib.find(t => t.id === 'letter')).toBeTruthy()
    expect(lib.find(t => t.id === 'report')).toBeTruthy()
    expect(lib.find(t => t.id === 'newsletter')).toBeTruthy()
  })

  it('registers a custom template', () => {
    registerTemplate({ id: 'test-tpl', name: 'Test', category: 'Test', html: '<p>{{x}}</p>' })
    expect(getTemplate('test-tpl')).toBeTruthy()
    unregisterTemplate('test-tpl')
  })

  it('unregisters a template', () => {
    registerTemplate({ id: 'rm-tpl', name: 'RM', category: 'Test', html: '<p>x</p>' })
    expect(unregisterTemplate('rm-tpl')).toBe(true)
    expect(getTemplate('rm-tpl')).toBeUndefined()
  })

  it('ignores register with no id', () => {
    registerTemplate({})
    registerTemplate(null)
  })

  it('getTemplate returns undefined for unknown id', () => {
    expect(getTemplate('nonexistent')).toBeUndefined()
  })
})

describe('TemplatePlugin', () => {
  let engine, plugin

  beforeEach(() => {
    engine = createMockEngine()
  })

  afterEach(() => {
    if (plugin) plugin.destroy(engine)
    engine.element.remove()
  })

  it('initializes and exposes API', () => {
    plugin = TemplatePlugin()
    plugin.init(engine)
    expect(engine._templates).toBeTruthy()
    expect(engine._templates.renderTemplate).toBe(renderTemplate)
    expect(engine._templates.extractTags).toBe(extractTags)
  })

  describe('commands — insertMergeTag', () => {
    it('inserts a merge tag chip', () => {
      plugin = TemplatePlugin()
      plugin.init(engine)

      const p = document.createElement('p')
      p.textContent = 'text'
      engine.element.appendChild(p)

      const range = document.createRange()
      range.setStart(p.firstChild, 4)
      range.collapse(true)
      const sel = window.getSelection()
      sel.removeAllRanges()
      sel.addRange(range)

      const cmd = plugin.commands.find(c => c.name === 'insertMergeTag')
      cmd.execute(engine, 'firstName')

      const chip = engine.element.querySelector('.rmx-merge-tag')
      expect(chip).toBeTruthy()
      expect(chip.getAttribute('data-tag')).toBe('firstName')
    })

    it('does nothing when no tag name', () => {
      plugin = TemplatePlugin()
      plugin.init(engine)
      const cmd = plugin.commands.find(c => c.name === 'insertMergeTag')
      cmd.execute(engine, '')
    })
  })

  describe('commands — loadTemplate', () => {
    it('loads a template by id', () => {
      plugin = TemplatePlugin()
      plugin.init(engine)

      const cmd = plugin.commands.find(c => c.name === 'loadTemplate')
      const result = cmd.execute(engine, 'email')

      expect(result).toBeTruthy()
      expect(result.id).toBe('email')
      expect(engine.element.innerHTML).toContain('rmx-merge-tag')
      expect(engine.eventBus.emit).toHaveBeenCalledWith('template:loaded', expect.any(Object))
    })

    it('returns null for unknown template', () => {
      plugin = TemplatePlugin()
      plugin.init(engine)

      const cmd = plugin.commands.find(c => c.name === 'loadTemplate')
      expect(cmd.execute(engine, 'unknown')).toBeNull()
    })
  })

  describe('commands — previewTemplate', () => {
    it('renders template with data', () => {
      plugin = TemplatePlugin()
      plugin.init(engine)

      engine.element.innerHTML = '<span class="rmx-merge-tag" data-tag="name">{{name}}</span>'
      engine.getHTML.mockReturnValue(engine.element.innerHTML)

      const cmd = plugin.commands.find(c => c.name === 'previewTemplate')
      cmd.execute(engine, { name: 'John' })

      expect(engine.element.contentEditable).toBe('false')
      expect(engine.element.classList.contains('rmx-template-preview')).toBe(true)
      expect(engine.eventBus.emit).toHaveBeenCalledWith('template:preview', expect.any(Object))
    })
  })

  describe('commands — exitPreview', () => {
    it('restores editor from preview mode', () => {
      plugin = TemplatePlugin()
      plugin.init(engine)

      engine.element.innerHTML = '<p>original</p>'
      engine.getHTML.mockReturnValue(engine.element.innerHTML)

      const preview = plugin.commands.find(c => c.name === 'previewTemplate')
      preview.execute(engine, { name: 'test' })

      const exit = plugin.commands.find(c => c.name === 'exitPreview')
      exit.execute(engine)

      expect(engine.element.contentEditable).toBe('true')
      expect(engine.element.classList.contains('rmx-template-preview')).toBe(false)
    })

    it('does nothing when not in preview mode', () => {
      plugin = TemplatePlugin()
      plugin.init(engine)
      const cmd = plugin.commands.find(c => c.name === 'exitPreview')
      cmd.execute(engine)
    })
  })

  describe('commands — exportTemplate', () => {
    it('exports template HTML and tags', () => {
      plugin = TemplatePlugin()
      plugin.init(engine)

      engine.element.innerHTML = '<span class="rmx-merge-tag" data-tag="name">{{name}}</span>'
      engine.getHTML.mockReturnValue(engine.element.innerHTML)

      const cmd = plugin.commands.find(c => c.name === 'exportTemplate')
      const result = cmd.execute(engine)

      expect(result.html).toContain('{{name}}')
      expect(result.tags).toContain('name')
    })
  })

  describe('commands — getTemplateTags', () => {
    it('returns tags from current content', () => {
      plugin = TemplatePlugin()
      plugin.init(engine)

      engine.element.innerHTML = '<span class="rmx-merge-tag" data-tag="email">{{email}}</span>'
      engine.getHTML.mockReturnValue(engine.element.innerHTML)

      const cmd = plugin.commands.find(c => c.name === 'getTemplateTags')
      const tags = cmd.execute(engine)
      expect(tags).toContain('email')
    })
  })

  describe('exposed API', () => {
    it('setPreviewData and getPreviewData', () => {
      plugin = TemplatePlugin()
      plugin.init(engine)

      engine._templates.setPreviewData({ foo: 'bar' })
      expect(engine._templates.getPreviewData()).toEqual({ foo: 'bar' })
    })

    it('isPreviewMode returns correct state', () => {
      plugin = TemplatePlugin()
      plugin.init(engine)
      expect(engine._templates.isPreviewMode()).toBe(false)
    })

    it('textToChips converts tags to chips', () => {
      plugin = TemplatePlugin()
      plugin.init(engine)
      const result = engine._templates.textToChips('Hello {{name}}')
      expect(result).toContain('rmx-merge-tag')
      expect(result).toContain('data-tag="name"')
    })

    it('chipsToText converts chips to tags', () => {
      plugin = TemplatePlugin()
      plugin.init(engine)
      const html = '<span class="rmx-merge-tag" data-tag="name" contenteditable="false">{{name}}</span>'
      const result = engine._templates.chipsToText(html)
      expect(result).toBe('{{name}}')
    })
  })

  describe('destroy during preview', () => {
    it('restores contentEditable on destroy during preview', () => {
      plugin = TemplatePlugin()
      plugin.init(engine)

      engine.getHTML.mockReturnValue('{{x}}')
      const preview = plugin.commands.find(c => c.name === 'previewTemplate')
      preview.execute(engine, { x: 'val' })

      plugin.destroy(engine)
      expect(engine.element.contentEditable).toBe('true')
      plugin = null // prevent afterEach from destroying again
    })
  })
})
