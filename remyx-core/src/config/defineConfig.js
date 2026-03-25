/**
 * Define a RemyxEditor configuration.
 *
 * Top-level keys act as defaults for all editors.
 * The `editors` key contains named configurations that can be
 * attached to specific <RemyxEditor config="name" /> instances.
 *
 * @param {object} config
 * @returns {object} The validated configuration object
 */
export function defineConfig(config) {
  if (!config || typeof config !== 'object') {
    throw new Error('defineConfig expects a configuration object')
  }

  if (config.editors && typeof config.editors !== 'object') {
    throw new Error('defineConfig: "editors" must be an object mapping names to editor configurations')
  }

  return config
}
