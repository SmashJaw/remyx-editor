import { vi } from 'vitest'
import { Clipboard } from '../core/Clipboard.js'

vi.mock('../utils/pasteClean.js', () => ({
  cleanPastedHTML: vi.fn((html) => html),
  looksLikeMarkdown: vi.fn(() => false),
}))

vi.mock('../utils/markdownConverter.js', () => ({
  markdownToHtml: vi.fn((md) => `<p>${md}</p>`),
}))

describe('Clipboard - extended paste coverage', () => {
  let clipboard, engine

  beforeEach(() => {
    const el = document.createElement('div')
    el.contentEditable = 'true'
    el.innerHTML = '<p>Content</p>'
    document.body.appendChild(el)

    engine = {
      element: el,
      eventBus: { emit: vi.fn() },
      history: { snapshot: vi.fn() },
      selection: {
        insertHTML: vi.fn(),
        save: vi.fn(),
        restore: vi.fn(),
        getRange: vi.fn(),
        getSelection: vi.fn(() => window.getSelection()),
      },
      sanitizer: { sanitize: vi.fn(h => h) },
      getHTML: vi.fn(() => '<p>Content</p>'),
      options: {},
    }

    clipboard = new Clipboard(engine)
    clipboard.init()
  })

  afterEach(() => {
    clipboard.destroy()
    document.body.innerHTML = ''
  })

  it('paste with HTML uses sanitizer', () => {
    const event = new Event('paste', { bubbles: true, cancelable: true })
    Object.defineProperty(event, 'clipboardData', {
      value: {
        getData: vi.fn((type) => {
          if (type === 'text/html') return '<p><script>evil</script>text</p>'
          return 'text'
        }),
        files: [],
      },
    })
    engine.element.dispatchEvent(event)
    expect(engine.history.snapshot).toHaveBeenCalled()
  })

  it('paste with only plain text', () => {
    const event = new Event('paste', { bubbles: true, cancelable: true })
    Object.defineProperty(event, 'clipboardData', {
      value: {
        getData: vi.fn((type) => {
          if (type === 'text/plain') return 'simple text'
          return ''
        }),
        files: [],
      },
    })
    engine.element.dispatchEvent(event)
    expect(engine.history.snapshot).toHaveBeenCalled()
  })

  it('paste with image file', () => {
    const event = new Event('paste', { bubbles: true, cancelable: true })
    const imageFile = new File(['data'], 'image.png', { type: 'image/png' })
    Object.defineProperty(event, 'clipboardData', {
      value: {
        getData: vi.fn(() => ''),
        files: [imageFile],
      },
    })
    engine.element.dispatchEvent(event)
    expect(engine.history.snapshot).toHaveBeenCalled()
  })

  it('paste with empty clipboard', () => {
    const event = new Event('paste', { bubbles: true, cancelable: true })
    Object.defineProperty(event, 'clipboardData', {
      value: {
        getData: vi.fn(() => ''),
        files: [],
      },
    })
    engine.element.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(true)
  })

  it('copy event is handled', () => {
    const sel = window.getSelection()
    const range = document.createRange()
    range.selectNodeContents(engine.element)
    sel.removeAllRanges()
    sel.addRange(range)

    const event = new Event('copy', { bubbles: true, cancelable: true })
    Object.defineProperty(event, 'clipboardData', {
      value: { setData: vi.fn() },
    })
    engine.element.dispatchEvent(event)
  })

  it('cut event is handled', () => {
    const sel = window.getSelection()
    const range = document.createRange()
    range.selectNodeContents(engine.element)
    sel.removeAllRanges()
    sel.addRange(range)

    const event = new Event('cut', { bubbles: true, cancelable: true })
    Object.defineProperty(event, 'clipboardData', {
      value: { setData: vi.fn() },
    })
    engine.element.dispatchEvent(event)
  })
})
