import { KeyboardManager } from '../core/KeyboardManager.js'

// Mock platform detection
jest.mock('../utils/platform.js', () => ({
  isMac: jest.fn(() => true),
}))

import { isMac } from '../utils/platform.js'

describe('KeyboardManager', () => {
  let km
  let mockEngine
  let element

  beforeEach(() => {
    element = document.createElement('div')
    element.setAttribute('contenteditable', 'true')
    document.body.appendChild(element)

    mockEngine = {
      element,
      commands: {
        execute: jest.fn(),
      },
    }
    km = new KeyboardManager(mockEngine)
  })

  afterEach(() => {
    km.destroy()
    document.body.removeChild(element)
  })

  describe('register / unregister', () => {
    it('should register a shortcut', () => {
      km.register('mod+b', 'bold')
      expect(km._shortcuts.size).toBe(1)
    })

    it('should normalize shortcut keys', () => {
      km.register('Mod+Shift+B', 'boldShift')
      // Normalized to lowercase sorted: b+mod+shift
      expect(km._shortcuts.has('b+mod+shift')).toBe(true)
    })

    it('should unregister a shortcut', () => {
      km.register('mod+b', 'bold')
      km.unregister('mod+b')
      expect(km._shortcuts.size).toBe(0)
    })
  })

  describe('getShortcutForCommand', () => {
    it('should find shortcut for a command', () => {
      km.register('mod+b', 'bold')
      expect(km.getShortcutForCommand('bold')).toBe('b+mod')
    })

    it('should return null for unknown command', () => {
      expect(km.getShortcutForCommand('nonexistent')).toBeNull()
    })
  })

  describe('getShortcutLabel', () => {
    it('should return Mac labels when on Mac', () => {
      isMac.mockReturnValue(true)
      const label = km.getShortcutLabel('mod+b')
      expect(label).toBe('⌘B')
    })

    it('should return Windows labels when not on Mac', () => {
      isMac.mockReturnValue(false)
      const label = km.getShortcutLabel('mod+b')
      expect(label).toBe('Ctrl+B')
    })

    it('should handle shift modifier on Mac', () => {
      isMac.mockReturnValue(true)
      const label = km.getShortcutLabel('mod+shift+x')
      expect(label).toBe('⌘⇧X')
    })

    it('should handle alt modifier', () => {
      isMac.mockReturnValue(true)
      const label = km.getShortcutLabel('alt+p')
      expect(label).toBe('⌥P')
    })

    it('should return empty string for falsy input', () => {
      expect(km.getShortcutLabel('')).toBe('')
      expect(km.getShortcutLabel(null)).toBe('')
    })
  })

  describe('_handleKeyDown', () => {
    beforeEach(() => {
      isMac.mockReturnValue(true)
      km.init()
      km.register('mod+b', 'bold')
    })

    it('should execute command on matching shortcut', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'b',
        metaKey: true,
        bubbles: true,
        cancelable: true,
      })
      element.dispatchEvent(event)
      expect(mockEngine.commands.execute).toHaveBeenCalledWith('bold')
    })

    it('should not execute for non-matching shortcut', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'i',
        metaKey: true,
        bubbles: true,
        cancelable: true,
      })
      element.dispatchEvent(event)
      expect(mockEngine.commands.execute).not.toHaveBeenCalled()
    })

    it('should prevent default on matching shortcut', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'b',
        metaKey: true,
        bubbles: true,
        cancelable: true,
      })
      const preventSpy = jest.spyOn(event, 'preventDefault')
      element.dispatchEvent(event)
      expect(preventSpy).toHaveBeenCalled()
    })

    it('should use ctrlKey on non-Mac platforms', () => {
      isMac.mockReturnValue(false)
      // Re-init with non-Mac detection
      km.destroy()
      km = new KeyboardManager(mockEngine)
      km.init()
      km.register('mod+b', 'bold')

      const event = new KeyboardEvent('keydown', {
        key: 'b',
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      })
      element.dispatchEvent(event)
      expect(mockEngine.commands.execute).toHaveBeenCalledWith('bold')
    })

    it('should handle shift+mod combinations', () => {
      km.register('mod+shift+x', 'strikethrough')
      const event = new KeyboardEvent('keydown', {
        key: 'x',
        metaKey: true,
        shiftKey: true,
        bubbles: true,
        cancelable: true,
      })
      element.dispatchEvent(event)
      expect(mockEngine.commands.execute).toHaveBeenCalledWith('strikethrough')
    })
  })

  describe('init / destroy', () => {
    it('should add and remove keydown listener', () => {
      const addSpy = jest.spyOn(element, 'addEventListener')
      const removeSpy = jest.spyOn(element, 'removeEventListener')

      km.init()
      expect(addSpy).toHaveBeenCalledWith('keydown', expect.any(Function))

      km.destroy()
      expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
    })
  })
})
