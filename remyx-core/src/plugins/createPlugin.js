/**
 * @typedef {Object} CreatePluginDefinition
 * @property {string} name - Unique plugin name
 * @property {Function} [init] - Called with the plugin API (or full engine if requiresFullAccess) on initialization
 * @property {Function} [destroy] - Called on cleanup with the same API as init
 * @property {boolean} [requiresFullAccess=false] - If true, receives the full engine reference
 *   instead of the restricted API facade. Only set this for trusted plugins that need
 *   direct DOM/sanitizer/history access.
 * @property {Array<import('../core/CommandRegistry.js').CommandDefinition>} [commands] - Commands to register with the editor
 * @property {Array} [toolbarItems] - Toolbar item definitions for the UI layer
 * @property {Array} [statusBarItems] - Status bar item definitions for the UI layer
 * @property {Array} [contextMenuItems] - Context menu item definitions for the UI layer
 */

/**
 * Creates a normalized plugin definition with default values for optional properties.
 *
 * @param {CreatePluginDefinition} definition - Plugin configuration
 * @returns {import('./PluginManager.js').PluginDefinition} A fully normalized plugin definition object
 */
export function createPlugin(definition) {
  return {
    name: definition.name,
    requiresFullAccess: definition.requiresFullAccess || false,
    init: definition.init || (() => {}),
    destroy: definition.destroy || (() => {}),
    commands: definition.commands || [],
    toolbarItems: definition.toolbarItems || [],
    statusBarItems: definition.statusBarItems || [],
    contextMenuItems: definition.contextMenuItems || [],
  }
}
