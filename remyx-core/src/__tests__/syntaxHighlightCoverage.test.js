import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { SyntaxHighlightPlugin } from '../plugins/builtins/syntaxHighlight/SyntaxHighlightPlugin.js'

vi.mock('../plugins/builtins/syntaxHighlight/tokenizers.js', () => ({
  detectLanguage: vi.fn(() => 'javascript'),
  tokenize: vi.fn((source) => [
    { type: 'keyword', value: 'const' },
    { type: 'plain', value: ' x = 1' },
  ]),
  LANGUAGE_MAP: { javascript: 'JavaScript', python: 'Python' },
}))

vi.mock('../utils/escapeHTML.js', () => ({
  escapeHTMLAttr: vi.fn((str) => str),
}))

import { detectLanguage, tokenize } from '../plugins/builtins/syntaxHighlight/tokenizers.js'

function createMockEngine() {
  const element = document.createElement('div')
  element.contentEditable = 'true'
  document.body.appendChild(element)
  return {
    element,
    eventBus: { on: vi.fn(() => vi.fn()), emit: vi.fn() },
    selection: {
      save: vi.fn(() => null),
      restore: vi.fn(),
      getSelection: vi.fn(() => window.getSelection()),
    },
  }
}

describe('SyntaxHighlightPlugin — comprehensive coverage', () => {
  let engine, plugin

  beforeEach(() => {
    engine = createMockEngine()
    detectLanguage.mockClear()
    tokenize.mockClear()
    tokenize.mockReturnValue([
      { type: 'keyword', value: 'const' },
      { type: 'plain', value: ' x = 1' },
    ])
  })

  afterEach(() => {
    if (plugin) plugin.destroy(engine)
    engine.element.remove()
  })

  describe('init/destroy', () => {
    it('highlights existing code blocks on init', () => {
      const pre = document.createElement('pre')
      const code = document.createElement('code')
      code.textContent = 'const x = 1'
      pre.appendChild(code)
      engine.element.appendChild(pre)

      plugin = SyntaxHighlightPlugin()
      plugin.init(engine)

      expect(tokenize).toHaveBeenCalled()
      expect(pre.classList.contains('rmx-highlighted')).toBe(true)
    })

    it('adds copy button to code blocks', () => {
      const pre = document.createElement('pre')
      const code = document.createElement('code')
      code.textContent = 'code'
      pre.appendChild(code)
      engine.element.appendChild(pre)

      plugin = SyntaxHighlightPlugin()
      plugin.init(engine)

      expect(pre.querySelector('.rmx-code-copy-btn')).toBeTruthy()
    })

    it('cleans up on destroy', () => {
      plugin = SyntaxHighlightPlugin()
      plugin.init(engine)
      plugin.destroy(engine)
    })
  })

  describe('commands — setCodeLanguage', () => {
    it('sets language on code block and re-highlights', () => {
      const pre = document.createElement('pre')
      const code = document.createElement('code')
      code.textContent = 'code'
      pre.appendChild(code)
      engine.element.appendChild(pre)

      // Mock selection inside the pre
      const range = document.createRange()
      range.setStart(code.firstChild, 0)
      range.collapse(true)
      const sel = window.getSelection()
      sel.removeAllRanges()
      sel.addRange(range)
      engine.selection.getSelection.mockReturnValue(sel)

      plugin = SyntaxHighlightPlugin()
      plugin.init(engine)

      tokenize.mockClear()
      const cmd = plugin.commands.find(c => c.name === 'setCodeLanguage')
      const result = cmd.execute(engine, { language: 'python' })

      expect(result).toBe(true)
      expect(code.getAttribute('data-language')).toBe('python')
      expect(tokenize).toHaveBeenCalled()
    })

    it('returns false when no language specified', () => {
      plugin = SyntaxHighlightPlugin()
      plugin.init(engine)
      const cmd = plugin.commands.find(c => c.name === 'setCodeLanguage')
      expect(cmd.execute(engine, {})).toBe(false)
    })

    it('returns false when not in code block', () => {
      plugin = SyntaxHighlightPlugin()
      plugin.init(engine)

      // Selection not in a pre
      engine.selection.getSelection.mockReturnValue({ anchorNode: null })

      const cmd = plugin.commands.find(c => c.name === 'setCodeLanguage')
      expect(cmd.execute(engine, { language: 'python' })).toBe(false)
    })
  })

  describe('commands — getCodeLanguage', () => {
    it('returns language of current code block', () => {
      const pre = document.createElement('pre')
      const code = document.createElement('code')
      code.setAttribute('data-language', 'python')
      code.textContent = 'code'
      pre.appendChild(code)
      engine.element.appendChild(pre)

      const range = document.createRange()
      range.setStart(code.firstChild, 0)
      range.collapse(true)
      const sel = window.getSelection()
      sel.removeAllRanges()
      sel.addRange(range)
      engine.selection.getSelection.mockReturnValue(sel)

      plugin = SyntaxHighlightPlugin()
      plugin.init(engine)

      const cmd = plugin.commands.find(c => c.name === 'getCodeLanguage')
      expect(cmd.execute(engine)).toBe('python')
    })

    it('returns null when not in code block', () => {
      plugin = SyntaxHighlightPlugin()
      plugin.init(engine)
      engine.selection.getSelection.mockReturnValue({ anchorNode: null })

      const cmd = plugin.commands.find(c => c.name === 'getCodeLanguage')
      expect(cmd.execute(engine)).toBeNull()
    })
  })

  describe('commands — toggleLineNumbers', () => {
    it('adds line numbers to code block', () => {
      const pre = document.createElement('pre')
      const code = document.createElement('code')
      code.textContent = 'line1\nline2\nline3'
      pre.appendChild(code)
      engine.element.appendChild(pre)

      // Mock selection to be outside the pre (so highlighting runs)
      engine.selection.save.mockReturnValue(null)

      plugin = SyntaxHighlightPlugin()
      plugin.init(engine)

      const cmd = plugin.commands.find(c => c.name === 'toggleLineNumbers')
      cmd.execute(engine, { element: pre })

      expect(pre.hasAttribute('data-line-numbers')).toBe(true)
      expect(pre.querySelector('.rmx-line-numbers')).toBeTruthy()
      // After tokenize mock, the code content is "const x = 1" (2 words) so line count might differ
      // Just check line numbers exist
      expect(pre.querySelectorAll('.rmx-line-number').length).toBeGreaterThan(0)
    })

    it('removes line numbers on second toggle', () => {
      const pre = document.createElement('pre')
      const code = document.createElement('code')
      code.textContent = 'line1'
      pre.appendChild(code)
      engine.element.appendChild(pre)

      plugin = SyntaxHighlightPlugin()
      plugin.init(engine)

      const cmd = plugin.commands.find(c => c.name === 'toggleLineNumbers')
      cmd.execute(engine, { element: pre })
      cmd.execute(engine, { element: pre })

      expect(pre.hasAttribute('data-line-numbers')).toBe(false)
      expect(pre.querySelector('.rmx-line-numbers')).toBeNull()
    })
  })

  describe('auto-detect language', () => {
    it('detects language when data-language not set', () => {
      detectLanguage.mockReturnValue('javascript')
      const pre = document.createElement('pre')
      const code = document.createElement('code')
      code.textContent = 'const x = 1;'
      pre.appendChild(code)
      engine.element.appendChild(pre)

      plugin = SyntaxHighlightPlugin()
      plugin.init(engine)

      expect(detectLanguage).toHaveBeenCalled()
      expect(code.getAttribute('data-language')).toBe('javascript')
    })
  })

  describe('inline code highlighting', () => {
    it('highlights inline code with data-language', () => {
      const code = document.createElement('code')
      code.setAttribute('data-language', 'javascript')
      code.textContent = 'const x = 1'
      engine.element.appendChild(code)

      plugin = SyntaxHighlightPlugin()
      plugin.init(engine)

      expect(code.classList.contains('rmx-inline-highlighted')).toBe(true)
    })
  })

  describe('no tokenizer available', () => {
    it('marks pre as highlighted when tokenize returns null', () => {
      tokenize.mockReturnValue(null)
      const pre = document.createElement('pre')
      const code = document.createElement('code')
      code.textContent = 'unknown code'
      pre.appendChild(code)
      engine.element.appendChild(pre)

      plugin = SyntaxHighlightPlugin()
      plugin.init(engine)

      expect(pre.classList.contains('rmx-highlighted')).toBe(true)
    })
  })

  describe('focusout handler', () => {
    it('re-highlights on blur from code block', () => {
      const pre = document.createElement('pre')
      const code = document.createElement('code')
      code.textContent = 'code'
      pre.appendChild(code)
      engine.element.appendChild(pre)

      plugin = SyntaxHighlightPlugin()
      plugin.init(engine)

      tokenize.mockClear()
      pre.classList.remove('rmx-highlighted')

      const focusOut = new FocusEvent('focusout', { bubbles: true })
      Object.defineProperty(focusOut, 'target', { value: code })
      engine.element.dispatchEvent(focusOut)

      expect(tokenize).toHaveBeenCalled()
    })
  })
})
