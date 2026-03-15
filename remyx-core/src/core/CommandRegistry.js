/**
 * @typedef {Object} CommandDefinition
 * @property {Function} execute - The function to run when the command is executed, receives (engine, ...args)
 * @property {Function} [isActive] - Returns true if the command's effect is currently active, receives (engine)
 * @property {Function} [isEnabled] - Returns true if the command can be executed, receives (engine)
 * @property {string|null} [shortcut] - Keyboard shortcut string (e.g., 'Ctrl+B')
 * @property {Object} [meta] - Arbitrary metadata for the command
 */

/**
 * @typedef {Object} RegisteredCommand
 * @property {string} name - The command name
 * @property {Function} execute - The execute function
 * @property {Function} isActive - Returns whether the command is currently active
 * @property {Function} isEnabled - Returns whether the command is enabled
 * @property {string|null} shortcut - The keyboard shortcut, or null
 * @property {Object} meta - Arbitrary metadata
 */

/**
 * Registry for editor commands. Commands are named operations that can be
 * executed, queried for active/enabled state, and optionally bound to keyboard shortcuts.
 */
export class CommandRegistry {
  /**
   * Creates a new CommandRegistry.
   * @param {import('./EditorEngine.js').EditorEngine} engine - The editor engine instance
   */
  constructor(engine) {
    this.engine = engine
    this._commands = new Map()
  }

  /**
   * Registers a command with the given name. If the command defines a shortcut,
   * it is also registered with the keyboard manager.
   * @param {string} name - Unique name for the command
   * @param {CommandDefinition} command - The command definition
   * @returns {void}
   */
  register(name, command) {
    this._commands.set(name, {
      name,
      execute: command.execute,
      isActive: command.isActive || (() => false),
      isEnabled: command.isEnabled || (() => true),
      shortcut: command.shortcut || null,
      meta: command.meta || {},
    })

    if (command.shortcut) {
      this.engine.keyboard.register(command.shortcut, name)
    }
  }

  /**
   * Executes a registered command by name. Takes a history snapshot before
   * execution and emits command:executed and content:change events.
   * @param {string} name - The name of the command to execute
   * @param {...*} args - Additional arguments passed to the command's execute function
   * @returns {*} The result of the command's execute function, or false if the command is not found or disabled
   */
  execute(name, ...args) {
    const command = this._commands.get(name)
    if (!command) {
      console.warn(`Command "${name}" not found`)
      return false
    }
    if (!command.isEnabled(this.engine)) {
      return false
    }

    this.engine.history.snapshot()
    const result = command.execute(this.engine, ...args)
    this.engine.eventBus.emit('command:executed', { name, args, result })
    this.engine.eventBus.emit('content:change')
    return result
  }

  /**
   * Checks whether a command is currently in an active state (e.g., bold is active when text is bold).
   * @param {string} name - The command name
   * @returns {boolean} True if the command exists and is active
   */
  isActive(name) {
    const command = this._commands.get(name)
    if (!command) return false
    return command.isActive(this.engine)
  }

  /**
   * Checks whether a command is currently enabled and can be executed.
   * @param {string} name - The command name
   * @returns {boolean} True if the command exists and is enabled
   */
  isEnabled(name) {
    const command = this._commands.get(name)
    if (!command) return false
    return command.isEnabled(this.engine)
  }

  /**
   * Returns the registered command object for the given name.
   * @param {string} name - The command name
   * @returns {RegisteredCommand|undefined} The command object, or undefined if not found
   */
  get(name) {
    return this._commands.get(name)
  }

  /**
   * Returns an array of all registered command names.
   * @returns {string[]} Array of command names
   */
  getAll() {
    return Array.from(this._commands.keys())
  }

  /**
   * Checks whether a command with the given name is registered.
   * @param {string} name - The command name
   * @returns {boolean} True if the command exists
   */
  has(name) {
    return this._commands.has(name)
  }
}
