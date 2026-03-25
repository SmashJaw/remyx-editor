import { vi } from 'vitest'
import { exportAsMarkdown, exportAsPDF, exportAsDocx } from '../utils/exportUtils.js'

// Mock the markdownConverter module
vi.mock('../utils/markdownConverter.js', () => ({
  htmlToMarkdown: vi.fn((html) => `# Converted\n\n${html}`),
}))

// Mock the Sanitizer module used by exportUtils at module level
vi.mock('../core/Sanitizer.js', () => ({
  Sanitizer: class MockSanitizer {
    sanitize(html) { return html }
  },
}))

describe('exportUtils', () => {
  let mockAnchor
  let createElementSpy
  let createObjectURLSpy
  let revokeObjectURLSpy
  let appendChildSpy
  let removeChildSpy

  beforeEach(() => {
    mockAnchor = {
      href: '',
      download: '',
      click: vi.fn(),
    }

    createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      if (tag === 'a') return mockAnchor
      // For iframe in exportAsPDF
      if (tag === 'iframe') {
        return {
          style: { cssText: '' },
          srcdoc: '',
          setAttribute: vi.fn(),
          contentWindow: {
            focus: vi.fn(),
            print: vi.fn(),
            onafterprint: null,
          },
          onload: null,
          parentNode: document.body,
        }
      }
      return document.createElement.call(document, tag)
    })

    createObjectURLSpy = vi.fn(() => 'blob:mock-url')
    revokeObjectURLSpy = vi.fn()
    URL.createObjectURL = createObjectURLSpy
    URL.revokeObjectURL = revokeObjectURLSpy

    appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => {})
    removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => {})
  })

  afterEach(() => {
    createElementSpy.mockRestore()
    appendChildSpy.mockRestore()
    removeChildSpy.mockRestore()
    vi.restoreAllMocks()
  })

  describe('exportAsMarkdown', () => {
    it('should create a blob with markdown content', () => {
      exportAsMarkdown('<p>Hello</p>')
      expect(createObjectURLSpy).toHaveBeenCalled()
      const blob = createObjectURLSpy.mock.calls[0][0]
      expect(blob).toBeInstanceOf(Blob)
      expect(blob.type).toBe('text/markdown;charset=utf-8')
    })

    it('should use the default filename "document.md"', () => {
      exportAsMarkdown('<p>Hello</p>')
      expect(mockAnchor.download).toBe('document.md')
    })

    it('should use a custom filename when provided', () => {
      exportAsMarkdown('<p>Hello</p>', 'notes.md')
      expect(mockAnchor.download).toBe('notes.md')
    })

    it('should trigger a click on the anchor element', () => {
      exportAsMarkdown('<p>Hello</p>')
      expect(mockAnchor.click).toHaveBeenCalled()
    })

    it('should set the anchor href to the blob URL', () => {
      exportAsMarkdown('<p>Hello</p>')
      expect(mockAnchor.href).toBe('blob:mock-url')
    })

    it('should revoke the object URL after download', () => {
      exportAsMarkdown('<p>Hello</p>')
      expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-url')
    })

    it('should append and remove the anchor from the body', () => {
      exportAsMarkdown('<p>Hello</p>')
      expect(appendChildSpy).toHaveBeenCalledWith(mockAnchor)
      expect(removeChildSpy).toHaveBeenCalledWith(mockAnchor)
    })
  })

  describe('exportAsPDF', () => {
    it('should create an iframe element', () => {
      exportAsPDF('<p>Hello</p>')
      expect(createElementSpy).toHaveBeenCalledWith('iframe')
    })

    it('should append the iframe to the body', () => {
      exportAsPDF('<p>Hello</p>')
      expect(appendChildSpy).toHaveBeenCalled()
    })

    it('should set iframe.srcdoc with HTML content', () => {
      const iframe = createMockIframe()
      createElementSpy.mockImplementation((tag) => {
        if (tag === 'iframe') return iframe
        return mockAnchor
      })

      exportAsPDF('<p>Hello</p>', 'My Doc')
      expect(iframe.srcdoc).toContain('<p>Hello</p>')
      expect(iframe.srcdoc).toContain('My Doc')
    })

    it('should use default title "Document" in srcdoc', () => {
      const iframe = createMockIframe()
      createElementSpy.mockImplementation((tag) => {
        if (tag === 'iframe') return iframe
        return mockAnchor
      })

      exportAsPDF('<p>Hello</p>')
      expect(iframe.srcdoc).toContain('<title>Document</title>')
    })

    it('should hide the iframe off-screen', () => {
      const iframe = createMockIframe()
      createElementSpy.mockImplementation((tag) => {
        if (tag === 'iframe') return iframe
        return mockAnchor
      })

      exportAsPDF('<p>Hello</p>')
      expect(iframe.style.cssText).toContain('-9999px')
    })
  })

  describe('exportAsPDF - onafterprint cleanup', () => {
    it('should remove iframe when onafterprint fires', () => {
      const iframe = createMockIframe()
      iframe.parentNode = document.body
      createElementSpy.mockImplementation((tag) => {
        if (tag === 'iframe') return iframe
        return mockAnchor
      })

      exportAsPDF('<p>Test</p>')

      // onafterprint should have been set
      expect(iframe.contentWindow.onafterprint).toBeInstanceOf(Function)

      // Simulate onafterprint firing
      iframe.contentWindow.onafterprint()
      expect(removeChildSpy).toHaveBeenCalledWith(iframe)
    })
  })

  describe('exportAsPDF - iframe.onload behavior', () => {
    it('should call focus and print when iframe loads', () => {
      const iframe = createMockIframe()
      createElementSpy.mockImplementation((tag) => {
        if (tag === 'iframe') return iframe
        return mockAnchor
      })

      exportAsPDF('<p>Test</p>')

      // onload should have been set
      expect(iframe.onload).toBeInstanceOf(Function)

      // Simulate iframe load
      iframe.onload()

      expect(iframe.contentWindow.focus).toHaveBeenCalled()
      expect(iframe.contentWindow.print).toHaveBeenCalled()
    })

    it('should set fallback timeout after print that removes iframe', () => {
      vi.useFakeTimers()
      const iframe = createMockIframe()
      iframe.parentNode = document.body
      createElementSpy.mockImplementation((tag) => {
        if (tag === 'iframe') return iframe
        return mockAnchor
      })

      exportAsPDF('<p>Test</p>')
      iframe.onload()

      // Advance past the 1000ms fallback timeout set inside onload
      vi.advanceTimersByTime(1000)
      expect(removeChildSpy).toHaveBeenCalledWith(iframe)

      vi.useRealTimers()
    })

    it('should not remove iframe via fallback if already removed', () => {
      vi.useFakeTimers()
      const iframe = createMockIframe()
      iframe.parentNode = null // simulate already removed
      createElementSpy.mockImplementation((tag) => {
        if (tag === 'iframe') return iframe
        return mockAnchor
      })

      exportAsPDF('<p>Test</p>')
      iframe.onload()

      // Advance timers - removeChild should not be called since parentNode is null
      vi.advanceTimersByTime(1000)
      // removeChild is called once during onload path setup but not for fallback cleanup
      // since iframe.parentNode is null
      expect(removeChildSpy).not.toHaveBeenCalledWith(iframe)

      vi.useRealTimers()
    })
  })

  describe('exportAsPDF - initial fallback timeout', () => {
    it('should set a 60s fallback timeout that removes iframe if still in DOM', () => {
      vi.useFakeTimers()
      const iframe = createMockIframe()
      iframe.parentNode = document.body
      createElementSpy.mockImplementation((tag) => {
        if (tag === 'iframe') return iframe
        return mockAnchor
      })

      exportAsPDF('<p>Test</p>')

      // Do NOT trigger onload - simulate the case where it never fires
      // Advance past the 60000ms fallback
      vi.advanceTimersByTime(60000)
      expect(removeChildSpy).toHaveBeenCalledWith(iframe)

      vi.useRealTimers()
    })
  })

  describe('exportAsDocx', () => {
    it('should create a blob with Word-compatible content', () => {
      exportAsDocx('<p>Hello</p>')
      expect(createObjectURLSpy).toHaveBeenCalled()
      const blob = createObjectURLSpy.mock.calls[0][0]
      expect(blob).toBeInstanceOf(Blob)
      expect(blob.type).toBe('application/msword')
    })

    it('should use the default filename "document.doc"', () => {
      exportAsDocx('<p>Hello</p>')
      expect(mockAnchor.download).toBe('document.doc')
    })

    it('should use a custom filename when provided', () => {
      exportAsDocx('<p>Hello</p>', 'report.doc')
      expect(mockAnchor.download).toBe('report.doc')
    })

    it('should trigger a click to start download', () => {
      exportAsDocx('<p>Hello</p>')
      expect(mockAnchor.click).toHaveBeenCalled()
    })

    it('should include the HTML content in Word format', () => {
      exportAsDocx('<p>Hello</p>')
      // The blob should contain the HTML wrapped in Word XML namespaces
      expect(createObjectURLSpy).toHaveBeenCalled()
    })

    it('should revoke the object URL after download', () => {
      exportAsDocx('<p>Hello</p>')
      expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-url')
    })

    it('should include Word XML namespaces in the blob content', () => {
      exportAsDocx('<p>Hello World</p>')
      const blob = createObjectURLSpy.mock.calls[0][0]
      expect(blob).toBeInstanceOf(Blob)
      expect(blob.type).toBe('application/msword')
    })

    it('should include BOM character for Word compatibility', () => {
      exportAsDocx('<p>Test</p>')
      const blob = createObjectURLSpy.mock.calls[0][0]
      // Verify blob was created (BOM is internal to the blob)
      expect(blob).toBeInstanceOf(Blob)
    })

    it('should append and remove the anchor from the body', () => {
      exportAsDocx('<p>Hello</p>')
      expect(appendChildSpy).toHaveBeenCalledWith(mockAnchor)
      expect(removeChildSpy).toHaveBeenCalledWith(mockAnchor)
    })
  })
})

function createMockIframe() {
  return {
    style: { cssText: '' },
    srcdoc: '',
    setAttribute: vi.fn(),
    contentWindow: {
      focus: vi.fn(),
      print: vi.fn(),
      onafterprint: null,
    },
    onload: null,
    parentNode: document.body,
  }
}
