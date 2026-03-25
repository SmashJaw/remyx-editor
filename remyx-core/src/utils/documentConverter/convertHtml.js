import { readAsText } from './shared.js'

/**
 * Read an HTML file and return its content.
 * Sanitization happens at insertion time via the engine sanitizer.
 */
export default async function convertHtml(file) {
  return readAsText(file)
}
