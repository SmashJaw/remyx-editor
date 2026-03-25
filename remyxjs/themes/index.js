/**
 * Theme auto-discovery module.
 *
 * Scans remyxjs/themes/ for CSS files and imports them eagerly.
 * Each theme's name is derived from its filename (e.g. "dark.css" → "dark").
 *
 * Config files reference themes by name:
 *   { "theme": "dark" }
 *   { "theme": "ocean" }
 */

const themeModules = import.meta.glob('./*.css', { eager: true })

const availableThemes = new Set()

for (const path of Object.keys(themeModules)) {
  // "./dark.css" → "dark"
  const name = path.replace('./', '').replace('.css', '')
  availableThemes.add(name)
}

/**
 * Get all available theme names.
 * @returns {string[]}
 */
export function getAvailableThemes() {
  return [...availableThemes]
}

/**
 * Check if a theme is available.
 * @param {string} name
 * @returns {boolean}
 */
export function hasTheme(name) {
  return availableThemes.has(name)
}
