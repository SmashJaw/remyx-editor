import { registerAlignmentCommands } from '../commands/alignment.js'

describe('registerAlignmentCommands', () => {
  let commands
  let mockEngine

  beforeEach(() => {
    commands = {}
    document.execCommand = jest.fn().mockReturnValue(true)

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
        wrapWith: jest.fn(),
        unwrap: jest.fn(),
        getParentBlock: jest.fn(),
      },
      sanitizer: { sanitize: jest.fn(html => html) },
      getHTML: jest.fn().mockReturnValue('<p>test</p>'),
      setHTML: jest.fn(),
      options: { baseHeadingLevel: 0 },
      isMarkdownMode: false,
      isSourceMode: false,
    }

    registerAlignmentCommands(mockEngine)
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('should register all 4 alignment commands', () => {
    expect(mockEngine.commands.register).toHaveBeenCalledTimes(4)
    expect(commands.alignLeft).toBeDefined()
    expect(commands.alignCenter).toBeDefined()
    expect(commands.alignRight).toBeDefined()
    expect(commands.alignJustify).toBeDefined()
  })

  it('should execute alignLeft with justifyLeft', () => {
    const spy = jest.spyOn(document, 'execCommand').mockReturnValue(true)
    commands.alignLeft.execute()
    expect(spy).toHaveBeenCalledWith('justifyLeft', false, null)
    spy.mockRestore()
  })

  it('should execute alignCenter with justifyCenter', () => {
    const spy = jest.spyOn(document, 'execCommand').mockReturnValue(true)
    commands.alignCenter.execute()
    expect(spy).toHaveBeenCalledWith('justifyCenter', false, null)
    spy.mockRestore()
  })

  it('should execute alignRight with justifyRight', () => {
    const spy = jest.spyOn(document, 'execCommand').mockReturnValue(true)
    commands.alignRight.execute()
    expect(spy).toHaveBeenCalledWith('justifyRight', false, null)
    spy.mockRestore()
  })

  it('should execute alignJustify with justifyFull', () => {
    const spy = jest.spyOn(document, 'execCommand').mockReturnValue(true)
    commands.alignJustify.execute()
    expect(spy).toHaveBeenCalledWith('justifyFull', false, null)
    spy.mockRestore()
  })

  it('should return true for alignLeft isActive when no alignment set', () => {
    const block = document.createElement('p')
    mockEngine.selection.getParentBlock.mockReturnValue(block)
    expect(commands.alignLeft.isActive(mockEngine)).toBe(true)
  })

  it('should return true for alignLeft isActive when textAlign is start', () => {
    const block = document.createElement('p')
    block.style.textAlign = 'start'
    mockEngine.selection.getParentBlock.mockReturnValue(block)
    expect(commands.alignLeft.isActive(mockEngine)).toBe(true)
  })

  it('should return false for alignLeft isActive when no block', () => {
    mockEngine.selection.getParentBlock.mockReturnValue(null)
    expect(commands.alignLeft.isActive(mockEngine)).toBe(false)
  })

  it('should return true for alignCenter isActive when textAlign is center', () => {
    const block = document.createElement('p')
    block.style.textAlign = 'center'
    mockEngine.selection.getParentBlock.mockReturnValue(block)
    expect(commands.alignCenter.isActive(mockEngine)).toBe(true)
  })

  it('should return true for alignRight isActive when textAlign is right', () => {
    const block = document.createElement('p')
    block.style.textAlign = 'right'
    mockEngine.selection.getParentBlock.mockReturnValue(block)
    expect(commands.alignRight.isActive(mockEngine)).toBe(true)
  })

  it('should return true for alignJustify isActive when textAlign is justify', () => {
    const block = document.createElement('p')
    block.style.textAlign = 'justify'
    mockEngine.selection.getParentBlock.mockReturnValue(block)
    expect(commands.alignJustify.isActive(mockEngine)).toBe(true)
  })

  it('should have correct meta for each alignment command', () => {
    expect(commands.alignLeft.meta).toEqual({ icon: 'alignLeft', tooltip: 'Align Left' })
    expect(commands.alignCenter.meta).toEqual({ icon: 'alignCenter', tooltip: 'Align Center' })
    expect(commands.alignRight.meta).toEqual({ icon: 'alignRight', tooltip: 'Align Right' })
    expect(commands.alignJustify.meta).toEqual({ icon: 'alignJustify', tooltip: 'Justify' })
  })
})
