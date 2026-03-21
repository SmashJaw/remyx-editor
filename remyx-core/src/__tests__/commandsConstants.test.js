import { vi } from 'vitest'
import {
  BUTTON_COMMANDS,
  TOOLTIP_MAP,
  SHORTCUT_MAP,
  MODAL_COMMANDS,
  getShortcutLabel,
  getCommandActiveState,
} from '../constants/commands.js'

// Mock isMac
vi.mock('../utils/platform.js', () => ({
  isMac: vi.fn(() => false),
}))

import { isMac } from '../utils/platform.js'

describe('BUTTON_COMMANDS', () => {
  it('should be a Set', () => {
    expect(BUTTON_COMMANDS instanceof Set).toBe(true)
  })

  it('should contain core formatting commands', () => {
    expect(BUTTON_COMMANDS.has('bold')).toBe(true)
    expect(BUTTON_COMMANDS.has('italic')).toBe(true)
    expect(BUTTON_COMMANDS.has('underline')).toBe(true)
    expect(BUTTON_COMMANDS.has('strikethrough')).toBe(true)
  })

  it('should contain layout commands', () => {
    expect(BUTTON_COMMANDS.has('fullscreen')).toBe(true)
    expect(BUTTON_COMMANDS.has('sourceMode')).toBe(true)
    expect(BUTTON_COMMANDS.has('distractionFree')).toBe(true)
    expect(BUTTON_COMMANDS.has('toggleSplitView')).toBe(true)
  })

  it('should contain plugin commands', () => {
    expect(BUTTON_COMMANDS.has('insertCallout')).toBe(true)
    expect(BUTTON_COMMANDS.has('insertMath')).toBe(true)
    expect(BUTTON_COMMANDS.has('toggleSpellcheck')).toBe(true)
  })
})

describe('TOOLTIP_MAP', () => {
  it('should be an object with string values', () => {
    expect(typeof TOOLTIP_MAP).toBe('object')
    for (const val of Object.values(TOOLTIP_MAP)) {
      expect(typeof val).toBe('string')
    }
  })

  it('should have tooltips for core commands', () => {
    expect(TOOLTIP_MAP.bold).toBe('Bold')
    expect(TOOLTIP_MAP.italic).toBe('Italic')
    expect(TOOLTIP_MAP.underline).toBe('Underline')
    expect(TOOLTIP_MAP.undo).toBe('Undo')
    expect(TOOLTIP_MAP.redo).toBe('Redo')
  })

  it('should have tooltips for plugin commands', () => {
    expect(TOOLTIP_MAP.insertCallout).toBe('Insert Callout')
    expect(TOOLTIP_MAP.insertMath).toBe('Insert Math')
    expect(TOOLTIP_MAP.toggleSpellcheck).toBe('Toggle Spellcheck')
  })
})

describe('SHORTCUT_MAP', () => {
  it('should have shortcuts for common commands', () => {
    expect(SHORTCUT_MAP.bold).toBe('mod+B')
    expect(SHORTCUT_MAP.italic).toBe('mod+I')
    expect(SHORTCUT_MAP.underline).toBe('mod+U')
    expect(SHORTCUT_MAP.undo).toBe('mod+Z')
    expect(SHORTCUT_MAP.redo).toBe('mod+Shift+Z')
  })
})

describe('MODAL_COMMANDS', () => {
  it('should map commands to modal names', () => {
    expect(MODAL_COMMANDS.link).toBe('link')
    expect(MODAL_COMMANDS.image).toBe('image')
    expect(MODAL_COMMANDS.table).toBe('table')
    expect(MODAL_COMMANDS.export).toBe('export')
    expect(MODAL_COMMANDS.findReplace).toBe('findReplace')
    expect(MODAL_COMMANDS.embedMedia).toBe('embed')
    expect(MODAL_COMMANDS.importDocument).toBe('importDocument')
    expect(MODAL_COMMANDS.attachment).toBe('attachment')
  })
})

describe('getShortcutLabel', () => {
  it('should return empty string for unknown command', () => {
    expect(getShortcutLabel('nonexistent')).toBe('')
  })

  it('should replace mod with Ctrl on non-Mac', () => {
    isMac.mockReturnValue(false)
    expect(getShortcutLabel('bold')).toBe('Ctrl+B')
  })

  it('should replace mod with command symbol on Mac', () => {
    isMac.mockReturnValue(true)
    const label = getShortcutLabel('bold')
    expect(label).toContain('B')
    // Should contain Mac command symbol
    expect(label).toContain('\u2318')
  })

  it('should handle shortcuts with Shift', () => {
    isMac.mockReturnValue(false)
    expect(getShortcutLabel('redo')).toBe('Ctrl+Shift+Z')
  })

  it('should handle strikethrough shortcut', () => {
    isMac.mockReturnValue(false)
    expect(getShortcutLabel('strikethrough')).toBe('Ctrl+Shift+X')
  })
})

describe('getCommandActiveState', () => {
  const selectionState = {
    bold: true,
    italic: false,
    underline: true,
    strikethrough: false,
    subscript: true,
    superscript: false,
    alignment: 'center',
    orderedList: false,
    unorderedList: true,
    blockquote: false,
    codeBlock: true,
  }

  it('should return bold state', () => {
    expect(getCommandActiveState('bold', selectionState)).toBe(true)
  })

  it('should return italic state', () => {
    expect(getCommandActiveState('italic', selectionState)).toBe(false)
  })

  it('should return underline state', () => {
    expect(getCommandActiveState('underline', selectionState)).toBe(true)
  })

  it('should return strikethrough state', () => {
    expect(getCommandActiveState('strikethrough', selectionState)).toBe(false)
  })

  it('should return subscript state', () => {
    expect(getCommandActiveState('subscript', selectionState)).toBe(true)
  })

  it('should return superscript state', () => {
    expect(getCommandActiveState('superscript', selectionState)).toBe(false)
  })

  it('should return correct alignment states', () => {
    expect(getCommandActiveState('alignLeft', selectionState)).toBe(false)
    expect(getCommandActiveState('alignCenter', selectionState)).toBe(true)
    expect(getCommandActiveState('alignRight', selectionState)).toBe(false)
    expect(getCommandActiveState('alignJustify', selectionState)).toBe(false)
  })

  it('should return list states', () => {
    expect(getCommandActiveState('orderedList', selectionState)).toBe(false)
    expect(getCommandActiveState('unorderedList', selectionState)).toBe(true)
  })

  it('should return blockquote state', () => {
    expect(getCommandActiveState('blockquote', selectionState)).toBe(false)
  })

  it('should return codeBlock state', () => {
    expect(getCommandActiveState('codeBlock', selectionState)).toBe(true)
  })

  it('should return sourceMode from engine', () => {
    expect(getCommandActiveState('sourceMode', selectionState, { isSourceMode: true })).toBe(true)
    expect(getCommandActiveState('sourceMode', selectionState, { isSourceMode: false })).toBe(false)
  })

  it('should return toggleMarkdown from engine', () => {
    expect(getCommandActiveState('toggleMarkdown', selectionState, { isMarkdownMode: true })).toBe(true)
    expect(getCommandActiveState('toggleMarkdown', selectionState, { isMarkdownMode: false })).toBe(false)
  })

  it('should return fullscreen state from DOM', () => {
    const editorDiv = document.createElement('div')
    editorDiv.className = 'rmx-editor rmx-fullscreen'
    document.body.appendChild(editorDiv)
    const el = document.createElement('div')
    editorDiv.appendChild(el)
    const engine = { element: el }

    expect(getCommandActiveState('fullscreen', selectionState, engine)).toBe(true)
    editorDiv.classList.remove('rmx-fullscreen')
    expect(getCommandActiveState('fullscreen', selectionState, engine)).toBe(false)
    editorDiv.remove()
  })

  it('should return distractionFree state from DOM', () => {
    const editorDiv = document.createElement('div')
    editorDiv.className = 'rmx-editor rmx-distraction-free'
    document.body.appendChild(editorDiv)
    const el = document.createElement('div')
    editorDiv.appendChild(el)
    const engine = { element: el }

    expect(getCommandActiveState('distractionFree', selectionState, engine)).toBe(true)
    editorDiv.remove()
  })

  it('should return toggleSplitView state from DOM', () => {
    const editorDiv = document.createElement('div')
    editorDiv.className = 'rmx-editor rmx-split-view'
    document.body.appendChild(editorDiv)
    const el = document.createElement('div')
    editorDiv.appendChild(el)
    const engine = { element: el }

    expect(getCommandActiveState('toggleSplitView', selectionState, engine)).toBe(true)
    editorDiv.remove()
  })

  it('should return false for unknown command', () => {
    expect(getCommandActiveState('nonexistent', selectionState)).toBe(false)
  })

  it('should handle null/undefined engine gracefully', () => {
    expect(getCommandActiveState('sourceMode', selectionState, null)).toBe(undefined)
    expect(getCommandActiveState('fullscreen', selectionState, null)).toBe(undefined)
  })
})
