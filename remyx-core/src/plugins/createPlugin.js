/**
 * @typedef {Object} PluginSettingsSchema
 * @property {string} key - Setting key name
 * @property {string} type - Value type: 'string' | 'number' | 'boolean' | 'select'
 * @property {string} label - Human-readable label
 * @property {*} defaultValue - Default value
 * @property {string} [description] - Description for documentation/UI
 * @property {Array<{label: string, value: *}>} [options] - Options for 'select' type
 * @property {Function} [validate] - Custom validation function: (value) => boolean
 */

/**
 * @typedef {Object} CreatePluginDefinition
 * @property {string} name - Unique plugin name
 * @property {string} [version] - Plugin version string (e.g., '1.0.0')
 * @property {string} [description] - Human-readable description
 * @property {string} [author] - Plugin author
 * @property {string[]} [dependencies] - Plugin names this plugin depends on (loaded first)
 * @property {Function} [init] - Called with the plugin API (or full engine if requiresFullAccess) on initialization
 * @property {Function} [destroy] - Called on cleanup with the same API as init
 * @property {Function} [onContentChange] - Called on every content:change event (debounced by the manager)
 * @property {Function} [onSelectionChange] - Called on every selectionchange event
 * @property {boolean} [requiresFullAccess=false] - If true, receives the full engine reference
 *   instead of the restricted API facade. Only set this for trusted plugins that need
 *   direct DOM/sanitizer/history access.
 * @property {boolean} [lazy=false] - If true, defers initialization until first command use
 * @property {Array<import('../core/CommandRegistry.js').CommandDefinition>} [commands] - Commands to register with the editor
 * @property {Array} [toolbarItems] - Toolbar item definitions for the UI layer
 * @property {Array} [statusBarItems] - Status bar item definitions for the UI layer
 * @property {Array} [contextMenuItems] - Context menu item definitions for the UI layer
 * @property {PluginSettingsSchema[]} [settingsSchema] - Schema for plugin-specific settings
 * @property {Object} [defaultSettings] - Default values for plugin settings
 */

/**
 * Creates a normalized plugin definition with default values for optional properties.
 *
 * Enhanced plugin architecture supports:
 * - **Lifecycle hooks**: `onContentChange` and `onSelectionChange` in addition to `init`/`destroy`
 * - **Dependencies**: declare `dependencies: ['otherPlugin']` to ensure load ordering
 * - **Scoped settings**: `settingsSchema` + `defaultSettings` for per-plugin configuration
 * - **Metadata**: `version`, `description`, `author` for registry/marketplace
 *
 * @param {CreatePluginDefinition} definition - Plugin configuration
 * @returns {import('./PluginManager.js').PluginDefinition} A fully normalized plugin definition object
 */
export function createPlugin(definition) {
  return {
    name: definition.name,
    version: definition.version || '0.0.0',
    description: definition.description || '',
    author: definition.author || '',
    dependencies: definition.dependencies || [],
    requiresFullAccess: definition.requiresFullAccess || false,
    lazy: definition.lazy || false,
    init: definition.init || (() => {}),
    destroy: definition.destroy || (() => {}),
    onContentChange: definition.onContentChange || null,
    onSelectionChange: definition.onSelectionChange || null,
    commands: definition.commands || [],
    toolbarItems: definition.toolbarItems || [],
    statusBarItems: definition.statusBarItems || [],
    contextMenuItems: definition.contextMenuItems || [],
    settingsSchema: definition.settingsSchema || [],
    defaultSettings: definition.defaultSettings || {},
  }
}
