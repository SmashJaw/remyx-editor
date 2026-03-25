/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  CalloutPlugin,
  registerCalloutType,
  unregisterCalloutType,
  getCalloutTypes,
  getCalloutType,
  parseGFMAlert,
} from '../plugins/builtins/calloutFeatures/index.js'

// ---- Helpers ----

function createMockEngine() {
  const listeners = {}
  const el = document.createElement('div')
  el.contentEditable = 'true'
  el.innerHTML = '<p>Test content</p>'
  document.body.appendChild(el)

  return {
    element: el,
    eventBus: {
      on(event, handler) {
        if (!listeners[event]) listeners[event] = []
        listeners[event].push(handler)
        return () => {
          listeners[event] = listeners[event].filter(h => h !== handler)
        }
      },
      emit(event, data) {
        if (listeners[event]) {
          for (const h of listeners[event]) h(data)
        }
      },
    },
    history: { snapshot: vi.fn() },
    selection: {
      getClosestElement: vi.fn(),
    },
    commands: { register: vi.fn() },
    _cleanup() { document.body.removeChild(el) },
  }
}

function placeCaretIn(el) {
  const target = el.querySelector('p') || el
  const textNode = target.firstChild || target
  const range = document.createRange()
  range.selectNodeContents(textNode)
  range.collapse(true)
  const sel = window.getSelection()
  sel.removeAllRanges()
  sel.addRange(range)
}

// ---- Tests ----

describe('parseGFMAlert', () => {
  it('returns null for non-alert text', () => {
    expect(parseGFMAlert('Just a blockquote')).toBeNull()
    expect(parseGFMAlert('')).toBeNull()
    expect(parseGFMAlert(null)).toBeNull()
  })

  it('parses [!NOTE]', () => {
    const result = parseGFMAlert('[!NOTE]\nThis is important')
    expect(result).toEqual({ type: 'note', body: 'This is important' })
  })

  it('parses [!WARNING]', () => {
    const result = parseGFMAlert('[!WARNING]\nBe careful')
    expect(result).toEqual({ type: 'warning', body: 'Be careful' })
  })

  it('parses [!TIP]', () => {
    const result = parseGFMAlert('[!TIP]\nHere is a tip')
    expect(result).toEqual({ type: 'tip', body: 'Here is a tip' })
  })

  it('parses [!IMPORTANT] as info type', () => {
    const result = parseGFMAlert('[!IMPORTANT]\nPay attention')
    expect(result).toEqual({ type: 'info', body: 'Pay attention' })
  })

  it('parses [!CAUTION] as error type', () => {
    const result = parseGFMAlert('[!CAUTION]\nDangerous')
    expect(result).toEqual({ type: 'error', body: 'Dangerous' })
  })

  it('handles empty body', () => {
    const result = parseGFMAlert('[!NOTE]\n')
    expect(result).toEqual({ type: 'note', body: '' })
  })
})

describe('Callout type registry', () => {
  it('has 7 built-in types', () => {
    expect(getCalloutTypes().length).toBeGreaterThanOrEqual(7)
  })

  it('includes all default types', () => {
    const types = getCalloutTypes().map(t => t.type)
    expect(types).toContain('info')
    expect(types).toContain('warning')
    expect(types).toContain('error')
    expect(types).toContain('success')
    expect(types).toContain('tip')
    expect(types).toContain('note')
    expect(types).toContain('question')
  })

  it('each type has type, label, icon, color', () => {
    for (const t of getCalloutTypes()) {
      expect(t.type).toBeTruthy()
      expect(t.label).toBeTruthy()
      expect(t.icon).toBeTruthy()
      expect(t.color).toBeTruthy()
    }
  })

  it('getCalloutType returns a specific type', () => {
    const info = getCalloutType('info')
    expect(info.type).toBe('info')
    expect(info.label).toBe('Info')
  })

  it('getCalloutType returns undefined for unknown', () => {
    expect(getCalloutType('nonexistent')).toBeUndefined()
  })

  it('registerCalloutType adds a custom type', () => {
    registerCalloutType({ type: 'custom-test', label: 'Custom', icon: '🔧', color: '#000' })
    expect(getCalloutType('custom-test')).toBeDefined()
    expect(getCalloutType('custom-test').label).toBe('Custom')
    // Cleanup
    unregisterCalloutType('custom-test')
  })

  it('registerCalloutType can override a built-in', () => {
    const original = getCalloutType('info')
    registerCalloutType({ type: 'info', label: 'Information!', icon: '🔵', color: '#0000ff' })
    expect(getCalloutType('info').label).toBe('Information!')
    // Restore
    registerCalloutType(original)
  })

  it('unregisterCalloutType removes a type', () => {
    registerCalloutType({ type: 'temp', label: 'Temp', icon: '⏳', color: '#999' })
    expect(unregisterCalloutType('temp')).toBe(true)
    expect(getCalloutType('temp')).toBeUndefined()
  })

  it('unregisterCalloutType returns false for unknown', () => {
    expect(unregisterCalloutType('nope')).toBe(false)
  })

  it('registerCalloutType ignores null/no-type', () => {
    const before = getCalloutTypes().length
    registerCalloutType(null)
    registerCalloutType({})
    expect(getCalloutTypes().length).toBe(before)
  })
})

describe('CalloutPlugin', () => {
  let engine
  let plugin

  beforeEach(() => {
    engine = createMockEngine()
    plugin = CalloutPlugin()
  })

  afterEach(() => {
    plugin.destroy()
    engine._cleanup()
  })

  it('creates a valid plugin', () => {
    expect(plugin.name).toBe('callouts')
    expect(plugin.requiresFullAccess).toBe(true)
    expect(typeof plugin.init).toBe('function')
    expect(typeof plugin.destroy).toBe('function')
  })

  it('registers 4 commands', () => {
    expect(plugin.commands.length).toBe(4)
    const names = plugin.commands.map(c => c.name)
    expect(names).toContain('insertCallout')
    expect(names).toContain('removeCallout')
    expect(names).toContain('changeCalloutType')
    expect(names).toContain('toggleCalloutCollapse')
  })

  it('has context menu items', () => {
    expect(plugin.contextMenuItems.length).toBe(2)
  })

  describe('after init', () => {
    beforeEach(() => {
      plugin.init(engine)
    })

    it('exposes _callouts API on engine', () => {
      expect(engine._callouts).toBeDefined()
      expect(typeof engine._callouts.getCalloutTypes).toBe('function')
      expect(typeof engine._callouts.registerCalloutType).toBe('function')
      expect(typeof engine._callouts.parseGFMAlert).toBe('function')
    })

    it('insertCallout creates a callout element', () => {
      placeCaretIn(engine.element)
      const insertCmd = plugin.commands.find(c => c.name === 'insertCallout')
      const callout = insertCmd.execute(engine, { type: 'warning' })

      expect(callout).not.toBeNull()
      expect(callout.classList.contains('rmx-callout')).toBe(true)
      expect(callout.classList.contains('rmx-callout-warning')).toBe(true)
      expect(callout.getAttribute('data-callout')).toBe('warning')
      expect(callout.querySelector('.rmx-callout-icon').textContent).toBe('⚠️')
      expect(callout.querySelector('.rmx-callout-title').textContent).toBe('Warning')
    })

    it('insertCallout with collapsible option', () => {
      placeCaretIn(engine.element)
      const insertCmd = plugin.commands.find(c => c.name === 'insertCallout')
      const callout = insertCmd.execute(engine, { type: 'tip', collapsible: true })

      expect(callout.hasAttribute('data-callout-collapsible')).toBe(true)
      expect(callout.querySelector('.rmx-callout-toggle')).not.toBeNull()
    })

    it('insertCallout with custom title', () => {
      placeCaretIn(engine.element)
      const insertCmd = plugin.commands.find(c => c.name === 'insertCallout')
      const callout = insertCmd.execute(engine, { type: 'info', title: 'Did you know?' })

      expect(callout.querySelector('.rmx-callout-title').textContent).toBe('Did you know?')
    })

    it('insertCallout defaults to info type', () => {
      placeCaretIn(engine.element)
      const insertCmd = plugin.commands.find(c => c.name === 'insertCallout')
      const callout = insertCmd.execute(engine)

      expect(callout.getAttribute('data-callout')).toBe('info')
    })

    it('removeCallout unwraps content', () => {
      placeCaretIn(engine.element)
      const insertCmd = plugin.commands.find(c => c.name === 'insertCallout')
      const callout = insertCmd.execute(engine, { type: 'note', content: '<p>Keep this text</p>' })

      // Place caret inside the callout body
      const body = callout.querySelector('.rmx-callout-body p')
      const range = document.createRange()
      range.selectNodeContents(body)
      range.collapse(true)
      window.getSelection().removeAllRanges()
      window.getSelection().addRange(range)

      const removeCmd = plugin.commands.find(c => c.name === 'removeCallout')
      removeCmd.execute(engine)

      // Callout should be gone, text preserved
      expect(engine.element.querySelector('.rmx-callout')).toBeNull()
      expect(engine.element.textContent).toContain('Keep this text')
    })

    it('changeCalloutType updates class and attributes', () => {
      placeCaretIn(engine.element)
      const insertCmd = plugin.commands.find(c => c.name === 'insertCallout')
      const callout = insertCmd.execute(engine, { type: 'info' })

      // Place caret inside callout
      const body = callout.querySelector('.rmx-callout-body p')
      const range = document.createRange()
      range.selectNodeContents(body)
      range.collapse(true)
      window.getSelection().removeAllRanges()
      window.getSelection().addRange(range)

      const changeCmd = plugin.commands.find(c => c.name === 'changeCalloutType')
      changeCmd.execute(engine, 'error')

      expect(callout.classList.contains('rmx-callout-error')).toBe(true)
      expect(callout.classList.contains('rmx-callout-info')).toBe(false)
      expect(callout.getAttribute('data-callout')).toBe('error')
      expect(callout.querySelector('.rmx-callout-icon').textContent).toBe('❌')
    })

    it('collapse toggle works via click', () => {
      placeCaretIn(engine.element)
      const insertCmd = plugin.commands.find(c => c.name === 'insertCallout')
      const callout = insertCmd.execute(engine, { type: 'tip', collapsible: true })

      const toggle = callout.querySelector('.rmx-callout-toggle')
      const body = callout.querySelector('.rmx-callout-body')

      // Initially expanded
      expect(callout.hasAttribute('data-callout-collapsed')).toBe(false)

      // Click to collapse
      toggle.click()
      expect(callout.hasAttribute('data-callout-collapsed')).toBe(true)
      expect(body.style.display).toBe('none')

      // Click to expand
      toggle.click()
      expect(callout.hasAttribute('data-callout-collapsed')).toBe(false)
      expect(body.style.display).toBe('')
    })

    it('auto-converts GFM alert blockquotes', () => {
      engine.element.innerHTML = '<blockquote>[!WARNING]\nThis is dangerous</blockquote>'
      // Trigger content:change to run the scanner
      engine.eventBus.emit('content:change')

      // Wait for debounce (300ms)
      return new Promise(resolve => setTimeout(resolve, 400)).then(() => {
        const callout = engine.element.querySelector('.rmx-callout-warning')
        expect(callout).not.toBeNull()
        expect(callout.getAttribute('data-callout')).toBe('warning')
        expect(engine.element.querySelector('blockquote')).toBeNull()
      })
    })

    it('callout body supports nested content', () => {
      placeCaretIn(engine.element)
      const insertCmd = plugin.commands.find(c => c.name === 'insertCallout')
      const callout = insertCmd.execute(engine, {
        type: 'info',
        content: '<ul><li>Item 1</li><li>Item 2</li></ul><pre><code>const x = 1;</code></pre>',
      })

      const body = callout.querySelector('.rmx-callout-body')
      expect(body.querySelector('ul')).not.toBeNull()
      expect(body.querySelector('pre')).not.toBeNull()
    })
  })
})
