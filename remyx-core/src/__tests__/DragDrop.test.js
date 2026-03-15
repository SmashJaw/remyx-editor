
import { DragDrop } from '../core/DragDrop.js'

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
import { isImportableFile, convertDocument } from '../utils/documentConverter/index.js'

describe('DragDrop', () => {
  let dragDrop
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
        enableDocumentImport: true,
        enableAttachments: true,
      },
      selection: { insertHTML: jest.fn() },
      history: { snapshot: jest.fn() },
      eventBus: { emit: jest.fn() },
      sanitizer: { sanitize: jest.fn((html) => html) },
      commands: { execute: jest.fn() },
      outputFormat: 'html',
    }
    dragDrop = new DragDrop(mockEngine)

    cleanPastedHTML.mockImplementation((html) => html)
    looksLikeMarkdown.mockReturnValue(false)
    markdownToHtml.mockImplementation((text) => `<p>${text}</p>`)
    isImportableFile.mockReturnValue(false)

    // Mock caretRangeFromPoint
    document.caretRangeFromPoint = jest.fn(() => {
      const range = document.createRange()
      return range
    })
  })

  afterEach(() => {
    dragDrop.destroy()
    delete document.caretRangeFromPoint
  })

  describe('constructor', () => {
    it('should store the engine reference', () => {
      expect(dragDrop.engine).toBe(mockEngine)
    })
  })

  describe('init', () => {
    it('should add all four drag/drop event listeners', () => {
      const spy = jest.spyOn(element, 'addEventListener')
      dragDrop.init()
      expect(spy).toHaveBeenCalledWith('dragover', dragDrop._handleDragOver)
      expect(spy).toHaveBeenCalledWith('drop', dragDrop._handleDrop)
      expect(spy).toHaveBeenCalledWith('dragenter', dragDrop._handleDragEnter)
      expect(spy).toHaveBeenCalledWith('dragleave', dragDrop._handleDragLeave)
      expect(spy).toHaveBeenCalledTimes(4)
    })
  })

  describe('destroy', () => {
    it('should remove all four drag/drop event listeners', () => {
      dragDrop.init()
      const spy = jest.spyOn(element, 'removeEventListener')
      dragDrop.destroy()
      expect(spy).toHaveBeenCalledWith('dragover', dragDrop._handleDragOver)
      expect(spy).toHaveBeenCalledWith('drop', dragDrop._handleDrop)
      expect(spy).toHaveBeenCalledWith('dragenter', dragDrop._handleDragEnter)
      expect(spy).toHaveBeenCalledWith('dragleave', dragDrop._handleDragLeave)
    })

    it('should not throw if called without init', () => {
      expect(() => dragDrop.destroy()).not.toThrow()
    })
  })

  describe('_handleDragOver', () => {
    it('should preventDefault on dragover', () => {
      dragDrop.init()
      const event = new Event('dragover', { bubbles: true, cancelable: true })
      event.dataTransfer = { dropEffect: '' }
      const spy = jest.spyOn(event, 'preventDefault')
      element.dispatchEvent(event)
      expect(spy).toHaveBeenCalled()
    })

    it('should set dropEffect to copy', () => {
      dragDrop.init()
      const event = new Event('dragover', { bubbles: true, cancelable: true })
      event.dataTransfer = { dropEffect: '' }
      element.dispatchEvent(event)
      expect(event.dataTransfer.dropEffect).toBe('copy')
    })
  })

  describe('_handleDragEnter', () => {
    it('should add rmx-drag-over class to the element', () => {
      dragDrop.init()
      const event = new Event('dragenter', { bubbles: true, cancelable: true })
      element.dispatchEvent(event)
      expect(element.classList.contains('rmx-drag-over')).toBe(true)
    })

    it('should preventDefault on dragenter', () => {
      dragDrop.init()
      const event = new Event('dragenter', { bubbles: true, cancelable: true })
      const spy = jest.spyOn(event, 'preventDefault')
      element.dispatchEvent(event)
      expect(spy).toHaveBeenCalled()
    })
  })

  describe('_handleDragLeave', () => {
    it('should remove rmx-drag-over class when leaving the element', () => {
      dragDrop.init()
      element.classList.add('rmx-drag-over')

      const event = new Event('dragleave', { bubbles: true })
      // relatedTarget is outside the element
      Object.defineProperty(event, 'relatedTarget', { value: document.body })
      element.dispatchEvent(event)
      expect(element.classList.contains('rmx-drag-over')).toBe(false)
    })

    it('should not remove rmx-drag-over class when moving to a child element', () => {
      dragDrop.init()
      const child = document.createElement('span')
      element.appendChild(child)
      element.classList.add('rmx-drag-over')

      const event = new Event('dragleave', { bubbles: true })
      Object.defineProperty(event, 'relatedTarget', { value: child })
      element.dispatchEvent(event)
      expect(element.classList.contains('rmx-drag-over')).toBe(true)
    })

    it('should remove class when relatedTarget is null', () => {
      dragDrop.init()
      element.classList.add('rmx-drag-over')

      const event = new Event('dragleave', { bubbles: true })
      Object.defineProperty(event, 'relatedTarget', { value: null })
      element.dispatchEvent(event)
      expect(element.classList.contains('rmx-drag-over')).toBe(false)
    })
  })

  describe('_handleDrop', () => {
    function createDropEvent({ files = [], html = '', text = '' } = {}) {
      const event = new Event('drop', { bubbles: true, cancelable: true })
      event.dataTransfer = {
        files,
        getData: jest.fn((type) => {
          if (type === 'text/html') return html
          if (type === 'text/plain') return text
          return ''
        }),
      }
      event.clientX = 100
      event.clientY = 100
      return event
    }

    it('should preventDefault on drop', () => {
      dragDrop.init()
      const event = createDropEvent()
      const spy = jest.spyOn(event, 'preventDefault')
      element.dispatchEvent(event)
      expect(spy).toHaveBeenCalled()
    })

    it('should remove rmx-drag-over class on drop', () => {
      dragDrop.init()
      element.classList.add('rmx-drag-over')
      const event = createDropEvent()
      element.dispatchEvent(event)
      expect(element.classList.contains('rmx-drag-over')).toBe(false)
    })

    it('should handle dropped HTML content', () => {
      dragDrop.init()
      const event = createDropEvent({ html: '<b>bold</b>' })
      element.dispatchEvent(event)
      expect(cleanPastedHTML).toHaveBeenCalledWith('<b>bold</b>')
      expect(mockEngine.sanitizer.sanitize).toHaveBeenCalled()
      expect(mockEngine.selection.insertHTML).toHaveBeenCalled()
      expect(mockEngine.eventBus.emit).toHaveBeenCalledWith('content:change')
    })

    it('should handle dropped plain text', () => {
      dragDrop.init()
      const event = createDropEvent({ text: 'hello world' })
      element.dispatchEvent(event)
      expect(mockEngine.selection.insertHTML).toHaveBeenCalledWith('<p>hello world</p>')
      expect(mockEngine.eventBus.emit).toHaveBeenCalledWith('content:change')
    })

    it('should take a history snapshot for text/html drops', () => {
      dragDrop.init()
      const event = createDropEvent({ text: 'test' })
      element.dispatchEvent(event)
      expect(mockEngine.history.snapshot).toHaveBeenCalled()
    })

    it('should emit drop event', () => {
      dragDrop.init()
      const event = createDropEvent({ text: 'test' })
      element.dispatchEvent(event)
      expect(mockEngine.eventBus.emit).toHaveBeenCalledWith('drop', expect.any(Object))
    })

    it('should detect markdown in dropped text when looksLikeMarkdown returns true', () => {
      looksLikeMarkdown.mockReturnValue(true)
      dragDrop.init()
      const event = createDropEvent({ text: '# Heading' })
      element.dispatchEvent(event)
      expect(markdownToHtml).toHaveBeenCalledWith('# Heading')
      expect(mockEngine.sanitizer.sanitize).toHaveBeenCalled()
    })

    it('should always parse as markdown when outputFormat is markdown', () => {
      mockEngine.outputFormat = 'markdown'
      dragDrop.init()
      const event = createDropEvent({ text: 'just text' })
      element.dispatchEvent(event)
      expect(markdownToHtml).toHaveBeenCalledWith('just text')
    })

    it('should escape HTML entities in plain text drops', () => {
      dragDrop.init()
      const event = createDropEvent({ text: '<div>test</div>' })
      element.dispatchEvent(event)
      expect(mockEngine.selection.insertHTML).toHaveBeenCalledWith(
        '<p>&lt;div&gt;test&lt;/div&gt;</p>'
      )
    })

    it('should prefer HTML over plain text when both are present', () => {
      markdownToHtml.mockClear()
      dragDrop.init()
      const event = createDropEvent({ html: '<em>italic</em>', text: 'italic' })
      element.dispatchEvent(event)
      expect(cleanPastedHTML).toHaveBeenCalledWith('<em>italic</em>')
      expect(markdownToHtml).not.toHaveBeenCalled()
    })
  })

  describe('_handleDrop with image files', () => {
    function createDropEventWithFiles(files) {
      const event = new Event('drop', { bubbles: true, cancelable: true })
      event.dataTransfer = {
        files,
        getData: jest.fn(() => ''),
      }
      event.clientX = 100
      event.clientY = 100
      return event
    }

    it('should handle image file drop with uploadHandler', async () => {
      const uploadHandler = jest.fn().mockResolvedValue('https://example.com/img.png')
      mockEngine.options.uploadHandler = uploadHandler
      dragDrop.init()

      const imageFile = new File(['data'], 'image.png', { type: 'image/png' })
      const event = createDropEventWithFiles([imageFile])
      element.dispatchEvent(event)

      expect(uploadHandler).toHaveBeenCalledWith(imageFile)
      await Promise.resolve()
      expect(mockEngine.commands.execute).toHaveBeenCalledWith('insertImage', {
        src: 'https://example.com/img.png',
        alt: 'image.png',
      })
    })

    it('should use FileReader for image drop when no uploadHandler', () => {
      mockEngine.options.uploadHandler = null
      dragDrop.init()

      const imageFile = new File(['data'], 'photo.jpg', { type: 'image/jpeg' })
      const event = createDropEventWithFiles([imageFile])

      const mockReader = { readAsDataURL: jest.fn(), onload: null }
      jest.spyOn(global, 'FileReader').mockImplementation(() => mockReader)

      element.dispatchEvent(event)
      expect(mockReader.readAsDataURL).toHaveBeenCalledWith(imageFile)

      mockReader.onload({ target: { result: 'data:image/jpeg;base64,abc' } })
      expect(mockEngine.commands.execute).toHaveBeenCalledWith('insertImage', {
        src: 'data:image/jpeg;base64,abc',
        alt: 'photo.jpg',
      })

      global.FileReader.mockRestore()
    })

    it('should skip image files that exceed max size', () => {
      mockEngine.options.maxFileSize = 100
      dragDrop.init()

      const bigFile = new File(['x'], 'big.png', { type: 'image/png' })
      Object.defineProperty(bigFile, 'size', { value: 200 })

      const event = createDropEventWithFiles([bigFile])
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
      element.dispatchEvent(event)

      expect(mockEngine.eventBus.emit).toHaveBeenCalledWith('file:too-large', {
        file: bigFile,
        maxSize: 100,
      })
      warnSpy.mockRestore()
    })
  })

  describe('_exceedsMaxFileSize', () => {
    it('should return false for files under the limit', () => {
      const file = new File(['data'], 'small.txt', { type: 'text/plain' })
      Object.defineProperty(file, 'size', { value: 100 })
      expect(dragDrop._exceedsMaxFileSize(file)).toBe(false)
    })

    it('should return true for files over the limit', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
      mockEngine.options.maxFileSize = 500
      const file = new File(['data'], 'big.txt', { type: 'text/plain' })
      Object.defineProperty(file, 'size', { value: 1000 })
      expect(dragDrop._exceedsMaxFileSize(file)).toBe(true)
      expect(mockEngine.eventBus.emit).toHaveBeenCalledWith('file:too-large', {
        file,
        maxSize: 500,
      })
      warnSpy.mockRestore()
    })

    it('should use DEFAULT_MAX_FILE_SIZE when maxFileSize is not set', () => {
      delete mockEngine.options.maxFileSize
      const file = new File(['data'], 'small.txt', { type: 'text/plain' })
      Object.defineProperty(file, 'size', { value: 100 })
      expect(dragDrop._exceedsMaxFileSize(file)).toBe(false)
    })

    it('should return false when maxSize is 0 (unlimited)', () => {
      mockEngine.options.maxFileSize = 0
      const file = new File(['data'], 'any.txt', { type: 'text/plain' })
      Object.defineProperty(file, 'size', { value: 999999999 })
      expect(dragDrop._exceedsMaxFileSize(file)).toBe(false)
    })
  })

  describe('_setCursorAtDropPoint', () => {
    it('should set cursor using caretRangeFromPoint when available', () => {
      const mockRange = document.createRange()
      document.caretRangeFromPoint = jest.fn(() => mockRange)

      const mockSel = {
        removeAllRanges: jest.fn(),
        addRange: jest.fn(),
      }
      jest.spyOn(window, 'getSelection').mockReturnValue(mockSel)

      dragDrop._setCursorAtDropPoint({ clientX: 50, clientY: 50 })

      expect(document.caretRangeFromPoint).toHaveBeenCalledWith(50, 50)
      expect(mockSel.removeAllRanges).toHaveBeenCalled()
      expect(mockSel.addRange).toHaveBeenCalledWith(mockRange)

      window.getSelection.mockRestore()
    })

    it('should handle missing caretRangeFromPoint gracefully', () => {
      document.caretRangeFromPoint = undefined
      expect(() => {
        dragDrop._setCursorAtDropPoint({ clientX: 50, clientY: 50 })
      }).not.toThrow()
    })
  })

  describe('_handleDrop with upload errors', () => {
    it('should emit upload:error when image upload fails', async () => {
      const uploadError = new Error('upload failed')
      mockEngine.options.uploadHandler = jest.fn().mockRejectedValue(uploadError)
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      dragDrop.init()

      const imageFile = new File(['data'], 'fail.png', { type: 'image/png' })
      const event = new Event('drop', { bubbles: true, cancelable: true })
      event.dataTransfer = {
        files: [imageFile],
        getData: jest.fn(() => ''),
      }
      event.clientX = 100
      event.clientY = 100
      element.dispatchEvent(event)

      await Promise.resolve()
      await Promise.resolve()

      expect(mockEngine.eventBus.emit).toHaveBeenCalledWith('upload:error', {
        file: imageFile,
        error: uploadError,
      })
      errorSpy.mockRestore()
    })
  })
})
