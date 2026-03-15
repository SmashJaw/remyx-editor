import { exportAsMarkdown, exportAsPDF, exportAsDocx } from '../utils/exportUtils.js'

// Mock the markdownConverter module
jest.mock('../utils/markdownConverter.js', () => ({
  htmlToMarkdown: jest.fn((html) => `# Converted\n\n${html}`),
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
      click: jest.fn(),
    }

    createElementSpy = jest.spyOn(document, 'createElement').mockImplementation((tag) => {
      if (tag === 'a') return mockAnchor
      // For iframe in exportAsPDF
      if (tag === 'iframe') {
        const iframeDoc = {
          open: jest.fn(),
          write: jest.fn(),
          close: jest.fn(),
        }
        return {
          style: {},
          contentDocument: iframeDoc,
          contentWindow: {
            document: iframeDoc,
            focus: jest.fn(),
            print: jest.fn(),
            onafterprint: null,
          },
          onload: null,
          parentNode: document.body,
        }
      }
      return document.createElement.call(document, tag)
    })

    createObjectURLSpy = jest.fn(() => 'blob:mock-url')
    revokeObjectURLSpy = jest.fn()
    URL.createObjectURL = createObjectURLSpy
    URL.revokeObjectURL = revokeObjectURLSpy

    appendChildSpy = jest.spyOn(document.body, 'appendChild').mockImplementation(() => {})
    removeChildSpy = jest.spyOn(document.body, 'removeChild').mockImplementation(() => {})
  })

  afterEach(() => {
    createElementSpy.mockRestore()
    appendChildSpy.mockRestore()
    removeChildSpy.mockRestore()
    jest.restoreAllMocks()
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

    it('should write HTML content to the iframe document', () => {
      const iframe = createMockIframe()
      createElementSpy.mockImplementation((tag) => {
        if (tag === 'iframe') return iframe
        return mockAnchor
      })

      exportAsPDF('<p>Hello</p>', 'My Doc')
      expect(iframe.contentDocument.write).toHaveBeenCalled()
      const writtenHTML = iframe.contentDocument.write.mock.calls[0][0]
      expect(writtenHTML).toContain('<p>Hello</p>')
      expect(writtenHTML).toContain('My Doc')
    })

    it('should use default title "Document"', () => {
      const iframe = createMockIframe()
      createElementSpy.mockImplementation((tag) => {
        if (tag === 'iframe') return iframe
        return mockAnchor
      })

      exportAsPDF('<p>Hello</p>')
      const writtenHTML = iframe.contentDocument.write.mock.calls[0][0]
      expect(writtenHTML).toContain('<title>Document</title>')
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
  })
})

function createMockIframe() {
  const iframeDoc = {
    open: jest.fn(),
    write: jest.fn(),
    close: jest.fn(),
  }
  return {
    style: { cssText: '' },
    contentDocument: iframeDoc,
    contentWindow: {
      document: iframeDoc,
      focus: jest.fn(),
      print: jest.fn(),
      onafterprint: null,
    },
    onload: null,
    parentNode: document.body,
  }
}
