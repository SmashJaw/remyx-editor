import { escapeHTML } from '@remyxjs/core'

/**
 * MathPlugin — LaTeX/KaTeX math rendering with inline and block equations.
 *
 * Inline math: $expression$ or \(expression\)
 * Block math:  $$expression$$ or \[expression\]
 *
 * DOM structure:
 *   <span class="rmx-math rmx-math-inline" data-math="latex" data-math-src="expression">rendered</span>
 *   <div  class="rmx-math rmx-math-block"  data-math="latex" data-math-src="expression">rendered</div>
 *
 * Uses a pluggable renderer — provide `renderMath(latex, displayMode)` callback,
 * or defaults to displaying the raw LaTeX in a styled container.
 *
 * @param {object} [options]
 * @param {Function} [options.renderMath] — (latex, displayMode) => HTMLString
 * @param {boolean}  [options.autoRender=true] — auto-detect and render $ and $$ syntax
 * @param {boolean}  [options.numbering=true] — auto-number block equations
 */

import { createPlugin } from '@remyxjs/core'

// ---------------------------------------------------------------------------
// Symbol palette
// ---------------------------------------------------------------------------

/** @type {Array<{ category: string, symbols: Array<{ label: string, latex: string }> }>} */
const SYMBOL_PALETTE = [
  {
    category: 'Greek',
    symbols: [
      { label: '\u03B1', latex: '\\alpha' }, { label: '\u03B2', latex: '\\beta' },
      { label: '\u03B3', latex: '\\gamma' }, { label: '\u03B4', latex: '\\delta' },
      { label: '\u03B5', latex: '\\epsilon' }, { label: '\u03B8', latex: '\\theta' },
      { label: '\u03BB', latex: '\\lambda' }, { label: '\u03BC', latex: '\\mu' },
      { label: '\u03C0', latex: '\\pi' }, { label: '\u03C3', latex: '\\sigma' },
      { label: '\u03C6', latex: '\\phi' }, { label: '\u03C9', latex: '\\omega' },
      { label: '\u0394', latex: '\\Delta' }, { label: '\u03A3', latex: '\\Sigma' },
      { label: '\u03A9', latex: '\\Omega' },
    ],
  },
  {
    category: 'Operators',
    symbols: [
      { label: '\u00B1', latex: '\\pm' }, { label: '\u00D7', latex: '\\times' },
      { label: '\u00F7', latex: '\\div' }, { label: '\u2260', latex: '\\neq' },
      { label: '\u2264', latex: '\\leq' }, { label: '\u2265', latex: '\\geq' },
      { label: '\u221E', latex: '\\infty' }, { label: '\u2248', latex: '\\approx' },
      { label: '\u221A', latex: '\\sqrt{}' }, { label: '\u2211', latex: '\\sum' },
      { label: '\u220F', latex: '\\prod' }, { label: '\u222B', latex: '\\int' },
    ],
  },
  {
    category: 'Arrows',
    symbols: [
      { label: '\u2190', latex: '\\leftarrow' }, { label: '\u2192', latex: '\\rightarrow' },
      { label: '\u2194', latex: '\\leftrightarrow' }, { label: '\u21D2', latex: '\\Rightarrow' },
      { label: '\u21D4', latex: '\\Leftrightarrow' }, { label: '\u2191', latex: '\\uparrow' },
      { label: '\u2193', latex: '\\downarrow' },
    ],
  },
  {
    category: 'Common',
    symbols: [
      { label: '\u00B2', latex: '^{2}' }, { label: '\u00B3', latex: '^{3}' },
      { label: 'x\u207F', latex: '^{n}' }, { label: 'x\u2081', latex: '_{1}' },
      { label: '\u2200', latex: '\\forall' }, { label: '\u2203', latex: '\\exists' },
      { label: '\u2208', latex: '\\in' }, { label: '\u2282', latex: '\\subset' },
      { label: '\u222A', latex: '\\cup' }, { label: '\u2229', latex: '\\cap' },
      { label: 'frac', latex: '\\frac{}{}' }, { label: '\u2202', latex: '\\partial' },
    ],
  },
]

/**
 * Get the symbol palette for building UI.
 * @returns {typeof SYMBOL_PALETTE}
 */
export function getSymbolPalette() {
  return SYMBOL_PALETTE
}

// ---------------------------------------------------------------------------
// LaTeX detection
// ---------------------------------------------------------------------------

/** Inline: $...$ (not $$) */
const INLINE_REGEX = /(?<!\$)\$(?!\$)(.+?)(?<!\$)\$(?!\$)/g

/** Block: $$...$$ */
const BLOCK_REGEX = /\$\$([\s\S]+?)\$\$/g

/**
 * Parse math expressions from text.
 * @param {string} text
 * @returns {Array<{ type: 'inline'|'block', src: string, index: number, length: number }>}
 */
export function parseMathExpressions(text) {
  if (!text) return []
  const results = []

  BLOCK_REGEX.lastIndex = 0
  let match
  while ((match = BLOCK_REGEX.exec(text)) !== null) {
    results.push({ type: 'block', src: match[1].trim(), index: match.index, length: match[0].length })
  }

  INLINE_REGEX.lastIndex = 0
  while ((match = INLINE_REGEX.exec(text)) !== null) {
    // Skip if inside a block match
    if (!results.some(r => match.index >= r.index && match.index < r.index + r.length)) {
      results.push({ type: 'inline', src: match[1].trim(), index: match.index, length: match[0].length })
    }
  }

  return results.sort((a, b) => a.index - b.index)
}

/**
 * Convert a LaTeX string to MathML (basic subset).
 * @param {string} latex
 * @returns {string}
 */
export function latexToMathML(latex) {
  // Basic conversion for common patterns
  let ml = latex
    .replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, '<mfrac><mrow>$1</mrow><mrow>$2</mrow></mfrac>')
    .replace(/\\sqrt\{([^}]*)\}/g, '<msqrt><mrow>$1</mrow></msqrt>')
    .replace(/\^{([^}]*)}/g, '<msup><mo></mo><mn>$1</mn></msup>')
    .replace(/_{([^}]*)}/g, '<msub><mo></mo><mn>$1</mn></msub>')
    .replace(/\\sum/g, '<mo>&sum;</mo>')
    .replace(/\\prod/g, '<mo>&prod;</mo>')
    .replace(/\\int/g, '<mo>&int;</mo>')
    .replace(/\\infty/g, '<mo>&infin;</mo>')
    .replace(/\\alpha/g, '<mi>&alpha;</mi>')
    .replace(/\\beta/g, '<mi>&beta;</mi>')
    .replace(/\\pi/g, '<mi>&pi;</mi>')
  return `<math xmlns="http://www.w3.org/1998/Math/MathML">${ml}</math>`
}

// ---------------------------------------------------------------------------
// Default renderer (styled LaTeX display)
// ---------------------------------------------------------------------------

function defaultRenderMath(latex, displayMode) {
  const escaped = escapeHTML(latex)
  return `<code class="rmx-math-latex">${escaped}</code>`
}

// ---------------------------------------------------------------------------
// Plugin
// ---------------------------------------------------------------------------

export function MathPlugin(options = {}) {
  const {
    renderMath = defaultRenderMath,
    autoRender = true,
    numbering = true,
  } = options

  let engine = null
  let observer = null
  let equationCounter = 0

  function renderMathElement(el) {
    const src = el.getAttribute('data-math-src')
    if (!src) return
    const isBlock = el.classList.contains('rmx-math-block')
    const html = renderMath(src, isBlock)
    el.innerHTML = html
    if (isBlock && numbering) {
      const num = el.getAttribute('data-equation-number')
      if (num) {
        const label = document.createElement('span')
        label.className = 'rmx-equation-number'
        label.textContent = `(${num})`
        el.appendChild(label)
      }
    }
  }

  function renderAllMath() {
    if (!engine) return
    const els = engine.element.querySelectorAll('[data-math-src]')
    els.forEach(renderMathElement)
  }

  function createMathElement(latex, displayMode, eqNumber) {
    const tag = displayMode ? 'div' : 'span'
    const el = document.createElement(tag)
    el.className = `rmx-math ${displayMode ? 'rmx-math-block' : 'rmx-math-inline'}`
    el.setAttribute('data-math', 'latex')
    el.setAttribute('data-math-src', latex)
    el.contentEditable = 'false'
    if (displayMode && numbering && eqNumber) {
      el.setAttribute('data-equation-number', String(eqNumber))
    }
    el.innerHTML = renderMath(latex, displayMode)
    if (displayMode && numbering && eqNumber) {
      const label = document.createElement('span')
      label.className = 'rmx-equation-number'
      label.textContent = `(${eqNumber})`
      el.appendChild(label)
    }
    return el
  }

  return createPlugin({
    name: 'math',
    requiresFullAccess: true,
    version: '1.0.0',
    description: 'LaTeX/KaTeX math rendering, symbol palette, equation numbering',

    commands: [
      {
        name: 'insertMath',
        execute(eng, params = {}) {
          const { latex = '', displayMode = false } = params
          eng.history.snapshot()
          equationCounter++
          const el = createMathElement(latex, displayMode, displayMode ? equationCounter : null)

          const sel = window.getSelection()
          if (sel && sel.rangeCount > 0) {
            const range = sel.getRangeAt(0)
            range.deleteContents()
            range.insertNode(el)
            const space = document.createTextNode('\u00A0')
            el.after(space)
            range.setStartAfter(space)
            range.collapse(true)
            sel.removeAllRanges()
            sel.addRange(range)
          }

          eng.eventBus.emit('content:change')
          return el
        },
        meta: { icon: 'math', tooltip: 'Insert Math Equation' },
      },
      {
        name: 'editMath',
        execute(eng, { element, latex }) {
          if (!element || !latex) return
          eng.history.snapshot()
          element.setAttribute('data-math-src', latex)
          renderMathElement(element)
          eng.eventBus.emit('content:change')
        },
        meta: { tooltip: 'Edit Math Equation' },
      },
      {
        name: 'insertSymbol',
        execute(eng, latex) {
          if (!latex) return
          const sel = window.getSelection()
          if (!sel || sel.rangeCount === 0) return
          const range = sel.getRangeAt(0)
          range.deleteContents()
          range.insertNode(document.createTextNode(latex))
          range.collapse(false)
          eng.eventBus.emit('content:change')
        },
        meta: { icon: 'symbol', tooltip: 'Insert Symbol' },
      },
      {
        name: 'getSymbolPalette',
        execute() { return getSymbolPalette() },
        meta: { tooltip: 'Get Symbol Palette' },
      },
      {
        name: 'getMathElements',
        execute(eng) {
          const els = eng.element.querySelectorAll('[data-math-src]')
          return Array.from(els).map((el, i) => ({
            index: i,
            src: el.getAttribute('data-math-src'),
            displayMode: el.classList.contains('rmx-math-block'),
            equationNumber: el.getAttribute('data-equation-number'),
            element: el,
          }))
        },
        meta: { tooltip: 'Get Math Elements' },
      },
      {
        name: 'copyMathAs',
        execute(eng, { element, format = 'latex' }) {
          if (!element) return null
          const src = element.getAttribute('data-math-src')
          if (!src) return null
          if (format === 'latex') return src
          if (format === 'mathml') return latexToMathML(src)
          return src
        },
        meta: { tooltip: 'Copy Math As Format' },
      },
    ],

    contextMenuItems: [
      { label: 'Insert Inline Math', command: 'insertMath' },
    ],

    init(eng) {
      engine = eng
      equationCounter = 0

      engine._math = {
        getSymbolPalette,
        parseMathExpressions,
        latexToMathML,
        renderAllMath,
        getEquationCount: () => equationCounter,
      }

      // Click on math element to edit
      engine.element.addEventListener('dblclick', (e) => {
        const mathEl = e.target.closest('[data-math-src]')
        if (mathEl) {
          engine.eventBus.emit('math:edit', {
            element: mathEl,
            src: mathEl.getAttribute('data-math-src'),
            displayMode: mathEl.classList.contains('rmx-math-block'),
          })
        }
      })

      // Re-render on content change
      observer = new MutationObserver(() => renderAllMath())
      observer.observe(engine.element, { childList: true, subtree: true })

      renderAllMath()
    },

    destroy() {
      observer?.disconnect()
      engine = null
    },
  })
}
