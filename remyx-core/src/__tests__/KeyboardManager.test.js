import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { KeyboardManager } from '../core/KeyboardManager.js'

// Mock the platform module so we can control isMac()
vi.mock('../utils/platform.js', () => ({
  isMac: vi.fn(() => false),
}))

import { isMac } from '../utils/platform.js'

describe('KeyboardManager', () => {
  let km
  let mockEngine
  let element

  beforeEach(() => {
    element = document.createElement('div')
    mockEngine = {
      element,
      commands: { execute: vi.fn() },
      eventBus: { emit: vi.fn() },
    }
    km = new KeyboardManager(mockEngine)
    isMac.mockReturnValue(false)
  })

  afterEach(() => {
    km.destroy()
  })

  describe('constructor', () => {
    it('should store the engine reference', () => {
      expect(km.engine).toBe(mockEngine)
    })

    it('should initialize an empty shortcuts map', () => {
      expect(km._shortcuts.size).toBe(0)
    })
  })

  describe('init', () => {
    it('should add a keydown event listener to the element', () => {
      const spy = vi.spyOn(element, 'addEventListener')
      km.init()
      expect(spy).toHaveBeenCalledWith('keydown', km._handleKeyDown)
    })
  })

  describe('destroy', () => {
    it('should remove the keydown event listener from the element', () => {
      km.init()
      const spy = vi.spyOn(element, 'removeEventListener')
      km.destroy()
      expect(spy).toHaveBeenCalledWith('keydown', km._handleKeyDown)
    })

    it('should not throw if called without init', () => {
      expect(() => km.destroy()).not.toThrow()
    })
  })

  describe('register', () => {
    it('should register a shortcut mapping to a command name', () => {
      km.register('mod+b', 'bold')
      expect(km._shortcuts.has('b+mod')).toBe(true)
      expect(km._shortcuts.get('b+mod')).toBe('bold')
    })

    it('should normalize the shortcut before storing', () => {
      km.register('Mod+Shift+B', 'bold')
      // normalized: b+mod+shift (lowercase, sorted)
      expect(km._shortcuts.has('b+mod+shift')).toBe(true)
    })

    it('should overwrite an existing shortcut with the same normalized key', () => {
      km.register('mod+b', 'bold')
      km.register('mod+b', 'strong')
      expect(km._shortcuts.get('b+mod')).toBe('strong')
    })

    it('should allow multiple different shortcuts', () => {
      km.register('mod+b', 'bold')
      km.register('mod+i', 'italic')
      expect(km._shortcuts.size).toBe(2)
    })
  })

  describe('unregister', () => {
    it('should remove a registered shortcut', () => {
      km.register('mod+b', 'bold')
      km.unregister('mod+b')
      expect(km._shortcuts.has('b+mod')).toBe(false)
    })

    it('should not throw when unregistering a non-existent shortcut', () => {
      expect(() => km.unregister('mod+x')).not.toThrow()
    })

    it('should normalize the shortcut for removal', () => {
      km.register('mod+b', 'bold')
      km.unregister('B+Mod')
      expect(km._shortcuts.size).toBe(0)
    })
  })

  describe('getShortcutForCommand', () => {
    it('should return the shortcut string for a registered command', () => {
      km.register('mod+b', 'bold')
      expect(km.getShortcutForCommand('bold')).toBe('b+mod')
    })

    it('should return null if the command is not registered', () => {
      expect(km.getShortcutForCommand('nonexistent')).toBeNull()
    })

    it('should return the first matching shortcut if multiple commands exist', () => {
      km.register('mod+b', 'bold')
      km.register('mod+i', 'italic')
      expect(km.getShortcutForCommand('italic')).toBe('i+mod')
    })
  })

  describe('getShortcutLabel', () => {
    it('should return empty string for falsy input', () => {
      expect(km.getShortcutLabel(null)).toBe('')
      expect(km.getShortcutLabel('')).toBe('')
      expect(km.getShortcutLabel(undefined)).toBe('')
    })

    it('should convert mod to Ctrl on non-Mac', () => {
      isMac.mockReturnValue(false)
      expect(km.getShortcutLabel('mod+b')).toBe('Ctrl+B')
    })

    it('should convert mod to command symbol on Mac', () => {
      isMac.mockReturnValue(true)
      expect(km.getShortcutLabel('mod+b')).toBe('⌘B')
    })

    it('should convert shift on non-Mac', () => {
      isMac.mockReturnValue(false)
      expect(km.getShortcutLabel('mod+shift+b')).toBe('Ctrl+Shift+B')
    })

    it('should convert shift on Mac', () => {
      isMac.mockReturnValue(true)
      expect(km.getShortcutLabel('mod+shift+b')).toBe('⌘⇧B')
    })

    it('should convert alt on non-Mac', () => {
      isMac.mockReturnValue(false)
      expect(km.getShortcutLabel('alt+b')).toBe('Alt+B')
    })

    it('should convert alt on Mac', () => {
      isMac.mockReturnValue(true)
      expect(km.getShortcutLabel('alt+b')).toBe('⌥B')
    })
  })

  describe('_normalizeShortcut', () => {
    it('should lowercase and sort parts', () => {
      expect(km._normalizeShortcut('Mod+Shift+B')).toBe('b+mod+shift')
    })

    it('should handle single keys', () => {
      expect(km._normalizeShortcut('Enter')).toBe('enter')
    })

    it('should produce consistent output regardless of input order', () => {
      expect(km._normalizeShortcut('shift+mod+b')).toBe(km._normalizeShortcut('b+mod+shift'))
    })
  })

  describe('_handleKeyDown', () => {
    beforeEach(() => {
      km.init()
    })

    it('should execute a matching command when shortcut is pressed', () => {
      km.register('mod+b', 'bold')
      const event = new KeyboardEvent('keydown', {
        key: 'b',
        ctrlKey: true,
        bubbles: true,
      })
      element.dispatchEvent(event)
      expect(mockEngine.commands.execute).toHaveBeenCalledWith('bold')
    })

    it('should preventDefault and stopPropagation for matching shortcuts', () => {
      km.register('mod+b', 'bold')
      const event = new KeyboardEvent('keydown', {
        key: 'b',
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      })
      const preventSpy = vi.spyOn(event, 'preventDefault')
      const stopSpy = vi.spyOn(event, 'stopPropagation')
      element.dispatchEvent(event)
      expect(preventSpy).toHaveBeenCalled()
      expect(stopSpy).toHaveBeenCalled()
    })

    it('should not execute anything for non-matching shortcuts', () => {
      km.register('mod+b', 'bold')
      const event = new KeyboardEvent('keydown', {
        key: 'i',
        ctrlKey: true,
        bubbles: true,
      })
      element.dispatchEvent(event)
      expect(mockEngine.commands.execute).not.toHaveBeenCalled()
    })

    it('should handle shift modifier in shortcuts', () => {
      km.register('mod+shift+z', 'redo')
      const event = new KeyboardEvent('keydown', {
        key: 'z',
        ctrlKey: true,
        shiftKey: true,
        bubbles: true,
      })
      element.dispatchEvent(event)
      expect(mockEngine.commands.execute).toHaveBeenCalledWith('redo')
    })

    it('should handle alt modifier in shortcuts', () => {
      km.register('alt+1', 'heading1')
      const event = new KeyboardEvent('keydown', {
        key: '1',
        altKey: true,
        bubbles: true,
      })
      element.dispatchEvent(event)
      expect(mockEngine.commands.execute).toHaveBeenCalledWith('heading1')
    })

    it('should use metaKey on Mac', () => {
      isMac.mockReturnValue(true)
      km.register('mod+b', 'bold')
      const event = new KeyboardEvent('keydown', {
        key: 'b',
        metaKey: true,
        bubbles: true,
      })
      element.dispatchEvent(event)
      expect(mockEngine.commands.execute).toHaveBeenCalledWith('bold')
    })

    it('should ignore standalone modifier key presses', () => {
      km.register('mod+b', 'bold')
      const event = new KeyboardEvent('keydown', {
        key: 'Control',
        ctrlKey: true,
        bubbles: true,
      })
      element.dispatchEvent(event)
      expect(mockEngine.commands.execute).not.toHaveBeenCalled()
    })

    it('should ignore Meta key press alone', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'Meta',
        metaKey: true,
        bubbles: true,
      })
      element.dispatchEvent(event)
      expect(mockEngine.commands.execute).not.toHaveBeenCalled()
    })

    it('should ignore Shift key press alone', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'Shift',
        shiftKey: true,
        bubbles: true,
      })
      element.dispatchEvent(event)
      expect(mockEngine.commands.execute).not.toHaveBeenCalled()
    })

    it('should ignore Alt key press alone', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'Alt',
        altKey: true,
        bubbles: true,
      })
      element.dispatchEvent(event)
      expect(mockEngine.commands.execute).not.toHaveBeenCalled()
    })

    it('should not fire after destroy is called', () => {
      km.register('mod+b', 'bold')
      km.destroy()
      const event = new KeyboardEvent('keydown', {
        key: 'b',
        ctrlKey: true,
        bubbles: true,
      })
      element.dispatchEvent(event)
      expect(mockEngine.commands.execute).not.toHaveBeenCalled()
    })
  })
})
