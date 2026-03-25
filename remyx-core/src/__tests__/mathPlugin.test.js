/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest'
import { MathPlugin, getSymbolPalette, parseMathExpressions, latexToMathML } from '../plugins/builtins/mathFeatures/index.js'

describe('getSymbolPalette', () => {
  it('returns categorized symbols', () => {
    const palette = getSymbolPalette()
    expect(palette.length).toBeGreaterThanOrEqual(4)
    const categories = palette.map(c => c.category)
    expect(categories).toContain('Greek')
    expect(categories).toContain('Operators')
    expect(categories).toContain('Arrows')
    expect(categories).toContain('Common')
  })

  it('each symbol has label and latex', () => {
    for (const group of getSymbolPalette()) {
      for (const s of group.symbols) {
        expect(s.label).toBeTruthy()
        expect(s.latex).toBeTruthy()
      }
    }
  })
})

describe('parseMathExpressions', () => {
  it('detects inline math ($...$)', () => {
    const results = parseMathExpressions('The formula $x^2 + y^2$ is important')
    expect(results.length).toBe(1)
    expect(results[0].type).toBe('inline')
    expect(results[0].src).toBe('x^2 + y^2')
  })

  it('detects block math ($$...$$)', () => {
    const results = parseMathExpressions('$$\\sum_{i=1}^{n} x_i$$')
    expect(results.length).toBe(1)
    expect(results[0].type).toBe('block')
  })

  it('detects both inline and block', () => {
    const results = parseMathExpressions('Inline $a+b$ then block $$c+d$$')
    expect(results.length).toBe(2)
  })

  it('returns empty for no math', () => {
    expect(parseMathExpressions('Just text')).toEqual([])
    expect(parseMathExpressions(null)).toEqual([])
  })
})

describe('latexToMathML', () => {
  it('converts \\alpha to MathML', () => {
    const ml = latexToMathML('\\alpha')
    expect(ml).toContain('<mi>&alpha;</mi>')
    expect(ml).toContain('<math')
  })

  it('converts \\frac to mfrac', () => {
    const ml = latexToMathML('\\frac{a}{b}')
    expect(ml).toContain('<mfrac>')
  })

  it('converts \\sqrt to msqrt', () => {
    const ml = latexToMathML('\\sqrt{x}')
    expect(ml).toContain('<msqrt>')
  })
})

describe('MathPlugin', () => {
  it('creates a valid plugin', () => {
    const plugin = MathPlugin()
    expect(plugin.name).toBe('math')
    expect(plugin.commands.length).toBe(6)
    const names = plugin.commands.map(c => c.name)
    expect(names).toContain('insertMath')
    expect(names).toContain('editMath')
    expect(names).toContain('insertSymbol')
    expect(names).toContain('getSymbolPalette')
    expect(names).toContain('getMathElements')
    expect(names).toContain('copyMathAs')
  })

  it('exposes _math API after init', () => {
    const plugin = MathPlugin()
    const el = document.createElement('div')
    el.contentEditable = 'true'
    document.body.appendChild(el)
    const engine = {
      element: el,
      eventBus: { on: vi.fn(() => () => {}), emit: vi.fn() },
      history: { snapshot: vi.fn() },
      commands: { register: vi.fn() },
    }
    plugin.init(engine)
    expect(engine._math).toBeDefined()
    expect(typeof engine._math.getSymbolPalette).toBe('function')
    expect(typeof engine._math.parseMathExpressions).toBe('function')
    expect(typeof engine._math.latexToMathML).toBe('function')
    plugin.destroy()
    el.remove()
  })
})
