/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  TemplatePlugin,
  renderTemplate,
  extractTags,
  registerTemplate,
  unregisterTemplate,
  getTemplateLibrary,
  getTemplate,
} from '../plugins/builtins/templateFeatures/index.js'

describe('renderTemplate', () => {
  it('replaces simple variables', () => {
    expect(renderTemplate('Hello {{name}}!', { name: 'Alice' })).toBe('Hello Alice!')
  })

  it('handles multiple variables', () => {
    expect(renderTemplate('{{a}} and {{b}}', { a: '1', b: '2' })).toBe('1 and 2')
  })

  it('preserves unknown tags', () => {
    expect(renderTemplate('{{known}} {{unknown}}', { known: 'X' })).toBe('X {{unknown}}')
  })

  it('processes {{#if}} blocks', () => {
    expect(renderTemplate('{{#if show}}visible{{/if}}', { show: true })).toBe('visible')
    expect(renderTemplate('{{#if show}}visible{{/if}}', { show: false })).toBe('')
    expect(renderTemplate('{{#if show}}visible{{/if}}', {})).toBe('')
  })

  it('processes {{#each}} blocks with objects', () => {
    const result = renderTemplate('{{#each items}}{{name}} {{/each}}', { items: [{ name: 'A' }, { name: 'B' }] })
    expect(result).toBe('A B ')
  })

  it('processes {{#each}} blocks with primitives using {{this}}', () => {
    const result = renderTemplate('{{#each tags}}{{this}},{{/each}}', { tags: ['x', 'y'] })
    expect(result).toBe('x,y,')
  })

  it('returns input for null data', () => {
    expect(renderTemplate('{{x}}', null)).toBe('{{x}}')
  })

  it('returns empty for null template', () => {
    expect(renderTemplate(null, {})).toBe('')
  })
})

describe('extractTags', () => {
  it('extracts simple tags', () => {
    expect(extractTags('{{name}} and {{email}}')).toEqual(['name', 'email'])
  })

  it('extracts tags from conditionals and loops', () => {
    const tags = extractTags('{{#if show}}{{name}}{{/if}}{{#each items}}{{/each}}')
    expect(tags).toContain('show')
    expect(tags).toContain('name')
    expect(tags).toContain('items')
  })

  it('deduplicates', () => {
    expect(extractTags('{{x}} {{x}} {{x}}')).toEqual(['x'])
  })

  it('returns empty for null', () => {
    expect(extractTags(null)).toEqual([])
  })
})

describe('Template library', () => {
  it('has 5 built-in templates', () => {
    expect(getTemplateLibrary().length).toBeGreaterThanOrEqual(5)
  })

  it('includes email, invoice, letter, report, newsletter', () => {
    const ids = getTemplateLibrary().map(t => t.id)
    expect(ids).toContain('email')
    expect(ids).toContain('invoice')
    expect(ids).toContain('letter')
    expect(ids).toContain('report')
    expect(ids).toContain('newsletter')
  })

  it('each template has required fields', () => {
    for (const t of getTemplateLibrary()) {
      expect(t.id).toBeTruthy()
      expect(t.name).toBeTruthy()
      expect(t.category).toBeTruthy()
      expect(t.html).toBeTruthy()
    }
  })

  it('getTemplate returns by ID', () => {
    expect(getTemplate('email').name).toBe('Email')
  })

  it('registerTemplate adds a custom template', () => {
    registerTemplate({ id: 'test-tmpl', name: 'Test', category: 'Test', html: '{{x}}' })
    expect(getTemplate('test-tmpl')).toBeDefined()
    unregisterTemplate('test-tmpl')
  })

  it('unregisterTemplate removes a template', () => {
    registerTemplate({ id: 'rm-tmpl', name: 'RM', category: 'Test', html: '' })
    expect(unregisterTemplate('rm-tmpl')).toBe(true)
    expect(getTemplate('rm-tmpl')).toBeUndefined()
  })
})

describe('TemplatePlugin', () => {
  let engine, plugin

  beforeEach(() => {
    const el = document.createElement('div')
    el.contentEditable = 'true'
    el.innerHTML = '<p>Test</p>'
    document.body.appendChild(el)
    engine = {
      element: el,
      eventBus: {
        on: vi.fn(() => () => {}),
        emit: vi.fn(),
      },
      history: { snapshot: vi.fn() },
      commands: { register: vi.fn() },
      getHTML: () => el.innerHTML,
      _el: el,
    }
    plugin = TemplatePlugin()
  })

  afterEach(() => {
    plugin.destroy()
    engine._el.remove()
  })

  it('creates a valid plugin', () => {
    expect(plugin.name).toBe('templates')
    expect(plugin.commands.length).toBe(6)
  })

  it('exposes _templates API after init', () => {
    plugin.init(engine)
    expect(engine._templates).toBeDefined()
    expect(typeof engine._templates.renderTemplate).toBe('function')
    expect(typeof engine._templates.extractTags).toBe('function')
    expect(typeof engine._templates.getTemplateLibrary).toBe('function')
  })

  it('loadTemplate sets editor content', () => {
    plugin.init(engine)
    const loadCmd = plugin.commands.find(c => c.name === 'loadTemplate')
    loadCmd.execute(engine, 'email')
    expect(engine.element.innerHTML).toContain('recipient_name')
  })

  it('exportTemplate returns template data', () => {
    plugin.init(engine)
    engine.element.innerHTML = '<p>Hello <span class="rmx-merge-tag" data-tag="name">{{name}}</span></p>'
    const exportCmd = plugin.commands.find(c => c.name === 'exportTemplate')
    const result = exportCmd.execute(engine)
    expect(result.html).toContain('{{name}}')
    expect(result.tags).toContain('name')
  })
})
