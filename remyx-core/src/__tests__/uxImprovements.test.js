import { vi } from 'vitest'
import { registerDistractionFreeCommands } from '../commands/distractionFree.js'
import { registerSplitViewCommands } from '../commands/splitView.js'
import { registerColorPresetCommands, saveColorPreset, loadColorPresets, deleteColorPreset } from '../commands/colorPresets.js'
import { registerFontCommands } from '../commands/fontControls.js'

// Shared test helpers
function createMockEngine() {
  const commands = {}
  const editorRoot = document.createElement('div')
  editorRoot.className = 'rmx-editor'

  const element = document.createElement('div')
  element.setAttribute('contenteditable', 'true')
  editorRoot.appendChild(element)
  document.body.appendChild(editorRoot)

  const mockEngine = {
    element,
    commands: {
      register: vi.fn((name, def) => { commands[name] = def }),
      execute: vi.fn((name, ...args) => commands[name]?.execute(mockEngine, ...args)),
      has: vi.fn((name) => !!commands[name]),
    },
    keyboard: { register: vi.fn() },
    eventBus: { emit: vi.fn(), on: vi.fn(() => () => {}) },
    history: { snapshot: vi.fn() },
    selection: {
      getSelection: vi.fn().mockReturnValue(window.getSelection()),
      getRange: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      insertHTML: vi.fn(),
      wrapWith: vi.fn(),
      unwrap: vi.fn(),
      getParentElement: vi.fn().mockReturnValue(null),
    },
    sanitizer: { sanitize: vi.fn(html => html) },
    getHTML: vi.fn().mockReturnValue('<p>test</p>'),
    setHTML: vi.fn(),
    options: { baseHeadingLevel: 0 },
    isMarkdownMode: false,
    isSourceMode: false,
  }

  return { commands, mockEngine, editorRoot }
}

// ==========================
// Distraction-Free Mode
// ==========================
describe('registerDistractionFreeCommands', () => {
  let commands, mockEngine, editorRoot

  beforeEach(() => {
    ;({ commands, mockEngine, editorRoot } = createMockEngine())
    registerDistractionFreeCommands(mockEngine)
  })

  afterEach(() => {
    editorRoot.classList.remove('rmx-distraction-free')
    document.body.innerHTML = ''
  })

  it('should register distractionFree command', () => {
    expect(commands.distractionFree).toBeDefined()
  })

  it('should have mod+shift+d shortcut', () => {
    expect(commands.distractionFree.shortcut).toBe('mod+shift+d')
  })

  it('should add rmx-distraction-free class when entering', () => {
    commands.distractionFree.execute(mockEngine)
    expect(editorRoot.classList.contains('rmx-distraction-free')).toBe(true)
  })

  it('should remove rmx-distraction-free class when exiting', () => {
    editorRoot.classList.add('rmx-distraction-free')
    commands.distractionFree.execute(mockEngine)
    expect(editorRoot.classList.contains('rmx-distraction-free')).toBe(false)
  })

  it('should emit distractionFree:toggle event', () => {
    commands.distractionFree.execute(mockEngine)
    expect(mockEngine.eventBus.emit).toHaveBeenCalledWith('distractionFree:toggle', { active: true })
  })

  it('should return true for isActive when in distraction-free mode', () => {
    editorRoot.classList.add('rmx-distraction-free')
    expect(commands.distractionFree.isActive(mockEngine)).toBe(true)
  })

  it('should return false for isActive when not in distraction-free mode', () => {
    expect(commands.distractionFree.isActive(mockEngine)).toBe(false)
  })

  it('should do nothing if no .rmx-editor root found', () => {
    const standaloneElement = document.createElement('div')
    document.body.appendChild(standaloneElement)
    const eng = { ...mockEngine, element: standaloneElement }
    commands.distractionFree.execute(eng)
    expect(mockEngine.eventBus.emit).not.toHaveBeenCalled()
  })

  it('should have correct meta', () => {
    expect(commands.distractionFree.meta).toEqual({ icon: 'distractionFree', tooltip: 'Distraction-Free Mode' })
  })
})

// ==========================
// Split View
// ==========================
describe('registerSplitViewCommands', () => {
  let commands, mockEngine, editorRoot

  beforeEach(() => {
    ;({ commands, mockEngine, editorRoot } = createMockEngine())
    registerSplitViewCommands(mockEngine)
  })

  afterEach(() => {
    editorRoot.classList.remove('rmx-split-view')
    document.body.innerHTML = ''
  })

  it('should register toggleSplitView command', () => {
    expect(commands.toggleSplitView).toBeDefined()
  })

  it('should have mod+shift+v shortcut', () => {
    expect(commands.toggleSplitView.shortcut).toBe('mod+shift+v')
  })

  it('should add rmx-split-view class when entering', () => {
    commands.toggleSplitView.execute(mockEngine)
    expect(editorRoot.classList.contains('rmx-split-view')).toBe(true)
  })

  it('should remove rmx-split-view class when exiting', () => {
    editorRoot.classList.add('rmx-split-view')
    commands.toggleSplitView.execute(mockEngine)
    expect(editorRoot.classList.contains('rmx-split-view')).toBe(false)
  })

  it('should emit splitView:toggle event', () => {
    commands.toggleSplitView.execute(mockEngine)
    expect(mockEngine.eventBus.emit).toHaveBeenCalledWith('splitView:toggle', { active: true })
  })

  it('should return correct isActive state', () => {
    expect(commands.toggleSplitView.isActive(mockEngine)).toBe(false)
    editorRoot.classList.add('rmx-split-view')
    expect(commands.toggleSplitView.isActive(mockEngine)).toBe(true)
  })
})

// ==========================
// Color Presets
// ==========================
describe('Color Presets', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('saveColorPreset / loadColorPresets / deleteColorPreset', () => {
    it('should save and load a color preset', () => {
      saveColorPreset('My Palette', ['#ff0000', '#00ff00', '#0000ff'])
      const presets = loadColorPresets()
      expect(presets).toHaveLength(1)
      expect(presets[0].name).toBe('My Palette')
      expect(presets[0].colors).toEqual(['#ff0000', '#00ff00', '#0000ff'])
    })

    it('should return empty array when no presets exist', () => {
      expect(loadColorPresets()).toEqual([])
    })

    it('should replace preset with same name', () => {
      saveColorPreset('Default', ['#111'])
      saveColorPreset('Default', ['#222'])
      const presets = loadColorPresets()
      expect(presets).toHaveLength(1)
      expect(presets[0].colors).toEqual(['#222'])
    })

    it('should delete a color preset', () => {
      saveColorPreset('A', ['#aaa'])
      saveColorPreset('B', ['#bbb'])
      deleteColorPreset('A')
      const presets = loadColorPresets()
      expect(presets).toHaveLength(1)
      expect(presets[0].name).toBe('B')
    })

    it('should handle invalid name gracefully', () => {
      saveColorPreset('', ['#000'])
      expect(loadColorPresets()).toEqual([])
    })

    it('should handle invalid colors gracefully', () => {
      saveColorPreset('Bad', null)
      expect(loadColorPresets()).toEqual([])
    })
  })

  describe('registerColorPresetCommands', () => {
    it('should register saveColorPreset and loadColorPresets commands', () => {
      const { commands, mockEngine } = createMockEngine()
      registerColorPresetCommands(mockEngine)
      expect(commands.saveColorPreset).toBeDefined()
      expect(commands.loadColorPresets).toBeDefined()
      expect(commands.deleteColorPreset).toBeDefined()
      document.body.innerHTML = ''
    })

    it('saveColorPreset command should save and emit event', () => {
      const { commands, mockEngine } = createMockEngine()
      registerColorPresetCommands(mockEngine)
      commands.saveColorPreset.execute(mockEngine, 'Test', ['#ff0000'])
      expect(mockEngine.eventBus.emit).toHaveBeenCalledWith('colorPresets:change', expect.any(Object))
      expect(loadColorPresets()).toHaveLength(1)
      document.body.innerHTML = ''
    })

    it('loadColorPresets command should return presets', () => {
      const { commands, mockEngine } = createMockEngine()
      registerColorPresetCommands(mockEngine)
      saveColorPreset('X', ['#abc'])
      const result = commands.loadColorPresets.execute(mockEngine)
      expect(result).toHaveLength(1)
      document.body.innerHTML = ''
    })
  })
})

// ==========================
// Typography Controls
// ==========================
describe('Typography Controls (fontControls.js)', () => {
  let commands, mockEngine

  beforeEach(() => {
    ;({ commands, mockEngine } = createMockEngine())
    registerFontCommands(mockEngine)
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('should register lineHeight command', () => {
    expect(commands.lineHeight).toBeDefined()
    expect(commands.lineHeight.meta.tooltip).toBe('Line Height')
  })

  it('should register letterSpacing command', () => {
    expect(commands.letterSpacing).toBeDefined()
    expect(commands.letterSpacing.meta.tooltip).toBe('Letter Spacing')
  })

  it('should register paragraphSpacing command', () => {
    expect(commands.paragraphSpacing).toBeDefined()
    expect(commands.paragraphSpacing.meta.tooltip).toBe('Paragraph Spacing')
  })

  it('lineHeight should not throw when no selection', () => {
    expect(() => commands.lineHeight.execute(mockEngine, '1.5')).not.toThrow()
  })

  it('letterSpacing should not throw when no selection', () => {
    expect(() => commands.letterSpacing.execute(mockEngine, '1px')).not.toThrow()
  })

  it('paragraphSpacing should not throw when no selection', () => {
    expect(() => commands.paragraphSpacing.execute(mockEngine, '16px')).not.toThrow()
  })

  it('lineHeight should do nothing with no value', () => {
    expect(() => commands.lineHeight.execute(mockEngine)).not.toThrow()
  })

  it('letterSpacing should do nothing with no value', () => {
    expect(() => commands.letterSpacing.execute(mockEngine)).not.toThrow()
  })
})
