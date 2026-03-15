/**
 * Create a plugin definition.
 *
 * @param {Object} definition - Plugin configuration
 * @param {string} definition.name - Unique plugin name
 * @param {Function} [definition.init] - Called with the plugin API on initialization
 * @param {Function} [definition.destroy] - Called on cleanup
 * @param {boolean} [definition.requiresFullAccess=false] - If true, receives the full
 *   engine reference instead of the restricted API facade. Only set this for trusted
 *   plugins that need direct DOM/sanitizer/history access.
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
