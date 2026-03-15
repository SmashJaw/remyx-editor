import { registerMediaCommands } from '../commands/media.js'

describe('registerMediaCommands', () => {
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

    registerMediaCommands(mockEngine)
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('should register embedMedia and removeEmbed', () => {
    expect(mockEngine.commands.register).toHaveBeenCalledTimes(2)
    expect(commands.embedMedia).toBeDefined()
    expect(commands.removeEmbed).toBeDefined()
  })

  it('should not embed when no URL', () => {
    commands.embedMedia.execute(mockEngine, { url: '' })
    expect(mockEngine.selection.insertNode).not.toHaveBeenCalled()
  })

  it('should not embed for unsupported URL', () => {
    commands.embedMedia.execute(mockEngine, { url: 'https://example.com/video' })
    expect(mockEngine.selection.insertNode).not.toHaveBeenCalled()
  })

  it('should embed YouTube video', () => {
    commands.embedMedia.execute(mockEngine, { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' })
    expect(mockEngine.selection.insertNode).toHaveBeenCalled()

    const wrapper = mockEngine.selection.insertNode.mock.calls[0][0]
    expect(wrapper.className).toBe('rmx-embed-wrapper')
    expect(wrapper.getAttribute('contenteditable')).toBe('false')
    expect(wrapper.getAttribute('data-embed-url')).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ')

    const iframe = wrapper.querySelector('iframe')
    expect(iframe).not.toBeNull()
    expect(iframe.src).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ')
  })

  it('should embed YouTube short URL', () => {
    commands.embedMedia.execute(mockEngine, { url: 'https://youtu.be/dQw4w9WgXcQ' })
    const wrapper = mockEngine.selection.insertNode.mock.calls[0][0]
    const iframe = wrapper.querySelector('iframe')
    expect(iframe.src).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ')
  })

  it('should embed Vimeo video', () => {
    commands.embedMedia.execute(mockEngine, { url: 'https://vimeo.com/123456789' })
    const wrapper = mockEngine.selection.insertNode.mock.calls[0][0]
    const iframe = wrapper.querySelector('iframe')
    expect(iframe.src).toBe('https://player.vimeo.com/video/123456789')
  })

  it('should embed Dailymotion video', () => {
    commands.embedMedia.execute(mockEngine, { url: 'https://www.dailymotion.com/video/x8abc123' })
    const wrapper = mockEngine.selection.insertNode.mock.calls[0][0]
    const iframe = wrapper.querySelector('iframe')
    expect(iframe.src).toBe('https://www.dailymotion.com/embed/video/x8abc123')
  })

  it('should set iframe attributes', () => {
    commands.embedMedia.execute(mockEngine, { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' })
    const wrapper = mockEngine.selection.insertNode.mock.calls[0][0]
    const iframe = wrapper.querySelector('iframe')
    expect(iframe.getAttribute('frameborder')).toBe('0')
    expect(iframe.getAttribute('allowfullscreen')).toBe('true')
    expect(iframe.style.width).toBe('100%')
    expect(iframe.style.height).toBe('100%')
  })

  it('should remove embed and replace with paragraph', () => {
    const wrapper = document.createElement('div')
    wrapper.className = 'rmx-embed-wrapper'
    mockEngine.element.appendChild(wrapper)

    commands.removeEmbed.execute(mockEngine, { element: wrapper })
    expect(mockEngine.element.querySelector('.rmx-embed-wrapper')).toBeNull()
    expect(mockEngine.element.querySelector('p')).not.toBeNull()
  })

  it('should find closest embed wrapper when removing', () => {
    const wrapper = document.createElement('div')
    wrapper.className = 'rmx-embed-wrapper'
    const iframe = document.createElement('iframe')
    wrapper.appendChild(iframe)
    mockEngine.element.appendChild(wrapper)

    commands.removeEmbed.execute(mockEngine, { element: iframe })
    expect(mockEngine.element.querySelector('.rmx-embed-wrapper')).toBeNull()
  })

  it('should not remove when no element', () => {
    expect(() => commands.removeEmbed.execute(mockEngine, { element: null })).not.toThrow()
  })

  it('should have correct meta', () => {
    expect(commands.embedMedia.meta).toEqual({ icon: 'embedMedia', tooltip: 'Embed Media' })
    expect(commands.removeEmbed.meta).toEqual({ tooltip: 'Remove Embed' })
  })
})
