/**
 * Creates a restricted API facade for plugins.
 * Plugins receive this facade instead of the full engine reference,
 * limiting what they can access to prevent accidental or malicious
 * bypass of sanitization, history corruption, or content exfiltration.
 *
 * @param {Object} engine - The full editor engine
 * @returns {Object} A restricted API surface
 */
function createPluginAPI(engine) {
  return {
    /** The editor DOM element (read-only access) */
    get element() { return engine.element },

    /** Execute a registered command by name */
    executeCommand(name, ...args) { return engine.commands.execute(name, ...args) },

    /** Subscribe to an editor event */
    on(event, handler) { return engine.eventBus.on(event, handler) },

    /** Unsubscribe from an editor event */
    off(event, handler) { engine.eventBus.off(event, handler) },

    /** Get the current selection range */
    getSelection() { return engine.selection.getSelection() },

    /** Get the current selection range object */
    getRange() { return engine.selection.getRange() },

    /** Get current active formats */
    getActiveFormats() { return engine.selection.getActiveFormats() },

    /** Get sanitized HTML content */
    getHTML() { return engine.getHTML() },

    /** Get plain text content */
    getText() { return engine.getText() },

    /** Check if editor is empty */
    isEmpty() { return engine.isEmpty() },

    /** Editor options (read-only copy) */
    get options() { return { ...engine.options } },
  }
}

/**
 * Manages editor plugins.
 *
 * **Security notice:** Plugins receive a restricted API facade by default,
 * which limits access to safe operations (executing commands, subscribing
 * to events, reading content). The full engine reference is NOT exposed.
 *
 * If a plugin requires full engine access (e.g., built-in plugins), it can
 * declare `requiresFullAccess: true` in its definition — but third-party
 * plugins should be audited before granting this level of access.
 */
export class PluginManager {
  constructor(engine) {
    this.engine = engine
    this._plugins = new Map()
    this._pluginAPI = createPluginAPI(engine)
  }

  register(plugin) {
    if (!plugin || !plugin.name) {
      console.warn('Plugin must have a name')
      return
    }
    if (this._plugins.has(plugin.name)) {
      console.warn(`Plugin "${plugin.name}" already registered`)
      return
    }
    this._plugins.set(plugin.name, plugin)

    // Register any commands the plugin provides
    if (plugin.commands) {
      plugin.commands.forEach((cmd) => {
        this.engine.commands.register(cmd.name, cmd)
      })
    }

    this.engine.eventBus.emit('plugin:registered', { name: plugin.name })
  }

  initAll() {
    this._plugins.forEach((plugin) => {
      try {
        if (plugin.init) {
          // Built-in or trusted plugins get full engine access;
          // third-party plugins get the restricted API facade
          const api = plugin.requiresFullAccess ? this.engine : this._pluginAPI
          plugin.init(api)
        }
      } catch (err) {
        console.error(`Error initializing plugin "${plugin.name}":`, err)
      }
    })
  }

  destroyAll() {
    this._plugins.forEach((plugin) => {
      try {
        if (plugin.destroy) {
          const api = plugin.requiresFullAccess ? this.engine : this._pluginAPI
          plugin.destroy(api)
        }
      } catch (err) {
        console.error(`Error destroying plugin "${plugin.name}":`, err)
      }
    })
    this._plugins.clear()
  }

  get(name) {
    return this._plugins.get(name)
  }

  getAll() {
    return Array.from(this._plugins.values())
  }

  has(name) {
    return this._plugins.has(name)
  }
}
