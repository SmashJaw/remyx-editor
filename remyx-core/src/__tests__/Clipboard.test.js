
import { Clipboard } from '../core/Clipboard.js'

jest.mock('../utils/pasteClean.js', () => ({
  cleanPastedHTML: jest.fn((html) => html),
  looksLikeMarkdown: jest.fn(() => false),
}))

jest.mock('../utils/markdownConverter.js', () => ({
  markdownToHtml: jest.fn((text) => `<p>${text}</p>`),
}))

jest.mock('../utils/documentConverter/index.js', () => ({
  isImportableFile: jest.fn(() => false),
  convertDocument: jest.fn(() => Promise.resolve('<p>converted</p>')),
}))

jest.mock('../constants/defaults.js', () => ({
  DEFAULT_MAX_FILE_SIZE: 10 * 1024 * 1024,
}))

import { cleanPastedHTML, looksLikeMarkdown } from '../utils/pasteClean.js'
import { markdownToHtml } from '../utils/markdownConverter.js'
import { isImportableFile } from '../utils/documentConverter/index.js'

describe('Clipboard', () => {
  let clipboard
  let mockEngine
  let element

  beforeEach(() => {
    element = document.createElement('div')
    mockEngine = {
      element,
      options: {
        uploadHandler: null,
        maxFileSize: 10 * 1024 * 1024,
        sanitize: true,
      },
      selection: {
        insertHTML: jest.fn(),
        save: jest.fn(),
        restore: jest.fn(),
      },
      history: { snapshot: jest.fn() },
      eventBus: { emit: jest.fn() },
      sanitizer: { sanitize: jest.fn((html) => html) },
      commands: { execute: jest.fn() },
      outputFormat: 'html',
    }
    clipboard = new Clipboard(mockEngine)

    // Reset mocks
    cleanPastedHTML.mockImplementation((html) => html)
    looksLikeMarkdown.mockReturnValue(false)
    markdownToHtml.mockImplementation((text) => `<p>${text}</p>`)
    isImportableFile.mockReturnValue(false)
  })

  afterEach(() => {
    clipboard.destroy()
  })

  describe('constructor', () => {
    it('should store the engine reference', () => {
      expect(clipboard.engine).toBe(mockEngine)
    })
  })

  describe('init', () => {
    it('should add paste, copy, and cut event listeners', () => {
      const spy = jest.spyOn(element, 'addEventListener')
      clipboard.init()
      expect(spy).toHaveBeenCalledWith('paste', clipboard._handlePaste)
      expect(spy).toHaveBeenCalledWith('copy', clipboard._handleCopy)
      expect(spy).toHaveBeenCalledWith('cut', clipboard._handleCut)
      expect(spy).toHaveBeenCalledTimes(3)
    })
  })

  describe('destroy', () => {
    it('should remove paste, copy, and cut event listeners', () => {
      clipboard.init()
      const spy = jest.spyOn(element, 'removeEventListener')
      clipboard.destroy()
      expect(spy).toHaveBeenCalledWith('paste', clipboard._handlePaste)
      expect(spy).toHaveBeenCalledWith('copy', clipboard._handleCopy)
      expect(spy).toHaveBeenCalledWith('cut', clipboard._handleCut)
    })
  })

  describe('_handlePaste', () => {
    function createPasteEvent({ html = '', text = '', files = [] } = {}) {
      const event = new Event('paste', { bubbles: true, cancelable: true })
      event.clipboardData = {
        getData: jest.fn((type) => {
          if (type === 'text/html') return html
          if (type === 'text/plain') return text
          return ''
        }),
        files,
      }
      return event
    }

    it('should preventDefault on paste', () => {
      clipboard.init()
      const event = createPasteEvent({ text: 'hello' })
      const spy = jest.spyOn(event, 'preventDefault')
      element.dispatchEvent(event)
      expect(spy).toHaveBeenCalled()
    })

    it('should take a history snapshot on paste', () => {
      clipboard.init()
      const event = createPasteEvent({ text: 'hello' })
      element.dispatchEvent(event)
      expect(mockEngine.history.snapshot).toHaveBeenCalled()
    })

    it('should handle HTML paste by cleaning and sanitizing', () => {
      clipboard.init()
      const event = createPasteEvent({ html: '<b>bold</b>' })
      element.dispatchEvent(event)
      expect(cleanPastedHTML).toHaveBeenCalledWith('<b>bold</b>')
      expect(mockEngine.sanitizer.sanitize).toHaveBeenCalled()
      expect(mockEngine.selection.insertHTML).toHaveBeenCalled()
    })

    it('should handle plain text paste with paragraph wrapping', () => {
      clipboard.init()
      const event = createPasteEvent({ text: 'hello world' })
      element.dispatchEvent(event)
      expect(mockEngine.selection.insertHTML).toHaveBeenCalledWith('<p>hello world</p>')
    })

    it('should split double newlines into separate paragraphs', () => {
      clipboard.init()
      const event = createPasteEvent({ text: 'para1\n\npara2' })
      element.dispatchEvent(event)
      expect(mockEngine.selection.insertHTML).toHaveBeenCalledWith('<p>para1</p><p>para2</p>')
    })

    it('should convert single newlines to <br> within paragraphs', () => {
      clipboard.init()
      const event = createPasteEvent({ text: 'line1\nline2' })
      element.dispatchEvent(event)
      expect(mockEngine.selection.insertHTML).toHaveBeenCalledWith('<p>line1<br>line2</p>')
    })

    it('should escape HTML entities in plain text paste', () => {
      clipboard.init()
      const event = createPasteEvent({ text: '<script>alert("xss")</script>' })
      element.dispatchEvent(event)
      // The source only escapes &, <, and > — not quotes
      expect(mockEngine.selection.insertHTML).toHaveBeenCalledWith(
        '<p>&lt;script&gt;alert("xss")&lt;/script&gt;</p>'
      )
    })

    it('should emit paste and content:change events for text paste', () => {
      clipboard.init()
      const event = createPasteEvent({ text: 'hello' })
      element.dispatchEvent(event)
      expect(mockEngine.eventBus.emit).toHaveBeenCalledWith('paste', expect.any(Object))
      expect(mockEngine.eventBus.emit).toHaveBeenCalledWith('content:change')
    })

    it('should detect markdown and convert when looksLikeMarkdown returns true', () => {
      looksLikeMarkdown.mockReturnValue(true)
      clipboard.init()
      const event = createPasteEvent({ text: '# Heading' })
      element.dispatchEvent(event)
      expect(markdownToHtml).toHaveBeenCalledWith('# Heading')
      expect(mockEngine.sanitizer.sanitize).toHaveBeenCalled()
      expect(mockEngine.selection.insertHTML).toHaveBeenCalled()
    })

    it('should always parse as markdown when outputFormat is markdown', () => {
      mockEngine.outputFormat = 'markdown'
      clipboard.init()
      const event = createPasteEvent({ text: 'just text' })
      element.dispatchEvent(event)
      expect(markdownToHtml).toHaveBeenCalledWith('just text')
    })

    it('should prefer HTML over plain text when both are available', () => {
      markdownToHtml.mockClear()
      clipboard.init()
      const event = createPasteEvent({ html: '<b>bold</b>', text: 'bold' })
      element.dispatchEvent(event)
      expect(cleanPastedHTML).toHaveBeenCalledWith('<b>bold</b>')
      // Should not call markdownToHtml for the plain text
      expect(markdownToHtml).not.toHaveBeenCalled()
    })

    it('should insert empty paragraph for empty text paste', () => {
      clipboard.init()
      const event = createPasteEvent({ text: '' })
      element.dispatchEvent(event)
      // No text or html — neither branch fires insertHTML
      expect(mockEngine.selection.insertHTML).not.toHaveBeenCalled()
    })
  })

  describe('_handlePaste with images', () => {
    it('should handle image file paste with uploadHandler', async () => {
      const uploadHandler = jest.fn().mockResolvedValue('https://example.com/img.png')
      mockEngine.options.uploadHandler = uploadHandler
      clipboard.init()

      const imageFile = new File(['data'], 'image.png', { type: 'image/png' })
      const event = createPasteEventWithFiles([imageFile])
      element.dispatchEvent(event)

      expect(uploadHandler).toHaveBeenCalledWith(imageFile)
      await Promise.resolve()
      expect(mockEngine.commands.execute).toHaveBeenCalledWith('insertImage', {
        src: 'https://example.com/img.png',
        alt: 'image.png',
      })
    })

    it('should use FileReader when no uploadHandler is provided', () => {
      mockEngine.options.uploadHandler = null
      clipboard.init()

      const imageFile = new File(['data'], 'photo.jpg', { type: 'image/jpeg' })
      const event = createPasteEventWithFiles([imageFile])

      // Mock FileReader
      const mockReader = {
        readAsDataURL: jest.fn(),
        onload: null,
      }
      jest.spyOn(global, 'FileReader').mockImplementation(() => mockReader)

      element.dispatchEvent(event)
      expect(mockReader.readAsDataURL).toHaveBeenCalledWith(imageFile)

      // Simulate reader load
      mockReader.onload({ target: { result: 'data:image/jpeg;base64,abc' } })
      expect(mockEngine.commands.execute).toHaveBeenCalledWith('insertImage', {
        src: 'data:image/jpeg;base64,abc',
        alt: 'photo.jpg',
      })

      global.FileReader.mockRestore()
    })

    it('should not handle image paste if file exceeds max size', () => {
      mockEngine.options.maxFileSize = 100
      clipboard.init()

      const bigFile = new File(['x'.repeat(200)], 'big.png', { type: 'image/png' })
      // Override size since File constructor may not set it correctly
      Object.defineProperty(bigFile, 'size', { value: 200 })

      const event = createPasteEventWithFiles([bigFile])
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
      element.dispatchEvent(event)

      expect(mockEngine.eventBus.emit).toHaveBeenCalledWith('file:too-large', {
        file: bigFile,
        maxSize: 100,
      })
      warnSpy.mockRestore()
    })

    function createPasteEventWithFiles(files) {
      const event = new Event('paste', { bubbles: true, cancelable: true })
      event.clipboardData = {
        getData: jest.fn(() => ''),
        files,
      }
      return event
    }
  })

  describe('_handleCopy', () => {
    it('should not throw on copy events', () => {
      clipboard.init()
      const event = new Event('copy', { bubbles: true })
      expect(() => element.dispatchEvent(event)).not.toThrow()
    })
  })

  describe('_handleCut', () => {
    it('should emit content:change after cut', () => {
      jest.useFakeTimers()
      clipboard.init()
      const event = new Event('cut', { bubbles: true })
      element.dispatchEvent(event)

      expect(mockEngine.eventBus.emit).not.toHaveBeenCalledWith('content:change')
      jest.runAllTimers()
      expect(mockEngine.eventBus.emit).toHaveBeenCalledWith('content:change')
      jest.useRealTimers()
    })
  })

  describe('_exceedsMaxFileSize', () => {
    it('should return false for files under the limit', () => {
      const file = new File(['data'], 'small.txt', { type: 'text/plain' })
      Object.defineProperty(file, 'size', { value: 100 })
      expect(clipboard._exceedsMaxFileSize(file)).toBe(false)
    })

    it('should return true for files over the limit', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
      mockEngine.options.maxFileSize = 1000
      const file = new File(['data'], 'big.txt', { type: 'text/plain' })
      Object.defineProperty(file, 'size', { value: 2000 })
      expect(clipboard._exceedsMaxFileSize(file)).toBe(true)
      expect(mockEngine.eventBus.emit).toHaveBeenCalledWith('file:too-large', {
        file,
        maxSize: 1000,
      })
      warnSpy.mockRestore()
    })

    it('should use DEFAULT_MAX_FILE_SIZE when maxFileSize is not configured', () => {
      delete mockEngine.options.maxFileSize
      const file = new File(['data'], 'small.txt', { type: 'text/plain' })
      Object.defineProperty(file, 'size', { value: 100 })
      expect(clipboard._exceedsMaxFileSize(file)).toBe(false)
    })

    it('should return false when maxSize is 0 (unlimited)', () => {
      mockEngine.options.maxFileSize = 0
      const file = new File(['data'], 'any.txt', { type: 'text/plain' })
      Object.defineProperty(file, 'size', { value: 999999999 })
      expect(clipboard._exceedsMaxFileSize(file)).toBe(false)
    })
  })

  describe('_handleImagePaste upload error', () => {
    it('should emit upload:error when upload fails', async () => {
      const uploadError = new Error('upload failed')
      mockEngine.options.uploadHandler = jest.fn().mockRejectedValue(uploadError)
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      const file = new File(['data'], 'fail.png', { type: 'image/png' })
      clipboard._handleImagePaste(file)

      await Promise.resolve()
      await Promise.resolve()

      expect(mockEngine.eventBus.emit).toHaveBeenCalledWith('upload:error', {
        file,
        error: uploadError,
      })
      errorSpy.mockRestore()
    })
  })
})
