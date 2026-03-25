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
/**
 * @typedef {Object} LoadGoogleFontsOptions
 * @property {string} [integrity] - Subresource Integrity (SRI) hash for the stylesheet
 *   (e.g. 'sha384-abc123...'). When provided, the browser verifies the fetched
 *   stylesheet matches this hash before applying it. Generate with:
 *   `openssl dgst -sha384 -binary <file> | openssl base64 -A`
 * @property {string} [crossOrigin='anonymous'] - CORS attribute for the link element.
 *   Must be set when using SRI. Defaults to 'anonymous'.
 */

export function loadGoogleFonts(fontFamilies, options = {}) {
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

  // Subresource Integrity (SRI) — verify stylesheet hasn't been tampered with
  if (options.integrity) {
    link.integrity = options.integrity
    link.crossOrigin = options.crossOrigin || 'anonymous'
  } else {
    // Always set crossorigin for Google Fonts (required for CORS font loading)
    link.crossOrigin = options.crossOrigin || 'anonymous'
  }

  document.head.appendChild(link)

  return link
}
