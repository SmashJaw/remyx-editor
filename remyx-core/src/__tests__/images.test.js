import { registerImageCommands } from '../commands/images.js'

describe('registerImageCommands', () => {
  let commands
  let mockEngine

  beforeEach(() => {
    commands = {}
    const element = document.createElement('div')
    element.setAttribute('contenteditable', 'true')
    document.body.appendChild(element)

    mockEngine = {
      element,
      commands: {
        register: jest.fn((name, def) => { commands[name] = def }),
        execute: jest.fn((name, ...args) => commands[name]?.execute(mockEngine, ...args)),
      },
      keyboard: { register: jest.fn() },
      eventBus: { emit: jest.fn(), on: jest.fn() },
      history: { snapshot: jest.fn() },
      selection: {
        getSelection: jest.fn().mockReturnValue(window.getSelection()),
        getRange: jest.fn(),
        save: jest.fn(),
        restore: jest.fn(),
        insertHTML: jest.fn(),
        insertNode: jest.fn(),
        wrapWith: jest.fn(),
        unwrap: jest.fn(),
        setRange: jest.fn(),
      },
      sanitizer: { sanitize: jest.fn(html => html) },
      getHTML: jest.fn().mockReturnValue('<p>test</p>'),
      setHTML: jest.fn(),
      options: { baseHeadingLevel: 0 },
      isMarkdownMode: false,
      isSourceMode: false,
    }

    // Make insertNode actually append to DOM so parentNode checks work
    mockEngine.selection.insertNode.mockImplementation((node) => {
      mockEngine.element.appendChild(node)
    })

    registerImageCommands(mockEngine)
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('should register all 4 image commands', () => {
    expect(mockEngine.commands.register).toHaveBeenCalledTimes(4)
    expect(commands.insertImage).toBeDefined()
    expect(commands.resizeImage).toBeDefined()
    expect(commands.alignImage).toBeDefined()
    expect(commands.removeImage).toBeDefined()
  })

  it('should not insert image when no src', () => {
    commands.insertImage.execute(mockEngine, { src: '' })
    expect(mockEngine.selection.insertNode).not.toHaveBeenCalled()
  })

  it('should insert image with correct attributes', () => {
    mockEngine.selection.getRange.mockReturnValue(document.createRange())

    commands.insertImage.execute(mockEngine, { src: 'test.jpg', alt: 'Test image' })
    expect(mockEngine.selection.insertNode).toHaveBeenCalled()

    const img = mockEngine.selection.insertNode.mock.calls[0][0]
    expect(img.tagName).toBe('IMG')
    expect(img.src).toContain('test.jpg')
    expect(img.alt).toBe('Test image')
    expect(img.className).toBe('rmx-image')
    expect(img.style.maxWidth).toBe('100%')
  })

  it('should set width and height as pixels when numbers', () => {
    mockEngine.selection.getRange.mockReturnValue(document.createRange())

    commands.insertImage.execute(mockEngine, { src: 'test.jpg', width: 200, height: 150 })
    const img = mockEngine.selection.insertNode.mock.calls[0][0]
    expect(img.style.width).toBe('200px')
    expect(img.style.height).toBe('150px')
  })

  it('should set width and height as strings when strings', () => {
    mockEngine.selection.getRange.mockReturnValue(document.createRange())

    commands.insertImage.execute(mockEngine, { src: 'test.jpg', width: '50%', height: '100%' })
    const img = mockEngine.selection.insertNode.mock.calls[0][0]
    expect(img.style.width).toBe('50%')
    expect(img.style.height).toBe('100%')
  })

  it('should create range at end when no selection range', () => {
    mockEngine.selection.getRange.mockReturnValue(null)
    commands.insertImage.execute(mockEngine, { src: 'test.jpg' })
    expect(mockEngine.selection.setRange).toHaveBeenCalled()
    expect(mockEngine.selection.insertNode).toHaveBeenCalled()
  })

  it('should resize image with pixel width', () => {
    const img = document.createElement('img')
    commands.resizeImage.execute(mockEngine, { element: img, width: 300 })
    expect(img.style.width).toBe('300px')
    expect(img.style.height).toBe('auto')
  })

  it('should resize image with string width and height', () => {
    const img = document.createElement('img')
    commands.resizeImage.execute(mockEngine, { element: img, width: '50%', height: 200 })
    expect(img.style.width).toBe('50%')
    expect(img.style.height).toBe('200px')
  })

  it('should not resize non-IMG element', () => {
    const div = document.createElement('div')
    commands.resizeImage.execute(mockEngine, { element: div, width: 100 })
    expect(div.style.width).toBe('')
  })

  it('should align image left', () => {
    const img = document.createElement('img')
    commands.alignImage.execute(mockEngine, { element: img, alignment: 'left' })
    expect(img.style.float).toBe('left')
    // jsdom normalizes '0' to '0px'
    expect(img.style.marginRight).toBe('16px')
    expect(img.style.marginBottom).toBe('16px')
  })

  it('should align image right', () => {
    const img = document.createElement('img')
    commands.alignImage.execute(mockEngine, { element: img, alignment: 'right' })
    expect(img.style.float).toBe('right')
    expect(img.style.marginLeft).toBe('16px')
    expect(img.style.marginBottom).toBe('16px')
  })

  it('should align image center', () => {
    const img = document.createElement('img')
    commands.alignImage.execute(mockEngine, { element: img, alignment: 'center' })
    expect(img.style.display).toBe('block')
    expect(img.style.marginLeft).toBe('auto')
    expect(img.style.marginRight).toBe('auto')
  })

  it('should reset alignment styles for unknown alignment', () => {
    const img = document.createElement('img')
    img.style.float = 'left'
    commands.alignImage.execute(mockEngine, { element: img, alignment: 'none' })
    expect(img.style.float).toBe('')
  })

  it('should remove image from DOM', () => {
    const img = document.createElement('img')
    mockEngine.element.appendChild(img)
    commands.removeImage.execute(mockEngine, { element: img })
    expect(mockEngine.element.contains(img)).toBe(false)
  })

  it('should not remove non-IMG element', () => {
    const div = document.createElement('div')
    mockEngine.element.appendChild(div)
    commands.removeImage.execute(mockEngine, { element: div })
    expect(mockEngine.element.contains(div)).toBe(true)
  })

  it('should have correct meta', () => {
    expect(commands.insertImage.meta).toEqual({ icon: 'image', tooltip: 'Insert Image' })
    expect(commands.removeImage.meta).toEqual({ tooltip: 'Remove Image' })
  })
})
