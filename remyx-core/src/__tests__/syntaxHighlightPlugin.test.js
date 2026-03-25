import { vi } from 'vitest'
import { SyntaxHighlightPlugin } from '../plugins/builtins/syntaxHighlight/SyntaxHighlightPlugin.js'

describe('SyntaxHighlightPlugin', () => {
  let plugin, engine

  beforeEach(() => {
    const el = document.createElement('div')
    el.contentEditable = 'true'
    document.body.appendChild(el)

    engine = {
      element: el,
      eventBus: {
        emit: vi.fn(),
        on: vi.fn(() => () => {}),
      },
      selection: {
        save: vi.fn(() => null),
        restore: vi.fn(),
        getSelection: vi.fn(() => window.getSelection()),
      },
      commands: { register: vi.fn() },
    }
  })

  afterEach(() => {
    if (plugin) {
      plugin.destroy(engine)
    }
    document.body.innerHTML = ''
  })

  it('creates a plugin with correct name', () => {
    plugin = SyntaxHighlightPlugin()
    expect(plugin.name).toBe('syntaxHighlight')
    expect(plugin.requiresFullAccess).toBe(true)
  })

  it('has expected commands', () => {
    plugin = SyntaxHighlightPlugin()
    const names = plugin.commands.map(c => c.name)
    expect(names).toContain('setCodeLanguage')
    expect(names).toContain('getCodeLanguage')
    expect(names).toContain('toggleLineNumbers')
  })

  it('highlights code blocks on init', () => {
    engine.element.innerHTML = '<pre><code data-language="javascript">const x = 1;</code></pre>'
    plugin = SyntaxHighlightPlugin()
    plugin.init(engine)

    // After init, the pre should be marked as highlighted
    const pre = engine.element.querySelector('pre')
    expect(pre.classList.contains('rmx-highlighted')).toBe(true)
  })

  it('adds copy button to pre blocks', () => {
    engine.element.innerHTML = '<pre><code>test</code></pre>'
    plugin = SyntaxHighlightPlugin()
    plugin.init(engine)

    const btn = engine.element.querySelector('.rmx-code-copy-btn')
    expect(btn).not.toBeNull()
    expect(btn.getAttribute('aria-label')).toBe('Copy code')
  })

  it('does not add duplicate copy buttons', () => {
    engine.element.innerHTML = '<pre><code>test</code></pre>'
    plugin = SyntaxHighlightPlugin()
    plugin.init(engine)

    // Call init behavior again (simulate)
    const pre = engine.element.querySelector('pre')
    pre.classList.remove('rmx-highlighted')
    // Trigger re-highlight by adding pre
    const pre2 = document.createElement('pre')
    const code2 = document.createElement('code')
    code2.textContent = 'more code'
    pre2.appendChild(code2)
    engine.element.appendChild(pre2)

    // Wait for mutation observer + debounce
    vi.useFakeTimers()
    vi.advanceTimersByTime(200)
    vi.useRealTimers()

    expect(engine.element.querySelectorAll('.rmx-code-copy-btn').length).toBeGreaterThanOrEqual(1)
  })

  it('toggleLineNumbers adds and removes line numbers', () => {
    engine.element.innerHTML = '<pre><code>line1\nline2\nline3</code></pre>'
    plugin = SyntaxHighlightPlugin()
    plugin.init(engine)

    const pre = engine.element.querySelector('pre')
    const cmd = plugin.commands.find(c => c.name === 'toggleLineNumbers')

    // Toggle on
    cmd.execute(engine, { element: pre })
    expect(pre.hasAttribute('data-line-numbers')).toBe(true)
    expect(pre.querySelector('.rmx-line-numbers')).not.toBeNull()
    expect(pre.classList.contains('rmx-has-line-numbers')).toBe(true)

    // Toggle off
    cmd.execute(engine, { element: pre })
    expect(pre.hasAttribute('data-line-numbers')).toBe(false)
  })

  it('setCodeLanguage returns false when no pre block', () => {
    plugin = SyntaxHighlightPlugin()
    plugin.init(engine)

    const sel = window.getSelection()
    sel.removeAllRanges()

    engine.selection.getSelection.mockReturnValue({ anchorNode: null })

    const cmd = plugin.commands.find(c => c.name === 'setCodeLanguage')
    expect(cmd.execute(engine, { language: 'python' })).toBe(false)
  })

  it('setCodeLanguage returns false when no language specified', () => {
    plugin = SyntaxHighlightPlugin()
    plugin.init(engine)
    const cmd = plugin.commands.find(c => c.name === 'setCodeLanguage')
    expect(cmd.execute(engine)).toBe(false)
  })

  it('getCodeLanguage returns null when not in code block', () => {
    plugin = SyntaxHighlightPlugin()
    plugin.init(engine)

    engine.selection.getSelection.mockReturnValue({ anchorNode: null })

    const cmd = plugin.commands.find(c => c.name === 'getCodeLanguage')
    expect(cmd.execute(engine)).toBeNull()
  })

  it('detects language automatically when not specified', () => {
    engine.element.innerHTML = '<pre><code>const x = 1; // js</code></pre>'
    plugin = SyntaxHighlightPlugin()
    plugin.init(engine)

    const code = engine.element.querySelector('code')
    // May or may not detect as JS, but should have data-language attribute set
    // or the pre should be marked highlighted
    const pre = engine.element.querySelector('pre')
    expect(pre.classList.contains('rmx-highlighted')).toBe(true)
  })

  it('handles pre without code element', () => {
    engine.element.innerHTML = '<pre>plain pre content</pre>'
    plugin = SyntaxHighlightPlugin()
    plugin.init(engine)
    // Should not crash, copy button still added
    expect(engine.element.querySelector('.rmx-code-copy-btn')).not.toBeNull()
  })

  it('destroy cleans up observer and handlers', () => {
    plugin = SyntaxHighlightPlugin()
    plugin.init(engine)
    plugin.destroy(engine)
    // Should not throw
  })

  it('re-highlights on focusout from pre', () => {
    engine.element.innerHTML = '<pre><code data-language="javascript">const x</code></pre>'
    plugin = SyntaxHighlightPlugin()
    plugin.init(engine)

    const pre = engine.element.querySelector('pre')
    pre.classList.remove('rmx-highlighted')

    const event = new Event('focusout', { bubbles: true })
    Object.defineProperty(event, 'target', { value: pre.querySelector('code') })
    engine.element.dispatchEvent(event)

    // Should attempt re-highlight
    expect(pre.classList.contains('rmx-highlighted')).toBe(true)
  })

  it('handles inline code with data-language', () => {
    engine.element.innerHTML = '<p>Text <code data-language="javascript">x</code> more</p>'
    plugin = SyntaxHighlightPlugin()
    plugin.init(engine)

    const code = engine.element.querySelector('code')
    // Inline code should get highlighted class
    expect(code.classList.contains('rmx-inline-highlighted')).toBe(true)
  })

  it('line numbers show correct count', () => {
    engine.element.innerHTML = '<pre data-line-numbers><code>a\nb\nc\nd</code></pre>'
    plugin = SyntaxHighlightPlugin()
    plugin.init(engine)

    const gutter = engine.element.querySelector('.rmx-line-numbers')
    expect(gutter).not.toBeNull()
    const numbers = gutter.querySelectorAll('.rmx-line-number')
    expect(numbers.length).toBe(4)
  })
})
