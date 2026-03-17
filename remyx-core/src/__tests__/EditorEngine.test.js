
import { EditorEngine } from '../core/EditorEngine.js'

describe('EditorEngine', () => {
  let engine
  let element

  beforeEach(() => {
    element = document.createElement('div')
    document.body.appendChild(element)
    engine = new EditorEngine(element)
  })

  afterEach(() => {
    if (!engine._isDestroyed) {
      engine.destroy()
    }
    if (element.parentNode) {
      document.body.removeChild(element)
    }
  })

  describe('constructor', () => {
    it('should store the element', () => {
      expect(engine.element).toBe(element)
    })

    it('should store options', () => {
      const opts = { outputFormat: 'markdown', theme: 'dark' }
      const e = new EditorEngine(element, opts)
      expect(e.options).toEqual(opts)
      expect(e.outputFormat).toBe('markdown')
    })

    it('should default outputFormat to html', () => {
      expect(engine.outputFormat).toBe('html')
    })

    it('should initialize subsystems', () => {
      expect(engine.eventBus).toBeDefined()
      expect(engine.selection).toBeDefined()
      expect(engine.keyboard).toBeDefined()
      expect(engine.commands).toBeDefined()
      expect(engine.history).toBeDefined()
      expect(engine.sanitizer).toBeDefined()
      expect(engine.clipboard).toBeDefined()
      expect(engine.dragDrop).toBeDefined()
      expect(engine.plugins).toBeDefined()
    })

    it('should not be destroyed initially', () => {
      expect(engine._isDestroyed).toBe(false)
    })

    it('should not be in source or markdown mode initially', () => {
      expect(engine.isSourceMode).toBe(false)
      expect(engine.isMarkdownMode).toBe(false)
    })
  })

  describe('init', () => {
    it('should set contenteditable to true', () => {
      engine.init()
      expect(element.getAttribute('contenteditable')).toBe('true')
    })

    it('should set ARIA attributes', () => {
      engine.init()
      expect(element.getAttribute('role')).toBe('textbox')
      expect(element.getAttribute('aria-multiline')).toBe('true')
      expect(element.getAttribute('spellcheck')).toBe('true')
    })

    it('should add default paragraph when empty', () => {
      element.innerHTML = ''
      engine.init()
      expect(element.innerHTML).toBe('<p><br></p>')
    })

    it('should preserve existing content', () => {
      element.innerHTML = '<p>Existing content</p>'
      engine.init()
      expect(element.innerHTML).toContain('Existing content')
    })
  })

  describe('destroy', () => {
    it('should remove contenteditable attribute', () => {
      engine.init()
      engine.destroy()
      expect(element.hasAttribute('contenteditable')).toBe(false)
    })

    it('should set _isDestroyed flag', () => {
      engine.destroy()
      expect(engine._isDestroyed).toBe(true)
    })

    it('should be idempotent', () => {
      engine.init()
      engine.destroy()
      expect(() => engine.destroy()).not.toThrow()
    })
  })

  describe('getHTML / setHTML', () => {
    it('should return sanitized HTML content', () => {
      engine.init()
      element.innerHTML = '<p>Hello <strong>world</strong></p>'
      const html = engine.getHTML()
      expect(html).toContain('Hello')
      expect(html).toContain('<strong>world</strong>')
    })

    it('should set HTML content', () => {
      engine.init()
      engine.setHTML('<p>New content</p>')
      expect(element.innerHTML).toContain('New content')
    })

    it('should set default paragraph when setting empty HTML', () => {
      engine.init()
      engine.setHTML('')
      expect(element.innerHTML).toBe('<p><br></p>')
    })

    it('should sanitize HTML on set', () => {
      engine.init()
      engine.setHTML('<p>Safe</p><script>alert(1)</script>')
      expect(element.innerHTML).not.toContain('<script>')
      expect(element.innerHTML).toContain('Safe')
    })
  })

  describe('getText', () => {
    it('should return text content', () => {
      engine.init()
      element.innerHTML = '<p>Hello world</p>'
      expect(engine.getText()).toBe('Hello world')
    })

    it('should return empty string when element is empty', () => {
      engine.init()
      element.innerHTML = ''
      expect(engine.getText()).toBe('')
    })
  })

  describe('isEmpty', () => {
    it('should return true when editor is empty', () => {
      engine.init()
      element.innerHTML = '<p><br></p>'
      // textContent of <p><br></p> is "\n"
      expect(engine.isEmpty()).toBe(true)
    })

    it('should return true when text is only whitespace', () => {
      engine.init()
      element.innerHTML = '<p>   </p>'
      expect(engine.isEmpty()).toBe(true)
    })

    it('should return false when editor has content', () => {
      engine.init()
      element.innerHTML = '<p>Hello</p>'
      expect(engine.isEmpty()).toBe(false)
    })
  })

  describe('focus / blur', () => {
    it('should call focus on the element', () => {
      engine.init()
      const focusSpy = jest.spyOn(element, 'focus')
      engine.focus()
      expect(focusSpy).toHaveBeenCalled()
    })

    it('should call blur on the element', () => {
      engine.init()
      const blurSpy = jest.spyOn(element, 'blur')
      engine.blur()
      expect(blurSpy).toHaveBeenCalled()
    })
  })

  describe('executeCommand', () => {
    it('should delegate to commands.execute', () => {
      const spy = jest.spyOn(engine.commands, 'execute').mockReturnValue(true)
      engine.executeCommand('bold')
      expect(spy).toHaveBeenCalledWith('bold')
    })

    it('should pass additional arguments', () => {
      const spy = jest.spyOn(engine.commands, 'execute').mockReturnValue(true)
      engine.executeCommand('setColor', '#ff0000')
      expect(spy).toHaveBeenCalledWith('setColor', '#ff0000')
    })
  })

  describe('event emission', () => {
    it('should provide on/off for event subscription', () => {
      const handler = jest.fn()
      engine.on('test', handler)
      engine.eventBus.emit('test', 'data')
      expect(handler).toHaveBeenCalledWith('data')
    })

    it('should allow unsubscribing via off', () => {
      const handler = jest.fn()
      engine.on('test', handler)
      engine.off('test', handler)
      engine.eventBus.emit('test', 'data')
      expect(handler).not.toHaveBeenCalled()
    })

    it('on should return an unsubscribe function', () => {
      const handler = jest.fn()
      const unsub = engine.on('test', handler)
      unsub()
      engine.eventBus.emit('test', 'data')
      expect(handler).not.toHaveBeenCalled()
    })

    it('should emit focus event on element focus', () => {
      engine.init()
      const handler = jest.fn()
      engine.on('focus', handler)
      element.dispatchEvent(new Event('focus'))
      expect(handler).toHaveBeenCalled()
    })

    it('should emit blur event on element blur', () => {
      engine.init()
      const handler = jest.fn()
      engine.on('blur', handler)
      element.dispatchEvent(new Event('blur'))
      expect(handler).toHaveBeenCalled()
    })

    it('should emit content:change on input', () => {
      engine.init()
      element.innerHTML = '<p>text</p>'
      const handler = jest.fn()
      engine.on('content:change', handler)
      element.dispatchEvent(new Event('input'))
      expect(handler).toHaveBeenCalled()
    })
  })

  describe('getWordCount / getCharCount', () => {
    it('should count words', () => {
      engine.init()
      element.innerHTML = '<p>Hello world foo</p>'
      expect(engine.getWordCount()).toBe(3)
    })

    it('should return 0 for empty content', () => {
      engine.init()
      element.innerHTML = ''
      expect(engine.getWordCount()).toBe(0)
    })

    it('should count characters', () => {
      engine.init()
      element.innerHTML = '<p>Hello</p>'
      expect(engine.getCharCount()).toBe(5)
    })
  })

  describe('_handleInput', () => {
    it('should ensure at least one block element when content is empty', () => {
      engine.init()
      element.innerHTML = ''
      element.dispatchEvent(new Event('input'))
      expect(element.innerHTML).toBe('<p><br></p>')
    })

    it('should ensure at least one block element when content is just <br>', () => {
      engine.init()
      element.innerHTML = '<br>'
      element.dispatchEvent(new Event('input'))
      expect(element.innerHTML).toBe('<p><br></p>')
    })
  })
})
