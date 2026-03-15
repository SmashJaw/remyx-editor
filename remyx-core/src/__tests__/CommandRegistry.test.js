import { describe, it, expect, beforeEach, vi } from 'vitest'
import { CommandRegistry } from '../core/CommandRegistry.js'

describe('CommandRegistry', () => {
  let registry
  let mockEngine

  beforeEach(() => {
    mockEngine = {
      keyboard: { register: vi.fn() },
      history: { snapshot: vi.fn() },
      eventBus: { emit: vi.fn() },
    }
    registry = new CommandRegistry(mockEngine)
  })

  describe('register', () => {
    it('should register a command', () => {
      registry.register('bold', {
        execute: vi.fn(),
      })
      expect(registry.has('bold')).toBe(true)
    })

    it('should store command with default isActive and isEnabled', () => {
      registry.register('bold', {
        execute: vi.fn(),
      })
      const cmd = registry.get('bold')
      expect(cmd.isActive(mockEngine)).toBe(false)
      expect(cmd.isEnabled(mockEngine)).toBe(true)
    })

    it('should register keyboard shortcut if provided', () => {
      registry.register('bold', {
        execute: vi.fn(),
        shortcut: 'mod+b',
      })
      expect(mockEngine.keyboard.register).toHaveBeenCalledWith('mod+b', 'bold')
    })

    it('should not register keyboard shortcut if not provided', () => {
      registry.register('bold', {
        execute: vi.fn(),
      })
      expect(mockEngine.keyboard.register).not.toHaveBeenCalled()
    })

    it('should store meta information', () => {
      registry.register('bold', {
        execute: vi.fn(),
        meta: { icon: 'bold', tooltip: 'Bold' },
      })
      const cmd = registry.get('bold')
      expect(cmd.meta).toEqual({ icon: 'bold', tooltip: 'Bold' })
    })
  })

  describe('execute', () => {
    it('should execute a registered command', () => {
      const executeFn = vi.fn()
      registry.register('bold', { execute: executeFn })
      registry.execute('bold')
      expect(executeFn).toHaveBeenCalledWith(mockEngine)
    })

    it('should take a snapshot before executing', () => {
      const executeFn = vi.fn()
      registry.register('bold', { execute: executeFn })
      registry.execute('bold')
      expect(mockEngine.history.snapshot).toHaveBeenCalled()
    })

    it('should emit command:executed and content:change events', () => {
      const executeFn = vi.fn().mockReturnValue(true)
      registry.register('bold', { execute: executeFn })
      registry.execute('bold')
      expect(mockEngine.eventBus.emit).toHaveBeenCalledWith('command:executed', {
        name: 'bold',
        args: [],
        result: true,
      })
      expect(mockEngine.eventBus.emit).toHaveBeenCalledWith('content:change')
    })

    it('should pass extra arguments to the execute function', () => {
      const executeFn = vi.fn()
      registry.register('setColor', { execute: executeFn })
      registry.execute('setColor', '#ff0000')
      expect(executeFn).toHaveBeenCalledWith(mockEngine, '#ff0000')
    })

    it('should return false for non-existent commands', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const result = registry.execute('nonexistent')
      expect(result).toBe(false)
      consoleSpy.mockRestore()
    })

    it('should not execute disabled commands', () => {
      const executeFn = vi.fn()
      registry.register('bold', {
        execute: executeFn,
        isEnabled: () => false,
      })
      const result = registry.execute('bold')
      expect(result).toBe(false)
      expect(executeFn).not.toHaveBeenCalled()
    })
  })

  describe('isActive', () => {
    it('should return false for non-existent command', () => {
      expect(registry.isActive('nonexistent')).toBe(false)
    })

    it('should call the command isActive function', () => {
      const isActiveFn = vi.fn().mockReturnValue(true)
      registry.register('bold', {
        execute: vi.fn(),
        isActive: isActiveFn,
      })
      expect(registry.isActive('bold')).toBe(true)
      expect(isActiveFn).toHaveBeenCalledWith(mockEngine)
    })
  })

  describe('isEnabled', () => {
    it('should return false for non-existent command', () => {
      expect(registry.isEnabled('nonexistent')).toBe(false)
    })

    it('should call the command isEnabled function', () => {
      const isEnabledFn = vi.fn().mockReturnValue(false)
      registry.register('bold', {
        execute: vi.fn(),
        isEnabled: isEnabledFn,
      })
      expect(registry.isEnabled('bold')).toBe(false)
    })
  })

  describe('has', () => {
    it('should return true for registered commands', () => {
      registry.register('bold', { execute: vi.fn() })
      expect(registry.has('bold')).toBe(true)
    })

    it('should return false for unregistered commands', () => {
      expect(registry.has('nonexistent')).toBe(false)
    })
  })

  describe('get', () => {
    it('should return the command object', () => {
      const executeFn = vi.fn()
      registry.register('bold', { execute: executeFn })
      const cmd = registry.get('bold')
      expect(cmd.name).toBe('bold')
      expect(cmd.execute).toBe(executeFn)
    })

    it('should return undefined for non-existent commands', () => {
      expect(registry.get('nonexistent')).toBeUndefined()
    })
  })

  describe('getAll', () => {
    it('should return all registered command names', () => {
      registry.register('bold', { execute: vi.fn() })
      registry.register('italic', { execute: vi.fn() })
      const all = registry.getAll()
      expect(all).toContain('bold')
      expect(all).toContain('italic')
      expect(all).toHaveLength(2)
    })

    it('should return an empty array when no commands are registered', () => {
      expect(registry.getAll()).toEqual([])
    })
  })
})
