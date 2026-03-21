import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  TocPlugin,
  buildOutline,
  flattenOutline,
  renderTocHTML,
  validateHeadingHierarchy,
} from '../plugins/builtins/tocFeatures/TocPlugin.js'

vi.mock('../utils/escapeHTML.js', () => ({
  escapeHTML: vi.fn((str) => str),
}))

function createEditorWithHeadings() {
  const el = document.createElement('div')
  el.innerHTML = '<h1>Title</h1><h2>Section 1</h2><h3>Sub 1.1</h3><h2>Section 2</h2><p>text</p>'
  document.body.appendChild(el)
  return el
}

describe('buildOutline', () => {
  let el
  afterEach(() => el?.remove())

  it('builds hierarchical outline from headings', () => {
    el = createEditorWithHeadings()
    const outline = buildOutline(el)
    expect(outline).toHaveLength(1) // 1 H1
    expect(outline[0].text).toBe('Title')
    expect(outline[0].children).toHaveLength(2) // 2 H2s
    expect(outline[0].children[0].children).toHaveLength(1) // 1 H3
  })

  it('assigns section numbers', () => {
    el = createEditorWithHeadings()
    const outline = buildOutline(el, { numbering: true })
    expect(outline[0].number).toBe('1')
    expect(outline[0].children[0].number).toBe('1.1')
    expect(outline[0].children[0].children[0].number).toBe('1.1.1')
    expect(outline[0].children[1].number).toBe('1.2')
  })

  it('skips numbering when disabled', () => {
    el = createEditorWithHeadings()
    const outline = buildOutline(el, { numbering: false })
    expect(outline[0].number).toBe('')
  })

  it('generates IDs for headings without them', () => {
    el = createEditorWithHeadings()
    const outline = buildOutline(el)
    outline.forEach(item => expect(item.id).toBeTruthy())
  })

  it('preserves existing heading IDs', () => {
    el = document.createElement('div')
    el.innerHTML = '<h1 id="my-id">Test</h1>'
    document.body.appendChild(el)
    const outline = buildOutline(el)
    expect(outline[0].id).toBe('my-id')
  })

  it('handles flat headings (all same level)', () => {
    el = document.createElement('div')
    el.innerHTML = '<h2>A</h2><h2>B</h2><h2>C</h2>'
    document.body.appendChild(el)
    const outline = buildOutline(el)
    expect(outline).toHaveLength(3)
  })

  it('handles empty editor', () => {
    el = document.createElement('div')
    document.body.appendChild(el)
    const outline = buildOutline(el)
    expect(outline).toEqual([])
  })
})

describe('flattenOutline', () => {
  it('flattens hierarchical outline into flat list', () => {
    const outline = [
      { text: 'A', children: [
        { text: 'A1', children: [] },
        { text: 'A2', children: [
          { text: 'A2a', children: [] },
        ] },
      ] },
      { text: 'B', children: [] },
    ]
    const flat = flattenOutline(outline)
    expect(flat).toHaveLength(5)
    expect(flat.map(i => i.text)).toEqual(['A', 'A1', 'A2', 'A2a', 'B'])
  })

  it('handles empty outline', () => {
    expect(flattenOutline([])).toEqual([])
  })
})

describe('renderTocHTML', () => {
  it('renders a nav element with links', () => {
    const outline = [
      { id: 'title', text: 'Title', number: '1', children: [
        { id: 'sec1', text: 'Section 1', number: '1.1', children: [] },
      ] },
    ]
    const html = renderTocHTML(outline)
    expect(html).toContain('<nav class="rmx-toc"')
    expect(html).toContain('href="#title"')
    expect(html).toContain('href="#sec1"')
    expect(html).toContain('rmx-toc-number')
  })

  it('renders without numbering', () => {
    const outline = [
      { id: 'x', text: 'X', number: '', children: [] },
    ]
    const html = renderTocHTML(outline, { numbering: false })
    expect(html).not.toContain('rmx-toc-number')
  })

  it('uses custom linkPrefix', () => {
    const outline = [
      { id: 'x', text: 'X', number: '', children: [] },
    ]
    const html = renderTocHTML(outline, { linkPrefix: '/page#' })
    expect(html).toContain('href="/page#x"')
  })

  it('handles empty outline', () => {
    const html = renderTocHTML([])
    expect(html).toContain('<nav')
    expect(html).toContain('<ul></ul>')
  })
})

describe('validateHeadingHierarchy', () => {
  it('returns no warnings for proper hierarchy', () => {
    const flat = [
      { level: 1, element: {} },
      { level: 2, element: {} },
      { level: 3, element: {} },
    ]
    expect(validateHeadingHierarchy(flat)).toEqual([])
  })

  it('detects skipped heading levels', () => {
    const flat = [
      { level: 1, element: {} },
      { level: 3, element: {} },
    ]
    const warnings = validateHeadingHierarchy(flat)
    expect(warnings).toHaveLength(1)
    expect(warnings[0].message).toContain('H1')
    expect(warnings[0].message).toContain('H3')
  })

  it('handles empty list', () => {
    expect(validateHeadingHierarchy([])).toEqual([])
  })

  it('handles single heading', () => {
    expect(validateHeadingHierarchy([{ level: 1, element: {} }])).toEqual([])
  })
})

describe('TocPlugin', () => {
  let engine, plugin

  beforeEach(() => {
    const element = document.createElement('div')
    element.contentEditable = 'true'
    document.body.appendChild(element)
    engine = {
      element,
      eventBus: { on: vi.fn(() => vi.fn()), emit: vi.fn() },
      history: { snapshot: vi.fn() },
      selection: { save: vi.fn(), restore: vi.fn() },
    }
  })

  afterEach(() => {
    if (plugin) plugin.destroy(engine)
    engine.element.remove()
  })

  it('initializes and builds initial outline', () => {
    engine.element.innerHTML = '<h1>Title</h1>'
    plugin = TocPlugin()
    plugin.init(engine)
    expect(engine._toc).toBeTruthy()
    expect(engine.eventBus.emit).toHaveBeenCalledWith('toc:change', expect.any(Object))
  })

  it('exposes toc API', () => {
    plugin = TocPlugin()
    plugin.init(engine)
    expect(typeof engine._toc.buildOutline).toBe('function')
    expect(typeof engine._toc.flattenOutline).toBe('function')
    expect(typeof engine._toc.renderTocHTML).toBe('function')
    expect(typeof engine._toc.validateHeadingHierarchy).toBe('function')
    expect(typeof engine._toc.getOutline).toBe('function')
  })

  describe('commands — getOutline', () => {
    it('returns outline for current content', () => {
      engine.element.innerHTML = '<h1>T</h1><h2>S</h2>'
      plugin = TocPlugin()
      plugin.init(engine)
      const cmd = plugin.commands.find(c => c.name === 'getOutline')
      const outline = cmd.execute(engine)
      expect(outline).toHaveLength(1)
    })
  })

  describe('commands — insertToc', () => {
    it('inserts TOC at cursor position', () => {
      engine.element.innerHTML = '<h1>Title</h1><p>text</p>'
      plugin = TocPlugin()
      plugin.init(engine)

      const range = document.createRange()
      range.setStart(engine.element.querySelector('p').firstChild, 0)
      range.collapse(true)
      const sel = window.getSelection()
      sel.removeAllRanges()
      sel.addRange(range)

      const cmd = plugin.commands.find(c => c.name === 'insertToc')
      cmd.execute(engine)

      expect(engine.element.querySelector('.rmx-toc')).toBeTruthy()
    })
  })

  describe('commands — scrollToHeading', () => {
    it('scrolls to a heading by id', () => {
      engine.element.innerHTML = '<h1 id="my-heading">Title</h1>'
      plugin = TocPlugin()
      plugin.init(engine)

      const h1 = engine.element.querySelector('h1')
      h1.scrollIntoView = vi.fn()

      const cmd = plugin.commands.find(c => c.name === 'scrollToHeading')
      cmd.execute(engine, 'my-heading')

      expect(h1.scrollIntoView).toHaveBeenCalled()
    })
  })

  describe('commands — validateHeadings', () => {
    it('validates heading hierarchy', () => {
      engine.element.innerHTML = '<h1>A</h1><h3>B</h3>'
      plugin = TocPlugin()
      plugin.init(engine)

      const cmd = plugin.commands.find(c => c.name === 'validateHeadings')
      const warnings = cmd.execute(engine)
      expect(warnings.length).toBeGreaterThan(0)
    })
  })

  describe('onOutlineChange callback', () => {
    it('calls callback when outline updates', () => {
      const onOutlineChange = vi.fn()
      engine.element.innerHTML = '<h1>Title</h1>'
      plugin = TocPlugin({ onOutlineChange })
      plugin.init(engine)

      expect(onOutlineChange).toHaveBeenCalled()
    })
  })
})
