/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest'
import { TocPlugin, buildOutline, flattenOutline, renderTocHTML, validateHeadingHierarchy } from '../plugins/builtins/tocFeatures/index.js'

describe('buildOutline', () => {
  it('builds from headings', () => {
    const el = document.createElement('div')
    el.innerHTML = '<h1>Title</h1><h2>Section A</h2><h3>Sub</h3><h2>Section B</h2>'
    const outline = buildOutline(el)
    expect(outline.length).toBe(1) // h1 is root
    expect(outline[0].text).toBe('Title')
    expect(outline[0].children.length).toBe(2) // two h2s
    expect(outline[0].children[0].children.length).toBe(1) // one h3 under first h2
  })

  it('assigns section numbers', () => {
    const el = document.createElement('div')
    el.innerHTML = '<h1>A</h1><h2>A.1</h2><h2>A.2</h2><h1>B</h1>'
    const outline = buildOutline(el, { numbering: true })
    expect(outline[0].number).toBe('1')
    expect(outline[0].children[0].number).toBe('1.1')
    expect(outline[0].children[1].number).toBe('1.2')
    expect(outline[1].number).toBe('2')
  })

  it('assigns IDs to headings without them', () => {
    const el = document.createElement('div')
    el.innerHTML = '<h1>My Title</h1>'
    buildOutline(el)
    expect(el.querySelector('h1').id).toBeTruthy()
  })

  it('preserves existing IDs', () => {
    const el = document.createElement('div')
    el.innerHTML = '<h1 id="existing">Title</h1>'
    buildOutline(el)
    expect(el.querySelector('h1').id).toBe('existing')
  })

  it('returns empty for no headings', () => {
    const el = document.createElement('div')
    el.innerHTML = '<p>No headings</p>'
    expect(buildOutline(el)).toEqual([])
  })
})

describe('flattenOutline', () => {
  it('flattens nested outline', () => {
    const el = document.createElement('div')
    el.innerHTML = '<h1>A</h1><h2>B</h2><h3>C</h3>'
    const outline = buildOutline(el)
    const flat = flattenOutline(outline)
    expect(flat.length).toBe(3)
    expect(flat.map(i => i.text)).toEqual(['A', 'B', 'C'])
  })
})

describe('renderTocHTML', () => {
  it('generates HTML with links', () => {
    const el = document.createElement('div')
    el.innerHTML = '<h1 id="a">Title</h1><h2 id="b">Section</h2>'
    const outline = buildOutline(el)
    const html = renderTocHTML(outline)
    expect(html).toContain('rmx-toc')
    expect(html).toContain('href="#a"')
    expect(html).toContain('href="#b"')
    expect(html).toContain('Title')
  })

  it('includes section numbers when numbering=true', () => {
    const el = document.createElement('div')
    el.innerHTML = '<h1 id="a">A</h1><h2 id="b">B</h2>'
    const outline = buildOutline(el, { numbering: true })
    const html = renderTocHTML(outline, { numbering: true })
    expect(html).toContain('rmx-toc-number')
  })
})

describe('validateHeadingHierarchy', () => {
  it('detects skipped levels', () => {
    const el = document.createElement('div')
    el.innerHTML = '<h1>A</h1><h3>C</h3>' // skipped h2
    const flat = flattenOutline(buildOutline(el, { numbering: false }))
    const warnings = validateHeadingHierarchy(flat)
    expect(warnings.length).toBe(1)
    expect(warnings[0].message).toContain('skipped')
  })

  it('returns empty for valid hierarchy', () => {
    const el = document.createElement('div')
    el.innerHTML = '<h1>A</h1><h2>B</h2><h3>C</h3>'
    const flat = flattenOutline(buildOutline(el, { numbering: false }))
    expect(validateHeadingHierarchy(flat)).toEqual([])
  })
})

describe('TocPlugin', () => {
  it('creates a valid plugin', () => {
    const plugin = TocPlugin()
    expect(plugin.name).toBe('toc')
    expect(plugin.commands.length).toBe(4)
    const names = plugin.commands.map(c => c.name)
    expect(names).toContain('getOutline')
    expect(names).toContain('insertToc')
    expect(names).toContain('scrollToHeading')
    expect(names).toContain('validateHeadings')
  })

  it('exposes _toc API after init', () => {
    const plugin = TocPlugin()
    const el = document.createElement('div')
    el.contentEditable = 'true'
    el.innerHTML = '<h1>Test</h1>'
    document.body.appendChild(el)
    const engine = {
      element: el,
      eventBus: { on: vi.fn(() => () => {}), emit: vi.fn() },
      history: { snapshot: vi.fn() },
      getText: () => el.textContent,
      commands: { register: vi.fn() },
    }
    plugin.init(engine)
    expect(engine._toc).toBeDefined()
    expect(typeof engine._toc.buildOutline).toBe('function')
    expect(typeof engine._toc.renderTocHTML).toBe('function')
    plugin.destroy()
    el.remove()
  })
})
