import { vi } from 'vitest'

import { DragDrop } from '../core/DragDrop.js'

vi.mock('../utils/pasteClean.js', () => ({
  cleanPastedHTML: vi.fn((html) => html),
  looksLikeMarkdown: vi.fn(() => false),
}))

vi.mock('../utils/markdownConverter.js', () => ({
  markdownToHtml: vi.fn((text) => `<p>${text}</p>`),
}))

vi.mock('../utils/documentConverter/index.js', () => ({
  isImportableFile: vi.fn(() => false),
  convertDocument: vi.fn(() => Promise.resolve('<p>converted</p>')),
}))

vi.mock('../constants/defaults.js', () => ({
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
      selection: { insertHTML: vi.fn() },
      history: { snapshot: vi.fn() },
      eventBus: { emit: vi.fn(), on: vi.fn(() => vi.fn()) },
      sanitizer: { sanitize: vi.fn((html) => html) },
      commands: { execute: vi.fn() },
      outputFormat: 'html',
    }
    dragDrop = new DragDrop(mockEngine)

    cleanPastedHTML.mockImplementation((html) => html)
    looksLikeMarkdown.mockReturnValue(false)
    markdownToHtml.mockImplementation((text) => `<p>${text}</p>`)
    isImportableFile.mockReturnValue(false)

    // Mock caretRangeFromPoint
    document.caretRangeFromPoint = vi.fn(() => {
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

    it('should initialize drag state as null/false', () => {
      expect(dragDrop._dragSource).toBeNull()
      expect(dragDrop._dropTarget).toBeNull()
      expect(dragDrop._dropPosition).toBeNull()
      expect(dragDrop._isExternalDrag).toBe(false)
      expect(dragDrop._enterCount).toBe(0)
    })
  })

  describe('init', () => {
    it('should add all six drag/drop event listeners', () => {
      const spy = vi.spyOn(element, 'addEventListener')
      dragDrop.init()
      expect(spy).toHaveBeenCalledWith('dragover', dragDrop._handleDragOver)
      expect(spy).toHaveBeenCalledWith('drop', dragDrop._handleDrop)
      expect(spy).toHaveBeenCalledWith('dragenter', dragDrop._handleDragEnter)
      expect(spy).toHaveBeenCalledWith('dragleave', dragDrop._handleDragLeave)
      expect(spy).toHaveBeenCalledWith('dragstart', dragDrop._handleDragStart)
      expect(spy).toHaveBeenCalledWith('dragend', dragDrop._handleDragEnd)
      expect(spy).toHaveBeenCalledTimes(6)
    })

    it('should register the editor in the global registry', () => {
      dragDrop.init()
      const registry = DragDrop._getRegistry()
      expect(registry.get(element)).toBe(dragDrop)
    })
  })

  describe('destroy', () => {
    it('should remove all six drag/drop event listeners', () => {
      dragDrop.init()
      const spy = vi.spyOn(element, 'removeEventListener')
      dragDrop.destroy()
      expect(spy).toHaveBeenCalledWith('dragover', dragDrop._handleDragOver)
      expect(spy).toHaveBeenCalledWith('drop', dragDrop._handleDrop)
      expect(spy).toHaveBeenCalledWith('dragenter', dragDrop._handleDragEnter)
      expect(spy).toHaveBeenCalledWith('dragleave', dragDrop._handleDragLeave)
      expect(spy).toHaveBeenCalledWith('dragstart', dragDrop._handleDragStart)
      expect(spy).toHaveBeenCalledWith('dragend', dragDrop._handleDragEnd)
    })

    it('should unregister the editor from the global registry', () => {
      dragDrop.init()
      dragDrop.destroy()
      const registry = DragDrop._getRegistry()
      expect(registry.has(element)).toBe(false)
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
      const spy = vi.spyOn(event, 'preventDefault')
      element.dispatchEvent(event)
      expect(spy).toHaveBeenCalled()
    })

    it('should set dropEffect to copy for external drags', () => {
      dragDrop.init()
      const event = new Event('dragover', { bubbles: true, cancelable: true })
      event.dataTransfer = { dropEffect: '' }
      element.dispatchEvent(event)
      expect(event.dataTransfer.dropEffect).toBe('copy')
    })

    it('should set dropEffect to move for internal block drags', () => {
      dragDrop.init()
      dragDrop._dragSource = document.createElement('p')
      const event = new Event('dragover', { bubbles: true, cancelable: true })
      event.dataTransfer = { dropEffect: '' }
      element.dispatchEvent(event)
      expect(event.dataTransfer.dropEffect).toBe('move')
    })
  })

  describe('_handleDragEnter', () => {
    it('should add rmx-drag-over class to the element', () => {
      dragDrop.init()
      const event = new Event('dragenter', { bubbles: true, cancelable: true })
      event.dataTransfer = { types: ['Files'] }
      element.dispatchEvent(event)
      expect(element.classList.contains('rmx-drag-over')).toBe(true)
    })

    it('should preventDefault on dragenter', () => {
      dragDrop.init()
      const event = new Event('dragenter', { bubbles: true, cancelable: true })
      event.dataTransfer = { types: [] }
      const spy = vi.spyOn(event, 'preventDefault')
      element.dispatchEvent(event)
      expect(spy).toHaveBeenCalled()
    })

    it('should set isExternalDrag when no internal drag source', () => {
      dragDrop.init()
      const event = new Event('dragenter', { bubbles: true, cancelable: true })
      event.dataTransfer = { types: ['Files'] }
      element.dispatchEvent(event)
      expect(dragDrop._isExternalDrag).toBe(true)
    })

    it('should not set isExternalDrag when there is a drag source', () => {
      dragDrop.init()
      dragDrop._dragSource = document.createElement('p')
      const event = new Event('dragenter', { bubbles: true, cancelable: true })
      event.dataTransfer = { types: ['Files'] }
      element.dispatchEvent(event)
      expect(dragDrop._isExternalDrag).toBe(false)
    })

    it('should emit drag:enter event with types', () => {
      dragDrop.init()
      const event = new Event('dragenter', { bubbles: true, cancelable: true })
      event.dataTransfer = { types: ['Files', 'text/plain'] }
      element.dispatchEvent(event)
      expect(mockEngine.eventBus.emit).toHaveBeenCalledWith('drag:enter', {
        isExternal: true,
        types: ['Files', 'text/plain'],
      })
    })

    it('should handle nested dragenter with enter count', () => {
      dragDrop.init()
      const event1 = new Event('dragenter', { bubbles: true, cancelable: true })
      event1.dataTransfer = { types: [] }
      const event2 = new Event('dragenter', { bubbles: true, cancelable: true })
      event2.dataTransfer = { types: [] }
      element.dispatchEvent(event1)
      element.dispatchEvent(event2)
      expect(dragDrop._enterCount).toBe(2)
      // Class should still be present
      expect(element.classList.contains('rmx-drag-over')).toBe(true)
    })
  })

  describe('_handleDragLeave', () => {
    it('should remove rmx-drag-over class when enterCount reaches zero', () => {
      dragDrop.init()
      dragDrop._enterCount = 1
      element.classList.add('rmx-drag-over')

      const event = new Event('dragleave', { bubbles: true })
      element.dispatchEvent(event)
      expect(element.classList.contains('rmx-drag-over')).toBe(false)
    })

    it('should not remove class when enterCount is still positive', () => {
      dragDrop.init()
      dragDrop._enterCount = 2
      element.classList.add('rmx-drag-over')

      const event = new Event('dragleave', { bubbles: true })
      element.dispatchEvent(event)
      expect(element.classList.contains('rmx-drag-over')).toBe(true)
      expect(dragDrop._enterCount).toBe(1)
    })

    it('should emit drag:leave when fully leaving', () => {
      dragDrop.init()
      dragDrop._enterCount = 1

      const event = new Event('dragleave', { bubbles: true })
      element.dispatchEvent(event)
      expect(mockEngine.eventBus.emit).toHaveBeenCalledWith('drag:leave')
    })
  })

  describe('_handleDrop', () => {
    function createDropEvent({ files = [], html = '', text = '' } = {}) {
      const event = new Event('drop', { bubbles: true, cancelable: true })
      event.dataTransfer = {
        files,
        getData: vi.fn((type) => {
          if (type === 'text/html') return html
          if (type === 'text/plain') return text
          if (type === 'application/x-remyx-content') return ''
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
      const spy = vi.spyOn(event, 'preventDefault')
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

    it('should reset enterCount on drop', () => {
      dragDrop.init()
      dragDrop._enterCount = 3
      const event = createDropEvent()
      element.dispatchEvent(event)
      expect(dragDrop._enterCount).toBe(0)
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
        getData: vi.fn(() => ''),
      }
      event.clientX = 100
      event.clientY = 100
      return event
    }

    it('should handle image file drop with uploadHandler', async () => {
      const uploadHandler = vi.fn().mockResolvedValue('https://example.com/img.png')
      mockEngine.options.uploadHandler = uploadHandler
      dragDrop.init()

      const imageFile = new File(['data'], 'image.png', { type: 'image/png' })
      const event = createDropEventWithFiles([imageFile])
      element.dispatchEvent(event)

      await Promise.resolve()
      expect(uploadHandler).toHaveBeenCalledWith(imageFile)
      await Promise.resolve()
      await Promise.resolve()
      expect(mockEngine.commands.execute).toHaveBeenCalledWith('insertImage', {
        src: 'https://example.com/img.png',
        alt: 'image.png',
      })
    })

    it('should use FileReader for image drop when no uploadHandler', async () => {
      mockEngine.options.uploadHandler = null
      dragDrop.init()

      const imageFile = new File(['data'], 'photo.jpg', { type: 'image/jpeg' })
      const event = createDropEventWithFiles([imageFile])

      const mockReader = { readAsDataURL: vi.fn(), onload: null, onprogress: null, onerror: null }
      vi.spyOn(global, 'FileReader').mockImplementation(function () { return mockReader })

      element.dispatchEvent(event)

      // FileReader is created inside a serialized promise chain, await a tick
      await Promise.resolve()

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
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
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
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
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
      document.caretRangeFromPoint = vi.fn(() => mockRange)

      const mockSel = {
        removeAllRanges: vi.fn(),
        addRange: vi.fn(),
      }
      vi.spyOn(window, 'getSelection').mockReturnValue(mockSel)

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
      mockEngine.options.uploadHandler = vi.fn().mockRejectedValue(uploadError)
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      dragDrop.init()

      const imageFile = new File(['data'], 'fail.png', { type: 'image/png' })
      const event = new Event('drop', { bubbles: true, cancelable: true })
      event.dataTransfer = {
        files: [imageFile],
        getData: vi.fn(() => ''),
      }
      event.clientX = 100
      event.clientY = 100
      element.dispatchEvent(event)

      await Promise.resolve()
      await Promise.resolve()
      await Promise.resolve()
      await Promise.resolve()

      expect(mockEngine.eventBus.emit).toHaveBeenCalledWith('upload:error', {
        file: imageFile,
        error: uploadError,
      })
      errorSpy.mockRestore()
    })
  })

  // ── New drag-and-drop feature tests ──────────────────────────────

  describe('getDraggableBlock', () => {
    it('should return a direct child block element', () => {
      const p = document.createElement('p')
      p.textContent = 'Hello'
      element.appendChild(p)

      expect(dragDrop.getDraggableBlock(p)).toBe(p)
    })

    it('should return null for non-block elements', () => {
      const span = document.createElement('span')
      element.appendChild(span)

      expect(dragDrop.getDraggableBlock(span)).toBeNull()
    })

    it('should find the block ancestor from a nested node', () => {
      const p = document.createElement('p')
      const strong = document.createElement('strong')
      strong.textContent = 'bold text'
      p.appendChild(strong)
      element.appendChild(p)

      expect(dragDrop.getDraggableBlock(strong)).toBe(p)
    })

    it('should return null for text nodes not within a block child', () => {
      expect(dragDrop.getDraggableBlock(element)).toBeNull()
    })
  })

  describe('makeBlockDraggable / unmakeBlockDraggable', () => {
    it('should set draggable attribute on a block', () => {
      const p = document.createElement('p')
      dragDrop.makeBlockDraggable(p)
      expect(p.getAttribute('draggable')).toBe('true')
    })

    it('should remove draggable attribute', () => {
      const p = document.createElement('p')
      p.setAttribute('draggable', 'true')
      dragDrop.unmakeBlockDraggable(p)
      expect(p.hasAttribute('draggable')).toBe(false)
    })

    it('should not throw for null input', () => {
      expect(() => dragDrop.makeBlockDraggable(null)).not.toThrow()
      expect(() => dragDrop.unmakeBlockDraggable(null)).not.toThrow()
    })
  })

  describe('getDragState', () => {
    it('should return default state when idle', () => {
      const state = dragDrop.getDragState()
      expect(state.isDragging).toBe(false)
      expect(state.isExternalDrag).toBe(false)
      expect(state.dropTarget).toBeNull()
      expect(state.dropPosition).toBeNull()
    })

    it('should reflect internal drag state', () => {
      const block = document.createElement('p')
      dragDrop._dragSource = block
      dragDrop._dropTarget = document.createElement('h1')
      dragDrop._dropPosition = 'before'

      const state = dragDrop.getDragState()
      expect(state.isDragging).toBe(true)
      expect(state.isExternalDrag).toBe(false)
      expect(state.dropTarget).toBeTruthy()
      expect(state.dropPosition).toBe('before')
    })

    it('should reflect external drag state', () => {
      dragDrop._isExternalDrag = true
      const state = dragDrop.getDragState()
      expect(state.isDragging).toBe(true)
      expect(state.isExternalDrag).toBe(true)
    })
  })

  describe('_handleDragStart', () => {
    it('should set dragSource and add dragging class', () => {
      dragDrop.init()
      const p = document.createElement('p')
      p.textContent = 'Drag me'
      element.appendChild(p)

      const event = new Event('dragstart', { bubbles: true })
      event.dataTransfer = {
        setData: vi.fn(),
        setDragImage: vi.fn(),
        effectAllowed: '',
      }
      p.dispatchEvent(event)

      expect(dragDrop._dragSource).toBe(p)
      expect(p.classList.contains('rmx-block-dragging')).toBe(true)
      expect(event.dataTransfer.effectAllowed).toBe('move')
    })

    it('should set remyx MIME type in dataTransfer', () => {
      dragDrop.init()
      const p = document.createElement('p')
      p.textContent = 'Drag me'
      element.appendChild(p)

      const event = new Event('dragstart', { bubbles: true })
      event.dataTransfer = {
        setData: vi.fn(),
        setDragImage: vi.fn(),
        effectAllowed: '',
      }
      p.dispatchEvent(event)

      // Content is captured before the dragging class is added
      expect(event.dataTransfer.setData).toHaveBeenCalledWith(
        'application/x-remyx-content',
        '<p>Drag me</p>'
      )
    })

    it('should emit drag:start event', () => {
      dragDrop.init()
      const p = document.createElement('p')
      p.textContent = 'Drag me'
      element.appendChild(p)

      const event = new Event('dragstart', { bubbles: true })
      event.dataTransfer = {
        setData: vi.fn(),
        setDragImage: vi.fn(),
        effectAllowed: '',
      }
      p.dispatchEvent(event)

      expect(mockEngine.eventBus.emit).toHaveBeenCalledWith('drag:start', { block: p })
    })

    it('should do nothing for non-block targets', () => {
      dragDrop.init()
      const span = document.createElement('span')
      element.appendChild(span)

      const event = new Event('dragstart', { bubbles: true })
      event.dataTransfer = { setData: vi.fn(), setDragImage: vi.fn(), effectAllowed: '' }
      span.dispatchEvent(event)

      expect(dragDrop._dragSource).toBeNull()
    })
  })

  describe('_handleDragEnd', () => {
    it('should remove dragging class and clean up state', () => {
      dragDrop.init()
      const p = document.createElement('p')
      p.classList.add('rmx-block-dragging')
      dragDrop._dragSource = p

      const event = new Event('dragend', { bubbles: true })
      element.dispatchEvent(event)

      expect(p.classList.contains('rmx-block-dragging')).toBe(false)
      expect(dragDrop._dragSource).toBeNull()
    })

    it('should emit drag:end event', () => {
      dragDrop.init()
      const event = new Event('dragend', { bubbles: true })
      element.dispatchEvent(event)
      expect(mockEngine.eventBus.emit).toHaveBeenCalledWith('drag:end')
    })
  })

  describe('_handleBlockDrop (reorder)', () => {
    it('should move block before target when position is before', () => {
      const p1 = document.createElement('p')
      p1.textContent = 'First'
      const p2 = document.createElement('p')
      p2.textContent = 'Second'
      const p3 = document.createElement('p')
      p3.textContent = 'Third'
      element.appendChild(p1)
      element.appendChild(p2)
      element.appendChild(p3)

      dragDrop._dragSource = p3
      dragDrop._dropTarget = p1
      dragDrop._dropPosition = 'before'
      dragDrop._dragSourceEditor = dragDrop

      dragDrop._handleBlockDrop(new Event('drop'))

      // p3 should now be before p1
      expect(element.children[0]).toBe(p3)
      expect(element.children[1]).toBe(p1)
      expect(element.children[2]).toBe(p2)
    })

    it('should move block after target when position is after', () => {
      const p1 = document.createElement('p')
      p1.textContent = 'First'
      const p2 = document.createElement('p')
      p2.textContent = 'Second'
      const p3 = document.createElement('p')
      p3.textContent = 'Third'
      element.appendChild(p1)
      element.appendChild(p2)
      element.appendChild(p3)

      dragDrop._dragSource = p1
      dragDrop._dropTarget = p3
      dragDrop._dropPosition = 'after'
      dragDrop._dragSourceEditor = dragDrop

      dragDrop._handleBlockDrop(new Event('drop'))

      expect(element.children[0]).toBe(p2)
      expect(element.children[1]).toBe(p3)
      expect(element.children[2]).toBe(p1)
    })

    it('should not move if source equals target', () => {
      const p = document.createElement('p')
      element.appendChild(p)

      dragDrop._dragSource = p
      dragDrop._dropTarget = p
      dragDrop._dropPosition = 'before'
      dragDrop._dragSourceEditor = dragDrop

      dragDrop._handleBlockDrop(new Event('drop'))
      expect(element.children[0]).toBe(p)
    })

    it('should take a history snapshot on block reorder', () => {
      const p1 = document.createElement('p')
      const p2 = document.createElement('p')
      element.appendChild(p1)
      element.appendChild(p2)

      dragDrop._dragSource = p2
      dragDrop._dropTarget = p1
      dragDrop._dropPosition = 'before'
      dragDrop._dragSourceEditor = dragDrop

      dragDrop._handleBlockDrop(new Event('drop'))
      expect(mockEngine.history.snapshot).toHaveBeenCalled()
    })

    it('should emit content:change and drag:reorder on block reorder', () => {
      const p1 = document.createElement('p')
      const p2 = document.createElement('p')
      element.appendChild(p1)
      element.appendChild(p2)

      dragDrop._dragSource = p2
      dragDrop._dropTarget = p1
      dragDrop._dropPosition = 'before'
      dragDrop._dragSourceEditor = dragDrop

      dragDrop._handleBlockDrop(new Event('drop'))
      expect(mockEngine.eventBus.emit).toHaveBeenCalledWith('content:change')
      expect(mockEngine.eventBus.emit).toHaveBeenCalledWith('drag:reorder', {
        source: p2,
        target: p1,
        position: 'before',
      })
    })
  })

  describe('list item reordering', () => {
    it('should reorder list items within the same list', () => {
      const ul = document.createElement('ul')
      const li1 = document.createElement('li')
      li1.textContent = 'Item 1'
      const li2 = document.createElement('li')
      li2.textContent = 'Item 2'
      const li3 = document.createElement('li')
      li3.textContent = 'Item 3'
      ul.appendChild(li1)
      ul.appendChild(li2)
      ul.appendChild(li3)
      element.appendChild(ul)

      dragDrop._dragSource = li3
      dragDrop._dropTarget = li1
      dragDrop._dropPosition = 'before'
      dragDrop._dragSourceEditor = dragDrop

      dragDrop._handleBlockDrop(new Event('drop'))

      expect(ul.children[0]).toBe(li3)
      expect(ul.children[1]).toBe(li1)
      expect(ul.children[2]).toBe(li2)
    })
  })

  describe('_getTopLevelBlocks', () => {
    it('should return all direct child elements', () => {
      const p = document.createElement('p')
      const h1 = document.createElement('h1')
      element.appendChild(p)
      element.appendChild(h1)

      const blocks = dragDrop._getTopLevelBlocks()
      expect(blocks).toEqual([p, h1])
    })

    it('should exclude drop indicator and ghost elements', () => {
      const p = document.createElement('p')
      const indicator = document.createElement('div')
      indicator.className = 'rmx-drop-indicator'
      const ghost = document.createElement('div')
      ghost.className = 'rmx-drag-ghost'
      element.appendChild(p)
      element.appendChild(indicator)
      element.appendChild(ghost)

      const blocks = dragDrop._getTopLevelBlocks()
      expect(blocks).toEqual([p])
    })
  })

  describe('_cleanupDrag', () => {
    it('should reset all drag state', () => {
      const block = document.createElement('p')
      block.classList.add('rmx-block-dragging')
      dragDrop._dragSource = block
      dragDrop._dropTarget = document.createElement('h1')
      dragDrop._dropPosition = 'after'
      dragDrop._isExternalDrag = true
      dragDrop._enterCount = 3
      element.classList.add('rmx-drag-over')

      dragDrop._cleanupDrag()

      expect(dragDrop._dragSource).toBeNull()
      expect(dragDrop._dragSourceEditor).toBeNull()
      expect(dragDrop._dropTarget).toBeNull()
      expect(dragDrop._dropPosition).toBeNull()
      expect(dragDrop._isExternalDrag).toBe(false)
      expect(dragDrop._enterCount).toBe(0)
      expect(block.classList.contains('rmx-block-dragging')).toBe(false)
      expect(element.classList.contains('rmx-drag-over')).toBe(false)
    })
  })

  describe('inter-editor registry', () => {
    it('should register multiple editors', () => {
      const element2 = document.createElement('div')
      const mockEngine2 = { ...mockEngine, element: element2 }
      const dragDrop2 = new DragDrop(mockEngine2)

      dragDrop.init()
      dragDrop2.init()

      const registry = DragDrop._getRegistry()
      const activeInstances = DragDrop._getActiveInstances()
      expect(activeInstances.size).toBe(2)
      expect(registry.get(element)).toBe(dragDrop)
      expect(registry.get(element2)).toBe(dragDrop2)

      dragDrop2.destroy()
    })

    it('should propagate dragSource to all editors on dragstart', () => {
      const element2 = document.createElement('div')
      const mockEngine2 = {
        ...mockEngine,
        element: element2,
        eventBus: { emit: vi.fn(), on: vi.fn(() => vi.fn()) },
      }
      const dragDrop2 = new DragDrop(mockEngine2)

      dragDrop.init()
      dragDrop2.init()

      const p = document.createElement('p')
      p.textContent = 'Drag me'
      element.appendChild(p)

      const event = new Event('dragstart', { bubbles: true })
      event.dataTransfer = {
        setData: vi.fn(),
        setDragImage: vi.fn(),
        effectAllowed: '',
      }
      p.dispatchEvent(event)

      // Both instances should know about the drag source
      expect(dragDrop._dragSource).toBe(p)
      expect(dragDrop2._dragSource).toBe(p)
      expect(dragDrop2._dragSourceEditor).toBe(dragDrop)

      dragDrop2.destroy()
    })
  })

  // ── Additional coverage tests ─────────────────────────────────────

  describe('_handleDrop routing', () => {
    function createDropEvent({ files = [], html = '', text = '', remyx = '' } = {}) {
      const event = new Event('drop', { bubbles: true, cancelable: true })
      event.dataTransfer = {
        files,
        getData: vi.fn((type) => {
          if (type === 'text/html') return html
          if (type === 'text/plain') return text
          if (type === 'application/x-remyx-content') return remyx
          return ''
        }),
      }
      event.clientX = 100
      event.clientY = 100
      return event
    }

    it('should route to _handleBlockDrop when _dragSource and _dropTarget are set', () => {
      dragDrop.init()
      const p1 = document.createElement('p')
      const p2 = document.createElement('p')
      p1.textContent = 'A'
      p2.textContent = 'B'
      element.appendChild(p1)
      element.appendChild(p2)

      dragDrop._dragSource = p1
      dragDrop._dropTarget = p2
      dragDrop._dropPosition = 'after'
      dragDrop._dragSourceEditor = dragDrop

      const spy = vi.spyOn(dragDrop, '_handleBlockDrop')
      const event = createDropEvent()
      element.dispatchEvent(event)

      expect(spy).toHaveBeenCalled()
      spy.mockRestore()
    })

    it('should route to _handleDocumentDrop for importable non-image files', async () => {
      isImportableFile.mockReturnValue(true)
      dragDrop.init()

      const docFile = new File(['data'], 'doc.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
      const event = createDropEvent({ files: [docFile] })

      const spy = vi.spyOn(dragDrop, '_handleDocumentDrop')
      element.dispatchEvent(event)

      expect(spy).toHaveBeenCalledWith(expect.any(Event), [docFile])
      spy.mockRestore()
      isImportableFile.mockReturnValue(false)
    })

    it('should route to _handleFileDrop for non-image non-importable files with uploadHandler', () => {
      mockEngine.options.uploadHandler = vi.fn().mockResolvedValue('https://example.com/file.pdf')
      isImportableFile.mockReturnValue(false)
      dragDrop.init()

      const pdfFile = new File(['data'], 'file.pdf', { type: 'application/pdf' })
      const event = createDropEvent({ files: [pdfFile] })

      const spy = vi.spyOn(dragDrop, '_handleFileDrop')
      element.dispatchEvent(event)

      expect(spy).toHaveBeenCalledWith(expect.any(Event), [pdfFile])
      spy.mockRestore()
    })

    it('should route to _handleInterEditorDrop when remyx content is present and no dragSource', () => {
      dragDrop.init()
      dragDrop._dragSource = null

      const event = createDropEvent({ remyx: '<p>From other editor</p>' })
      const spy = vi.spyOn(dragDrop, '_handleInterEditorDrop')
      element.dispatchEvent(event)

      expect(spy).toHaveBeenCalledWith(expect.any(Event), '<p>From other editor</p>')
      spy.mockRestore()
    })
  })

  describe('_handleBlockDrop with cross-editor source', () => {
    it('should take snapshot in both source and target editors', () => {
      const element2 = document.createElement('div')
      const mockEngine2 = {
        ...mockEngine,
        element: element2,
        history: { snapshot: vi.fn() },
        eventBus: { emit: vi.fn(), on: vi.fn(() => vi.fn()) },
      }
      const dragDrop2 = new DragDrop(mockEngine2)
      dragDrop.init()
      dragDrop2.init()

      const p1 = document.createElement('p')
      p1.textContent = 'Source block'
      element2.appendChild(p1)

      const p2 = document.createElement('p')
      p2.textContent = 'Target block'
      element.appendChild(p2)

      dragDrop._dragSource = p1
      dragDrop._dropTarget = p2
      dragDrop._dropPosition = 'before'
      dragDrop._dragSourceEditor = dragDrop2

      dragDrop._handleBlockDrop(new Event('drop'))

      expect(mockEngine.history.snapshot).toHaveBeenCalled()
      expect(mockEngine2.history.snapshot).toHaveBeenCalled()

      dragDrop2.destroy()
    })

    it('should emit content:change on the source editor when cross-editor', () => {
      const element2 = document.createElement('div')
      const mockEngine2 = {
        ...mockEngine,
        element: element2,
        history: { snapshot: vi.fn() },
        eventBus: { emit: vi.fn(), on: vi.fn(() => vi.fn()) },
      }
      const dragDrop2 = new DragDrop(mockEngine2)
      dragDrop.init()
      dragDrop2.init()

      const p1 = document.createElement('p')
      p1.textContent = 'Source'
      element2.appendChild(p1)

      const p2 = document.createElement('p')
      p2.textContent = 'Target'
      element.appendChild(p2)

      dragDrop._dragSource = p1
      dragDrop._dropTarget = p2
      dragDrop._dropPosition = 'after'
      dragDrop._dragSourceEditor = dragDrop2

      dragDrop._handleBlockDrop(new Event('drop'))

      expect(mockEngine2.eventBus.emit).toHaveBeenCalledWith('content:change')
      expect(mockEngine.eventBus.emit).toHaveBeenCalledWith('content:change')

      dragDrop2.destroy()
    })

    it('should not snapshot source editor when sourceEditor is self', () => {
      const p1 = document.createElement('p')
      const p2 = document.createElement('p')
      element.appendChild(p1)
      element.appendChild(p2)

      dragDrop._dragSource = p1
      dragDrop._dropTarget = p2
      dragDrop._dropPosition = 'before'
      dragDrop._dragSourceEditor = dragDrop

      mockEngine.history.snapshot.mockClear()
      dragDrop._handleBlockDrop(new Event('drop'))

      // snapshot called exactly once (for self), not twice
      expect(mockEngine.history.snapshot).toHaveBeenCalledTimes(1)
    })
  })

  describe('_handleInterEditorDrop', () => {
    it('should set cursor, snapshot, sanitize and insert HTML', () => {
      const spy = vi.spyOn(dragDrop, '_setCursorAtDropPoint')
      const event = { clientX: 50, clientY: 50 }

      dragDrop._handleInterEditorDrop(event, '<p>Inter content</p>')

      expect(spy).toHaveBeenCalledWith(event)
      expect(mockEngine.history.snapshot).toHaveBeenCalled()
      expect(mockEngine.sanitizer.sanitize).toHaveBeenCalledWith('<p>Inter content</p>')
      expect(mockEngine.selection.insertHTML).toHaveBeenCalledWith('<p>Inter content</p>')
      expect(mockEngine.eventBus.emit).toHaveBeenCalledWith('content:change')
      expect(mockEngine.eventBus.emit).toHaveBeenCalledWith('drag:inter-editor', {
        html: '<p>Inter content</p>',
      })
      spy.mockRestore()
    })
  })

  describe('_handleDocumentDrop', () => {
    it('should convert documents and insert sanitized HTML', async () => {
      convertDocument.mockResolvedValue('<p>converted doc</p>')

      const docFile = new File(['data'], 'test.docx', { type: 'application/vnd.openxmlformats' })
      const event = { clientX: 100, clientY: 100 }

      dragDrop._handleDocumentDrop(event, [docFile])

      expect(mockEngine.history.snapshot).toHaveBeenCalled()

      await Promise.resolve()
      await Promise.resolve()

      expect(mockEngine.sanitizer.sanitize).toHaveBeenCalledWith('<p>converted doc</p>')
      expect(mockEngine.selection.insertHTML).toHaveBeenCalledWith('<p>converted doc</p>')
      expect(mockEngine.eventBus.emit).toHaveBeenCalledWith('content:change')
    })

    it('should skip files exceeding max size', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      mockEngine.options.maxFileSize = 50

      const bigFile = new File(['data'], 'big.docx', { type: 'application/vnd.openxmlformats' })
      Object.defineProperty(bigFile, 'size', { value: 100 })

      convertDocument.mockClear()

      dragDrop._handleDocumentDrop({ clientX: 0, clientY: 0 }, [bigFile])

      await Promise.resolve()
      expect(convertDocument).not.toHaveBeenCalled()
      warnSpy.mockRestore()
    })

    it('should handle document conversion failure gracefully', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      convertDocument.mockRejectedValue(new Error('conversion failed'))

      const docFile = new File(['data'], 'bad.docx', { type: 'application/vnd.openxmlformats' })
      dragDrop._handleDocumentDrop({ clientX: 0, clientY: 0 }, [docFile])

      await Promise.resolve()
      await Promise.resolve()
      await Promise.resolve()

      // Should not throw, just warn
      expect(warnSpy).toHaveBeenCalledWith('Document import failed on drop:', 'conversion failed')
      warnSpy.mockRestore()
    })
  })

  describe('_handleFileDrop', () => {
    it('should upload files and insert attachments', async () => {
      mockEngine.options.uploadHandler = vi.fn().mockResolvedValue('https://cdn.example.com/file.zip')

      const file = new File(['data'], 'archive.zip', { type: 'application/zip' })
      Object.defineProperty(file, 'size', { value: 5000 })

      dragDrop._handleFileDrop({ clientX: 100, clientY: 100 }, [file])

      expect(mockEngine.history.snapshot).toHaveBeenCalled()

      await Promise.resolve()
      expect(mockEngine.options.uploadHandler).toHaveBeenCalledWith(file)
      await Promise.resolve()

      expect(mockEngine.commands.execute).toHaveBeenCalledWith('insertAttachment', {
        url: 'https://cdn.example.com/file.zip',
        filename: 'archive.zip',
        filesize: 5000,
      })
    })

    it('should emit upload:error when file upload fails', async () => {
      const uploadError = new Error('upload failed')
      mockEngine.options.uploadHandler = vi.fn().mockRejectedValue(uploadError)
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const file = new File(['data'], 'fail.zip', { type: 'application/zip' })

      dragDrop._handleFileDrop({ clientX: 0, clientY: 0 }, [file])

      await Promise.resolve()
      await Promise.resolve()
      await Promise.resolve()
      await Promise.resolve()

      expect(mockEngine.eventBus.emit).toHaveBeenCalledWith('upload:error', {
        file,
        error: uploadError,
      })
      errorSpy.mockRestore()
    })

    it('should handle multiple files', async () => {
      mockEngine.options.uploadHandler = vi.fn()
        .mockResolvedValueOnce('https://cdn.example.com/a.txt')
        .mockResolvedValueOnce('https://cdn.example.com/b.txt')

      const file1 = new File(['a'], 'a.txt', { type: 'text/plain' })
      Object.defineProperty(file1, 'size', { value: 100 })
      const file2 = new File(['b'], 'b.txt', { type: 'text/plain' })
      Object.defineProperty(file2, 'size', { value: 200 })

      dragDrop._handleFileDrop({ clientX: 0, clientY: 0 }, [file1, file2])

      // Serialized chain: tick 1 calls first upload, tick 2 resolves it,
      // tick 3 calls second upload, tick 4 resolves it
      await Promise.resolve()
      await Promise.resolve()
      await Promise.resolve()
      await Promise.resolve()
      await Promise.resolve()
      await Promise.resolve()

      expect(mockEngine.options.uploadHandler).toHaveBeenCalledTimes(2)

      expect(mockEngine.commands.execute).toHaveBeenCalledWith('insertAttachment', {
        url: 'https://cdn.example.com/a.txt',
        filename: 'a.txt',
        filesize: 100,
      })
      expect(mockEngine.commands.execute).toHaveBeenCalledWith('insertAttachment', {
        url: 'https://cdn.example.com/b.txt',
        filename: 'b.txt',
        filesize: 200,
      })
    })
  })

  describe('_updateDropTarget', () => {
    it('should set dropTarget and dropPosition based on mouse position above a block', () => {
      const p1 = document.createElement('p')
      p1.textContent = 'Block 1'
      element.appendChild(p1)

      // Mock getBoundingClientRect
      p1.getBoundingClientRect = vi.fn(() => ({
        top: 100, bottom: 150, left: 0, right: 200, height: 50, width: 200,
      }))
      element.getBoundingClientRect = vi.fn(() => ({
        top: 0, bottom: 500, left: 0, right: 200, height: 500, width: 200,
      }))

      dragDrop._dragSource = document.createElement('h1') // different block
      dragDrop._updateDropTarget({ clientY: 110 })

      expect(dragDrop._dropTarget).toBe(p1)
      expect(dragDrop._dropPosition).toBe('before')
    })

    it('should set position to after when mouse is in bottom half', () => {
      const p1 = document.createElement('p')
      p1.textContent = 'Block 1'
      element.appendChild(p1)

      p1.getBoundingClientRect = vi.fn(() => ({
        top: 100, bottom: 150, left: 0, right: 200, height: 50, width: 200,
      }))
      element.getBoundingClientRect = vi.fn(() => ({
        top: 0, bottom: 500, left: 0, right: 200, height: 500, width: 200,
      }))

      dragDrop._dragSource = document.createElement('h1')
      dragDrop._updateDropTarget({ clientY: 140 })

      expect(dragDrop._dropTarget).toBe(p1)
      expect(dragDrop._dropPosition).toBe('after')
    })

    it('should pick the closest block when multiple are present', () => {
      const p1 = document.createElement('p')
      const p2 = document.createElement('p')
      element.appendChild(p1)
      element.appendChild(p2)

      p1.getBoundingClientRect = vi.fn(() => ({
        top: 0, bottom: 50, left: 0, right: 200, height: 50, width: 200,
      }))
      p2.getBoundingClientRect = vi.fn(() => ({
        top: 60, bottom: 110, left: 0, right: 200, height: 50, width: 200,
      }))
      element.getBoundingClientRect = vi.fn(() => ({
        top: 0, bottom: 500, left: 0, right: 200, height: 500, width: 200,
      }))

      dragDrop._dragSource = document.createElement('h1')
      dragDrop._updateDropTarget({ clientY: 80 })

      expect(dragDrop._dropTarget).toBe(p2)
      expect(dragDrop._dropPosition).toBe('before')
    })

    it('should skip the block being dragged', () => {
      const p1 = document.createElement('p')
      const p2 = document.createElement('p')
      element.appendChild(p1)
      element.appendChild(p2)

      p1.getBoundingClientRect = vi.fn(() => ({
        top: 0, bottom: 50, left: 0, right: 200, height: 50, width: 200,
      }))
      p2.getBoundingClientRect = vi.fn(() => ({
        top: 60, bottom: 110, left: 0, right: 200, height: 50, width: 200,
      }))
      element.getBoundingClientRect = vi.fn(() => ({
        top: 0, bottom: 500, left: 0, right: 200, height: 500, width: 200,
      }))

      dragDrop._dragSource = p1
      dragDrop._updateDropTarget({ clientY: 25 })

      // Should skip p1 (the drag source) and target p2
      expect(dragDrop._dropTarget).toBe(p2)
    })

    it('should clear drop target when no blocks exist', () => {
      dragDrop._dragSource = document.createElement('p')
      dragDrop._dropTarget = document.createElement('p')
      dragDrop._dropPosition = 'before'

      dragDrop._updateDropTarget({ clientY: 50 })

      expect(dragDrop._dropTarget).toBeNull()
      expect(dragDrop._dropPosition).toBeNull()
    })

    it('should call _showDropIndicator when target changes', () => {
      const p1 = document.createElement('p')
      element.appendChild(p1)

      p1.getBoundingClientRect = vi.fn(() => ({
        top: 0, bottom: 50, left: 0, right: 200, height: 50, width: 200,
      }))
      element.getBoundingClientRect = vi.fn(() => ({
        top: 0, bottom: 500, left: 0, right: 200, height: 500, width: 200,
      }))

      const spy = vi.spyOn(dragDrop, '_showDropIndicator')
      dragDrop._dragSource = document.createElement('h1')
      dragDrop._updateDropTarget({ clientY: 10 })

      expect(spy).toHaveBeenCalledWith(p1, 'before')
      spy.mockRestore()
    })

    it('should not call _showDropIndicator when target and position are unchanged', () => {
      const p1 = document.createElement('p')
      element.appendChild(p1)

      p1.getBoundingClientRect = vi.fn(() => ({
        top: 0, bottom: 50, left: 0, right: 200, height: 50, width: 200,
      }))
      element.getBoundingClientRect = vi.fn(() => ({
        top: 0, bottom: 500, left: 0, right: 200, height: 500, width: 200,
      }))

      dragDrop._dragSource = document.createElement('h1')

      // First call sets the target
      dragDrop._updateDropTarget({ clientY: 10 })
      expect(dragDrop._dropTarget).toBe(p1)

      const spy = vi.spyOn(dragDrop, '_showDropIndicator')
      // Second call with same position should not trigger indicator update
      dragDrop._updateDropTarget({ clientY: 10 })
      expect(spy).not.toHaveBeenCalled()
      spy.mockRestore()
    })
  })

  describe('_showDropIndicator', () => {
    it('should create a drop indicator div with correct class', () => {
      element.getBoundingClientRect = vi.fn(() => ({
        top: 0, bottom: 500, left: 0, right: 200, height: 500, width: 200,
      }))

      const block = document.createElement('p')
      element.appendChild(block)
      block.getBoundingClientRect = vi.fn(() => ({
        top: 100, bottom: 150, left: 0, right: 200, height: 50, width: 200,
      }))

      dragDrop._showDropIndicator(block, 'before')

      const indicator = element.querySelector('.rmx-drop-indicator')
      expect(indicator).not.toBeNull()
      expect(indicator.getAttribute('aria-hidden')).toBe('true')
    })

    it('should position indicator at block top for before position', () => {
      element.getBoundingClientRect = vi.fn(() => ({
        top: 10, bottom: 500, left: 0, right: 200, height: 490, width: 200,
      }))
      Object.defineProperty(element, 'scrollTop', { value: 0, writable: true })

      const block = document.createElement('p')
      element.appendChild(block)
      block.getBoundingClientRect = vi.fn(() => ({
        top: 110, bottom: 160, left: 0, right: 200, height: 50, width: 200,
      }))

      dragDrop._showDropIndicator(block, 'before')

      expect(dragDrop._dropIndicator.style.top).toBe('100px') // 110 - 10 + 0
    })

    it('should position indicator at block bottom for after position', () => {
      element.getBoundingClientRect = vi.fn(() => ({
        top: 10, bottom: 500, left: 0, right: 200, height: 490, width: 200,
      }))
      Object.defineProperty(element, 'scrollTop', { value: 0, writable: true })

      const block = document.createElement('p')
      element.appendChild(block)
      block.getBoundingClientRect = vi.fn(() => ({
        top: 110, bottom: 160, left: 0, right: 200, height: 50, width: 200,
      }))

      dragDrop._showDropIndicator(block, 'after')

      expect(dragDrop._dropIndicator.style.top).toBe('150px') // 160 - 10 + 0
    })

    it('should reuse existing indicator element on subsequent calls', () => {
      element.getBoundingClientRect = vi.fn(() => ({
        top: 0, bottom: 500, left: 0, right: 200, height: 500, width: 200,
      }))

      const block = document.createElement('p')
      element.appendChild(block)
      block.getBoundingClientRect = vi.fn(() => ({
        top: 50, bottom: 100, left: 0, right: 200, height: 50, width: 200,
      }))

      dragDrop._showDropIndicator(block, 'before')
      const firstIndicator = dragDrop._dropIndicator

      dragDrop._showDropIndicator(block, 'after')
      expect(dragDrop._dropIndicator).toBe(firstIndicator)
    })

    it('should emit drag:indicator event', () => {
      element.getBoundingClientRect = vi.fn(() => ({
        top: 0, bottom: 500, left: 0, right: 200, height: 500, width: 200,
      }))
      Object.defineProperty(element, 'scrollTop', { value: 0, writable: true })

      const block = document.createElement('p')
      element.appendChild(block)
      block.getBoundingClientRect = vi.fn(() => ({
        top: 50, bottom: 100, left: 0, right: 200, height: 50, width: 200,
      }))

      dragDrop._showDropIndicator(block, 'before')

      expect(mockEngine.eventBus.emit).toHaveBeenCalledWith('drag:indicator', {
        target: block,
        position: 'before',
        top: 50,
      })
    })

    it('should append indicator to editor element', () => {
      element.getBoundingClientRect = vi.fn(() => ({
        top: 0, bottom: 500, left: 0, right: 200, height: 500, width: 200,
      }))

      const block = document.createElement('p')
      element.appendChild(block)
      block.getBoundingClientRect = vi.fn(() => ({
        top: 50, bottom: 100, left: 0, right: 200, height: 50, width: 200,
      }))

      dragDrop._showDropIndicator(block, 'after')

      expect(dragDrop._dropIndicator.parentElement).toBe(element)
    })
  })

  describe('_removeDropIndicator', () => {
    it('should remove indicator from DOM when present', () => {
      const indicator = document.createElement('div')
      indicator.className = 'rmx-drop-indicator'
      element.appendChild(indicator)
      dragDrop._dropIndicator = indicator

      dragDrop._removeDropIndicator()

      expect(indicator.parentElement).toBeNull()
      expect(dragDrop._dropIndicator).toBeNull()
    })

    it('should handle case where indicator has no parent', () => {
      dragDrop._dropIndicator = document.createElement('div')
      // Not appended to anything

      expect(() => dragDrop._removeDropIndicator()).not.toThrow()
      expect(dragDrop._dropIndicator).toBeNull()
    })

    it('should handle case where no indicator exists', () => {
      dragDrop._dropIndicator = null
      expect(() => dragDrop._removeDropIndicator()).not.toThrow()
    })
  })

  describe('_createGhostPreview', () => {
    it('should create a ghost element cloned from the block', () => {
      const block = document.createElement('p')
      block.textContent = 'Ghost me'
      block.className = 'my-block'
      Object.defineProperty(block, 'offsetWidth', { value: 300 })

      block.getBoundingClientRect = vi.fn(() => ({
        top: 50, left: 20, bottom: 100, right: 320, height: 50, width: 300,
      }))

      const event = {
        clientX: 60,
        clientY: 70,
        dataTransfer: { setDragImage: vi.fn() },
      }

      dragDrop._createGhostPreview(block, event)

      expect(dragDrop._ghostEl).not.toBeNull()
      expect(dragDrop._ghostEl.className).toBe('rmx-drag-ghost')
      expect(dragDrop._ghostEl.style.position).toBe('absolute')
      expect(dragDrop._ghostEl.style.top).toBe('-9999px')
      expect(dragDrop._ghostEl.style.width).toBe('300px')
      expect(dragDrop._ghostEl.style.pointerEvents).toBe('none')
      expect(dragDrop._ghostEl.textContent).toBe('Ghost me')
      expect(dragDrop._ghostEl.parentElement).toBe(document.body)

      // setDragImage called with offsets
      expect(event.dataTransfer.setDragImage).toHaveBeenCalledWith(
        dragDrop._ghostEl,
        40, // 60 - 20
        20  // 70 - 50
      )

      // Clean up
      dragDrop._ghostEl.remove()
    })
  })

  describe('_getReorderableItem', () => {
    it('should return LI element within a UL', () => {
      const ul = document.createElement('ul')
      const li = document.createElement('li')
      li.textContent = 'Item'
      ul.appendChild(li)
      element.appendChild(ul)

      expect(dragDrop._getReorderableItem(li)).toBe(li)
    })

    it('should return LI element within an OL', () => {
      const ol = document.createElement('ol')
      const li = document.createElement('li')
      ol.appendChild(li)
      element.appendChild(ol)

      expect(dragDrop._getReorderableItem(li)).toBe(li)
    })

    it('should return TR element within a TBODY', () => {
      const table = document.createElement('table')
      const tbody = document.createElement('tbody')
      const tr = document.createElement('tr')
      const td = document.createElement('td')
      td.textContent = 'Cell'
      tr.appendChild(td)
      tbody.appendChild(tr)
      table.appendChild(tbody)
      element.appendChild(table)

      expect(dragDrop._getReorderableItem(tr)).toBe(tr)
    })

    it('should find TR from a nested TD element', () => {
      const table = document.createElement('table')
      const tbody = document.createElement('tbody')
      const tr = document.createElement('tr')
      const td = document.createElement('td')
      td.textContent = 'Cell'
      tr.appendChild(td)
      tbody.appendChild(tr)
      table.appendChild(tbody)
      element.appendChild(table)

      expect(dragDrop._getReorderableItem(td)).toBe(tr)
    })

    it('should return null for LI not in a reorderable container', () => {
      const div = document.createElement('div')
      const li = document.createElement('li')
      div.appendChild(li)
      element.appendChild(div)

      expect(dragDrop._getReorderableItem(li)).toBeNull()
    })

    it('should return null for non-reorderable elements', () => {
      const p = document.createElement('p')
      element.appendChild(p)

      expect(dragDrop._getReorderableItem(p)).toBeNull()
    })

    it('should handle text nodes inside LI', () => {
      const ul = document.createElement('ul')
      const li = document.createElement('li')
      const text = document.createTextNode('Item text')
      li.appendChild(text)
      ul.appendChild(li)
      element.appendChild(ul)

      expect(dragDrop._getReorderableItem(text)).toBe(li)
    })
  })

  describe('_handleBlockDrop with reorderable items (LI reorder after position)', () => {
    it('should reorder list items to after position', () => {
      const ul = document.createElement('ul')
      const li1 = document.createElement('li')
      li1.textContent = 'Item 1'
      const li2 = document.createElement('li')
      li2.textContent = 'Item 2'
      const li3 = document.createElement('li')
      li3.textContent = 'Item 3'
      ul.appendChild(li1)
      ul.appendChild(li2)
      ul.appendChild(li3)
      element.appendChild(ul)

      dragDrop._dragSource = li1
      dragDrop._dropTarget = li3
      dragDrop._dropPosition = 'after'
      dragDrop._dragSourceEditor = dragDrop

      dragDrop._handleBlockDrop(new Event('drop'))

      expect(ul.children[0]).toBe(li2)
      expect(ul.children[1]).toBe(li3)
      expect(ul.children[2]).toBe(li1)
    })
  })

  describe('_handleBlockDrop edge cases', () => {
    it('should return early when source is null', () => {
      dragDrop._dragSource = null
      dragDrop._dropTarget = document.createElement('p')
      dragDrop._dropPosition = 'before'

      expect(() => dragDrop._handleBlockDrop(new Event('drop'))).not.toThrow()
      expect(mockEngine.history.snapshot).not.toHaveBeenCalled()
    })

    it('should return early when target is null', () => {
      dragDrop._dragSource = document.createElement('p')
      dragDrop._dropTarget = null
      dragDrop._dropPosition = 'before'

      expect(() => dragDrop._handleBlockDrop(new Event('drop'))).not.toThrow()
      expect(mockEngine.history.snapshot).not.toHaveBeenCalled()
    })

    it('should return early when position is null', () => {
      dragDrop._dragSource = document.createElement('p')
      dragDrop._dropTarget = document.createElement('p')
      dragDrop._dropPosition = null

      expect(() => dragDrop._handleBlockDrop(new Event('drop'))).not.toThrow()
      expect(mockEngine.history.snapshot).not.toHaveBeenCalled()
    })

    it('should handle target with no parentElement', () => {
      const source = document.createElement('p')
      const target = document.createElement('p')
      // target has no parent

      dragDrop._dragSource = source
      dragDrop._dropTarget = target
      dragDrop._dropPosition = 'before'
      dragDrop._dragSourceEditor = dragDrop

      expect(() => dragDrop._handleBlockDrop(new Event('drop'))).not.toThrow()
    })
  })

  describe('_removeGhostPreview', () => {
    it('should remove ghost element from DOM', () => {
      const ghost = document.createElement('div')
      ghost.className = 'rmx-drag-ghost'
      document.body.appendChild(ghost)
      dragDrop._ghostEl = ghost

      dragDrop._removeGhostPreview()

      expect(ghost.parentElement).toBeNull()
      expect(dragDrop._ghostEl).toBeNull()
    })

    it('should handle ghost with no parent gracefully', () => {
      dragDrop._ghostEl = document.createElement('div')
      expect(() => dragDrop._removeGhostPreview()).not.toThrow()
      expect(dragDrop._ghostEl).toBeNull()
    })

    it('should handle null ghost', () => {
      dragDrop._ghostEl = null
      expect(() => dragDrop._removeGhostPreview()).not.toThrow()
    })
  })

  describe('_updateDropTarget with reorderable items', () => {
    it('should iterate sibling LI elements when dragging a list item', () => {
      const ul = document.createElement('ul')
      const li1 = document.createElement('li')
      const li2 = document.createElement('li')
      const li3 = document.createElement('li')
      ul.appendChild(li1)
      ul.appendChild(li2)
      ul.appendChild(li3)
      element.appendChild(ul)

      li1.getBoundingClientRect = vi.fn(() => ({
        top: 0, bottom: 30, left: 0, right: 200, height: 30, width: 200,
      }))
      li2.getBoundingClientRect = vi.fn(() => ({
        top: 30, bottom: 60, left: 0, right: 200, height: 30, width: 200,
      }))
      li3.getBoundingClientRect = vi.fn(() => ({
        top: 60, bottom: 90, left: 0, right: 200, height: 30, width: 200,
      }))
      element.getBoundingClientRect = vi.fn(() => ({
        top: 0, bottom: 500, left: 0, right: 200, height: 500, width: 200,
      }))

      dragDrop._dragSource = li1
      dragDrop._updateDropTarget({ clientY: 45 })

      // Should target li2 since li1 is the drag source
      expect(dragDrop._dropTarget).toBe(li2)
    })
  })

  describe('_handleDragOver with drop target update', () => {
    it('should call _updateDropTarget during external drag', () => {
      dragDrop.init()
      dragDrop._isExternalDrag = true

      const spy = vi.spyOn(dragDrop, '_updateDropTarget')
      const event = new Event('dragover', { bubbles: true, cancelable: true })
      event.dataTransfer = { dropEffect: '' }
      event.clientY = 50
      element.dispatchEvent(event)

      expect(spy).toHaveBeenCalled()
      spy.mockRestore()
    })

    it('should not call _updateDropTarget when no drag source and not external', () => {
      dragDrop.init()
      dragDrop._isExternalDrag = false
      dragDrop._dragSource = null

      const spy = vi.spyOn(dragDrop, '_updateDropTarget')
      const event = new Event('dragover', { bubbles: true, cancelable: true })
      event.dataTransfer = { dropEffect: '' }
      element.dispatchEvent(event)

      expect(spy).not.toHaveBeenCalled()
      spy.mockRestore()
    })
  })
})
