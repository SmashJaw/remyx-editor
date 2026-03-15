import { DEFAULT_FONTS } from '../constants/defaults.js'

/**
 * Remove fonts from a font list.
 *
 * @param {string[]} fonts - Font list to modify
 * @param {string[]} fontsToRemove - Font names to remove
 * @returns {string[]} New font list with specified fonts removed
 *
 * @example
 * removeFonts(DEFAULT_FONTS, ['Comic Sans MS', 'Impact'])
 */
export function removeFonts(fonts, fontsToRemove) {
  const removeSet = new Set(fontsToRemove.map(f => f.toLowerCase()))
  return fonts.filter(f => !removeSet.has(f.toLowerCase()))
}

/**
 * Add fonts to a font list.
 *
 * @param {string[]} fonts - Font list to modify
 * @param {string[]} fontsToAdd - Font names to add
 * @param {Object} [options]
 * @param {'start' | 'end'} [options.position='end'] - Where to insert the new fonts
 * @returns {string[]} New font list with fonts added (duplicates are skipped)
 *
 * @example
 * // Append fonts
 * addFonts(DEFAULT_FONTS, ['Lato', 'Poppins'])
 *
 * // Prepend fonts
 * addFonts(DEFAULT_FONTS, ['Lato', 'Poppins'], { position: 'start' })
 */
export function addFonts(fonts, fontsToAdd, options = {}) {
  const existing = new Set(fonts.map(f => f.toLowerCase()))
  const newFonts = fontsToAdd.filter(f => !existing.has(f.toLowerCase()))

  if (options.position === 'start') {
    return [...newFonts, ...fonts]
  }
  return [...fonts, ...newFonts]
}

/**
 * Load Google Fonts by injecting a stylesheet link into the document head.
 * Fonts that are already loaded will not be loaded again.
 *
 * **Privacy notice:** This function makes external requests to `fonts.googleapis.com`
 * and `fonts.gstatic.com`, which reveals the user's IP address, browser user-agent,
 * and which fonts are being loaded to Google. For privacy-sensitive deployments,
 * consider self-hosting fonts instead. See: https://google-webfonts-helper.herokuapp.com/
 *
 * **CSP note:** Requires `font-src fonts.gstatic.com` and `style-src fonts.googleapis.com`
 * in your Content-Security-Policy header.
 *
 * @param {string[]} fontFamilies - Google Font family names (e.g. ['Roboto', 'Open Sans', 'Lato:wght@400;700'])
 * @returns {HTMLLinkElement | null} The injected link element, or null if all fonts were already loaded
 *
 * @example
 * // Basic usage
 * loadGoogleFonts(['Roboto', 'Open Sans', 'Lato'])
 *
 * // With specific weights
 * loadGoogleFonts(['Roboto:wght@400;700', 'Open Sans:ital,wght@0,400;1,400'])
 */
export function loadGoogleFonts(fontFamilies) {
  if (!fontFamilies || fontFamilies.length === 0) return null
  if (typeof document === 'undefined') return null

  // Build the Google Fonts URL
  const families = fontFamilies.map(f => {
    // If the user already provided a spec with weights, use as-is
    if (f.includes(':')) return `family=${f.replace(/ /g, '+')}`
    // Otherwise default to requesting the font family
    return `family=${f.replace(/ /g, '+')}`
  })

  const url = `https://fonts.googleapis.com/css2?${families.join('&')}&display=swap`

  // Check if this URL is already loaded
  const existing = document.querySelector(`link[href="${url}"]`)
  if (existing) return existing

  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = url
  link.dataset.remyxFonts = 'true'
  document.head.appendChild(link)

  return link
}
