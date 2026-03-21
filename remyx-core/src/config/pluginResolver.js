/**
 * Built-in plugin registry for resolving plugin names from config files.
 *
 * Item 21: Uses lazy Map with dynamic import() on first use instead of
 * eagerly importing all 17 plugins at module load time.
 *
 * When plugins are specified as strings in a JSON/YAML config (e.g., `"plugins": ["TablePlugin", "MathPlugin"]`),
 * this resolver maps those names to the actual plugin factory functions.
 *
 * Users can also register custom plugins so they can be referenced by name in config files.
 */

/**
 * Lazy-loaded built-in plugin factories. Each value is an async function
 * that dynamically imports the plugin module and returns the factory result.
 * @type {Map<string, (opts?: object) => Promise<object>>}
 */
const BUILTIN_PLUGINS = new Map([
  ['WordCountPlugin', async () => {
    const { WordCountPlugin } = await import('../plugins/builtins/WordCountPlugin.js')
    return WordCountPlugin
  }],
  ['AutolinkPlugin', async () => {
    const { AutolinkPlugin } = await import('../plugins/builtins/AutolinkPlugin.js')
    return AutolinkPlugin
  }],
  ['PlaceholderPlugin', async (opts) => {
    const { PlaceholderPlugin } = await import('../plugins/builtins/PlaceholderPlugin.js')
    return PlaceholderPlugin(opts?.placeholder)
  }],
])

/**
 * Custom plugin registry for user-defined plugins that can be referenced by name.
 * @type {Map<string, Function>}
 */
const _customPluginFactories = new Map()

/**
 * Register a custom plugin factory so it can be referenced by name in config files.
 *
 * @param {string} name - The plugin name (used in config files)
 * @param {Function} factory - A factory function that returns a plugin instance.
 *   Called with `(options)` from the config. If no options, called with `undefined`.
 *
 * @example
 * ```js
 * import { registerPluginFactory } from '@remyxjs/core';
 *
 * registerPluginFactory('MyCustomPlugin', (opts) => MyCustomPlugin(opts));
 *
 * // Now usable in config files:
 * // { "plugins": [{ "name": "MyCustomPlugin", "options": { "color": "red" } }] }
 * ```
 */
export function registerPluginFactory(name, factory) {
  if (typeof name !== 'string' || !name) {
    throw new Error('registerPluginFactory: name must be a non-empty string')
  }
  if (typeof factory !== 'function') {
    throw new Error('registerPluginFactory: factory must be a function')
  }
  _customPluginFactories.set(name, factory)
}

/**
 * Unregister a previously registered custom plugin factory.
 * @param {string} name - The plugin name to remove
 */
export function unregisterPluginFactory(name) {
  _customPluginFactories.delete(name)
}

/**
 * Resolve a plugins config value into an array of plugin instances.
 *
 * Accepts:
 * - An array of strings: `["TablePlugin", "MathPlugin"]`
 * - An array of objects: `[{ "name": "TablePlugin" }, { "name": "CollaborationPlugin", "options": { "roomId": "doc-1" } }]`
 * - A mixed array of strings, objects, and already-instantiated plugins
 * - `undefined` or `null` -> returns `undefined` (no plugins override)
 *
 * @param {Array|undefined|null} pluginsConfig - The plugins value from a config file
 * @returns {Promise<Array>|undefined} An array of resolved plugin instances, or undefined
 */
export function resolvePlugins(pluginsConfig) {
  if (!pluginsConfig || !Array.isArray(pluginsConfig)) {
    return undefined
  }

  return Promise.all(pluginsConfig.map((entry, index) => {
    // Already a plugin instance (function/object with init) -- pass through
    if (typeof entry === 'function' || (typeof entry === 'object' && entry !== null && typeof entry.init === 'function')) {
      return entry
    }

    // String name: "TablePlugin"
    if (typeof entry === 'string') {
      return resolveByName(entry)
    }

    // Object with name and optional options: { name: "TablePlugin", options: { ... } }
    if (typeof entry === 'object' && entry !== null && typeof entry.name === 'string') {
      return resolveByName(entry.name, entry.options)
    }

    throw new Error(`resolvePlugins: invalid plugin entry at index ${index} -- expected string, { name, options }, or plugin instance`)
  }))
}

/**
 * Look up a plugin by name and instantiate it with optional options.
 * @param {string} name
 * @param {object} [options]
 * @returns {Promise<*>} The plugin instance
 */
async function resolveByName(name, options) {
  // Check custom registry first (allows overriding built-ins)
  const customFactory = _customPluginFactories.get(name)
  if (customFactory) {
    return customFactory(options)
  }

  const builtinFactory = BUILTIN_PLUGINS.get(name)
  if (builtinFactory) {
    return builtinFactory(options)
  }

  throw new Error(`resolvePlugins: unknown plugin "${name}". Register it with registerPluginFactory() or import it directly.`)
}
