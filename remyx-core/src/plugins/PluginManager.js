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
 * @property {Function} getSetting - Get a plugin-scoped setting value
 * @property {Function} setSetting - Set a plugin-scoped setting value
 */

/**
 * @typedef {Object} PluginDefinition
 * @property {string} name - Unique plugin name
 * @property {string} [version='0.0.0'] - Plugin version
 * @property {string} [description=''] - Human-readable description
 * @property {string} [author=''] - Author
 * @property {string[]} [dependencies=[]] - Plugin names this plugin depends on
 * @property {boolean} [requiresFullAccess=false] - If true, receives full engine instead of restricted API
 * @property {boolean} [lazy=false] - If true, plugin is not initialized in initAll() but on first use
 * @property {Function} [init] - Initialization function, receives the plugin API or full engine
 * @property {Function} [destroy] - Cleanup function, receives the plugin API or full engine
 * @property {Function|null} [onContentChange] - Called on content:change events
 * @property {Function|null} [onSelectionChange] - Called on selectionchange events
 * @property {Array<import('../core/CommandRegistry.js').CommandDefinition>} [commands] - Commands to register
 * @property {Array} [toolbarItems] - Toolbar item definitions
 * @property {Array} [statusBarItems] - Status bar item definitions
 * @property {Array} [contextMenuItems] - Context menu item definitions
 * @property {Array} [settingsSchema] - Schema for plugin-specific settings
 * @property {Object} [defaultSettings] - Default setting values
 */

/**
 * Creates a restricted API facade for plugins.
 * Plugins receive this facade instead of the full engine reference,
 * limiting what they can access to prevent accidental or malicious
 * bypass of sanitization, history corruption, or content exfiltration.
 *
 * @param {import('../core/EditorEngine.js').EditorEngine} engine - The full editor engine
 * @param {string} pluginName - The plugin name (for scoped settings)
 * @param {PluginManager} manager - The plugin manager (for settings access)
 * @returns {PluginAPI} A restricted API surface
 */
function createPluginAPI(engine, pluginName, manager) {
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

    /**
     * Get a plugin-scoped setting value.
     * @param {string} key - Setting key
     * @returns {*} The setting value
     */
    getSetting(key) { return manager.getPluginSetting(pluginName, key) },

    /**
     * Set a plugin-scoped setting value.
     * @param {string} key - Setting key
     * @param {*} value - The value to set
     */
    setSetting(key, value) { manager.setPluginSetting(pluginName, key, value) },
  }
}

// ---------------------------------------------------------------------------
// Plugin Registry — discover and list available plugins
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} PluginRegistryEntry
 * @property {string} name - Plugin identifier
 * @property {string} version - Version string
 * @property {string} description - What the plugin does
 * @property {string} author - Author name
 * @property {string[]} [tags] - Search tags
 * @property {Function} [factory] - Factory function that returns the plugin definition
 */

/** @type {Map<string, PluginRegistryEntry>} */
const _globalRegistry = new Map()

/**
 * Register a plugin in the global registry for discovery.
 * This does NOT install the plugin — it makes it discoverable via `listRegisteredPlugins`.
 * @param {PluginRegistryEntry} entry
 */
export function registerPluginInRegistry(entry) {
  if (!entry || !entry.name) return
  _globalRegistry.set(entry.name, entry)
}

/**
 * Remove a plugin from the global registry.
 * @param {string} name
 * @returns {boolean}
 */
export function unregisterPluginFromRegistry(name) {
  return _globalRegistry.delete(name)
}

/**
 * List all plugins in the global registry.
 * @returns {PluginRegistryEntry[]}
 */
export function listRegisteredPlugins() {
  return Array.from(_globalRegistry.values())
}

/**
 * Search the global registry by name, description, or tags.
 * @param {string} query
 * @returns {PluginRegistryEntry[]}
 */
export function searchPluginRegistry(query) {
  if (!query) return listRegisteredPlugins()
  const q = query.toLowerCase()
  return listRegisteredPlugins().filter(e =>
    e.name.toLowerCase().includes(q) ||
    (e.description || '').toLowerCase().includes(q) ||
    (e.tags || []).some(t => t.toLowerCase().includes(q))
  )
}

// ---------------------------------------------------------------------------
// PluginManager
// ---------------------------------------------------------------------------

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
 *
 * **Dependencies:** Plugins can declare `dependencies: ['otherPlugin']` to
 * ensure they are initialized after their dependencies. Circular dependencies
 * are detected and reported.
 *
 * **Lifecycle hooks:** Beyond `init`/`destroy`, plugins can declare
 * `onContentChange` and `onSelectionChange` callbacks. These are wired
 * automatically during initialization.
 *
 * **Scoped settings:** Plugins can declare a `settingsSchema` and
 * `defaultSettings`. Settings are stored per-plugin and accessible via
 * `getSetting`/`setSetting` on the plugin API, or `getPluginSetting`/
 * `setPluginSetting` on the manager.
 *
 * **Sandboxing:** Each plugin's `init`, `destroy`, `onContentChange`, and
 * `onSelectionChange` calls are wrapped in try/catch. A single failing
 * plugin cannot crash the editor or other plugins.
 */
export class PluginManager {
  /**
   * Creates a new PluginManager.
   * @param {import('../core/EditorEngine.js').EditorEngine} engine - The editor engine instance
   */
  constructor(engine) {
    this.engine = engine
    this._plugins = new Map()
    /** @private Set of plugin names that have been initialized */
    this._initialized = new Set()
    /** @private Map of command name -> plugin name for lazy activation */
    this._commandPluginMap = new Map()
    /** @private Per-plugin settings store: Map<pluginName, Map<key, value>> */
    this._settings = new Map()
    /** @private Unsub functions for lifecycle hooks */
    this._lifecycleUnsubs = new Map()
  }

  // -----------------------------------------------------------------------
  // Plugin Settings
  // -----------------------------------------------------------------------

  /**
   * Get a plugin-scoped setting value.
   * Falls back to the plugin's defaultSettings if not explicitly set.
   * @param {string} pluginName
   * @param {string} key
   * @returns {*}
   */
  getPluginSetting(pluginName, key) {
    const settings = this._settings.get(pluginName)
    if (settings && settings.has(key)) return settings.get(key)
    const plugin = this._plugins.get(pluginName)
    if (plugin?.defaultSettings && key in plugin.defaultSettings) {
      return plugin.defaultSettings[key]
    }
    return undefined
  }

  /**
   * Set a plugin-scoped setting value.
   * Validates against the settingsSchema if present.
   * @param {string} pluginName
   * @param {string} key
   * @param {*} value
   * @returns {boolean} true if the setting was accepted
   */
  setPluginSetting(pluginName, key, value) {
    const plugin = this._plugins.get(pluginName)
    if (!plugin) return false

    // Validate against schema if available
    if (plugin.settingsSchema && plugin.settingsSchema.length > 0) {
      const schema = plugin.settingsSchema.find(s => s.key === key)
      if (schema) {
        // Type check
        if (schema.type === 'boolean' && typeof value !== 'boolean') return false
        if (schema.type === 'number' && typeof value !== 'number') return false
        if (schema.type === 'string' && typeof value !== 'string') return false
        if (schema.type === 'select') {
          const validValues = (schema.options || []).map(o => o.value)
          if (!validValues.includes(value)) return false
        }
        // Custom validation
        if (schema.validate && !schema.validate(value)) return false
      }
    }

    if (!this._settings.has(pluginName)) {
      this._settings.set(pluginName, new Map())
    }
    this._settings.get(pluginName).set(key, value)
    this.engine.eventBus.emit('plugin:settingChanged', { pluginName, key, value })
    return true
  }

  /**
   * Get all settings for a plugin as a plain object.
   * @param {string} pluginName
   * @returns {Object}
   */
  getPluginSettings(pluginName) {
    const plugin = this._plugins.get(pluginName)
    const result = { ...(plugin?.defaultSettings || {}) }
    const settings = this._settings.get(pluginName)
    if (settings) {
      for (const [k, v] of settings) result[k] = v
    }
    return result
  }

  // -----------------------------------------------------------------------
  // Dependency Resolution
  // -----------------------------------------------------------------------

  /**
   * Resolve plugin initialization order based on dependencies.
   * Uses topological sort. Detects circular dependencies.
   * @param {PluginDefinition[]} plugins - Plugins to sort
   * @returns {{ sorted: PluginDefinition[], circular: string[][] }} sorted list and any circular deps
   */
  _resolveDependencyOrder(plugins) {
    const nameSet = new Set(plugins.map(p => p.name))
    const graph = new Map() // name -> [dependency names]
    const inDegree = new Map()

    for (const p of plugins) {
      // Only include dependencies that are actually registered
      const deps = (p.dependencies || []).filter(d => nameSet.has(d))
      graph.set(p.name, deps)
      inDegree.set(p.name, deps.length)
    }

    // Kahn's algorithm for topological sort
    const queue = []
    for (const [name, degree] of inDegree) {
      if (degree === 0) queue.push(name)
    }

    const sorted = []
    while (queue.length > 0) {
      const name = queue.shift()
      sorted.push(name)
      // For each plugin that depends on `name`, decrement its in-degree
      for (const [other, deps] of graph) {
        if (deps.includes(name)) {
          inDegree.set(other, inDegree.get(other) - 1)
          if (inDegree.get(other) === 0) queue.push(other)
        }
      }
    }

    // Detect circular dependencies
    const circular = []
    if (sorted.length < plugins.length) {
      const remaining = plugins.filter(p => !sorted.includes(p.name)).map(p => p.name)
      circular.push(remaining)
    }

    const pluginMap = new Map(plugins.map(p => [p.name, p]))
    return {
      sorted: sorted.map(name => pluginMap.get(name)),
      circular,
    }
  }

  // -----------------------------------------------------------------------
  // Registration
  // -----------------------------------------------------------------------

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

    // Initialize default settings
    if (plugin.defaultSettings) {
      if (!this._settings.has(plugin.name)) {
        this._settings.set(plugin.name, new Map())
      }
    }

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

  // -----------------------------------------------------------------------
  // Initialization
  // -----------------------------------------------------------------------

  /**
   * Initializes a single plugin by calling its init function and
   * wiring lifecycle hooks (onContentChange, onSelectionChange).
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
      const api = plugin.requiresFullAccess
        ? this.engine
        : createPluginAPI(this.engine, plugin.name, this)

      if (plugin.init) {
        plugin.init(api)
      }

      // Wire lifecycle hooks
      const unsubs = []

      if (typeof plugin.onContentChange === 'function') {
        const handler = () => {
          try { plugin.onContentChange(api) }
          catch (err) {
            console.error(`Plugin "${plugin.name}" onContentChange error:`, err)
            this.engine.eventBus.emit('plugin:error', { name: plugin.name, error: err, hook: 'onContentChange' })
          }
        }
        unsubs.push(this.engine.eventBus.on('content:change', handler))
      }

      if (typeof plugin.onSelectionChange === 'function') {
        const handler = () => {
          try { plugin.onSelectionChange(api) }
          catch (err) {
            console.error(`Plugin "${plugin.name}" onSelectionChange error:`, err)
            this.engine.eventBus.emit('plugin:error', { name: plugin.name, error: err, hook: 'onSelectionChange' })
          }
        }
        unsubs.push(this.engine.eventBus.on('selection:change', handler))
      }

      if (unsubs.length > 0) {
        this._lifecycleUnsubs.set(plugin.name, unsubs)
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

    // Initialize dependencies first
    for (const dep of (plugin.dependencies || [])) {
      if (this._plugins.has(dep) && !this._initialized.has(dep)) {
        this.activatePlugin(dep)
      }
    }

    this._initPlugin(plugin)
  }

  /**
   * Initializes all registered plugins by calling their init functions.
   * Plugins are initialized in dependency order. Lazy plugins are skipped
   * and will be initialized on first use. Circular dependencies are
   * detected, reported, and the involved plugins are still initialized
   * (in registration order) with a warning.
   *
   * @returns {void}
   */
  initAll() {
    const nonLazy = []
    this._plugins.forEach((plugin) => {
      if (!plugin.lazy) nonLazy.push(plugin)
    })

    const { sorted, circular } = this._resolveDependencyOrder(nonLazy)

    // Report circular dependencies
    if (circular.length > 0) {
      for (const cycle of circular) {
        console.warn(`Circular plugin dependencies detected: ${cycle.join(' → ')}`)
        this.engine.eventBus.emit('plugin:circularDependency', { plugins: cycle })
      }
    }

    // Initialize in dependency-resolved order
    for (const plugin of sorted) {
      this._initPlugin(plugin)
    }

    // Initialize any plugins not in sorted (circular deps) in registration order
    for (const plugin of nonLazy) {
      if (!this._initialized.has(plugin.name)) {
        this._initPlugin(plugin)
      }
    }
  }

  // -----------------------------------------------------------------------
  // Destruction
  // -----------------------------------------------------------------------

  /**
   * Destroys all registered plugins by calling their destroy functions,
   * cleaning up lifecycle hook subscriptions, and clearing all state.
   * Errors are caught, logged, and emitted as plugin:error events.
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
          const api = plugin.requiresFullAccess
            ? this.engine
            : createPluginAPI(this.engine, plugin.name, this)
          plugin.destroy(api)
        }

        // Clean up lifecycle hook subscriptions
        const unsubs = this._lifecycleUnsubs.get(plugin.name)
        if (unsubs) {
          for (const unsub of unsubs) unsub?.()
        }
      } catch (err) {
        console.error(`Error destroying plugin "${plugin.name}":`, err)
        this.engine.eventBus.emit('plugin:error', { name: plugin.name, error: err })
      }
    })
    this._plugins.clear()
    this._initialized.clear()
    this._commandPluginMap.clear()
    this._settings.clear()
    this._lifecycleUnsubs.clear()
  }

  // -----------------------------------------------------------------------
  // Query methods
  // -----------------------------------------------------------------------

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
