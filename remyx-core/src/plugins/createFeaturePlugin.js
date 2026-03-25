import { createPlugin } from './createPlugin.js'

/**
 * Item 18: Factory helper for creating feature plugins with common boilerplate.
 *
 * Handles the common pattern of:
 * - Storing engine reference
 * - Subscribing to content:change (with optional debounce)
 * - Exposing an API on the engine (engine._<name>)
 * - Cleanup on destroy
 *
 * @param {object} config
 * @param {string} config.name - Plugin name
 * @param {string} [config.version='1.0.0'] - Plugin version
 * @param {string} [config.description=''] - Plugin description
 * @param {boolean} [config.requiresFullAccess=true] - Requires full engine access
 * @param {Array} [config.commands=[]] - Command definitions
 * @param {Array} [config.contextMenuItems=[]] - Context menu items
 * @param {number} [config.debounceMs=0] - Debounce ms for content:change handler (0 = no debounce)
 * @param {(engine: object) => object} [config.createApi] - Factory for the API to expose on engine._<name>
 * @param {(engine: object) => void} [config.onInit] - Additional init logic
 * @param {(engine: object) => void} [config.onDestroy] - Additional cleanup logic
 * @param {(engine: object) => void} [config.onContentChange] - Handler for content:change events
 * @returns {object} Plugin definition
 */
export function createFeaturePlugin(config) {
  let engine = null
  let unsubContentChange = null
  let debounceTimer = null

  return createPlugin({
    name: config.name,
    version: config.version || '1.0.0',
    description: config.description || '',
    requiresFullAccess: config.requiresFullAccess !== false,
    commands: config.commands || [],
    contextMenuItems: config.contextMenuItems || [],

    init(eng) {
      engine = eng

      if (config.createApi) {
        engine[`_${config.name}`] = config.createApi(engine)
      }

      if (config.onContentChange) {
        const handler = config.debounceMs > 0
          ? () => {
            clearTimeout(debounceTimer)
            debounceTimer = setTimeout(() => config.onContentChange(engine), config.debounceMs)
          }
          : () => config.onContentChange(engine)
        unsubContentChange = engine.eventBus.on('content:change', handler)
      }

      config.onInit?.(engine)
    },

    destroy() {
      clearTimeout(debounceTimer)
      unsubContentChange?.()
      config.onDestroy?.(engine)
      engine = null
    },
  })
}
