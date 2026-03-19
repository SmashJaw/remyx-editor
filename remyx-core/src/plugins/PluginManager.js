/**
 * @typedef {Object} PluginAPI
 * @property {HTMLElement} element - The editor DOM element (read-only)
 * @property {Function} executeCommand - Execute a registered command by name
 * @property {Function} on - Subscribe to an editor event
 * @property {Function} off - Unsubscribe from an editor event
 * @property {Function} getSelection - Get the current window Selection
 * @property {Function} getRange - Get the current selection Range
 * @property {Function} getActiveFormats - Get current active formatting states
 * @property {Function} getHTML - Get sanitized HTML content
 * @property {Function} getText - Get plain text content
 * @property {Function} isEmpty - Check if editor is empty
 * @property {Object} options - Editor options (read-only copy)
 */

/**
 * @typedef {Object} PluginDefinition
 * @property {string} name - Unique plugin name
 * @property {boolean} [requiresFullAccess=false] - If true, receives full engine instead of restricted API
 * @property {boolean} [lazy=false] - If true, plugin is not initialized in initAll() but on first use
 * @property {Function} [init] - Initialization function, receives the plugin API or full engine
 * @property {Function} [destroy] - Cleanup function, receives the plugin API or full engine
 * @property {Array<import('../core/CommandRegistry.js').CommandDefinition>} [commands] - Commands to register
 * @property {Array} [toolbarItems] - Toolbar item definitions
 * @property {Array} [statusBarItems] - Status bar item definitions
 * @property {Array} [contextMenuItems] - Context menu item definitions
 */

/**
 * Creates a restricted API facade for plugins.
 * Plugins receive this facade instead of the full engine reference,
 * limiting what they can access to prevent accidental or malicious
 * bypass of sanitization, history corruption, or content exfiltration.
 *
 * @param {import('../core/EditorEngine.js').EditorEngine} engine - The full editor engine
 * @returns {PluginAPI} A restricted API surface
 */
function createPluginAPI(engine) {
  return {
    /** The editor DOM element (read-only access) */
    get element() { return engine.element },

    /**
     * Execute a registered command by name.
     * @param {string} name - The command name
     * @param {...*} args - Additional arguments for the command
     * @returns {*} The command result
     */
    executeCommand(name, ...args) { return engine.commands.execute(name, ...args) },

    /**
     * Subscribe to an editor event.
     * @param {string} event - The event name
     * @param {Function} handler - The event handler
     * @returns {Function} An unsubscribe function
     */
    on(event, handler) { return engine.eventBus.on(event, handler) },

    /**
     * Unsubscribe from an editor event.
     * @param {string} event - The event name
     * @param {Function} handler - The handler to remove
     * @returns {void}
     */
    off(event, handler) { engine.eventBus.off(event, handler) },

    /**
     * Get the current window Selection object.
     * @returns {globalThis.Selection} The browser Selection
     */
    getSelection() { return engine.selection.getSelection() },

    /**
     * Get the current selection Range within the editor.
     * @returns {Range|null} The current range, or null
     */
    getRange() { return engine.selection.getRange() },

    /**
     * Get current active formatting states at the selection.
     * @returns {import('../core/Selection.js').ActiveFormats} Active format states
     */
    getActiveFormats() { return engine.selection.getActiveFormats() },

    /**
     * Get sanitized HTML content of the editor.
     * @returns {string} The sanitized HTML
     */
    getHTML() { return engine.getHTML() },

    /**
     * Get plain text content of the editor.
     * @returns {string} The text content
     */
    getText() { return engine.getText() },

    /**
     * Check if the editor content is empty.
     * @returns {boolean} True if empty
     */
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
 *
 * **Lazy loading:** Plugins can declare `lazy: true` to defer initialization
 * until first use. Lazy plugins are registered and their commands are
 * available, but init() is not called until the plugin is explicitly
 * activated or one of its commands is executed.
 */
export class PluginManager {
  /**
   * Creates a new PluginManager.
   * @param {import('../core/EditorEngine.js').EditorEngine} engine - The editor engine instance
   */
  constructor(engine) {
    this.engine = engine
    this._plugins = new Map()
    this._pluginAPI = createPluginAPI(engine)
    /** @private Set of plugin names that have been initialized */
    this._initialized = new Set()
    /** @private Map of command name -> plugin name for lazy activation */
    this._commandPluginMap = new Map()
  }

  /**
   * Registers a plugin and its commands. Does nothing if the plugin has no
   * name or is already registered.
   *
   * For lazy plugins, commands are wrapped to trigger plugin initialization
   * on first execution.
   *
   * @param {PluginDefinition} plugin - The plugin definition to register
   * @returns {void}
   */
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
        if (plugin.lazy) {
          // Track which plugin owns this command for lazy activation
          this._commandPluginMap.set(cmd.name, plugin.name)

          // Wrap the command execute to auto-init the plugin on first use
          const originalExecute = cmd.execute
          const self = this
          const wrappedCmd = {
            ...cmd,
            execute(...args) {
              self.activatePlugin(plugin.name)
              // After activation, re-register with original execute
              // so subsequent calls skip the wrapper
              self.engine.commands.register(cmd.name, { ...cmd, execute: originalExecute })
              return originalExecute.apply(this, args)
            }
          }
          this.engine.commands.register(cmd.name, wrappedCmd)
        } else {
          this.engine.commands.register(cmd.name, cmd)
        }
      })
    }

    this.engine.eventBus.emit('plugin:registered', { name: plugin.name })
  }

  /**
   * Initializes a single plugin by calling its init function.
   * Trusted plugins (requiresFullAccess) receive the full engine;
   * others receive the restricted API facade.
   *
   * @private
   * @param {PluginDefinition} plugin - The plugin to initialize
   * @returns {void}
   */
  _initPlugin(plugin) {
    if (this._initialized.has(plugin.name)) return

    try {
      if (plugin.init) {
        // Built-in or trusted plugins get full engine access;
        // third-party plugins get the restricted API facade
        const api = plugin.requiresFullAccess ? this.engine : this._pluginAPI
        plugin.init(api)
      }
      this._initialized.add(plugin.name)
      this.engine.eventBus.emit('plugin:initialized', { name: plugin.name })
    } catch (err) {
      console.error(`Error initializing plugin "${plugin.name}":`, err)
      this.engine.eventBus.emit('plugin:error', { name: plugin.name, error: err })
    }
  }

  /**
   * Activates a lazy plugin by initializing it. Has no effect if the plugin
   * is already initialized or does not exist.
   *
   * @param {string} name - The plugin name to activate
   * @returns {void}
   */
  activatePlugin(name) {
    const plugin = this._plugins.get(name)
    if (!plugin) {
      console.warn(`Plugin "${name}" not found`)
      return
    }
    if (this._initialized.has(name)) return

    this._initPlugin(plugin)
  }

  /**
   * Initializes all registered plugins by calling their init functions.
   * Lazy plugins are skipped and will be initialized on first use.
   * Trusted plugins (requiresFullAccess) receive the full engine;
   * others receive the restricted API facade. Errors are caught, logged,
   * and emitted as plugin:error events.
   * @returns {void}
   */
  initAll() {
    this._plugins.forEach((plugin) => {
      // Skip lazy plugins — they init on first use
      if (plugin.lazy) return
      this._initPlugin(plugin)
    })
  }

  /**
   * Destroys all registered plugins by calling their destroy functions,
   * then clears the plugin map. Errors are caught, logged, and emitted
   * as plugin:error events.
   * @returns {void}
   */
  destroyAll() {
    this._plugins.forEach((plugin) => {
      try {
        // For lazy plugins, only call destroy if they were initialized.
        // For non-lazy plugins, always call destroy (original behavior).
        const shouldDestroy = plugin.lazy
          ? this._initialized.has(plugin.name)
          : true
        if (shouldDestroy && plugin.destroy) {
          const api = plugin.requiresFullAccess ? this.engine : this._pluginAPI
          plugin.destroy(api)
        }
      } catch (err) {
        console.error(`Error destroying plugin "${plugin.name}":`, err)
        this.engine.eventBus.emit('plugin:error', { name: plugin.name, error: err })
      }
    })
    this._plugins.clear()
    this._initialized.clear()
    this._commandPluginMap.clear()
  }

  /**
   * Returns a registered plugin by name.
   * @param {string} name - The plugin name
   * @returns {PluginDefinition|undefined} The plugin definition, or undefined if not found
   */
  get(name) {
    return this._plugins.get(name)
  }

  /**
   * Returns all registered plugins as an array.
   * @returns {PluginDefinition[]} Array of all registered plugin definitions
   */
  getAll() {
    return Array.from(this._plugins.values())
  }

  /**
   * Checks whether a plugin with the given name is registered.
   * @param {string} name - The plugin name
   * @returns {boolean} True if the plugin is registered
   */
  has(name) {
    return this._plugins.has(name)
  }

  /**
   * Checks whether a plugin has been initialized.
   * @param {string} name - The plugin name
   * @returns {boolean} True if the plugin has been initialized
   */
  isInitialized(name) {
    return this._initialized.has(name)
  }
}
