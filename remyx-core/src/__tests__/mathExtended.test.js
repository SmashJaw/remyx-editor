import { vi } from 'vitest'
import { MathPlugin, parseMathExpressions, latexToMathML } from '../plugins/builtins/mathFeatures/index.js'

describe('MathPlugin - extended coverage', () => {
  let plugin, engine

  beforeEach(() => {
    const el = document.createElement('div')
    el.contentEditable = 'true'
    document.body.appendChild(el)
    engine = {
      element: el,
      eventBus: { on: vi.fn(() => () => {}), emit: vi.fn() },
      history: { snapshot: vi.fn() },
      selection: { save: vi.fn(), restore: vi.fn() },
      commands: { register: vi.fn() },
    }
    plugin = MathPlugin()
  })

  afterEach(() => {
    plugin.destroy()
    document.body.innerHTML = ''
  })

  it('insertMath creates inline math element', () => {
    plugin.init(engine)
    const cmd = plugin.commands.find(c => c.name === 'insertMath')

    // Set up selection
    const p = document.createElement('p')
    p.textContent = 'before'
    engine.element.appendChild(p)
    const sel = window.getSelection()
    const range = document.createRange()
    range.selectNodeContents(p)
    range.collapse(false)
    sel.removeAllRanges()
    sel.addRange(range)

    const el = cmd.execute(engine, { latex: 'x^2', displayMode: false })
    expect(el).toBeDefined()
    if (el) {
      expect(el.classList.contains('rmx-math-inline')).toBe(true)
      expect(el.getAttribute('data-math-src')).toBe('x^2')
    }
  })

  it('insertMath creates block math element with equation number', () => {
    plugin.init(engine)
    const cmd = plugin.commands.find(c => c.name === 'insertMath')

    const p = document.createElement('p')
    p.textContent = 'text'
    engine.element.appendChild(p)
    const sel = window.getSelection()
    const range = document.createRange()
    range.selectNodeContents(p)
    range.collapse(false)
    sel.removeAllRanges()
    sel.addRange(range)

    const el = cmd.execute(engine, { latex: '\\sum', displayMode: true })
    if (el) {
      expect(el.classList.contains('rmx-math-block')).toBe(true)
      expect(el.getAttribute('data-equation-number')).toBe('1')
    }
  })

  it('editMath updates math element', () => {
    plugin.init(engine)
    const mathEl = document.createElement('span')
    mathEl.className = 'rmx-math rmx-math-inline'
    mathEl.setAttribute('data-math', 'latex')
    mathEl.setAttribute('data-math-src', 'x')
    engine.element.appendChild(mathEl)

    const cmd = plugin.commands.find(c => c.name === 'editMath')
    cmd.execute(engine, { element: mathEl, latex: 'y^2' })
    expect(mathEl.getAttribute('data-math-src')).toBe('y^2')
    expect(engine.history.snapshot).toHaveBeenCalled()
  })

  it('editMath returns if no element or latex', () => {
    plugin.init(engine)
    const cmd = plugin.commands.find(c => c.name === 'editMath')
    cmd.execute(engine, {})
    expect(engine.history.snapshot).not.toHaveBeenCalled()
  })

  it('insertSymbol inserts text node', () => {
    plugin.init(engine)
    const p = document.createElement('p')
    p.textContent = 'text'
    engine.element.appendChild(p)
    const sel = window.getSelection()
    const range = document.createRange()
    range.selectNodeContents(p)
    range.collapse(false)
    sel.removeAllRanges()
    sel.addRange(range)

    const cmd = plugin.commands.find(c => c.name === 'insertSymbol')
    cmd.execute(engine, '\\alpha')
    expect(engine.eventBus.emit).toHaveBeenCalledWith('content:change')
  })

  it('insertSymbol returns if no latex', () => {
    plugin.init(engine)
    const cmd = plugin.commands.find(c => c.name === 'insertSymbol')
    cmd.execute(engine, null)
  })

  it('getMathElements returns empty when none exist', () => {
    plugin.init(engine)
    const cmd = plugin.commands.find(c => c.name === 'getMathElements')
    expect(cmd.execute(engine)).toEqual([])
  })

  it('getMathElements returns math info', () => {
    plugin.init(engine)
    const span = document.createElement('span')
    span.className = 'rmx-math rmx-math-inline'
    span.setAttribute('data-math-src', 'x^2')
    engine.element.appendChild(span)

    const cmd = plugin.commands.find(c => c.name === 'getMathElements')
    const result = cmd.execute(engine)
    expect(result.length).toBe(1)
    expect(result[0].src).toBe('x^2')
    expect(result[0].displayMode).toBe(false)
  })

  it('copyMathAs returns latex by default', () => {
    plugin.init(engine)
    const span = document.createElement('span')
    span.setAttribute('data-math-src', '\\pi')
    engine.element.appendChild(span)

    const cmd = plugin.commands.find(c => c.name === 'copyMathAs')
    expect(cmd.execute(engine, { element: span, format: 'latex' })).toBe('\\pi')
  })

  it('copyMathAs returns mathml', () => {
    plugin.init(engine)
    const span = document.createElement('span')
    span.setAttribute('data-math-src', '\\alpha')
    engine.element.appendChild(span)

    const cmd = plugin.commands.find(c => c.name === 'copyMathAs')
    const result = cmd.execute(engine, { element: span, format: 'mathml' })
    expect(result).toContain('<math')
  })

  it('copyMathAs returns null for no element', () => {
    plugin.init(engine)
    const cmd = plugin.commands.find(c => c.name === 'copyMathAs')
    expect(cmd.execute(engine, {})).toBeNull()
  })

  it('copyMathAs returns null for element without data-math-src', () => {
    plugin.init(engine)
    const span = document.createElement('span')
    const cmd = plugin.commands.find(c => c.name === 'copyMathAs')
    expect(cmd.execute(engine, { element: span })).toBeNull()
  })

  it('_math API exposes renderAllMath and getEquationCount', () => {
    plugin.init(engine)
    expect(typeof engine._math.renderAllMath).toBe('function')
    expect(typeof engine._math.getEquationCount).toBe('function')
    expect(engine._math.getEquationCount()).toBe(0)
  })

  it('contextMenuItems has insert inline math', () => {
    expect(plugin.contextMenuItems.length).toBe(1)
    expect(plugin.contextMenuItems[0].command).toBe('insertMath')
  })
})

describe('parseMathExpressions - extended', () => {
  it('handles multiple inline expressions', () => {
    const results = parseMathExpressions('$a$ and $b$ and $c$')
    expect(results.length).toBe(3)
    expect(results.every(r => r.type === 'inline')).toBe(true)
  })

  it('does not count inline $ inside block $$', () => {
    const results = parseMathExpressions('$$a + b$$')
    expect(results.length).toBe(1)
    expect(results[0].type).toBe('block')
  })

  it('returns sorted results by index', () => {
    const results = parseMathExpressions('$$block$$ then $inline$')
    expect(results.length).toBe(2)
    expect(results[0].index).toBeLessThan(results[1].index)
  })

  it('trims whitespace in expressions', () => {
    const results = parseMathExpressions('$  x  $')
    expect(results[0].src).toBe('x')
  })
})

describe('latexToMathML - extended', () => {
  it('converts \\sum', () => {
    expect(latexToMathML('\\sum')).toContain('&sum;')
  })

  it('converts \\int', () => {
    expect(latexToMathML('\\int')).toContain('&int;')
  })

  it('converts \\infty', () => {
    expect(latexToMathML('\\infty')).toContain('&infin;')
  })

  it('converts \\beta', () => {
    expect(latexToMathML('\\beta')).toContain('&beta;')
  })

  it('converts \\pi', () => {
    expect(latexToMathML('\\pi')).toContain('&pi;')
  })

  it('converts superscript', () => {
    expect(latexToMathML('^{2}')).toContain('<msup>')
  })

  it('converts subscript', () => {
    expect(latexToMathML('_{1}')).toContain('<msub>')
  })

  it('converts \\prod', () => {
    expect(latexToMathML('\\prod')).toContain('&prod;')
  })
})
