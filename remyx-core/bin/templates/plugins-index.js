/**
 * Plugin auto-discovery module.
 *
 * Scans the remyxjs/plugins/ directory for plugin folders and builds a registry.
 * Each plugin directory must have an index.js that exports a factory function
 * whose name ends with "Plugin" (e.g. TablePlugin, MathPlugin).
 *
 * Usage from config files:
 *   "plugins": { "table": { "enabled": true, "maxRows": 100 } }
 *
 * The key ("table") matches the directory name under remyxjs/plugins/.
 */

const pluginModules = import.meta.glob('./**/index.js', { eager: true })

const pluginRegistry = new Map()

for (const [path, module] of Object.entries(pluginModules)) {
  // Extract directory name: "./table/index.js" → "table"
  const segments = path.split('/')
  if (segments.length === 3 && segments[2] === 'index.js') {
    const name = segments[1]
    pluginRegistry.set(name, module)
  }
}

/**
 * Get the names of all available plugins discovered in the plugins directory.
 * @returns {string[]}
 */
export function getAvailablePlugins() {
  return [...pluginRegistry.keys()]
}

/**
 * Load and instantiate a single plugin by directory name.
 * @param {string} name - Plugin directory name (e.g. "table", "math")
 * @param {object} [options] - Options passed to the plugin factory
 * @returns {object|null} Plugin instance, or null if not found
 */
export function loadPlugin(name, options = {}) {
  const mod = pluginRegistry.get(name)
  if (!mod) {
    console.warn(`[remyxjs] Plugin "${name}" not found in remyxjs/plugins/`)
    return null
  }
  const factoryName = Object.keys(mod).find(
    k => k.endsWith('Plugin') && typeof mod[k] === 'function'
  )
  if (!factoryName) {
    console.warn(`[remyxjs] Plugin "${name}" has no exported factory function ending in "Plugin"`)
    return null
  }
  return mod[factoryName](options)
}

/**
 * Resolve plugins from a config file's plugins object.
 *
 * @param {object} pluginsConfig - e.g. { "table": { "enabled": true }, "math": false }
 * @returns {object[]} Array of instantiated plugin objects
 *
 * @example
 * resolvePluginsFromConfig({
 *   "table": { "enabled": true, "maxRows": 100 },
 *   "math": { "enabled": false },
 *   "comments": {},
 *   "callout": true
 * })
 * // Returns: [TablePlugin({ maxRows: 100 }), CommentsPlugin(), CalloutPlugin()]
 */
export function resolvePluginsFromConfig(pluginsConfig) {
  if (!pluginsConfig || typeof pluginsConfig !== 'object') return []

  return Object.entries(pluginsConfig)
    .filter(([, opts]) => {
      if (opts === false) return false
      if (typeof opts === 'object' && opts !== null && opts.enabled === false) return false
      return true
    })
    .map(([name, opts]) => {
      const options = typeof opts === 'object' && opts !== null ? { ...opts } : {}
      delete options.enabled
      return loadPlugin(name, options)
    })
    .filter(Boolean)
}
